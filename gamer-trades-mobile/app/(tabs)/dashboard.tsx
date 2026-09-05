import { useEffect, useState } from 'react';
import { ScrollView, View, Modal, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, PixelText, BodyText, PixelButton } from '../../components/ui';
import { colors } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';
import { depositFunds } from '../../lib/trading';
import { recordDailyCheckin } from '../../lib/streak';
import { scheduleStreakSaverReminder } from '../../lib/notifications';
import { maybePromptReview } from '../../lib/reviewPrompt';
import PortfolioSwitcher from '../../components/PortfolioSwitcher';
import DailyStoryCard from '../../components/DailyStoryCard';
import LiveMarketChart from '../../components/LiveMarketChart';
import WeeklyChallengeSection from '../../components/WeeklyChallengeCard';
import FreeTierBannerAd from '../../components/FreeTierBannerAd';

export default function DashboardScreen() {
  const { user, profile, activePortfolio, applyPortfolioPatch } = useAuth();
  const router = useRouter();
  const [streak, setStreak] = useState<number | null>(null);
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositBusy, setDepositBusy] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);

  // Records at most one check-in per day and keeps the streak counter current; also
  // re-arms the "streak at risk" local reminder so it reflects today's fresh count.
  useEffect(() => {
    if (!user) return;
    recordDailyCheckin(user.id)
      .then(({ streakCount }) => {
        setStreak(streakCount);
        if (profile?.notifications_enabled) scheduleStreakSaverReminder(streakCount);
        if (streakCount >= 3) maybePromptReview(user.id);
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleDeposit = async () => {
    if (!user || !activePortfolio) return;
    const amount = parseFloat(depositAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setDepositError('Enter an amount greater than $0');
      return;
    }
    setDepositBusy(true);
    setDepositError(null);
    try {
      const updated = await depositFunds(user.id, activePortfolio, amount);
      applyPortfolioPatch(updated);
      setShowDeposit(false);
      setDepositAmount('');
    } catch (err) {
      setDepositError(err instanceof Error ? err.message : 'Could not deposit funds');
    } finally {
      setDepositBusy(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <BodyText color={colors.muted} size={12}>▶ WELCOME BACK, {profile?.username ?? '...'}</BodyText>
          <PixelText color={colors.cyan} size={14} glow style={{ marginTop: 6 }}>TRADING ARENA</PixelText>
          {!!streak && streak > 1 && (
            <BodyText color={colors.gold} size={12} weight="semibold" style={{ marginTop: 6 }}>🔥 {streak}-DAY STREAK</BodyText>
          )}
        </View>
        <PortfolioSwitcher />
      </View>

      <FreeTierBannerAd />

      <WeeklyChallengeSection />

      {/* Add Funds */}
      <Pressable onPress={() => setShowDeposit(true)}>
        <Card borderColor={colors.green} style={{ padding: 22 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <PixelText size={30}>💰</PixelText>
            <View style={{ flex: 1 }}>
              <PixelText color={colors.green} size={13} glow>ADD FUNDS</PixelText>
              <BodyText color={colors.muted} size={12} style={{ marginTop: 6 }}>
                Cash: ${activePortfolio?.cash_balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '0.00'} — top up your paper balance anytime
              </BodyText>
            </View>
            <PixelText color={colors.green} size={16}>▶</PixelText>
          </View>
        </Card>
      </Pressable>

      {/* Leaderboard */}
      <Pressable onPress={() => router.push('/(tabs)/leaderboard' as never)}>
        <Card borderColor={colors.gold} style={{ padding: 22 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <PixelText size={30}>♛</PixelText>
            <View style={{ flex: 1 }}>
              <PixelText color={colors.gold} size={13} glow>LEADERBOARD</PixelText>
              <BodyText color={colors.muted} size={12} style={{ marginTop: 6 }}>
                See how you stack up — plus this week's trading competition
              </BodyText>
            </View>
            <PixelText color={colors.gold} size={16}>▶</PixelText>
          </View>
        </Card>
      </Pressable>

      {/* Learn */}
      <Pressable onPress={() => router.push('/(tabs)/academy' as never)}>
        <Card borderColor={colors.purple} style={{ padding: 22 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <PixelText size={30}>🎓</PixelText>
            <View style={{ flex: 1 }}>
              <PixelText color={colors.purple} size={13} glow>LEARN</PixelText>
              <BodyText color={colors.muted} size={12} style={{ marginTop: 6 }}>
                {profile?.skill_level
                  ? `Continue your ${profile.skill_level} Skill Path, or explore Learn & Detect`
                  : 'Start your Skill Path and learn to detect live strategies'}
              </BodyText>
            </View>
            <PixelText color={colors.purple} size={16}>▶</PixelText>
          </View>
        </Card>
      </Pressable>

      {/* TraderGPT */}
      <Pressable onPress={() => router.push('/(tabs)/trader-gpt' as never)}>
        <Card borderColor={colors.cyan} style={{ padding: 22 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <PixelText size={30}>🤖</PixelText>
            <View style={{ flex: 1 }}>
              <PixelText color={colors.cyan} size={13} glow>TRADERGPT</PixelText>
              <BodyText color={colors.muted} size={12} style={{ marginTop: 6 }}>
                {(profile?.plan ?? 'free') === 'free'
                  ? 'Ask AI anything about trading — 2 free questions/day'
                  : 'Ask AI anything about trading — unlimited on your plan'}
              </BodyText>
            </View>
            <PixelText color={colors.cyan} size={16}>▶</PixelText>
          </View>
        </Card>
      </Pressable>

      <DailyStoryCard />

      <LiveMarketChart />

      <Modal visible={showDeposit} transparent animationType="fade" onRequestClose={() => !depositBusy && setShowDeposit(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onPress={() => !depositBusy && setShowDeposit(false)}
        >
          <Pressable onPress={e => e.stopPropagation()} style={{ width: '100%' }}>
            <Card borderColor={colors.green} style={{ padding: 24 }}>
              <PixelText color={colors.green} size={12} glow style={{ textAlign: 'center', marginBottom: 14 }}>
                💰 ADD FUNDS
              </PixelText>
              <BodyText color={colors.muted} size={12} style={{ textAlign: 'center', marginBottom: 14 }}>
                Top up your paper-trading balance with any amount. This is simulated money — no real charge.
              </BodyText>
              <TextInput
                keyboardType="decimal-pad"
                placeholder="Amount (USD)"
                placeholderTextColor={colors.muted}
                value={depositAmount}
                onChangeText={t => { setDepositAmount(t); setDepositError(null); }}
                style={{
                  fontSize: 15, padding: 12, backgroundColor: colors.bg, color: colors.text,
                  borderWidth: 2, borderColor: colors.border, marginBottom: 10,
                }}
              />
              {depositError && (
                <BodyText color={colors.red} size={11} style={{ textAlign: 'center', marginBottom: 10 }}>
                  ⚠ {depositError}
                </BodyText>
              )}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <PixelButton color={colors.muted} disabled={depositBusy} onPress={() => setShowDeposit(false)} style={{ flex: 1 }}>
                  CANCEL
                </PixelButton>
                <PixelButton color={colors.green} disabled={depositBusy} onPress={handleDeposit} style={{ flex: 1 }}>
                  {depositBusy ? '...' : 'CONFIRM'}
                </PixelButton>
              </View>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
