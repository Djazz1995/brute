import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useArchivedGoals } from '@/hooks/use-archived-goals';

/**
 * Archived goals (§4.7). Tap one to open its detail, where Unarchive lives.
 * Reached from Settings.
 */
export function ArchivedScreen() {
  const router = useRouter();
  const { data, loading, error, refetch } = useArchivedGoals();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  return (
    <ThemedView style={styles.container}>
      {loading && data.length === 0 ? (
        <ActivityIndicator style={styles.center} />
      ) : error ? (
        <ThemedText type="small" style={styles.center}>
          Couldn’t load: {error.message}
        </ThemedText>
      ) : data.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          No archived goals. Archive a goal to keep its history without it
          cluttering Home.
        </ThemedText>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(g) => g.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/goal/${item.id}`)}>
              <ThemedView type="backgroundElement" style={styles.row}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="smallBold">{item.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.category}
                  </ThemedText>
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  ›
                </ThemedText>
              </ThemedView>
            </Pressable>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { textAlign: 'center', marginTop: Spacing.five, paddingHorizontal: Spacing.three },
  list: { padding: Spacing.three, gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
});
