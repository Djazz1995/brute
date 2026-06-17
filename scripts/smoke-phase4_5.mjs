// Phase 4.5 smoke: collection create + goal grouping + ungroup-on-delete.
// Run: npm run db:smoke4_5

import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing env. Run: node --env-file=.env scripts/smoke-phase4_5.mjs');
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data: auth, error: authErr } = await sb.auth.signInAnonymously();
  if (authErr) throw authErr;
  const userId = auth.user.id;
  console.log('✓ signed in:', userId);

  const { data: collection, error: colErr } = await sb
    .from('collections')
    .insert({ user_id: userId, name: 'Run a marathon' })
    .select()
    .single();
  if (colErr) throw colErr;
  console.log('✓ created collection:', collection.id);

  const { data: goal, error: gErr } = await sb
    .from('goals')
    .insert({
      user_id: userId,
      name: 'Long run',
      category: 'gym',
      schedule: { slots: [{ day: 7, time: '08:00' }] },
      rudeness_level: 2,
      escalation_speed: 'normal',
      collection_id: collection.id,
    })
    .select()
    .single();
  if (gErr) throw gErr;
  if (goal.collection_id !== collection.id) throw new Error('collection_id not stored');
  console.log('✓ created goal in collection');

  // Rename round-trips.
  const { data: renamed, error: rErr } = await sb
    .from('collections')
    .update({ name: 'Marathon prep' })
    .eq('id', collection.id)
    .select()
    .single();
  if (rErr) throw rErr;
  if (renamed.name !== 'Marathon prep') throw new Error('rename not stored');
  console.log('✓ renamed collection');

  // Deleting the collection must ungroup the goal, NOT delete it (FK set null).
  await sb.from('collections').delete().eq('id', collection.id);
  const { data: afterGoal, error: aErr } = await sb
    .from('goals')
    .select('id, collection_id')
    .eq('id', goal.id)
    .single();
  if (aErr) throw aErr;
  if (afterGoal.collection_id !== null) throw new Error('goal not ungrouped on collection delete');
  console.log('✓ collection delete ungrouped goal (goal survives, collection_id null)');

  await sb.from('goals').delete().eq('id', goal.id);
  console.log('✓ cleaned up');

  console.log('\nPhase 4.5 data paths OK (collection + grouping + ungroup-on-delete).');
}

main().catch((e) => {
  console.error('✗ failed:', e.message ?? e);
  process.exit(1);
});
