import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type Props = {
  /** Screen title shown in the stub. */
  title: string;
  /** PRD section this screen maps to, e.g. "§4.1". */
  section?: string;
  /** One-line note on what this screen will do. */
  note?: string;
};

/**
 * Phase 1 placeholder. Every §14 page renders one of these until its real
 * UI lands. Keeps the nav skeleton navigable without committing layout yet.
 */
export function ScreenPlaceholder({ title, section, note }: Props) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>
        {section ? <ThemedText type="code">{section}</ThemedText> : null}
        {note ? (
          <ThemedText type="small" style={styles.note}>
            {note}
          </ThemedText>
        ) : null}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  note: {
    textAlign: 'center',
    opacity: 0.7,
  },
});
