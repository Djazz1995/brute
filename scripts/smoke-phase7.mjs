// Phase 7 smoke: profile tier round-trip (BillingService stub purchase path).
// Verifies profiles.tier defaults 'free' and is owner-writable under RLS — the
// data path behind BillingService.purchase()/restoreFree(). Share + gate logic
// is UI/pure (no DB). Run: npm run db:smoke7

import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing env. Run: npm run db:smoke7');
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data: auth, error: authErr } = await sb.auth.signInAnonymously();
  if (authErr) throw authErr;
  const id = auth.user.id;
  console.log('✓ signed in:', id);

  // Profile auto-created by the §8.2 trigger; tier defaults 'free'.
  const { data: p0, error: e0 } = await sb.from('profiles').select('tier').eq('id', id).single();
  if (e0) throw e0;
  if (p0.tier !== 'free') throw new Error(`expected default tier 'free', got '${p0.tier}'`);
  console.log("✓ default tier is 'free'");

  // Stub purchase → paid.
  const { data: p1, error: e1 } = await sb
    .from('profiles')
    .update({ tier: 'paid' })
    .eq('id', id)
    .select('tier')
    .single();
  if (e1) throw e1;
  if (p1.tier !== 'paid') throw new Error('tier did not flip to paid');
  console.log('✓ purchase() path: tier → paid');

  // Restore → free.
  await sb.from('profiles').update({ tier: 'free' }).eq('id', id);
  const { data: p2 } = await sb.from('profiles').select('tier').eq('id', id).single();
  if (p2.tier !== 'free') throw new Error('restoreFree() path failed');
  console.log('✓ restoreFree() path: tier → free');

  console.log('\nPhase 7 data path OK (tier round-trip under RLS).');
}

main().catch((e) => {
  console.error('✗ failed:', e.message ?? e);
  process.exit(1);
});
