import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useComplete } from '@/hooks/use-complete';
import { useGoal } from '@/hooks/use-goal';
import { useStreak } from '@/hooks/use-streak';
import { useTheme } from '@/hooks/use-theme';
import type { ScheduleSlot } from '@/models';
import { goalService } from '@/services/goalService';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function slotText(s: ScheduleSlot): string {
  return `${WEEKDAYS[s.day - 1]} ${s.label ? `${s.label} ` : ''}${s.time}`;
}

/** Is any reminder scheduled for today's weekday? */
function isScheduledToday(slots: ScheduleSlot[]): boolean {
  const isoToday = new Date().getDay() === 0 ? 7 : new Date().getDay();
  return slots.some((s) => s.day === isoToday);
}

/** Soonest upcoming slot from now (wraps to next week). */
function nextReminder(slots: ScheduleSlot[]): ScheduleSlot | undefined {
  if (slots.length === 0) return undefined;
  const now = new Date();
  const isoToday = now.getDay() === 0 ? 7 : now.getDay();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  let best: ScheduleSlot | undefined;
  let bestDelta = Infinity;
  for (const s of slots) {
    const [h, m] = s.time.split(':').map(Number);
    const dayDiff = (s.day - isoToday + 7) % 7;
    let delta = dayDiff * 1440 + (h * 60 + m - nowMin);
    if (delta <= 0) delta += 7 * 1440;
    if (delta < bestDelta) {
      bestDelta = delta;
      best = s;
    }
  }
  return best;
}

type Props = { goalId: string };

export function GoalDetailScreen({ goalId }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const { data: goal, loading, error, refetch: refetchGoal } = useGoal(goalId);
  const { data: stats, refetch: refetchStats } = useStreak(goalId);
  const { complete, completing } = useComplete();
  const [justDone, setJustDone] = useState(false);
  const [amountDraft, setAmountDraft] = useState('');

  // Refresh stats/goal when returning (e.g. after a skip or edit).
  useFocusEffect(
    useCallback(() => {
      refetchGoal();
      refetchStats();
    }, [refetchGoal, refetchStats])
  );

  async function onDone() {
    const quantified = typeof goal?.targetValue === 'number';
    let amount: number | undefined;
    if (quantified) {
      const parsed = Number(amountDraft);
      if (!amountDraft.trim() || Number.isNaN(parsed) || parsed < 0) {
        Alert.alert('Enter an amount', `How many ${goal?.unit ?? 'units'} did you do?`);
        return;
      }
      amount = parsed;
    }
    try {
      await complete(goalId, 'tap', Boolean(goal?.buddyId), amount);
      setJustDone(true);
      setAmountDraft('');
      await refetchStats();
    } catch (e) {
      Alert.alert('Could not mark done', (e as Error).message);
    }
  }

  async function onToggleArchive() {
    if (!goal) return;
    await goalService.setArchived(goalId, !goal.archived);
    if (!goal.archived) router.back();
    else refetchGoal();
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

  const next = nextReminder(goal.schedule.slots);
  const scheduledToday = isScheduledToday(goal.schedule.slots);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: goal.name,
          headerRight: () => (
            <Pressable
              onPress={() => router.push(`/goal/${goalId}/edit`)}
              hitSlop={12}
              style={styles.headerBtn}
            >
              <ThemedText style={styles.headerBtnText}>Edit</ThemedText>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <ThemedText type="title">{goal.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {goal.category} · rudeness {goal.rudenessLevel} · {goal.escalationSpeed}
            {goal.paused ? ' · paused' : ''}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {goal.schedule.weeklyTarget
              ? `${goal.schedule.weeklyTarget}× per week`
              : goal.schedule.slots.length > 0
                ? goal.schedule.slots.map(slotText).join(', ')
                : 'No reminders set'}
          </ThemedText>
          {typeof goal.targetValue === 'number' ? (
            <ThemedText type="small" themeColor="textSecondary">
              Target: {goal.targetValue} {goal.unit ?? ''}
            </ThemedText>
          ) : null}
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
          {goal.buddyId ? (
            <ThemedText type="small" themeColor="textSecondary">
              👁 A buddy sees your wins and bails.
            </ThemedText>
          ) : null}
        </View>

        {next ? (
          <ThemedView type="backgroundElement" style={styles.nextBox}>
            <ThemedText type="small" themeColor="textSecondary">
              {goal.paused ? 'Paused — next would be' : 'Next reminder'}
            </ThemedText>
            <ThemedText type="smallBold">{slotText(next)}</ThemedText>
          </ThemedView>
        ) : null}

        <View style={styles.statsRow}>
          <Stat
            label={stats?.streakUnit === 'week' ? 'Streak (weeks)' : 'Current streak'}
            value={stats ? `${stats.current}` : '—'}
          />
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

        {typeof goal.targetValue === 'number' ? (
          <View style={styles.amountRow}>
            <TextInput
              value={amountDraft}
              onChangeText={setAmountDraft}
              placeholder={`How many ${goal.unit ?? 'units'}? (target ${goal.targetValue})`}
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              style={[
                styles.amountInput,
                { color: theme.text, backgroundColor: theme.backgroundElement },
              ]}
            />
          </View>
        ) : null}

        <Button title="Done ✓" onPress={onDone} loading={completing} style={styles.doneHero} />
        {scheduledToday && !goal.paused ? (
          <Button
            title="I can’t today"
            variant="secondary"
            onPress={() => router.push(`/goal/${goalId}/skip`)}
          />
        ) : null}
        <Button
          title={goal.paused ? 'Resume' : 'Pause'}
          variant="secondary"
          onPress={onTogglePause}
        />

        <Button
          title={goal.archived ? 'Unarchive' : 'Archive'}
          variant="secondary"
          onPress={onToggleArchive}
        />

        <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteLink}>
          <ThemedText type="small" style={{ color: '#E5484D' }}>
            Delete goal
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.stat}>
      <ThemedText type="subtitle">{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
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
  statLabel: { textAlign: 'center' },
  nextBox: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.half,
  },
  headerBtn: { paddingHorizontal: Spacing.two },
  headerBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#3c87f7',
  },
  doneHero: { minHeight: 60 },
  amountRow: { flexDirection: 'row' },
  amountInput: {
    flex: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  deleteLink: { alignSelf: 'center', paddingVertical: Spacing.three },
});
