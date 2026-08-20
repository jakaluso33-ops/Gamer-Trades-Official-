import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { logEvent } from './activity';

// Show notifications with a banner + sound while the app is in the foreground too,
// not just when backgrounded — otherwise engagement pushes silently disappear if the
// tester happens to already have the app open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Requests push permission (if not already decided) and registers the device's
 * Expo push token against this user. Safe to call repeatedly — no-ops on simulators,
 * on prior denial, and upserts by token so re-registering the same device is idempotent. */
export async function registerForPushNotificationsAsync(userId: string): Promise<void> {
  try {
    if (!Device.isDevice) return; // push tokens aren't issued to simulators/emulators

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    if (!token) return;

    const { error } = await supabase.from('push_tokens').upsert(
      { user_id: userId, expo_push_token: token, platform: Platform.OS, updated_at: new Date().toISOString() },
      { onConflict: 'expo_push_token' }
    );
    if (error) throw error;

    logEvent(userId, 'push_token_registered', { platform: Platform.OS }).catch(() => {});
  } catch (err) {
    console.error('registerForPushNotificationsAsync failed', err);
  }
}
