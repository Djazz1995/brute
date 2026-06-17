/** Completion logging + derived streak stats. AGENTS.md §4.3, §4.7, §15.3. */

import { getUserId } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Completion, CompletionSource, StreakStats } from '@/models';

type CompletionRow = {
  id: string;
  goal_id: string;
  user_id: string;
  ts: string;
  source: CompletionSource;
  witnessed: boolean;
  amount: number | null;
};

function mapCompletion(row: CompletionRow): Completion {
  return {
    id: row.id,
    goalId: row.goal_id,
    timestamp: row.ts,
    source: row.source,
    witnessed: row.witnessed,
    amount: row.amount ?? undefined,
  };
}

/** Local YYYY-MM-DD key for a timestamp. */
function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function daysBetween(a: Date, b: Date): number {
  const ms = 24 * 60 * 60 * 1000;
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((da - db) / ms);
}

const isoDay = (d: Date): number => (d.getDay() === 0 ? 7 : d.getDay());

/**
 * Are `prev` → `next` consecutive for streak purposes? True when they're
 * adjacent days, OR every calendar day strictly between them is a NON-scheduled
 * weekday — i.e. a day the goal never expected you to act, so missing it can't
 * break the streak (§4.7). With no scheduled days, only adjacent days count.
 */
function bridged(prev: Date, next: Date, scheduledDays?: Set<number>): boolean {
  const gap = daysBetween(next, prev);
  if (gap === 1) return true;
  if (gap < 1 || !scheduledDays || scheduledDays.size === 0) return false;
  for (let k = 1; k < gap; k++) {
    const mid = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + k);
    if (scheduledDays.has(isoDay(mid))) return false; // a scheduled day was missed
  }
  return true;
}

/**
 * Day-based streaks from distinct completion days, schedule-aware. A miss on a
 * non-scheduled weekday doesn't break the run (the schedule defines which days
 * count; every other day is implicitly a rest day).
 * `current` = run ending today (or bridged to today over non-scheduled days).
 */
function computeDayStreaks(
  completionDates: string[],
  scheduledDays?: Set<number>
): { current: number; longest: number } {
  const uniqueDays = [...new Set(completionDates.map(dayKey))]
    .map((k) => {
      const [y, m, d] = k.split('-').map(Number);
      return new Date(y, m, d);
    })
    .sort((a, b) => a.getTime() - b.getTime());

  if (uniqueDays.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    run = bridged(uniqueDays[i - 1], uniqueDays[i], scheduledDays) ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const today = new Date();
  const last = uniqueDays[uniqueDays.length - 1];
  let current = 0;
  if (daysBetween(today, last) === 0 || bridged(last, today, scheduledDays)) {
    current = 1;
    for (let i = uniqueDays.length - 1; i > 0; i--) {
      if (bridged(uniqueDays[i - 1], uniqueDays[i], scheduledDays)) current += 1;
      else break;
    }
  }
  return { current, longest };
}

/** Monday-anchored week index (integer increments each Mon-started week). */
function weekIndex(d: Date): number {
  const offset = (d.getDay() + 6) % 7; // 0 = Mon … 6 = Sun
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset);
  return Math.round(monday.getTime() / (7 * 24 * 60 * 60 * 1000));
}

/**
 * Week-based streaks for weekly-target goals (§4.1). A week counts when its
 * completion total meets `weeklyTarget`. `current` = run of hit weeks ending
 * this week or last week.
 */
function computeWeekStreaks(
  completionDates: string[],
  weeklyTarget: number
): { current: number; longest: number } {
  const counts = new Map<number, number>();
  for (const iso of completionDates) {
    const w = weekIndex(new Date(iso));
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  const hitWeeks = [...counts.entries()]
    .filter(([, n]) => n >= weeklyTarget)
    .map(([w]) => w)
    .sort((a, b) => a - b);

  if (hitWeeks.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < hitWeeks.length; i++) {
    run = hitWeeks[i] - hitWeeks[i - 1] === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const thisWeek = weekIndex(new Date());
  const last = hitWeeks[hitWeeks.length - 1];
  let current = 0;
  if (thisWeek - last <= 1) {
    current = 1;
    for (let i = hitWeeks.length - 1; i > 0; i--) {
      if (hitWeeks[i] - hitWeeks[i - 1] === 1) current += 1;
      else break;
    }
  }
  return { current, longest };
}

/** Engagement rate over a window: completions / (completions + skips). */
function rateInWindow(completions: string[], skips: string[], days: number): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const c = completions.filter((t) => new Date(t).getTime() >= cutoff).length;
  const s = skips.filter((t) => new Date(t).getTime() >= cutoff).length;
  const total = c + s;
  return total === 0 ? 0 : c / total;
}

export const completionService = {
  async complete(
    goalId: string,
    source: CompletionSource = 'tap',
    witnessed = false,
    amount?: number
  ): Promise<Completion> {
    const userId = await getUserId();
    if (!userId) throw new Error('Not signed in.');
    const { data, error } = await supabase
      .from('completions')
      .insert({ goal_id: goalId, user_id: userId, source, witnessed, amount: amount ?? null })
      .select()
      .single();
    if (error) throw error;
    return mapCompletion(data as CompletionRow);
  },

  async getStats(goalId: string): Promise<StreakStats> {
    const [{ data: goalRow, error: goalErr }, { data: comp, error: compErr }, { data: skip, error: skipErr }] =
      await Promise.all([
        supabase.from('goals').select('schedule').eq('id', goalId).single(),
        supabase.from('completions').select('ts').eq('goal_id', goalId),
        supabase.from('skips').select('ts').eq('goal_id', goalId),
      ]);
    if (goalErr) throw goalErr;
    if (compErr) throw compErr;
    if (skipErr) throw skipErr;

    const completions = (comp as { ts: string }[]).map((r) => r.ts);
    const skips = (skip as { ts: string }[]).map((r) => r.ts);

    const schedule = (goalRow as { schedule: { slots?: { day: number }[]; weeklyTarget?: number } })
      .schedule;
    const weeklyTarget = schedule?.weeklyTarget;
    const scheduledDays = new Set((schedule?.slots ?? []).map((s) => s.day));

    const { current, longest } =
      weeklyTarget && weeklyTarget > 0
        ? computeWeekStreaks(completions, weeklyTarget)
        : computeDayStreaks(completions, scheduledDays);

    return {
      current,
      longest,
      streakUnit: weeklyTarget && weeklyTarget > 0 ? 'week' : 'day',
      completionRate7: rateInWindow(completions, skips, 7),
      completionRate30: rateInWindow(completions, skips, 30),
      completionRate90: rateInWindow(completions, skips, 90),
      // Requires the notification engine to know what was scheduled-but-ignored.
      ignoredCount: 0, // TODO(Phase 5): derive from scheduled-vs-acted.
    };
  },
};
