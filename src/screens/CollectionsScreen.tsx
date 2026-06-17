import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCollections } from '@/hooks/use-collections';
import { useTheme } from '@/hooks/use-theme';
import { collectionService } from '@/services/collectionService';

export function CollectionsScreen() {
  const theme = useTheme();
  const { data, loading, refetch } = useCollections();
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string>();
  const [editingId, setEditingId] = useState<string>();
  const [editDraft, setEditDraft] = useState('');

  const inputStyle = [
    styles.input,
    { color: theme.text, backgroundColor: theme.backgroundElement },
  ];

  async function onCreate() {
    const v = name.trim();
    if (!v) return;
    setAdding(true);
    setError(undefined);
    try {
      await collectionService.create(v);
      setName('');
      await refetch();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAdding(false);
    }
  }

  function startEdit(id: string, current: string) {
    setEditingId(id);
    setEditDraft(current);
  }

  async function saveEdit(id: string) {
    const v = editDraft.trim();
    setEditingId(undefined);
    if (!v) return;
    try {
      await collectionService.rename(id, v);
      await refetch();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function onRemove(id: string, label: string) {
    Alert.alert('Delete collection?', `“${label}” is removed; its goals stay, just ungrouped.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await collectionService.remove(id);
          refetch();
        },
      },
    ]);
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="small" themeColor="textSecondary">
          Group goals under a bigger ambition, e.g. “Run a marathon”. Deleting one keeps its goals.
        </ThemedText>

        <View style={styles.addRow}>
          <TextInput
            value={name}
            onChangeText={setName}
            onSubmitEditing={onCreate}
            placeholder="New collection"
            placeholderTextColor={theme.textSecondary}
            returnKeyType="done"
            style={[...inputStyle, { flex: 1 }]}
          />
          <Button title="Add" variant="secondary" onPress={onCreate} loading={adding} />
        </View>

        {error ? (
          <ThemedText type="small" style={{ color: '#E5484D' }}>
            {error}
          </ThemedText>
        ) : null}

        {loading && data.length === 0 ? null : data.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            No collections yet.
          </ThemedText>
        ) : (
          data.map((c) => (
            <ThemedView key={c.id} type="backgroundElement" style={styles.row}>
              {editingId === c.id ? (
                <TextInput
                  value={editDraft}
                  onChangeText={setEditDraft}
                  onSubmitEditing={() => saveEdit(c.id)}
                  onBlur={() => saveEdit(c.id)}
                  autoFocus
                  returnKeyType="done"
                  style={[...inputStyle, { flex: 1 }]}
                />
              ) : (
                <Pressable style={{ flex: 1 }} onPress={() => startEdit(c.id, c.name)}>
                  <ThemedText type="smallBold">{c.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Tap to rename
                  </ThemedText>
                </Pressable>
              )}
              <Pressable onPress={() => onRemove(c.id, c.name)} hitSlop={8}>
                <ThemedText type="small" style={{ color: '#E5484D' }}>
                  Delete
                </ThemedText>
              </Pressable>
            </ThemedView>
          ))
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
  addRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
});
