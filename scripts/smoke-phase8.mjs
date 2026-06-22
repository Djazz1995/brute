// Phase 8 smoke: onboarding flag + defaults + GDPR export/delete.
// Requires migrations 0010 (profiles.onboarded) + 0011 (profiles delete policy).
// Run: npm run db:smoke8

import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing env. Run: npm run db:smoke8');
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data: auth, error: authErr } = await sb.auth.signInAnonymously();
  if (authErr) throw authErr;
  const id = auth.user.id;
  console.log('✓ signed in:', id);

  // onboarded defaults false, flips true.
  const { data: p0, error: e0 } = await sb
    .from('profiles')
    .select('onboarded')
    .eq('id', id)
    .single();
  if (e0) throw e0;
  if (p0.onboarded !== false) throw new Error(`expected onboarded=false, got ${p0.onboarded}`);
  await sb.from('profiles').update({ onboarded: true }).eq('id', id);
  const { data: p1 } = await sb.from('profiles').select('onboarded').eq('id', id).single();
  if (p1.onboarded !== true) throw new Error('completeOnboarding path failed');
  console.log('✓ onboarded flag: false → true');

  // Defaults update (settings §7.2).
  await sb.from('profiles').update({ rudeness_level: 4, sound: 'foghorn' }).eq('id', id);
  const { data: p2 } = await sb.from('profiles').select('rudeness_level, sound').eq('id', id).single();
  if (p2.rudeness_level !== 4 || p2.sound !== 'foghorn') throw new Error('defaults not saved');
  console.log('✓ defaults saved (rudeness=4, sound=foghorn)');

  // Seed a goal + completion so export/delete have content.
  const { data: goal } = await sb
    .from('goals')
    .insert({
      user_id: id,
      name: 'Smoke goal',
      category: 'gym',
      schedule: { slots: [{ day: 1, time: '09:00' }] },
      rudeness_level: 3,
      escalation_speed: 'normal',
    })
    .select()
    .single();
  await sb.from('completions').insert({ goal_id: goal.id, user_id: id, source: 'tap' });

  // Export gathers rows (§10 access).
  const [{ data: goals }, { data: comps }] = await Promise.all([
    sb.from('goals').select('*').eq('user_id', id),
    sb.from('completions').select('*').eq('user_id', id),
  ]);
  if ((goals ?? []).length !== 1 || (comps ?? []).length !== 1)
    throw new Error('export would miss rows');
  console.log('✓ export gathers goal + completion');

  // Delete-account path (§10 erasure): clear content + profile.
  for (const t of ['completions', 'skips', 'goals', 'buddies', 'collections']) {
    const { error } = await sb.from(t).delete().eq('user_id', id);
    if (error) throw error;
  }
  const { error: pdErr } = await sb.from('profiles').delete().eq('id', id);
  if (pdErr) throw new Error(`profile delete blocked (apply 0011?): ${pdErr.message}`);

  const { data: gAfter } = await sb.from('goals').select('id').eq('user_id', id);
  const { data: pAfter } = await sb.from('profiles').select('id').eq('id', id);
  if ((gAfter ?? []).length !== 0 || (pAfter ?? []).length !== 0)
    throw new Error('delete left data behind');
  console.log('✓ delete-account: goals + profile erased');

  console.log('\nPhase 8 data paths OK (onboarded + defaults + GDPR export/delete).');
}

main().catch((e) => {
  console.error('✗ failed:', e.message ?? e);
  process.exit(1);
});
