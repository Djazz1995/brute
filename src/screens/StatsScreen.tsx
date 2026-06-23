import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useGoals } from '@/hooks/use-goals';
import { useWeekOverview } from '@/hooks/use-week-overview';
import type { WeekDay } from '@/services/statsService';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function startOfWeek(d: Date): Date {
  const offset = (d.getDay() + 6) % 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset);
}
function sameWeek(a: Date, b: Date): boolean {
  return startOfWeek(a).getTime() === startOfWeek(b).getTime();
}
/** "Jun 16 – 22" / "Jun 30 – Jul 6" for the week containing `ref`. */
function weekLabel(ref: Date): string {
  const s = startOfWeek(ref);
  const e = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 6);
  const left = `${MONTHS[s.getMonth()]} ${s.getDate()}`;
  const right = s.getMonth() === e.getMonth() ? `${e.getDate()}` : `${MONTHS[e.getMonth()]} ${e.getDate()}`;
  return `${left} – ${right}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const LEGEND = [
  { color: '#30A46C', label: 'Done' },
  { color: 'rgba(60,135,247,0.35)', label: 'Upcoming' },
  { color: 'rgba(48,164,108,0.4)', label: 'Partial' },
  { color: 'rgba(229,72,77,0.35)', label: 'Missed' },
];

/** `cellDate` = the calendar date of this grid column; `today` = now. */
function dayTint(d: WeekDay, cellDate: Date, today: Date, settled: boolean): string {
  if (d.due === 0) return 'transparent';
  if (d.done >= d.due) return '#30A46C'; // all done (any day)
  // Today + future due-days haven't been missed yet → neutral "upcoming".
  if (startOfDay(cellDate).getTime() >= startOfDay(today).getTime())
    return 'rgba(60,135,247,0.12)';
  // Past, not fully done. While a week-switch is still loading, the grid data
  // lags the selected week — show neutral so upcoming days don't flash red.
  if (!settled) return 'rgba(60,135,247,0.12)';
  return d.done === 0 ? 'rgba(229,72,77,0.25)' : 'rgba(48,164,108,0.4)'; // missed / partial
}

export function StatsScreen() {
  const { data: goals, refetch } = useGoals();
  const [weekRef, setWeekRef] = useState(() => new Date());
  const [showHelp, setShowHelp] = useState(false);
  const { data, loading, refetch: refetchOverview } = useWeekOverview(goals, weekRef);

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchOverview();
    }, [refetch, refetchOverview])
  );

  const stepWeek = (delta: number) =>
    setWeekRef((r) => new Date(r.getFullYear(), r.getMonth(), r.getDate() + delta * 7));
  const today = new Date();
  const isThisWeek = sameWeek(weekRef, today);
  const weekStart = startOfWeek(weekRef);
  const cellDate = (day: number) =>
    new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + (day - 1));

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="subtitle" style={styles.title}>
          Stats
        </ThemedText>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.weekNav}>
            <Pressable onPress={() => stepWeek(-1)} hitSlop={12} style={styles.navBtn}>
              <ThemedText style={styles.navArrow}>‹</ThemedText>
            </Pressable>
            <ThemedText type="smallBold">{isThisWeek ? 'This week' : weekLabel(weekRef)}</ThemedText>
            <Pressable
              onPress={() => stepWeek(1)}
              hitSlop={12}
              disabled={isThisWeek}
              style={styles.navBtn}
            >
              <ThemedText style={[styles.navArrow, isThisWeek && styles.navArrowOff]}>›</ThemedText>
            </Pressable>
          </View>
          <View style={styles.grid}>
            {data.grid.map((d) => (
              <View key={d.day} style={styles.gridCol}>
                <ThemedText type="small" themeColor="textSecondary">
                  {WEEKDAYS[d.day - 1]}
                </ThemedText>
                <View style={[styles.cell, { backgroundColor: dayTint(d, cellDate(d.day), today, !loading) }]}>
                  <ThemedText type="small">{d.due > 0 ? `${d.done}/${d.due}` : '–'}</ThemedText>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.legend}>
            {LEGEND.map((l) => (
              <View key={l.label} style={styles.legendItem}>
                <View style={[styles.legendSwatch, { backgroundColor: l.color }]} />
                <ThemedText type="small" themeColor="textSecondary">
                  {l.label}
                </ThemedText>
              </View>
            ))}
          </View>

          <ThemedText type="smallBold" style={{ marginTop: Spacing.three }}>
            Streaks
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Days in a row you hit a goal. Flexible goals count by week.
          </ThemedText>

          {data.streaks.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              No goals yet.
            </ThemedText>
          ) : (
            data.streaks.map(({ goal, stats, weekDone }) => {
              const unit = stats.streakUnit === 'week' ? 'week' : 'day';
              const context =
                stats.streakUnit === 'week'
                  ? `${weekDone}/${goal.schedule.weeklyTarget} this week`
                  : `Best: ${stats.longest} ${stats.longest === 1 ? 'day' : 'days'}`;
              return (
                <ThemedView key={goal.id} type="backgroundElement" style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="smallBold">{goal.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {context}
                    </ThemedText>
                  </View>
                  <View style={styles.streakBox}>
                    <ThemedText type="subtitle" style={stats.current === 0 ? styles.streakZero : undefined}>
                      {stats.current > 0 ? `🔥 ${stats.current}` : '0'}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {stats.current > 0
                        ? `${stats.current === 1 ? unit : `${unit}s`} in a row`
                        : `${unit} streak`}
                    </ThemedText>
                  </View>
                </ThemedView>
              );
            })
          )}

          <Pressable onPress={() => setShowHelp((v) => !v)} hitSlop={8} style={styles.helpToggle}>
            <ThemedText type="small" style={styles.helpToggleText}>
              {showHelp ? 'Hide' : 'How streaks work'} {showHelp ? '⌃' : '⌄'}
            </ThemedText>
          </Pressable>
          {showHelp ? (
            <ThemedView type="backgroundElement" style={styles.help}>
              <ThemedText type="smallBold">Day streak</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Fixed-schedule & specific-date goals. Counts scheduled days done in a row. Days the
                goal isn’t scheduled don’t count against you. Miss a scheduled day → back to 0.
              </ThemedText>
              <ThemedText type="smallBold" style={{ marginTop: Spacing.two }}>
                Week streak
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                “X days a week” goals. Counts weeks you hit the target in a row. This week counts
                once you reach the target. Miss a week → back to 0.
              </ThemedText>
            </ThemedView>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.three },
  title: { paddingVertical: Spacing.three },
  content: { gap: Spacing.two, paddingBottom: 120 },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { paddingHorizontal: Spacing.three },
  navArrow: { fontSize: 24, fontWeight: '600', color: '#3c87f7' },
  navArrowOff: { opacity: 0.25 },
  grid: { flexDirection: 'row', gap: Spacing.one },
  gridCol: { flex: 1, alignItems: 'center', gap: Spacing.half },
  cell: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  streakBox: { alignItems: 'flex-end', minWidth: 92 },
  streakZero: { opacity: 0.4 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three, marginTop: Spacing.half },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.half },
  legendSwatch: { width: 12, height: 12, borderRadius: 3 },
  helpToggle: { alignSelf: 'flex-start', paddingVertical: Spacing.two, marginTop: Spacing.one },
  helpToggleText: { color: '#3c87f7', fontWeight: '600' },
  help: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.half },
});
