// Push notifications are temporarily disabled: the app's iOS provisioning profile predates
// the Push Notifications capability, and EAS can't regenerate it non-interactively (App Store
// Connect API key lacks permission to modify App ID capabilities without an interactive
// prompt). Once that's fixed (enable Push Notifications for com.gamertrades.app on
// developer.apple.com, or grant the ASC API key Admin role), reinstall expo-notifications +
// expo-device, re-add the expo-notifications plugin to app.json, and restore the real
// implementation below (git history has it, commit 8222233).

/** No-op until push notification credentials are fixed — safe to call from anywhere. */
export async function registerForPushNotificationsAsync(_userId: string): Promise<void> {
  return;
}
