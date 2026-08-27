import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { logEvent } from './activity';

// Local, on-device scheduling (streak-saver reminders) plus real remote push token
// registration — the Push Notifications capability is enabled on developer.apple.com
// (com.gamertrades.app), so EAS now regenerates the provisioning profile with the
// capability instead of Xcode rejecting the build. Token registration only ever runs
// after the user has explicitly opted in via requestNotificationPermission() — it never
// prompts on its own.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const STREAK_REMINDER_ID = 'gt-streak-saver';

/** Prompts the OS notification permission dialog if not already decided. Returns whether it's granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;
  if (!existing.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

export async function hasNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/** Persists the user's opt-in choice, (de)schedules the streak reminder, and registers/
 * clears the remote push token to match. Permission must already be granted (call
 * requestNotificationPermission() first) — this never prompts on its own. */
export async function setNotificationsEnabled(userId: string, enabled: boolean, streakCount = 0): Promise<void> {
  await supabase.from('profiles').update({ notifications_enabled: enabled }).eq('id', userId);

  if (enabled) {
    await scheduleStreakSaverReminder(streakCount);
    await registerPushToken(userId);
  } else {
    await cancelStreakSaverReminder();
  }
}

/**
 * Fetches this device's Expo push token and upserts it against the user. Assumes
 * notification permission is already granted — safe to call repeatedly (idempotent by
 * token), including on every app open for an already-opted-in user to keep the token
 * fresh after reinstalls or token rotation. No-ops on simulators/emulators.
 */
export async function registerPushToken(userId: string): Promise<void> {
  try {
    if (!Device.isDevice) return;
    const granted = await hasNotificationPermission();
    if (!granted) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    if (!token) return;

    const { error } = await supabase.from('push_tokens').upsert(
      { user_id: userId, expo_push_token: token, platform: Platform.OS, updated_at: new Date().toISOString() },
      { onConflict: 'expo_push_token' }
    );
    if (error) throw error;

    await logEvent(userId, 'push_token_registered', { platform: Platform.OS }).catch(() => {});
  } catch (err) {
    console.error('registerPushToken failed', err);
  }
}

/**
 * Schedules a single local reminder ~20 hours out warning the streak is about to lapse.
 * Re-call this after every check-in (with the fresh streak count) — it replaces any
 * previously scheduled one, so only the most recent check-in's timer is ever live.
 */
export async function scheduleStreakSaverReminder(streakCount: number): Promise<void> {
  if (Platform.OS === 'web') return;
  await cancelStreakSaverReminder();

  const granted = await hasNotificationPermission();
  if (!granted) return;

  const body = streakCount >= 2
    ? `Your ${streakCount}-day streak breaks in a few hours. One trade keeps it alive. 🔥`
    : "Come back and open a trade today — that's how streaks start. 🔥";

  await Notifications.scheduleNotificationAsync({
    identifier: STREAK_REMINDER_ID,
    content: {
      title: streakCount >= 2 ? `🔥 ${streakCount}-DAY STREAK AT RISK` : '🔥 START YOUR STREAK',
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 20 * 60 * 60,
    },
  });
}

export async function cancelStreakSaverReminder(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(STREAK_REMINDER_ID).catch(() => {});
}
