/** Shared goal-form primitives: Field wrapper, chips, input styling. */

import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ACCENT = '#3c87f7';

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={fieldStyles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      {children}
    </View>
  );
}

export function Chip({
  text,
  active,
  onPress,
}: {
  text: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <ThemedView
        type={active ? 'backgroundSelected' : 'backgroundElement'}
        style={[fieldStyles.chip, active && { borderColor: ACCENT, borderWidth: 1 }]}
      >
        <ThemedText type="small" themeColor={active ? 'text' : 'textSecondary'}>
          {text}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function ChipRow<T>({
  options,
  selected,
  onSelect,
  label,
  style,
}: {
  options: readonly T[];
  selected: T;
  onSelect: (v: T) => void;
  label: (v: T) => string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[fieldStyles.chips, style]}>
      {options.map((o) => (
        <Chip key={String(o)} text={label(o)} active={o === selected} onPress={() => onSelect(o)} />
      ))}
    </View>
  );
}

/** Themed TextInput style (matches the rest of the form). */
export function useInputStyle() {
  const theme = useTheme();
  return [fieldStyles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];
}

export const fieldStyles = StyleSheet.create({
  field: { gap: Spacing.two },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
  },
  entryRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  addBtn: { paddingHorizontal: Spacing.three, minHeight: 44 },
  pillButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    borderWidth: 1,
    borderColor: ACCENT,
  },
  pillButtonText: { color: ACCENT },
  timeBox: { justifyContent: 'center', minHeight: 48 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    paddingBottom: Spacing.five,
    paddingHorizontal: Spacing.three,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
});
