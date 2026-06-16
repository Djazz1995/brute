// Phase 3 smoke: prove the core loop's data path — create goal, complete it,
// read completions back (the streak source). Run: npm run db:smoke3

import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing env. Run: node --env-file=.env scripts/smoke-phase3.mjs');
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data: auth, error: authErr } = await sb.auth.signInAnonymously();
  if (authErr) throw authErr;
  const userId = auth.user.id;
  console.log('✓ signed in:', userId);

  const { data: goal, error: gErr } = await sb
    .from('goals')
    .insert({
      user_id: userId,
      name: 'Phase3 Gym',
      category: 'gym',
      schedule: { days: [1, 3, 5], timeOfDay: '07:00' },
      rudeness_level: 3,
      escalation_speed: 'normal',
    })
    .select()
    .single();
  if (gErr) throw gErr;
  console.log('✓ created goal:', goal.id);

  const { error: cErr } = await sb
    .from('completions')
    .insert({ goal_id: goal.id, user_id: userId, source: 'tap' });
  if (cErr) throw cErr;
  console.log('✓ logged completion');

  const { data: comps, error: rErr } = await sb
    .from('completions')
    .select('ts')
    .eq('goal_id', goal.id);
  if (rErr) throw rErr;
  if (comps.length !== 1) throw new Error(`expected 1 completion, got ${comps.length}`);
  console.log('✓ read back completions:', comps.length, '→ current streak would be 1');

  // Cascade: deleting the goal removes its completions.
  const { error: dErr } = await sb.from('goals').delete().eq('id', goal.id);
  if (dErr) throw dErr;
  const { data: after } = await sb.from('completions').select('ts').eq('goal_id', goal.id);
  if (after.length !== 0) throw new Error('cascade delete failed');
  console.log('✓ cascade delete cleaned completions');

  console.log('\nPhase 3 core loop data path OK.');
}

main().catch((e) => {
  console.error('✗ failed:', e.message ?? e);
  process.exit(1);
});
