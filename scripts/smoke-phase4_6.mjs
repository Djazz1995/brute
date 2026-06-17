// Phase 4.6 smoke: quantified amount + weekly-target schedule + rest day + archive.
// Run: npm run db:smoke4_6

import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing env. Run: node --env-file=.env scripts/smoke-phase4_6.mjs');
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data: auth, error: authErr } = await sb.auth.signInAnonymously();
  if (authErr) throw authErr;
  const userId = auth.user.id;
  console.log('✓ signed in:', userId);

  // Quantified + weekly-target + rest-day goal.
  const { data: goal, error: gErr } = await sb
    .from('goals')
    .insert({
      user_id: userId,
      name: 'Read',
      category: 'study',
      schedule: { slots: [], weeklyTarget: 4 },
      rudeness_level: 2,
      escalation_speed: 'normal',
      target_value: 20,
      unit: 'pages',
    })
    .select()
    .single();
  if (gErr) throw gErr;
  if (goal.schedule.weeklyTarget !== 4) throw new Error('weeklyTarget not stored');
  if (Number(goal.target_value) !== 20 || goal.unit !== 'pages')
    throw new Error('quantified target not stored');
  if (goal.archived !== false) throw new Error('archived should default false');
  console.log('✓ created weekly/quantified goal (defaults archived=false)');

  // Partial amount logs.
  const { data: comp, error: cErr } = await sb
    .from('completions')
    .insert({ goal_id: goal.id, user_id: userId, source: 'tap', amount: 4 })
    .select()
    .single();
  if (cErr) throw cErr;
  if (Number(comp.amount) !== 4) throw new Error('partial amount not stored');
  console.log('✓ logged partial amount (4 of 20)');

  // Archive: row leaves the active list but survives with its history.
  await sb.from('goals').update({ archived: true }).eq('id', goal.id);
  const { data: active } = await sb.from('goals').select('id').eq('archived', false);
  if ((active ?? []).some((g) => g.id === goal.id))
    throw new Error('archived goal still in active list');
  const { data: stillThere, error: stErr } = await sb
    .from('goals')
    .select('id, archived')
    .eq('id', goal.id)
    .single();
  if (stErr) throw stErr;
  if (stillThere.archived !== true) throw new Error('archive flag not set');
  const { data: histComp } = await sb.from('completions').select('id').eq('goal_id', goal.id);
  if ((histComp ?? []).length !== 1) throw new Error('archive lost completion history');
  console.log('✓ archived goal: off active list, history intact');

  await sb.from('goals').delete().eq('id', goal.id);

  // New 'water' category (migration 0006) is accepted by the check constraint.
  const { data: water, error: wErr } = await sb
    .from('goals')
    .insert({
      user_id: userId,
      name: 'Drink water',
      category: 'water',
      schedule: { slots: [{ day: 1, time: '10:00' }] },
      rudeness_level: 1,
      escalation_speed: 'normal',
      target_value: 2,
      unit: 'L',
    })
    .select()
    .single();
  if (wErr) throw wErr;
  if (water.category !== 'water') throw new Error('water category not stored');
  await sb.from('goals').delete().eq('id', water.id);
  console.log('✓ water category accepted');
  console.log('✓ cleaned up');

  console.log('\nPhase 4.6 data paths OK (quantified + weekly-target + archive + water category).');
}

main().catch((e) => {
  console.error('✗ failed:', e.message ?? e);
  process.exit(1);
});
