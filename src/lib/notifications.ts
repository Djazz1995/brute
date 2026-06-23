/** expo-notifications wrapper (AGENTS.md §8.2, §15.4). Thin SDK client — the
 *  NotificationService wraps this; screens never import it directly.
 *
 *  v1 schedules **local** Wave-1 reminders at each goal's scheduled times. True
 *  conditional escalation (fire Wave 2+ only if ignored, cancel on completion)
 *  needs the server cron + FCM (§8.2) — see `fcm.ts` / the Edge Function. */

import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** Data we attach to every local notification for tap routing. */
export type NotifData = {
  goalId: string;
  wave: number;
  deepLink: string;
};

// Foreground display behaviour (SDK 54 shape).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const ANDROID_CHANNEL = 'default';

/** ISO weekday (1=Mon…7=Sun) → expo weekday (1=Sun…7=Sat). */
function toExpoWeekday(isoDay: number): number {
  return (isoDay % 7) + 1;
}

export async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
    name: 'Roasts',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

/** Prompt for permission if not already granted. Returns whether granted. */
export async function ensurePermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return req.granted;
}

/** Schedule a repeating weekly local notification. Returns its identifier. */
export async function scheduleWeekly(args: {
  isoDay: number;
  hour: number;
  minute: number;
  title: string;
  body: string;
  data: NotifData;
}): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: { title: args.title, body: args.body, data: args.data },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: toExpoWeekday(args.isoDay),
      hour: args.hour,
      minute: args.minute,
      channelId: ANDROID_CHANNEL,
    },
  });
}

/** Schedule a one-time local notification at a specific Date. Returns its id. */
export async function scheduleOnce(args: {
  date: Date;
  title: string;
  body: string;
  data: NotifData;
}): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: { title: args.title, body: args.body, data: args.data },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: args.date,
      channelId: ANDROID_CHANNEL,
    },
  });
}

export async function getAllScheduled(): Promise<Notifications.NotificationRequest[]> {
  return Notifications.getAllScheduledNotificationsAsync();
}

export async function cancel(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

export async function cancelAll(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Subscribe to notification taps. Returns an unsubscribe function. */
export function addTapListener(handler: (data: NotifData) => void): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Partial<NotifData> | undefined;
    if (data?.goalId && data.deepLink) handler(data as NotifData);
  });
  return () => sub.remove();
}

/**
 * Register this device for remote push and return its Expo push token, for the
 * server cron to target (escalation Wave 2+, buddy notify, daily digest — §8.2).
 * Needs a dev/standalone build with an EAS projectId; returns undefined on web,
 * in Expo Go, or without permission. Caller stores it (profiles.push_token).
 */
export async function registerPushToken(): Promise<string | undefined> {
  if (Platform.OS === 'web') return undefined;
  if (!(await ensurePermissions())) return undefined;
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return undefined; // not a build that supports remote push
  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    return undefined;
  }
}

/**
 * Web-safe wrapper over expo-notifications' hook: its internal native call
 * (`getLastNotificationResponse`) is unavailable on web and throws, crashing the
 * root layout. `Platform.OS` is constant for the session, so the conditional
 * hook call never changes between renders.
 */
export function useLastNotificationResponse(): Notifications.NotificationResponse | null {
  if (Platform.OS === 'web') return null;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return Notifications.useLastNotificationResponse() ?? null;
}
