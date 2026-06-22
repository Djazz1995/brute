import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useBilling } from '@/hooks/use-billing';

const PERKS = [
  'Up to 5 goals',
  'Unhinged mode (Level 4)',
  'Accountability buddy',
  'More streak freezes',
];

/**
 * Upgrade screen (§12). Reached only when a gate blocks a free user (the
 * blocking reason is passed as the `reason` param). Purchase is a stub
 * (BillingService) until real IAP is wired.
 */
export function PaywallScreen() {
  const router = useRouter();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const { purchase, purchasing } = useBilling();

  async function onUpgrade() {
    try {
      await purchase();
      Alert.alert('You’re in 🔥', 'Paid features unlocked.', [
        { text: 'Nice', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Purchase failed', (e as Error).message);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Upgrade' }} />
      <View style={styles.content}>
        <ThemedText type="title">Go Unhinged</ThemedText>
        {reason ? (
          <ThemedText type="default" themeColor="textSecondary">
            {reason}
          </ThemedText>
        ) : null}

        <View style={styles.perks}>
          {PERKS.map((p) => (
            <ThemedView key={p} type="backgroundElement" style={styles.perkRow}>
              <ThemedText type="default">✓ {p}</ThemedText>
            </ThemedView>
          ))}
        </View>

        <ThemedText type="small" themeColor="textSecondary" style={styles.price}>
          $2.99/mo or $14.99/yr
        </ThemedText>

        <Button title="Upgrade" onPress={onUpgrade} loading={purchasing} style={styles.cta} />
        <Button title="Maybe later" variant="secondary" onPress={() => router.back()} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: Spacing.three, gap: Spacing.three, justifyContent: 'center' },
  perks: { gap: Spacing.two },
  perkRow: { padding: Spacing.three, borderRadius: Spacing.three },
  price: { textAlign: 'center' },
  cta: { minHeight: 56 },
});
