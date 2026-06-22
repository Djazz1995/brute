import '@/global.css';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { ActivityIndicator, useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ThemedText } from '@/components/themed-text';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { useNotificationRouting } from '@/hooks/use-notification-routing';
import { useSession } from '@/hooks/use-session';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { ready, error } = useSession();
  useNotificationRouting();

  return (
    <GluestackUIProvider mode={colorScheme === 'dark' ? 'dark' : 'light'}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        {!ready ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            {error ? (
              <ThemedText type="small">Couldn’t start a session: {error.message}</ThemedText>
            ) : (
              <ActivityIndicator />
            )}
          </View>
        ) : (
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Home' }} />
            <Stack.Screen name="onboarding" options={{ presentation: 'modal', title: 'Welcome' }} />
            <Stack.Screen name="goal/new" options={{ presentation: 'modal', title: 'New Goal' }} />
            <Stack.Screen name="goal/[id]/index" options={{ title: 'Goal' }} />
            <Stack.Screen name="goal/[id]/edit" options={{ title: 'Edit Goal' }} />
            <Stack.Screen
              name="goal/[id]/skip"
              options={{ presentation: 'modal', title: "I can't today" }}
            />
            <Stack.Screen
              name="goal/[id]/complete"
              options={{ presentation: 'modal', title: 'Done' }}
            />
            <Stack.Screen name="buddy" options={{ title: 'Accountability Buddy' }} />
            <Stack.Screen name="collections" options={{ title: 'Collections' }} />
            <Stack.Screen
              name="share/[cardId]"
              options={{ presentation: 'modal', title: 'Share' }}
            />
            <Stack.Screen name="paywall" options={{ presentation: 'modal', title: 'Upgrade' }} />
          </Stack>
        )}
      </ThemeProvider>
    </GluestackUIProvider>
  );
}
