import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, PixelText, BodyText, PixelButton } from '../components/ui';
import { colors } from '../lib/theme';
import { useAuth } from '../lib/AuthContext';
import { requestNotificationPermission, setNotificationsEnabled } from '../lib/notifications';
import { markNotificationPromptSeen } from '../lib/onboarding';

const PERKS = [
  { icon: '🔥', label: 'Streak alerts', desc: "A heads-up before your daily streak breaks." },
  { icon: '🎙️', label: 'AI Coach calls', desc: "Know when your coach has something to say about a setup." },
  { icon: '⚔️', label: 'Battle challenges', desc: "Get pinged the moment a friend challenges you." },
  { icon: '🏆', label: 'Season rewards', desc: "Never miss a leaderboard payout or level-up." },
];

export default function NotificationPermissionScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    if (user) {
      await markNotificationPromptSeen(user.id);
      await refreshProfile();
    }
    router.replace('/(tabs)/dashboard');
  };

  const enable = async () => {
    if (!user) return finish();
    setBusy(true);
    try {
      const granted = await requestNotificationPermission();
      await setNotificationsEnabled(user.id, granted, profile?.streak_count ?? 0);
    } finally {
      setBusy(false);
      await finish();
    }
  };

  const skip = async () => {
    if (user) await setNotificationsEnabled(user.id, false);
    await finish();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 20, paddingTop: 90, justifyContent: 'space-between' }}>
      <View style={{ gap: 22 }}>
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 92, height: 92, borderRadius: 46, borderWidth: 3, borderColor: colors.gold,
              backgroundColor: `${colors.gold}18`, alignItems: 'center', justifyContent: 'center',
              shadowColor: colors.gold, shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: 0, height: 0 },
            }}
          >
            <PixelText size={34}>🔔</PixelText>
          </View>
          <BodyText color={colors.gold} size={12} weight="semibold" style={{ marginTop: 14, letterSpacing: 1 }}>
            ★ NEW UNLOCK ★
          </BodyText>
          <PixelText color={colors.cyan} size={16} glow style={{ textAlign: 'center', marginTop: 10 }}>
            NEVER MISS A DROP
          </PixelText>
          <BodyText color={colors.muted} size={13} style={{ textAlign: 'center', marginTop: 10, paddingHorizontal: 8 }}>
            Turn on alerts and GamerTrades will keep you in the loop — right when it matters,
            never a spam blast.
          </BodyText>
        </View>

        <Card borderColor={colors.border}>
          <View style={{ gap: 14 }}>
            {PERKS.map(p => (
              <View key={p.label} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                <PixelText size={20}>{p.icon}</PixelText>
                <View style={{ flex: 1 }}>
                  <BodyText color={colors.text} size={13} weight="semibold">{p.label}</BodyText>
                  <BodyText color={colors.muted} size={12} style={{ marginTop: 2 }}>{p.desc}</BodyText>
                </View>
              </View>
            ))}
          </View>
        </Card>
      </View>

      <View style={{ gap: 12 }}>
        <PixelButton color={colors.gold} disabled={busy} onPress={enable} style={{ paddingVertical: 16 }}>
          {busy ? '...' : '🔔 ENABLE ALERTS'}
        </PixelButton>
        <BodyText
          color={colors.muted}
          size={12}
          style={{ textAlign: 'center', textDecorationLine: 'underline' }}
          onPress={busy ? undefined : skip}
        >
          Maybe later
        </BodyText>
      </View>
    </View>
  );
}
