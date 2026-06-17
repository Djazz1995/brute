import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Pressable, SectionList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useCollections } from '@/hooks/use-collections';
import { useGoals } from '@/hooks/use-goals';
import type { Collection, Goal } from '@/models';

const UNGROUPED = 'Ungrouped';

/** Groups goals by collection name; only adds headers when collections exist. */
function buildSections(goals: Goal[], collections: Collection[]) {
  const nameById = new Map(collections.map((c) => [c.id, c.name]));
  // Section order: each collection (creation order), then Ungrouped last.
  const order = [...collections.map((c) => c.name), UNGROUPED];
  const byTitle = new Map<string, Goal[]>();
  for (const g of goals) {
    const title = (g.collectionId && nameById.get(g.collectionId)) || UNGROUPED;
    const list = byTitle.get(title) ?? [];
    list.push(g);
    byTitle.set(title, list);
  }
  return order
    .filter((title) => byTitle.has(title))
    .map((title) => ({ title, data: byTitle.get(title)! }));
}

export function HomeScreen() {
  const router = useRouter();
  const { data: goals, loading, error, refetch } = useGoals();
  const { data: collections, refetch: refetchCollections } = useCollections();

  // Refresh when returning from create/edit/detail.
  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchCollections();
    }, [refetch, refetchCollections])
  );

  const sections = useMemo(() => buildSections(goals, collections), [goals, collections]);
  const showHeaders = collections.length > 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Your Goals</ThemedText>
        </View>

        {loading && goals.length === 0 ? (
          <ActivityIndicator style={styles.center} />
        ) : error ? (
          <ThemedText type="small" style={styles.center}>
            Couldn’t load goals: {error.message}
          </ThemedText>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(g) => g.id}
            contentContainerStyle={styles.list}
            stickySectionHeadersEnabled={false}
            renderSectionHeader={
              showHeaders
                ? ({ section }) => (
                    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.section}>
                      {section.title}
                    </ThemedText>
                  )
                : undefined
            }
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
  section: { marginTop: Spacing.three, marginBottom: Spacing.one, textTransform: 'uppercase' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  footer: { paddingTop: Spacing.three, paddingBottom: BottomTabInset + Spacing.three },
});
