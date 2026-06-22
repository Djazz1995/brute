/** User profile + global defaults + tier. Owns profile I/O. AGENTS.md §7.2, §12, §15.3. */

import { getUserId } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { User, UserDefaults, UserTier } from '@/models';

type ProfileRow = {
  id: string;
  rudeness_level: 1 | 2 | 3 | 4;
  escalation_speed: 'slow' | 'normal' | 'unhinged';
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  sound: 'standard' | 'whistle' | 'foghorn' | 'silent';
  always_watermark: boolean;
  tier: UserTier;
  created_at: string;
};

function mapUser(row: ProfileRow): User {
  return {
    id: row.id,
    tier: row.tier,
    createdAt: row.created_at,
    defaults: {
      rudenessLevel: row.rudeness_level,
      escalationSpeed: row.escalation_speed,
      quietHoursStart: row.quiet_hours_start ?? undefined,
      quietHoursEnd: row.quiet_hours_end ?? undefined,
      sound: row.sound,
      alwaysWatermark: row.always_watermark,
    },
  };
}

async function requireUserId(): Promise<string> {
  const id = await getUserId();
  if (!id) throw new Error('Not signed in.');
  return id;
}

export const userService = {
  /** The signed-in user's profile (auto-created by the §8.2 trigger). */
  async getUser(): Promise<User> {
    const id = await requireUserId();
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) throw error;
    return mapUser(data as ProfileRow);
  },

  async getTier(): Promise<UserTier> {
    return (await this.getUser()).tier;
  },

  /** Patch global defaults (§7.2); returns the updated user. */
  async updateDefaults(patch: Partial<UserDefaults>): Promise<User> {
    const id = await requireUserId();
    const row: Record<string, unknown> = {};
    if (patch.rudenessLevel != null) row.rudeness_level = patch.rudenessLevel;
    if (patch.escalationSpeed != null) row.escalation_speed = patch.escalationSpeed;
    if ('quietHoursStart' in patch) row.quiet_hours_start = patch.quietHoursStart ?? null;
    if ('quietHoursEnd' in patch) row.quiet_hours_end = patch.quietHoursEnd ?? null;
    if (patch.sound != null) row.sound = patch.sound;
    if (patch.alwaysWatermark != null) row.always_watermark = patch.alwaysWatermark;
    const { data, error } = await supabase
      .from('profiles')
      .update(row)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return mapUser(data as ProfileRow);
  },

  /** Set the paid/free tier directly (used by BillingService stub purchase). */
  async setTier(tier: UserTier): Promise<User> {
    const id = await requireUserId();
    const { data, error } = await supabase
      .from('profiles')
      .update({ tier })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return mapUser(data as ProfileRow);
  },
};
