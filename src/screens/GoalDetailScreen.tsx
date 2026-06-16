import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useComplete } from '@/hooks/use-complete';
import { useGoal } from '@/hooks/use-goal';
import { useStreak } from '@/hooks/use-streak';
import { goalService } from '@/services/goalService';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type Props = { goalId: string };

export function GoalDetailScreen({ goalId }: Props) {
  const router = useRouter();
  const { data: goal, loading, error, refetch: refetchGoal } = useGoal(goalId);
  const { data: stats, refetch: refetchStats } = useStreak(goalId);
  const { complete, completing } = useComplete();
  const [justDone, setJustDone] = useState(false);

  async function onDone() {
    try {
      await complete(goalId, 'tap');
      setJustDone(true);
      await refetchStats();
    } catch (e) {
      Alert.alert('Could not mark done', (e as Error).message);
    }
  }

  function onDelete() {
    Alert.alert('Delete goal?', 'This removes the goal and its history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await goalService.remove(goalId);
            router.back();
          } catch (e) {
            Alert.alert('Could not delete', (e as Error).message);
          }
        },
      },
    ]);
  }

  async function onTogglePause() {
    if (!goal) return;
    await goalService.setPaused(goalId, !goal.paused);
    refetchGoal();
  }

  if (loading && !goal) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
      </ThemedView>
    );
  }
  if (error || !goal) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText type="small">Couldn’t load goal: {error?.message ?? 'not found'}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <ThemedText type="title">{goal.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {goal.category} · rudeness {goal.rudenessLevel} · {goal.escalationSpeed}
            {goal.paused ? ' · paused' : ''}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {goal.schedule.slots.length > 0
              ? goal.schedule.slots
                  .map((s) => `${WEEKDAYS[s.day - 1]} ${s.label ? `${s.label} ` : ''}${s.time}`)
                  .join(', ')
              : 'No reminders set'}
          </ThemedText>
          {goal.cue ? (
            <ThemedText type="small" themeColor="textSecondary">
              Cue: {goal.cue}
            </ThemedText>
          ) : null}
          {goal.blockers.length > 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              Excuses on file: {goal.blockers.join(', ')}
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <Stat label="Current streak" value={stats ? `${stats.current}` : '—'} />
          <Stat label="Longest" value={stats ? `${stats.longest}` : '—'} />
          <Stat
            label="7d rate"
            value={stats ? `${Math.round(stats.completionRate7 * 100)}%` : '—'}
          />
        </View>

        {justDone ? (
          <ThemedText type="smallBold" style={{ color: '#30A46C' }}>
            Logged. The couch loses this round.
          </ThemedText>
        ) : null}

        <Button title="Done ✓" onPress={onDone} loading={completing} />
        <Button
          title={goal.paused ? 'Resume' : 'Pause'}
          variant="secondary"
          onPress={onTogglePause}
        />
        <Button
          title="Edit"
          variant="secondary"
          onPress={() => router.push(`/goal/${goalId}/edit`)}
        />
        <Button title="Delete" variant="danger" onPress={onDelete} />
      </ScrollView>
    </ThemedView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.stat}>
      <ThemedText type="subtitle">{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.six },
  statsRow: { flexDirection: 'row', gap: Spacing.two },
  stat: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    gap: Spacing.one,
  },
});
