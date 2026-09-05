import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Rect, Line, G } from 'react-native-svg';
import { Card, PixelText, BodyText, PixelButton } from '../../components/ui';
import { colors } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';
import { getActiveBacktestChallenge, getMyBacktestEntry, submitBacktestResult, BacktestChallenge, BacktestChallengeEntry } from '../../lib/backtestChallenge';
import { generateSeededCandles } from '../../lib/seededCandles';
import { getSymbolInfo } from '../../lib/symbols';
import { Candle } from '../../lib/strategyEngine';

const VISIBLE_CANDLES = 40;
const CHART_W = 320;
const CHART_H = 180;
const START_REVEALED = 60;

interface OpenPosition {
  direction: 'long' | 'short';
  entryPrice: number;
  quantity: number;
}

function MiniCandles({ candles }: { candles: Candle[] }) {
  const visible = candles.slice(-VISIBLE_CANDLES);
  if (visible.length === 0) return null;
  const highs = visible.map(c => c.high), lows = visible.map(c => c.low);
  const max = Math.max(...highs), min = Math.min(...lows);
  const range = max - min || 1;
  const slotW = CHART_W / visible.length;
  const y = (p: number) => CHART_H - ((p - min) / range) * (CHART_H - 10) - 5;

  return (
    <Svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
      {visible.map((c, i) => {
        const x = i * slotW + slotW / 2;
        const up = c.close >= c.open;
        const color = up ? colors.green : colors.red;
        const bodyTop = y(Math.max(c.open, c.close));
        const bodyBot = y(Math.min(c.open, c.close));
        return (
          <G key={i}>
            <Line x1={x} y1={y(c.high)} x2={x} y2={y(c.low)} stroke={color} strokeWidth={1} />
            <Rect x={x - slotW * 0.3} y={bodyTop} width={slotW * 0.6} height={Math.max(1.5, bodyBot - bodyTop)} fill={color} />
          </G>
        );
      })}
    </Svg>
  );
}

export default function BacktestPlayScreen() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [challenge, setChallenge] = useState<BacktestChallenge | null | undefined>(undefined);
  const [myBest, setMyBest] = useState<BacktestChallengeEntry | null>(null);
  const [revealed, setRevealed] = useState(START_REVEALED);
  const [cash, setCash] = useState(0);
  const [position, setPosition] = useState<OpenPosition | null>(null);
  const [tradesTaken, setTradesTaken] = useState(0);
  const [submitted, setSubmitted] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getActiveBacktestChallenge().then(async c => {
      setChallenge(c);
      if (c) {
        setCash(c.starting_balance);
        if (user) setMyBest(await getMyBacktestEntry(user.id, c.id));
      }
    }).catch(console.error);
  }, [user]);

  const fullSeries = useMemo(() => {
    if (!challenge) return [];
    const info = getSymbolInfo(challenge.symbol);
    return generateSeededCandles(challenge.seed, challenge.candle_count, info?.basePrice ?? 100);
  }, [challenge]);

  const visibleSeries = fullSeries.slice(0, revealed);
  const lastPrice = visibleSeries[visibleSeries.length - 1]?.close ?? 0;
  const done = revealed >= fullSeries.length;

  const unrealizedPnl = position ? (position.direction === 'long' ? (lastPrice - position.entryPrice) : (position.entryPrice - lastPrice)) * position.quantity : 0;
  const equity = cash + unrealizedPnl;

  const step = () => setRevealed(r => Math.min(fullSeries.length, r + 1));
  const skip5 = () => setRevealed(r => Math.min(fullSeries.length, r + 5));

  const closePosition = () => {
    if (!position) return;
    setCash(c => c + unrealizedPnl);
    setPosition(null);
  };

  const trade = (dir: 'long' | 'short') => {
    if (!challenge) return;
    if (position) {
      if (position.direction === dir) return;
      closePosition();
      return;
    }
    const quantity = (challenge.starting_balance * 0.1) / lastPrice;
    setPosition({ direction: dir, entryPrice: lastPrice, quantity });
    setTradesTaken(t => t + 1);
  };

  const handleSubmit = async () => {
    if (!user || !challenge) return;
    setSubmitting(true);
    try {
      const finalBalance = position ? cash + unrealizedPnl : cash;
      await submitBacktestResult(user.id, challenge.id, finalBalance, tradesTaken);
      setSubmitted(finalBalance);
    } catch (err) {
      console.error('submitBacktestResult failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  const restart = () => {
    if (!challenge) return;
    setRevealed(START_REVEALED);
    setCash(challenge.starting_balance);
    setPosition(null);
    setTradesTaken(0);
    setSubmitted(null);
  };

  if (challenge === undefined) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  if (challenge === null) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingTop: 60 }}>
        <Card borderColor={colors.purple}>
          <BodyText color={colors.muted} size={13} style={{ textAlign: 'center' }}>No weekend backtest challenge is active right now — check back this weekend.</BodyText>
        </Card>
      </ScrollView>
    );
  }

  const pnlSoFar = equity - challenge.starting_balance;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <PixelText color={colors.purple} size={12} glow>⏮️ WEEKEND BACKTEST</PixelText>
        <BodyText color={colors.muted} size={11} onPress={() => router.back()}>◀ BACK</BodyText>
      </View>

      <Card borderColor={colors.purple}>
        <BodyText color={colors.purple} size={13} weight="semibold" glow style={{ marginBottom: 4 }}>{challenge.symbol}</BodyText>
        <BodyText color={colors.muted} size={11} style={{ marginBottom: 10 }}>
          Everyone this weekend is trading the exact same fixed price history — same starting point, same moves. Best final balance wins.
        </BodyText>
        {myBest && (
          <BodyText color={colors.gold} size={11} style={{ marginBottom: 6 }}>
            Your best so far: {myBest.final_balance >= challenge.starting_balance ? '+' : ''}${(myBest.final_balance - challenge.starting_balance).toFixed(2)}
          </BodyText>
        )}
      </Card>

      <Card borderColor={pnlSoFar >= 0 ? colors.green : colors.red}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <View>
            <BodyText color={colors.muted} size={10}>EQUITY</BodyText>
            <PixelText color={pnlSoFar >= 0 ? colors.green : colors.red} size={12} glow>${equity.toFixed(2)}</PixelText>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <BodyText color={colors.muted} size={10}>CANDLE</BodyText>
            <BodyText color={colors.text} size={13} weight="semibold">{revealed} / {fullSeries.length}</BodyText>
          </View>
        </View>

        <MiniCandles candles={visibleSeries} />

        <BodyText color={colors.text} size={13} weight="semibold" style={{ textAlign: 'center', marginTop: 8 }}>
          ${lastPrice.toFixed(2)}
        </BodyText>
        {position && (
          <BodyText color={unrealizedPnl >= 0 ? colors.green : colors.red} size={11} style={{ textAlign: 'center', marginTop: 4 }}>
            {position.direction.toUpperCase()} open @ ${position.entryPrice.toFixed(2)} · {unrealizedPnl >= 0 ? '+' : ''}${unrealizedPnl.toFixed(2)}
          </BodyText>
        )}
      </Card>

      {!done && submitted == null && (
        <>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <PixelButton color={colors.green} onPress={() => trade('long')} style={{ flex: 1, paddingVertical: 14 }}>
              {position?.direction === 'short' ? '✕ CLOSE SHORT' : '▲ BUY'}
            </PixelButton>
            <PixelButton color={colors.red} onPress={() => trade('short')} style={{ flex: 1, paddingVertical: 14 }}>
              {position?.direction === 'long' ? '✕ CLOSE LONG' : '▼ SELL'}
            </PixelButton>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <PixelButton color={colors.blue} onPress={step} style={{ flex: 1 }}>▶ NEXT CANDLE</PixelButton>
            <PixelButton color={colors.muted} onPress={skip5} style={{ flex: 1 }}>▶▶ SKIP 5</PixelButton>
          </View>
          <PixelButton color={colors.gold} onPress={handleSubmit} disabled={submitting}>
            {submitting ? '...' : '🏁 FINISH & SUBMIT SCORE'}
          </PixelButton>
        </>
      )}

      {(done || submitted != null) && (
        <Card borderColor={colors.gold} style={{ alignItems: 'center', padding: 20 }}>
          <PixelText size={26}>🏁</PixelText>
          <PixelText color={colors.gold} size={12} glow style={{ marginTop: 8, textAlign: 'center' }}>
            {submitted != null ? 'SCORE SUBMITTED' : 'END OF HISTORY'}
          </PixelText>
          <BodyText color={pnlSoFar >= 0 ? colors.green : colors.red} size={14} weight="semibold" style={{ marginTop: 8 }}>
            {pnlSoFar >= 0 ? '+' : ''}${pnlSoFar.toFixed(2)}
          </BodyText>
          {submitted == null && (
            <PixelButton color={colors.gold} onPress={handleSubmit} disabled={submitting} style={{ marginTop: 14, alignSelf: 'stretch' }}>
              {submitting ? '...' : '🏁 SUBMIT SCORE'}
            </PixelButton>
          )}
          <PixelButton color={colors.blue} onPress={restart} style={{ marginTop: 10, alignSelf: 'stretch' }}>
            ↻ TRY AGAIN (BEST SCORE KEPT)
          </PixelButton>
        </Card>
      )}
    </ScrollView>
  );
}
