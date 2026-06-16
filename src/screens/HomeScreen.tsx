import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useGoals } from '@/hooks/use-goals';
import type { Goal } from '@/models';

export function HomeScreen() {
  const router = useRouter();
  const { data, loading, error, refetch } = useGoals();

  // Refresh when returning from create/edit/detail.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Your Goals</ThemedText>
        </View>

        {loading && data.length === 0 ? (
          <ActivityIndicator style={styles.center} />
        ) : error ? (
          <ThemedText type="small" style={styles.center}>
            Couldn’t load goals: {error.message}
          </ThemedText>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(g) => g.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <GoalRow goal={item} />}
            ListEmptyComponent={
              <ThemedText type="small" style={styles.center}>
                No goals yet. Add one to get roasted.
              </ThemedText>
            }
          />
        )}

        <View style={styles.footer}>
          <Button title="+ New Goal" onPress={() => router.push('/goal/new')} />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function GoalRow({ goal }: { goal: Goal }) {
  return (
    <Link href={`/goal/${goal.id}`} asChild>
      <Pressable>
        <ThemedView type="backgroundElement" style={styles.row}>
          <View style={{ flex: 1 }}>
            <ThemedText type="smallBold">{goal.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {goal.category}
              {goal.paused ? ' · paused' : ''} · {goal.schedule.slots.length}{' '}
              {goal.schedule.slots.length === 1 ? 'reminder' : 'reminders'}
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            ›
          </ThemedText>
        </ThemedView>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.three },
  header: { paddingVertical: Spacing.three },
  center: { textAlign: 'center', marginTop: Spacing.five },
  list: { gap: Spacing.two, paddingBottom: Spacing.three },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  footer: { paddingTop: Spacing.three, paddingBottom: BottomTabInset + Spacing.three },
});
