import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useGoals } from '@/hooks/use-goals';
import { useWeekOverview } from '@/hooks/use-week-overview';
import type { WeekDay } from '@/services/statsService';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function dayTint(d: WeekDay): string {
  if (d.due === 0) return 'transparent';
  if (d.done === 0) return 'rgba(229,72,77,0.25)'; // missed
  if (d.done >= d.due) return '#30A46C'; // all done
  return 'rgba(48,164,108,0.4)'; // partial
}

export function StatsScreen() {
  const { data: goals, refetch } = useGoals();
  const { data, refetch: refetchOverview } = useWeekOverview(goals);

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchOverview();
    }, [refetch, refetchOverview])
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="subtitle" style={styles.title}>
          Stats
        </ThemedText>

        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="smallBold">This week</ThemedText>
          <View style={styles.grid}>
            {data.grid.map((d) => (
              <View key={d.day} style={styles.gridCol}>
                <ThemedText type="small" themeColor="textSecondary">
                  {WEEKDAYS[d.day - 1]}
                </ThemedText>
                <View style={[styles.cell, { backgroundColor: dayTint(d) }]}>
                  <ThemedText type="small">{d.due > 0 ? `${d.done}/${d.due}` : '–'}</ThemedText>
                </View>
              </View>
            ))}
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            Done / due per day.
          </ThemedText>

          <ThemedText type="smallBold" style={{ marginTop: Spacing.three }}>
            Streaks
          </ThemedText>
          {data.streaks.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              No goals yet.
            </ThemedText>
          ) : (
            data.streaks.map(({ goal, stats }) => (
              <ThemedView key={goal.id} type="backgroundElement" style={styles.row}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="smallBold">{goal.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {Math.round(stats.completionRate7 * 100)}% this week
                  </ThemedText>
                </View>
                <View style={styles.streakBox}>
                  <ThemedText type="subtitle">{stats.current}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {stats.streakUnit === 'week' ? 'wk streak' : 'day streak'}
                  </ThemedText>
                </View>
              </ThemedView>
            ))
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
  content: { gap: Spacing.two, paddingBottom: Spacing.six },
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
  streakBox: { alignItems: 'center' },
});
