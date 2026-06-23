import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ymd } from '@/components/month-calendar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useGoals } from '@/hooks/use-goals';
import { useTodayStatuses } from '@/hooks/use-today-status';
import type { Goal, TodayStatus } from '@/models';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const isoDay = (d: Date): number => (d.getDay() === 0 ? 7 : d.getDay());

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** 6 weeks × 7 days (Mon-first) covering the month containing `view`. */
function monthWeeks(view: Date): Date[][] {
  const first = startOfMonth(view);
  const offset = (first.getDay() + 6) % 7; // Mon=0 … Sun=6 before the 1st
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
  const cells = Array.from(
    { length: 42 },
    (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
  );
  return Array.from({ length: 6 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}

type DayEntry = { goal: Goal; times: string[]; kind: 'fixed' | 'weekly' | 'dates' };

/**
 * Goals due on a given date: fixed slots on that weekday, weekly goals any day,
 * specific-dates goals on their picked dates. Excludes goals on dates before
 * they were created (no time travel).
 */
function goalsForDay(goals: Goal[], date: Date): DayEntry[] {
  const day = isoDay(date);
  const dateYmd = ymd(date);
  const dayFloor = startOfDay(date).getTime();
  const out: DayEntry[] = [];
  for (const g of goals) {
    if (g.paused || g.archived) continue;
    if (dayFloor < startOfDay(new Date(g.createdAt)).getTime()) continue; // before the goal existed
    if (g.schedule.dates?.length) {
      if (g.schedule.dates.includes(dateYmd)) {
        out.push({ goal: g, times: g.schedule.time ? [g.schedule.time] : [], kind: 'dates' });
      }
    } else if (g.schedule.weeklyTarget) {
      out.push({ goal: g, times: [], kind: 'weekly' });
    } else {
      const times = g.schedule.slots.filter((s) => s.day === day).map((s) => s.time);
      if (times.length > 0) out.push({ goal: g, times, kind: 'fixed' });
    }
  }
  return out;
}

const STATUS_COLOR: Record<TodayStatus, string | null> = {
  done: '#30A46C',
  skipped: '#E5484D',
  pending: '#3c87f7',
  off: null,
};

export function AgendaScreen() {
  const { data: goals, refetch } = useGoals();
  const { data: statuses, refetch: refetchStatuses } = useTodayStatuses(goals);
  const [selected, setSelected] = useState(() => new Date());
  const [view, setView] = useState(() => startOfMonth(new Date()));

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchStatuses();
    }, [refetch, refetchStatuses])
  );

  const today = new Date();
  const weeks = useMemo(() => monthWeeks(view), [view]);
  const entries = useMemo(() => goalsForDay(goals, selected), [goals, selected]);
  const isSelectedToday = sameDay(selected, today);
  // Days that have any goal — drives the dot under the date.
  const daysWithGoals = useMemo(() => {
    const set = new Set<string>();
    for (const week of weeks) {
      for (const d of week) {
        if (goalsForDay(goals, d).length > 0) set.add(startOfDay(d).toDateString());
      }
    }
    return set;
  }, [weeks, goals]);

  function pickDay(d: Date) {
    setSelected(d);
    if (d.getMonth() !== view.getMonth()) setView(startOfMonth(d));
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="subtitle" style={styles.title}>
          Agenda
        </ThemedText>

        <View style={styles.monthHeader}>
          <Pressable onPress={() => setView(addMonths(view, -1))} hitSlop={12} style={styles.navBtn}>
            <ThemedText style={styles.navArrow}>‹</ThemedText>
          </Pressable>
          <ThemedText type="smallBold">
            {MONTHS[view.getMonth()]} {view.getFullYear()}
          </ThemedText>
          <Pressable onPress={() => setView(addMonths(view, 1))} hitSlop={12} style={styles.navBtn}>
            <ThemedText style={styles.navArrow}>›</ThemedText>
          </Pressable>
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((w) => (
            <ThemedText key={w} type="small" themeColor="textSecondary" style={styles.weekdayCell}>
              {w}
            </ThemedText>
          ))}
        </View>

        {weeks.map((week, wi) => (
          <View key={wi} style={styles.weekRow}>
            {week.map((d) => {
              const inMonth = d.getMonth() === view.getMonth();
              const isToday = sameDay(d, today);
              const isSel = sameDay(d, selected);
              const hasGoals = daysWithGoals.has(startOfDay(d).toDateString());
              return (
                <Pressable key={d.toISOString()} onPress={() => pickDay(d)} style={styles.cell}>
                  <View style={[styles.cellInner, isSel && styles.cellSelected, isToday && !isSel && styles.cellToday]}>
                    <ThemedText
                      type="small"
                      style={[
                        isSel && styles.cellTextSel,
                        !inMonth && styles.cellTextDim,
                      ]}
                    >
                      {d.getDate()}
                    </ThemedText>
                  </View>
                  <View style={[styles.cellDot, hasGoals && inMonth ? styles.cellDotOn : null]} />
                </Pressable>
              );
            })}
          </View>
        ))}

        <ThemedText type="smallBold" style={styles.dayLabel}>
          {isSelectedToday ? 'Today' : `${WEEKDAYS[isoDay(selected) - 1]} ${selected.getDate()} ${MONTHS[selected.getMonth()]}`}
        </ThemedText>

        <ScrollView contentContainerStyle={styles.list}>
          {entries.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              Nothing due this day.
            </ThemedText>
          ) : (
            entries.map(({ goal, times, kind }) => {
              const t = statuses[goal.id];
              let badge: { color: string; text: string } | null = null;
              if (t?.progress) {
                const { done, total } = t.progress;
                badge = { color: done >= total ? '#30A46C' : '#3c87f7', text: `${done}/${total}` };
              } else if (isSelectedToday && t?.status) {
                const color = STATUS_COLOR[t.status];
                if (color) {
                  badge = {
                    color,
                    text: t.status === 'done' ? 'Done' : t.status === 'skipped' ? 'Skipped' : 'Today',
                  };
                }
              }
              const subtitle =
                kind === 'weekly'
                  ? `${goal.schedule.weeklyTarget} ${goal.schedule.weeklyTarget === 1 ? 'day' : 'days'} a week`
                  : times.length > 0
                    ? times.join(', ')
                    : 'any time';
              return (
                <Link key={goal.id} href={`/goal/${goal.id}`} asChild>
                  <Pressable>
                    <ThemedView type="backgroundElement" style={styles.row}>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="smallBold">{goal.name}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {subtitle}
                        </ThemedText>
                      </View>
                      {badge ? (
                        <View style={[styles.badge, { backgroundColor: badge.color }]}>
                          <ThemedText type="small" style={styles.badgeText}>
                            {badge.text}
                          </ThemedText>
                        </View>
                      ) : null}
                    </ThemedView>
                  </Pressable>
                </Link>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.three },
  title: { paddingVertical: Spacing.three },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  navBtn: { paddingHorizontal: Spacing.three },
  navArrow: { fontSize: 24, fontWeight: '600', color: '#3c87f7' },
  weekdayRow: { flexDirection: 'row', marginBottom: Spacing.one },
  weekdayCell: { flex: 1, textAlign: 'center' },
  weekRow: { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center', paddingVertical: Spacing.one, gap: 2 },
  cellInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: { backgroundColor: '#3c87f7' },
  cellToday: { borderWidth: 1, borderColor: '#3c87f7' },
  cellTextSel: { color: '#fff', fontWeight: '700' },
  cellTextDim: { opacity: 0.3 },
  cellDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'transparent' },
  cellDotOn: { backgroundColor: '#3c87f7' },
  dayLabel: { marginTop: Spacing.three, marginBottom: Spacing.one },
  list: { gap: Spacing.two, paddingBottom: Spacing.six },
  empty: { textAlign: 'center', marginTop: Spacing.four },
  row: { flexDirection: 'row', alignItems: 'center', padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two },
  badge: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.half, borderRadius: Spacing.five },
  badgeText: { color: '#fff', fontWeight: '600' },
});
