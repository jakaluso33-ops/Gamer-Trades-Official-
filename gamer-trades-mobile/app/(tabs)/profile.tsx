import { useState } from 'react';
import { ScrollView, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, PixelText, BodyText, PixelButton, Avatar } from '../../components/ui';
import { colors } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';
import { deleteAccount } from '../../lib/account';
import { PLANS } from '../../lib/plans';
import { startCheckout } from '../../lib/checkout';

export default function ProfileScreen() {
  const { profile, user, signOut } = useAuth();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleUpgrade = async (priceId: string) => {
    setCheckoutError(null);
    setCheckoutBusy(true);
    try {
      await startCheckout(priceId);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Could not start checkout');
    } finally {
      setCheckoutBusy(false);
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
        {PLANS.map(plan => {
          const isCurrent = (profile?.plan ?? 'free') === plan.name.toLowerCase();
          return (
            <Card key={plan.name} borderColor={isCurrent ? colors.border : plan.color} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <BodyText color={plan.color} size={13} weight="semibold" glow>{plan.name.toUpperCase()}</BodyText>
                <View style={{ alignItems: 'flex-end' }}>
                  <BodyText color={colors.gold} size={13} weight="medium">{plan.price}</BodyText>
                  {plan.annualPrice && <BodyText color={colors.green} size={11}>or {plan.annualPrice}</BodyText>}
                </View>
              </View>
              {plan.features.map(f => (
                <BodyText key={f} color={colors.muted} size={12} style={{ marginBottom: 3 }}>▶ {f}</BodyText>
              ))}
              {!isCurrent && plan.priceId && (
                <View style={{ marginTop: 10, gap: 6 }}>
                  <PixelButton color={plan.color} disabled={checkoutBusy} onPress={() => handleUpgrade(plan.priceId!)}>
                    {checkoutBusy ? '...' : `UPGRADE ${plan.annualPriceId ? '(MONTHLY)' : ''}`}
                  </PixelButton>
                  {plan.annualPriceId && (
                    <PixelButton color={colors.green} disabled={checkoutBusy} onPress={() => handleUpgrade(plan.annualPriceId!)}>
                      {checkoutBusy ? '...' : 'UPGRADE (ANNUAL — SAVE)'}
                    </PixelButton>
                  )}
                </View>
              )}
            </Card>
          );
        })}
        {checkoutError && (
          <View style={{ padding: 8, backgroundColor: '#ff335511', borderWidth: 1, borderColor: '#ff335544' }}>
            <BodyText color={colors.red} size={12}>⚠ {checkoutError}</BodyText>
          </View>
        )}
      </View>

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
    </ScrollView>
  );
}
