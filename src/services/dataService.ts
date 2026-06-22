/** GDPR data export + account deletion (AGENTS.md §10). Owns the cross-table I/O. */

import { getUserId } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

async function requireUserId(): Promise<string> {
  const id = await getUserId();
  if (!id) throw new Error('Not signed in.');
  return id;
}

export const dataService = {
  /**
   * Gather everything stored for the signed-in user into one object (§10 right
   * to access). Returns a plain JSON-serializable bundle.
   */
  async exportData(): Promise<Record<string, unknown>> {
    const id = await requireUserId();
    const [profile, goals, completions, skips, buddies, collections] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).single(),
      supabase.from('goals').select('*').eq('user_id', id),
      supabase.from('completions').select('*').eq('user_id', id),
      supabase.from('skips').select('*').eq('user_id', id),
      supabase.from('buddies').select('*').eq('user_id', id),
      supabase.from('collections').select('*').eq('user_id', id),
    ]);
    for (const r of [profile, goals, completions, skips, buddies, collections]) {
      if (r.error) throw r.error;
    }
    return {
      exportedAt: new Date().toISOString(),
      profile: profile.data,
      goals: goals.data ?? [],
      completions: completions.data ?? [],
      skips: skips.data ?? [],
      buddies: buddies.data ?? [],
      collections: collections.data ?? [],
    };
  },

  /**
   * Erase all of the user's data (§10 right to erasure) and sign out. Goals
   * cascade their completions/skips; we also clear the standalone owner-scoped
   * tables and the profile row. The next launch starts a fresh anonymous user.
   */
  async deleteAccount(): Promise<void> {
    const id = await requireUserId();
    // Order: children first is unnecessary (goal FKs cascade), but explicit
    // deletes cover rows not tied to a goal and keep this robust.
    const tables = ['completions', 'skips', 'goals', 'buddies', 'collections'] as const;
    for (const t of tables) {
      const { error } = await supabase.from(t).delete().eq('user_id', id);
      if (error) throw error;
    }
    const { error: pErr } = await supabase.from('profiles').delete().eq('id', id);
    if (pErr) throw pErr;
    await supabase.auth.signOut();
  },
};
