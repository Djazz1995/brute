/** Goal CRUD. Owns all goal I/O; returns models, throws on error. AGENTS.md §15.3. */

import { getUserId } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { EscalationSpeed, Goal, GoalCategory, RudenessLevel, Schedule } from '@/models';

/** Legacy rows stored `{ days, timeOfDay }`; map them onto the slot model. */
type LegacySchedule = { days: number[]; timeOfDay: string };

function normalizeSchedule(raw: Schedule | LegacySchedule): Schedule {
  if ('slots' in raw && Array.isArray(raw.slots)) return raw;
  const legacy = raw as LegacySchedule;
  if (Array.isArray(legacy.days) && legacy.timeOfDay) {
    return { slots: legacy.days.map((day) => ({ day, time: legacy.timeOfDay })) };
  }
  return { slots: [] };
}

type GoalRow = {
  id: string;
  user_id: string;
  name: string;
  category: GoalCategory;
  cue: string | null;
  blockers: string[];
  schedule: Schedule | LegacySchedule;
  rudeness_level: RudenessLevel;
  escalation_speed: EscalationSpeed;
  buddy_id: string | null;
  paused: boolean;
  created_at: string;
};

function mapGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    category: row.category,
    cue: row.cue ?? undefined,
    blockers: row.blockers ?? [],
    schedule: normalizeSchedule(row.schedule),
    rudenessLevel: row.rudeness_level,
    escalationSpeed: row.escalation_speed,
    buddyId: row.buddy_id ?? undefined,
    paused: row.paused,
    createdAt: row.created_at,
  };
}

/** Fields a user supplies when creating/editing a goal (§4.1). */
export type GoalInput = {
  name: string;
  category: GoalCategory;
  cue?: string;
  blockers?: string[];
  schedule: Schedule;
  rudenessLevel: RudenessLevel;
  escalationSpeed: EscalationSpeed;
  buddyId?: string;
};

function toRow(input: GoalInput) {
  return {
    name: input.name,
    category: input.category,
    cue: input.cue ?? null,
    blockers: input.blockers ?? [],
    schedule: input.schedule,
    rudeness_level: input.rudenessLevel,
    escalation_speed: input.escalationSpeed,
    buddy_id: input.buddyId ?? null,
  };
}

export const goalService = {
  async list(): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as GoalRow[]).map(mapGoal);
  },

  async get(id: string): Promise<Goal> {
    const { data, error } = await supabase.from('goals').select('*').eq('id', id).single();
    if (error) throw error;
    return mapGoal(data as GoalRow);
  },

  async create(input: GoalInput): Promise<Goal> {
    const userId = await getUserId();
    if (!userId) throw new Error('Not signed in.');
    const { data, error } = await supabase
      .from('goals')
      .insert({ ...toRow(input), user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return mapGoal(data as GoalRow);
  },

  async update(id: string, input: GoalInput): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .update(toRow(input))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapGoal(data as GoalRow);
  },

  async setPaused(id: string, paused: boolean): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .update({ paused })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapGoal(data as GoalRow);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) throw error;
  },
};
