import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, PixelText, PixelButton } from '../../components/ui';
import { colors } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';
import { logEvent } from '../../lib/activity';
import InsightsCard from '../../components/InsightsCard';

const POSITIONS = [
  { symbol: 'AAPL', side: 'LONG', qty: 50, pnl: 107.0 },
  { symbol: 'TSLA', side: 'SHORT', qty: 20, pnl: 64.6 },
  { symbol: 'BTC', side: 'LONG', qty: 0.5, pnl: 660.0 },
  { symbol: 'NVDA', side: 'LONG', qty: 15, pnl: -72.0 },
];

const QUICK_LINKS = [
  { label: 'PORTFOLIO', icon: '◉', href: '/(tabs)/portfolio', color: colors.blue },
  { label: 'ACADEMY', icon: '🧠', href: '/(tabs)/academy', color: colors.purple },
  { label: 'LEADERBOARD', icon: '♛', href: '/(tabs)/leaderboard', color: colors.gold },
  { label: 'CHALLENGES', icon: '◆', href: '/(tabs)/challenges', color: colors.green },
];

export default function DashboardScreen() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const totalPnl = POSITIONS.reduce((s, p) => s + p.pnl, 0);

  // Log at most one check-in per day toward the "trade with discipline" goal
  useEffect(() => {
    if (!user) return;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const key = `gt_checkin_${user.id}_${today}`;
      const already = await AsyncStorage.getItem(key);
      if (already) return;
      await AsyncStorage.setItem(key, '1');
      logEvent(user.id, 'daily_checkin');
    })();
  }, [user]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      <View>
        <PixelText color={colors.muted} size={6}>▶ WELCOME BACK, {profile?.username ?? '...'}</PixelText>
        <PixelText color={colors.cyan} size={14} glow style={{ marginTop: 6 }}>TRADING ARENA</PixelText>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Card style={{ flex: 1 }}>
          <PixelText color={colors.muted} size={5}>TODAY&apos;S P&amp;L</PixelText>
          <PixelText color={totalPnl >= 0 ? colors.green : colors.red} size={12} glow style={{ marginTop: 6 }}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
          </PixelText>
        </Card>
        <Card style={{ flex: 1 }}>
          <PixelText color={colors.muted} size={5}>WIN RATE</PixelText>
          <PixelText color={colors.gold} size={12} glow style={{ marginTop: 6 }}>
            {profile && profile.total_wins + profile.total_losses > 0
              ? `${Math.round((profile.total_wins / (profile.total_wins + profile.total_losses)) * 100)}%`
              : '—'}
          </PixelText>
        </Card>
      </View>

      <InsightsCard />

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <PixelText color={colors.blue} size={7} glow>◈ OPEN POSITIONS</PixelText>
          <PixelText color={colors.muted} size={6}>{POSITIONS.length} ACTIVE</PixelText>
        </View>
        {POSITIONS.map(p => (
          <View key={p.symbol} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <PixelText color={colors.blue} size={7}>{p.symbol}</PixelText>
            <PixelText color={p.side === 'LONG' ? colors.green : colors.red} size={6}>{p.side} x{p.qty}</PixelText>
            <PixelText color={p.pnl >= 0 ? colors.green : colors.red} size={7}>{p.pnl >= 0 ? '+' : ''}${p.pnl.toFixed(2)}</PixelText>
          </View>
        ))}
      </Card>

      <Card borderColor={colors.purple}>
        <PixelText color={colors.purple} size={7} glow style={{ marginBottom: 8 }}>★ PLAYER STATS</PixelText>
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
      <PixelText color={colors.muted} size={5}>{k}</PixelText>
      <PixelText color={colors.text} size={8} style={{ marginTop: 3 }}>{v}</PixelText>
    </View>
  );
}
