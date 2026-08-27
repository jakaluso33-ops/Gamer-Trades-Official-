import { supabase } from './supabase';
import { logEvent } from './activity';

// Notifications are temporarily disabled: the app's iOS provisioning profile predates the
// Push Notifications capability, and EAS can't regenerate it non-interactively (App Store
// Connect API key lacks permission to modify App ID capabilities without an interactive
// prompt). This blocks even LOCAL on-device scheduling — simply having expo-notifications
// installed makes Xcode require the capability, regardless of whether remote push is ever
// used. Confirmed twice now (see git history, commits 3b07995 and this one). Once the
// capability is fixed (enable Push Notifications for com.gamertrades.app on
// developer.apple.com, or grant the ASC API key Admin role), reinstall expo-notifications,
// re-add its plugin to app.json, and restore the real implementation (git history has it,
// commit e8b7e91).

/** No-op until the capability issue is fixed — always reports permission as not granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  return false;
}

export async function hasNotificationPermission(): Promise<boolean> {
  return false;
}

/** Persists the opt-in choice (so it's ready once real scheduling comes back) — schedules nothing. */
export async function setNotificationsEnabled(userId: string, enabled: boolean, _streakCount = 0): Promise<void> {
  await supabase.from('profiles').update({ notifications_enabled: enabled }).eq('id', userId);
  await logEvent(userId, 'push_token_registered', { type: 'local', enabled: false, requested: enabled });
}

/** No-op until local scheduling is safe to ship again — safe to call from anywhere. */
export async function scheduleStreakSaverReminder(_streakCount: number): Promise<void> {
  return;
}

export async function cancelStreakSaverReminder(): Promise<void> {
  return;
}
