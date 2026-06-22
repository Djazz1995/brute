import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { addTapListener, useLastNotificationResponse, type NotifData } from '@/lib/notifications';
import { notificationService } from '@/services/notificationService';

/**
 * Wires notification taps to navigation (§4.2 deep links) and requests
 * permission on first run. Mount once in the root layout.
 */
export function useNotificationRouting() {
  const router = useRouter();
  const last = useLastNotificationResponse();

  // Ask for permission / set up the Android channel once.
  useEffect(() => {
    notificationService.init();
  }, []);

  // Warm taps while the app is open.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    return addTapListener((data) => router.push(data.deepLink as Href));
  }, [router]);

  // Cold start — app launched by tapping a notification.
  useEffect(() => {
    const data = last?.notification.request.content.data as Partial<NotifData> | undefined;
    if (data?.deepLink) router.push(data.deepLink as Href);
  }, [last, router]);
}
