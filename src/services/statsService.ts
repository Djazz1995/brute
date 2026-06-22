/** Week overview: per-day done-vs-due grid + per-goal streaks. AGENTS.md §4.7. */

import { supabase } from '@/lib/supabase';
import type { Goal, StreakStats } from '@/models';
import { completionService } from '@/services/completionService';

const isoDay = (d: Date): number => (d.getDay() === 0 ? 7 : d.getDay());

function startOfWeek(d: Date): Date {
  const offset = (d.getDay() + 6) % 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset);
}

/** How many active goals are "due" on a given weekday (fixed slot or weekly). */
function dueOn(goals: Goal[], day: number): number {
  return goals.filter(
    (g) =>
      !g.paused &&
      !g.archived &&
      (g.schedule.weeklyTarget ? true : g.schedule.slots.some((s) => s.day === day))
  ).length;
}

export type WeekDay = { day: number; done: number; due: number };
export type GoalStreak = { goal: Goal; stats: StreakStats };
export type WeekOverview = { grid: WeekDay[]; streaks: GoalStreak[] };

export const statsService = {
  async getOverview(goals: Goal[]): Promise<WeekOverview> {
    const grid: WeekDay[] = Array.from({ length: 7 }, (_, i) => ({
      day: i + 1,
      done: 0,
      due: dueOn(goals, i + 1),
    }));

    if (goals.length === 0) return { grid, streaks: [] };

    const ids = goals.map((g) => g.id);
    const weekStart = startOfWeek(new Date()).toISOString();
    const { data: comp, error } = await supabase
      .from('completions')
      .select('ts')
      .in('goal_id', ids)
      .gte('ts', weekStart);
    if (error) throw error;

    for (const r of comp as { ts: string }[]) {
      grid[isoDay(new Date(r.ts)) - 1].done += 1;
    }

    const streaks = await Promise.all(
      goals.map(async (goal) => ({ goal, stats: await completionService.getStats(goal.id) }))
    );

    return { grid, streaks };
  },
};
