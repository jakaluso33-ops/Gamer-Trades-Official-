import { useState } from 'react';
import { ScrollView, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import { Card, PixelText, BodyText, PixelButton, Avatar } from '../../components/ui';
import { colors } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';
import { deleteAccount } from '../../lib/account';
import { requestNotificationPermission, setNotificationsEnabled } from '../../lib/notifications';
import PlanComparisonGrid from '../../components/PlanComparisonGrid';
import { Plan } from '../../lib/plans';
import FeedbackModal from '../../components/FeedbackModal';

export default function ProfileScreen() {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [notifBusy, setNotifBusy] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleRateApp = async () => {
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview();
    } else {
      Alert.alert("Not live yet", "We'll take you straight to the App Store review page once GamerTrades is publicly listed there.");
    }
  };

  const toggleNotifications = async () => {
    if (!user) return;
    setNotifBusy(true);
    try {
      const next = !profile?.notifications_enabled;
      const granted = next ? await requestNotificationPermission() : false;
      await setNotificationsEnabled(user.id, next && granted, profile?.streak_count ?? 0);
      await refreshProfile();
      if (next && !granted) {
        Alert.alert('Notifications blocked', 'Enable notifications for GamerTrades in your device Settings, then try again here.');
      }
    } finally {
      setNotifBusy(false);
    }
  };

  const xpForLevel = (level: number) => level * 250;
  const xpNeeded = xpForLevel(profile?.level ?? 1);

  const confirmDelete = () => {
    Alert.alert(
      'Delete Account',
      'This permanently deletes your account and all trading history, positions, goals, and stats. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAccount();
              router.replace('/login');
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Could not delete account');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
      <PixelText color={colors.cyan} size={13} glow>◎ PROFILE</PixelText>

      <Card style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
        <Avatar size={56} />
        <View style={{ flex: 1 }}>
          <BodyText color={colors.cyan} size={16} weight="semibold" glow>{profile?.username ?? '...'}</BodyText>
          <BodyText color={colors.muted} size={12} style={{ marginTop: 6 }}>{user?.email}</BodyText>
          <BodyText color={colors.muted} size={11} style={{ marginTop: 3 }}>{(profile?.plan ?? 'free').toUpperCase()} TIER</BodyText>
        </View>
      </Card>

      <Card>
        <BodyText color={colors.purple} size={13} weight="semibold" glow style={{ marginBottom: 8 }}>LEVEL {profile?.level ?? 1}</BodyText>
        <BodyText color={colors.muted} size={12} style={{ marginBottom: 6 }}>
          XP: {(profile?.xp ?? 0).toLocaleString()} / {xpNeeded.toLocaleString()}
        </BodyText>
        <View style={{ height: 8, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ width: `${Math.min(100, ((profile?.xp ?? 0) / xpNeeded) * 100)}%`, height: '100%', backgroundColor: colors.purple }} />
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Card style={{ flex: 1 }}>
          <BodyText color={colors.muted} size={11}>WINS</BodyText>
          <PixelText color={colors.green} size={12} glow style={{ marginTop: 6 }}>{profile?.total_wins ?? 0}</PixelText>
        </Card>
        <Card style={{ flex: 1 }}>
          <BodyText color={colors.muted} size={11}>LOSSES</BodyText>
          <PixelText color={colors.red} size={12} glow style={{ marginTop: 6 }}>{profile?.total_losses ?? 0}</PixelText>
        </Card>
      </View>

      <View>
        <PixelText color={colors.gold} size={11} glow style={{ marginBottom: 10 }}>★ PLANS</PixelText>
        <PlanComparisonGrid currentPlan={(profile?.plan ?? 'free') as Plan} />
      </View>

      <Card borderColor={colors.gold}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <BodyText color={colors.gold} size={13} weight="semibold" glow>🔔 STREAK &amp; COACH ALERTS</BodyText>
            <BodyText color={colors.muted} size={12} style={{ marginTop: 4 }}>
              {profile?.notifications_enabled ? "You're set — we'll ping you before your streak breaks." : "Get a nudge before your streak lapses."}
            </BodyText>
          </View>
          <PixelButton
            color={profile?.notifications_enabled ? colors.green : colors.muted}
            onPress={toggleNotifications}
            disabled={notifBusy}
            style={{ paddingHorizontal: 12, paddingVertical: 10 }}
          >
            {notifBusy ? '...' : profile?.notifications_enabled ? 'ON' : 'OFF'}
          </PixelButton>
        </View>
      </Card>

      <Card borderColor={colors.cyan}>
        <BodyText color={colors.cyan} size={13} weight="semibold" glow style={{ marginBottom: 10 }}>💬 RATE &amp; FEEDBACK</BodyText>
        <BodyText color={colors.muted} size={12} style={{ marginBottom: 12 }}>
          Loving GamerTrades? Found a bug? Want a feature? We read every single one.
        </BodyText>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <PixelButton color={colors.gold} onPress={handleRateApp} style={{ flex: 1 }}>⭐ RATE APP</PixelButton>
          <PixelButton color={colors.cyan} onPress={() => setShowFeedback(true)} style={{ flex: 1 }}>💬 FEEDBACK</PixelButton>
        </View>
      </Card>

      <PixelButton color={colors.red} onPress={signOut}>✕ SIGN OUT</PixelButton>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 14 }}>
        <BodyText color={colors.muted} size={12} onPress={() => router.push('/privacy')}>PRIVACY POLICY</BodyText>
        <BodyText color={colors.muted} size={12} onPress={() => router.push('/terms')}>TERMS OF SERVICE</BodyText>
      </View>

      <Card borderColor={colors.red}>
        <BodyText color={colors.red} size={13} weight="semibold" style={{ marginBottom: 8 }}>⚠ DANGER ZONE</BodyText>
        <BodyText color={colors.muted} size={12} style={{ marginBottom: 10 }}>
          Deleting your account permanently removes all your data — trades, positions, goals, and stats.
          This cannot be undone.
        </BodyText>
        <PixelButton color={colors.red} onPress={confirmDelete} disabled={deleting}>
          {deleting ? 'DELETING...' : '🗑 DELETE ACCOUNT'}
        </PixelButton>
      </Card>

      <FeedbackModal visible={showFeedback} onClose={() => setShowFeedback(false)} />
    </ScrollView>
  );
}
