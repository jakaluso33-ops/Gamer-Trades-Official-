import { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { BodyText, PixelText } from './ui';
import { colors } from '../lib/theme';
import { useAuth } from '../lib/AuthContext';
import { Candle, StrategySignal } from '../lib/strategyEngine';
import { computeDetectorStats, BacktestStats } from '../lib/backtestStats';
import { startCheckout } from '../lib/checkout';
import { PLANS } from '../lib/plans';

const PRO_PLAN = PLANS.find(p => p.name === 'pro');

/** Win rate / profit factor for one detector, computed from a simulated backtest.
 * Free users see a locked chip that upsells Pro; Pro users get the real numbers,
 * computed lazily (and cheaply -- a few thousand simulated steps) on first view. */
export default function StatsBadge({ detect }: { detect: (candles: Candle[]) => StrategySignal | null }) {
  const { profile } = useAuth();
  const router = useRouter();
  const isPro = (profile?.plan ?? 'free') !== 'free';
  const [stats, setStats] = useState<BacktestStats | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPro) return;
    setStats(null);
    const id = setTimeout(() => setStats(computeDetectorStats(detect)), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro, detect]);

  const handleUpgrade = async () => {
    if (!PRO_PLAN?.priceId) return;
    setBusy(true);
    try {
      await startCheckout(PRO_PLAN.priceId);
    } finally {
      setBusy(false);
    }
  };

  if (!isPro) {
    return (
      <Pressable
        onPress={handleUpgrade}
        disabled={busy}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.gold, opacity: busy ? 0.6 : 1 }}
      >
        <PixelText size={14}>🔒</PixelText>
        <View style={{ flex: 1 }}>
          <BodyText color={colors.gold} size={12} weight="semibold">WIN RATE & PROFIT FACTOR — PRO ONLY</BodyText>
          <BodyText color={colors.muted} size={11} style={{ marginTop: 2 }}>{busy ? 'Starting checkout...' : `Tap to upgrade — ${PRO_PLAN?.price ?? ''}`}</BodyText>
        </View>
      </Pressable>
    );
  }

  if (!stats) {
    return (
      <View style={{ padding: 10, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}>
        <BodyText color={colors.muted} size={11}>Running simulated backtest...</BodyText>
      </View>
    );
  }

  const winColor = stats.winRate >= 55 ? colors.green : stats.winRate >= 45 ? colors.gold : colors.red;
  const pfColor = stats.profitFactor >= 1.5 ? colors.green : stats.profitFactor >= 1 ? colors.gold : colors.red;

  return (
    <View style={{ padding: 10, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1, alignItems: 'center', padding: 8, borderWidth: 1, borderColor: winColor }}>
          <BodyText color={colors.muted} size={10}>WIN RATE</BodyText>
          <PixelText color={winColor} size={13} glow style={{ marginTop: 4 }}>{stats.winRate.toFixed(0)}%</PixelText>
        </View>
        <View style={{ flex: 1, alignItems: 'center', padding: 8, borderWidth: 1, borderColor: pfColor }}>
          <BodyText color={colors.muted} size={10}>PROFIT FACTOR</BodyText>
          <PixelText color={pfColor} size={13} glow style={{ marginTop: 4 }}>{stats.profitFactor.toFixed(2)}</PixelText>
        </View>
      </View>
      <BodyText color={colors.muted} size={10} style={{ marginTop: 8, textAlign: 'center' }}>
        From a simulated backtest ({stats.sampleSize} trades) — not real market history.
      </BodyText>
    </View>
  );
}
