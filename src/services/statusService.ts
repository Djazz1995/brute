/** Per-goal "today" status (done / skipped / pending / off). AGENTS.md §4.7. */

import { supabase } from '@/lib/supabase';
import type { Goal, GoalToday, TodayStatus } from '@/models';

const isoDay = (d: Date): number => (d.getDay() === 0 ? 7 : d.getDay());

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Monday 00:00 of the week containing `d`. */
function startOfWeek(d: Date): Date {
  const offset = (d.getDay() + 6) % 7; // 0 = Mon … 6 = Sun
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset);
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const pad = (n: number) => String(n).padStart(2, '0');
/** Local `YYYY-MM-DD`. */
function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Pure status rule for one goal given this week's completion timestamps and
 * today's skip timestamps. Exported for testing.
 */
export function todayStatusFor(
  goal: Goal,
  weekCompletions: string[],
  todaySkips: string[],
  now: Date = new Date()
): TodayStatus {
  if (goal.paused || goal.archived) return 'off';

  const completedToday = weekCompletions.some((ts) => sameDay(new Date(ts), now));
  if (completedToday) return 'done';
  if (todaySkips.some((ts) => sameDay(new Date(ts), now))) return 'skipped';

  const weeklyTarget = goal.schedule.weeklyTarget;
  if (weeklyTarget && weeklyTarget > 0) {
    // Expected any day until the weekly target is met.
    const weekStart = startOfWeek(now).getTime();
    const hitsThisWeek = weekCompletions.filter((ts) => new Date(ts).getTime() >= weekStart).length;
    return hitsThisWeek >= weeklyTarget ? 'off' : 'pending';
  }

  // Fixed schedule: expected only on its scheduled weekdays.
  const today = isoDay(now);
  return goal.schedule.slots.some((s) => s.day === today) ? 'pending' : 'off';
}

export const statusService = {
  /** Today's snapshot for each goal (status + weekly progress), in one pair of queries. */
  async getTodayStatuses(goals: Goal[]): Promise<Record<string, GoalToday>> {
    const out: Record<string, GoalToday> = {};
    if (goals.length === 0) return out;

    const now = new Date();
    const ids = goals.map((g) => g.id);
    const weekStart = startOfWeek(now).toISOString();
    const todayStart = startOfDay(now).toISOString();

    const [{ data: comp, error: compErr }, { data: skip, error: skipErr }] = await Promise.all([
      supabase.from('completions').select('goal_id, ts').in('goal_id', ids).gte('ts', weekStart),
      supabase.from('skips').select('goal_id, ts').in('goal_id', ids).gte('ts', todayStart),
    ]);
    if (compErr) throw compErr;
    if (skipErr) throw skipErr;

    const compByGoal = new Map<string, string[]>();
    for (const r of comp as { goal_id: string; ts: string }[]) {
      (compByGoal.get(r.goal_id) ?? compByGoal.set(r.goal_id, []).get(r.goal_id)!).push(r.ts);
    }
    const skipByGoal = new Map<string, string[]>();
    for (const r of skip as { goal_id: string; ts: string }[]) {
      (skipByGoal.get(r.goal_id) ?? skipByGoal.set(r.goal_id, []).get(r.goal_id)!).push(r.ts);
    }

    // Specific-dates goals need their full completion history (dates can be any
    // time, not just this week) to compute "N/total dates done".
    const dateGoalIds = goals.filter((g) => g.schedule.dates?.length).map((g) => g.id);
    const doneDatesByGoal = new Map<string, Set<string>>();
    if (dateGoalIds.length > 0) {
      const { data: allComp, error: allErr } = await supabase
        .from('completions')
        .select('goal_id, ts')
        .in('goal_id', dateGoalIds);
      if (allErr) throw allErr;
      for (const r of (allComp ?? []) as { goal_id: string; ts: string }[]) {
        const set = doneDatesByGoal.get(r.goal_id) ?? new Set<string>();
        set.add(ymd(new Date(r.ts)));
        doneDatesByGoal.set(r.goal_id, set);
      }
    }

    const weekStartMs = startOfWeek(now).getTime();
    const todayYmd = ymd(now);
    for (const g of goals) {
      const comps = compByGoal.get(g.id) ?? [];
      const skips = skipByGoal.get(g.id) ?? [];

      if (g.schedule.dates?.length) {
        const done = doneDatesByGoal.get(g.id) ?? new Set<string>();
        const total = g.schedule.dates.length;
        const doneCount = g.schedule.dates.filter((d) => done.has(d)).length;
        let status: TodayStatus;
        if (g.paused || g.archived) status = 'off';
        else if (done.has(todayYmd)) status = 'done';
        else if (skips.some((ts) => sameDay(new Date(ts), now))) status = 'skipped';
        else if (g.schedule.dates.includes(todayYmd)) status = 'pending';
        else status = 'off';
        out[g.id] = { status, progress: { done: doneCount, total, kind: 'dates' } };
        continue;
      }

      const status = todayStatusFor(g, comps, skips, now);
      const weeklyTarget = g.schedule.weeklyTarget;
      const progress =
        weeklyTarget != null
          ? {
              done: comps.filter((ts) => new Date(ts).getTime() >= weekStartMs).length,
              total: weeklyTarget,
              kind: 'weekly' as const,
            }
          : undefined;
      out[g.id] = { status, progress };
    }
    return out;
  },
};
