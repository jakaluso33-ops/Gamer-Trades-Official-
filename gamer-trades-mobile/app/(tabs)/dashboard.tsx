import { useEffect, useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, PixelText, BodyText, PixelButton } from '../../components/ui';
import { colors } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';
import { listOpenTrades, computePnl, DbTrade } from '../../lib/trading';
import { getBasePrice } from '../../lib/symbols';
import { recordDailyCheckin } from '../../lib/streak';
import { scheduleStreakSaverReminder } from '../../lib/notifications';
import SkillPathCard from '../../components/SkillPathCard';
import PortfolioSwitcher from '../../components/PortfolioSwitcher';

const QUICK_LINKS = [
  { label: 'PORTFOLIO', icon: '◉', href: '/(tabs)/portfolio', color: colors.blue },
  { label: 'FRIENDS', icon: '♥', href: '/(tabs)/friends', color: colors.red },
  { label: 'LEADERBOARD', icon: '♛', href: '/(tabs)/leaderboard', color: colors.gold },
  { label: 'CHALLENGES', icon: '◆', href: '/(tabs)/challenges', color: colors.green },
];

export default function DashboardScreen() {
  const { user, profile, activePortfolio } = useAuth();
  const router = useRouter();
  const [openTrades, setOpenTrades] = useState<DbTrade[]>([]);
  const [streak, setStreak] = useState<number | null>(null);

  useEffect(() => {
    if (!user || !activePortfolio) return;
    listOpenTrades(user.id, activePortfolio.id).then(setOpenTrades).catch(console.error);
  }, [user, activePortfolio]);

  const totalPnl = openTrades.reduce((s, t) => s + computePnl(t, getBasePrice(t.symbol) || t.entry_price), 0);
  const winRate = profile && profile.total_wins + profile.total_losses > 0
    ? Math.round((profile.total_wins / (profile.total_wins + profile.total_losses)) * 100)
    : 0;

  // Records at most one check-in per day and keeps the streak counter current; also
  // re-arms the "streak at risk" local reminder so it reflects today's fresh count.
  useEffect(() => {
    if (!user) return;
    recordDailyCheckin(user.id)
      .then(({ streakCount }) => {
        setStreak(streakCount);
        if (profile?.notifications_enabled) scheduleStreakSaverReminder(streakCount);
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <BodyText color={colors.muted} size={12}>▶ WELCOME BACK, {profile?.username ?? '...'}</BodyText>
          <PixelText color={colors.cyan} size={14} glow style={{ marginTop: 6 }}>TRADING ARENA</PixelText>
          <BodyText color={colors.gold} size={12} weight="semibold" style={{ marginTop: 6 }}>🎮 GAME ON, TRADE ON</BodyText>
        </View>
        <PortfolioSwitcher />
      </View>

      {!!streak && streak > 1 && (
        <Card borderColor={colors.gold} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }}>
          <PixelText size={20}>🔥</PixelText>
          <View style={{ flex: 1 }}>
            <BodyText color={colors.gold} size={13} weight="semibold" glow>{streak}-DAY STREAK</BodyText>
            <BodyText color={colors.muted} size={11} style={{ marginTop: 2 }}>Trade today to keep it going</BodyText>
          </View>
        </Card>
      )}

      <SkillPathCard />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable style={{ flex: 1 }} onPress={() => router.push('/(tabs)/trade-history' as never)}>
          <Card>
            <BodyText color={colors.muted} size={11}>TODAY&apos;S P&amp;L</BodyText>
            <PixelText color={totalPnl >= 0 ? colors.green : colors.red} size={12} glow style={{ marginTop: 6 }}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
            </PixelText>
            <BodyText color={colors.border} size={9} style={{ marginTop: 4 }}>TAP FOR HISTORY ▶</BodyText>
          </Card>
        </Pressable>
        <Card style={{ flex: 1 }}>
          <BodyText color={colors.muted} size={11}>WIN RATE</BodyText>
          <PixelText color={colors.gold} size={12} glow style={{ marginTop: 6 }}>
            {winRate}%
          </PixelText>
        </Card>
      </View>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <BodyText color={colors.blue} size={12} weight="semibold" glow>◈ OPEN POSITIONS</BodyText>
          <BodyText color={colors.muted} size={12}>{openTrades.length} ACTIVE</BodyText>
        </View>
        {openTrades.length === 0 ? (
          <BodyText color={colors.border} size={13}>No open positions yet — head to the Trading Arena to place your first trade.</BodyText>
        ) : openTrades.map(t => {
          const pnl = computePnl(t, getBasePrice(t.symbol) || t.entry_price);
          return (
            <View key={t.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <BodyText color={colors.blue} size={13} weight="medium">{t.symbol}</BodyText>
              <BodyText color={t.direction === 'long' ? colors.green : colors.red} size={12}>
                {t.direction === 'long' ? 'LONG' : 'SHORT'} x{t.quantity}
              </BodyText>
              <BodyText color={pnl >= 0 ? colors.green : colors.red} size={13}>{pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}</BodyText>
            </View>
          );
        })}
      </Card>

      <Card borderColor={colors.purple}>
        <BodyText color={colors.purple} size={12} weight="semibold" glow style={{ marginBottom: 8 }}>★ PLAYER STATS</BodyText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <StatBox k="LEVEL" v={String(profile?.level ?? 1)} />
          <StatBox k="XP" v={String(profile?.xp ?? 0)} />
          <StatBox k="WINS" v={String(profile?.total_wins ?? 0)} />
          <StatBox k="LOSSES" v={String(profile?.total_losses ?? 0)} />
        </View>
      </Card>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {QUICK_LINKS.map(q => (
          <PixelButton key={q.href} color={q.color} style={{ flexBasis: '47%', flexGrow: 1 }} onPress={() => router.push(q.href as never)}>
            {q.icon} {q.label}
          </PixelButton>
        ))}
      </View>
    </ScrollView>
  );
}

function StatBox({ k, v }: { k: string; v: string }) {
  return (
    <View style={{ padding: 8, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, minWidth: 90 }}>
      <BodyText color={colors.muted} size={11}>{k}</BodyText>
      <BodyText color={colors.text} size={14} weight="semibold" style={{ marginTop: 3 }}>{v}</BodyText>
    </View>
  );
}
