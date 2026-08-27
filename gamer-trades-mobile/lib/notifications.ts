import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { logEvent } from './activity';

// Everything here is LOCAL, on-device scheduling only — no device token, no remote push. The
// Push Notifications capability is now enabled on developer.apple.com (com.gamertrades.app),
// which is what makes it safe to have expo-notifications installed at all — EAS regenerates
// the provisioning profile with the capability instead of Xcode rejecting the build. Remote
// engagement pushes (market alerts) can layer on top of this later without touching the
// permission/preference plumbing below.

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

/** Persists the user's opt-in choice and (de)schedules the streak reminder to match. */
export async function setNotificationsEnabled(userId: string, enabled: boolean, streakCount = 0): Promise<void> {
  await supabase.from('profiles').update({ notifications_enabled: enabled }).eq('id', userId);
  await logEvent(userId, 'push_token_registered', { type: 'local', enabled });

  if (enabled) {
    await scheduleStreakSaverReminder(streakCount);
  } else {
    await cancelStreakSaverReminder();
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
