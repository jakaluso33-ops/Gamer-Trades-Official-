import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Rect, Line, G } from 'react-native-svg';
import { Card, PixelText, BodyText, PixelButton } from '../../components/ui';
import UpgradeGate from '../../components/UpgradeGate';
import { colors } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';
import { generateSeededCandles } from '../../lib/seededCandles';
import { scanStrategies, computeTradePlan, DetectorId, Candle, TradePlan } from '../../lib/strategyEngine';
import { getStrategy } from '../../lib/strategyContent';
import { Plan, practiceRevealDailyLimit, getPracticeRevealsToday, incrementPracticeRevealsToday } from '../../lib/plans';

const STARTING_BALANCE = 10000;
const CANDLE_COUNT = 140;
const VISIBLE_CANDLES = 40;
const CHART_W = 320;
const CHART_H = 180;
const START_REVEALED = 30;

interface OpenPosition {
  direction: 'long' | 'short';
  entryPrice: number;
  quantity: number;
}

function MiniCandles({ candles, highlightLast }: { candles: Candle[]; highlightLast: boolean }) {
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
        const isLast = highlightLast && i === visible.length - 1;
        const x = i * slotW + slotW / 2;
        const up = c.close >= c.open;
        const color = isLast ? colors.gold : up ? colors.green : colors.red;
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

export default function PracticeStrategyScreen() {
  const { strategyId } = useLocalSearchParams<{ strategyId: string }>();
  const { user, profile } = useAuth();
  const router = useRouter();
  const plan = (profile?.plan as Plan) ?? 'free';
  const isPro = plan !== 'free';
  const strategy = getStrategy(strategyId ?? '');
  const revealLimit = practiceRevealDailyLimit(plan);

  const [seed, setSeed] = useState(() => Date.now());
  const fullSeries = useMemo(() => generateSeededCandles(seed, CANDLE_COUNT, 100), [seed]);
  const [revealed, setRevealed] = useState(START_REVEALED);
  const [cash, setCash] = useState(STARTING_BALANCE);
  const [position, setPosition] = useState<OpenPosition | null>(null);
  const [tradesTaken, setTradesTaken] = useState(0);
  const [signalsSeen, setSignalsSeen] = useState(0);
  const [signalsFollowed, setSignalsFollowed] = useState(0);
  const [countedRevealIdx, setCountedRevealIdx] = useState(-1);
  const [flash, setFlash] = useState<string | null>(null);
  const [revealsUsedToday, setRevealsUsedToday] = useState<number | null>(null);
  const [revealedPlan, setRevealedPlan] = useState<TradePlan | null>(null);

  useEffect(() => {
    if (user && revealLimit != null) {
      getPracticeRevealsToday(user.id).then(setRevealsUsedToday).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const visibleSeries = fullSeries.slice(0, revealed);
  const lastPrice = visibleSeries[visibleSeries.length - 1]?.close ?? 0;
  const done = revealed >= fullSeries.length;

  const currentSignal = useMemo(() => {
    if (!strategy) return null;
    const signals = scanStrategies(visibleSeries, [strategy.id as DetectorId]);
    return signals[0] ?? null;
  }, [visibleSeries, strategy]);

  useEffect(() => {
    if (revealed === countedRevealIdx) return;
    setCountedRevealIdx(revealed);
    if (currentSignal) setSignalsSeen(s => s + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed]);

  useEffect(() => {
    setRevealedPlan(null);
  }, [revealed]);

  if (!strategy) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingTop: 60 }}>
        <Card><BodyText color={colors.muted} size={13} style={{ textAlign: 'center' }}>Strategy not found.</BodyText></Card>
      </ScrollView>
    );
  }

  if (!isPro) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingTop: 60, gap: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <PixelText color={strategy.color} size={12} glow>🎮 PRACTICE MODE</PixelText>
          <BodyText color={colors.muted} size={11} onPress={() => router.back()}>◀ BACK</BodyText>
        </View>
        <UpgradeGate
          plan="pro"
          title="PRACTICE MODE IS PRO+"
          description={`Test ${strategy.name} live against a backtested market, get feedback on whether you actually caught its signals, and build real pattern-recognition reps.`}
        />
      </ScrollView>
    );
  }

  const unrealizedPnl = position ? (position.direction === 'long' ? (lastPrice - position.entryPrice) : (position.entryPrice - lastPrice)) * position.quantity : 0;
  const equity = cash + unrealizedPnl;
  const pnlSoFar = equity - STARTING_BALANCE;

  const step = () => { setFlash(null); setRevealed(r => Math.min(fullSeries.length, r + 1)); };
  const skip5 = () => { setFlash(null); setRevealed(r => Math.min(fullSeries.length, r + 5)); };

  const closePosition = () => {
    if (!position) return;
    setCash(c => c + unrealizedPnl);
    setPosition(null);
  };

  const trade = (dir: 'long' | 'short') => {
    if (position) {
      if (position.direction === dir) return;
      closePosition();
      return;
    }
    const matchesSignal = !!currentSignal && ((currentSignal.direction === 'bullish' && dir === 'long') || (currentSignal.direction === 'bearish' && dir === 'short'));
    if (matchesSignal) {
      setSignalsFollowed(s => s + 1);
      setFlash(`✓ Followed the ${strategy.name} signal!`);
    } else if (currentSignal) {
      setFlash(`✕ That went against the active ${strategy.name} signal`);
    } else {
      setFlash(null);
    }
    const quantity = (STARTING_BALANCE * 0.1) / lastPrice;
    setPosition({ direction: dir, entryPrice: lastPrice, quantity });
    setTradesTaken(t => t + 1);
  };

  const restart = () => {
    setSeed(Date.now());
    setRevealed(START_REVEALED);
    setCash(STARTING_BALANCE);
    setPosition(null);
    setTradesTaken(0);
    setSignalsSeen(0);
    setSignalsFollowed(0);
    setCountedRevealIdx(-1);
    setFlash(null);
    setRevealedPlan(null);
  };

  const adherence = signalsSeen > 0 ? Math.round((signalsFollowed / signalsSeen) * 100) : null;
  const revealsRemaining = revealLimit == null ? null : Math.max(0, revealLimit - (revealsUsedToday ?? 0));
  const revealBlocked = revealLimit != null && revealsRemaining === 0;

  const handleReveal = async () => {
    if (!currentSignal || revealBlocked) return;
    if (revealLimit != null && user) {
      const next = await incrementPracticeRevealsToday(user.id);
      setRevealsUsedToday(next);
    }
    setRevealedPlan(computeTradePlan(currentSignal, visibleSeries));
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <PixelText color={strategy.color} size={12} glow>🎮 PRACTICE: {strategy.name.toUpperCase()}</PixelText>
        <BodyText color={colors.muted} size={11} onPress={() => router.back()}>◀ BACK</BodyText>
      </View>

      <Card borderColor={strategy.color}>
        <BodyText color={colors.muted} size={11}>
          A fresh backtested market, just for you. Trade LONG/SHORT only when you spot the {strategy.name} setup firing — step through candle by candle and see how your calls line up.
        </BodyText>
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

        <MiniCandles candles={visibleSeries} highlightLast={!!currentSignal} />

        <BodyText color={colors.text} size={13} weight="semibold" style={{ textAlign: 'center', marginTop: 8 }}>
          ${lastPrice.toFixed(2)}
        </BodyText>
        {position && (
          <BodyText color={unrealizedPnl >= 0 ? colors.green : colors.red} size={11} style={{ textAlign: 'center', marginTop: 4 }}>
            {position.direction.toUpperCase()} open @ ${position.entryPrice.toFixed(2)} · {unrealizedPnl >= 0 ? '+' : ''}${unrealizedPnl.toFixed(2)}
          </BodyText>
        )}
      </Card>

      {currentSignal && (
        <Card borderColor={colors.gold} style={{ padding: 10 }}>
          <BodyText color={colors.gold} size={12} weight="semibold" style={{ textAlign: 'center' }}>
            🔎 SIGNAL FIRING: {currentSignal.direction.toUpperCase()} — {currentSignal.detail}
          </BodyText>

          {revealedPlan ? (
            <View style={{ marginTop: 10, gap: 4 }}>
              <BodyText color={colors.text} size={12}>Entry: <BodyText color={colors.gold} size={12} weight="semibold">${revealedPlan.entry.toFixed(2)}</BodyText></BodyText>
              <BodyText color={colors.text} size={12}>Stop Loss: <BodyText color={colors.red} size={12} weight="semibold">${revealedPlan.stopLoss.toFixed(2)}</BodyText></BodyText>
              <BodyText color={colors.text} size={12}>Take Profit: <BodyText color={colors.green} size={12} weight="semibold">${revealedPlan.takeProfit.toFixed(2)}</BodyText></BodyText>
              <BodyText color={colors.muted} size={11}>Risk:Reward — 1:{revealedPlan.riskRewardRatio.toFixed(1)}</BodyText>
            </View>
          ) : (
            <PixelButton
              color={colors.gold}
              onPress={handleReveal}
              disabled={revealBlocked}
              style={{ marginTop: 10 }}
            >
              {revealBlocked ? '🔒 UPGRADE TO LEGEND FOR UNLIMITED' : '👁 REVEAL ENTRY/EXIT'}
            </PixelButton>
          )}

          {revealLimit != null && (
            <BodyText color={colors.muted} size={10} style={{ textAlign: 'center', marginTop: 6 }}>
              {revealsRemaining}/{revealLimit} reveal{revealLimit === 1 ? '' : 's'} left today — Legend gets unlimited
            </BodyText>
          )}
        </Card>
      )}

      {flash && (
        <BodyText color={flash.startsWith('✓') ? colors.green : colors.red} size={12} weight="semibold" style={{ textAlign: 'center' }}>
          {flash}
        </BodyText>
      )}

      {!done && (
        <>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <PixelButton color={colors.green} onPress={() => trade('long')} style={{ flex: 1, paddingVertical: 14 }}>
              {position?.direction === 'short' ? '✕ CLOSE SHORT' : '▲ LONG'}
            </PixelButton>
            <PixelButton color={colors.red} onPress={() => trade('short')} style={{ flex: 1, paddingVertical: 14 }}>
              {position?.direction === 'long' ? '✕ CLOSE LONG' : '▼ SHORT'}
            </PixelButton>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <PixelButton color={colors.blue} onPress={step} style={{ flex: 1 }}>▶ NEXT CANDLE</PixelButton>
            <PixelButton color={colors.muted} onPress={skip5} style={{ flex: 1 }}>▶▶ SKIP 5</PixelButton>
          </View>
        </>
      )}

      {done && (
        <Card borderColor={colors.gold} style={{ alignItems: 'center', padding: 20 }}>
          <PixelText size={26}>🏁</PixelText>
          <PixelText color={colors.gold} size={12} glow style={{ marginTop: 8, textAlign: 'center' }}>PRACTICE COMPLETE</PixelText>
          <BodyText color={pnlSoFar >= 0 ? colors.green : colors.red} size={14} weight="semibold" style={{ marginTop: 8 }}>
            {pnlSoFar >= 0 ? '+' : ''}${pnlSoFar.toFixed(2)}
          </BodyText>
          <BodyText color={colors.text} size={12} style={{ marginTop: 6, textAlign: 'center' }}>
            {signalsSeen === 0
              ? 'No signals fired this run — try again for a market with more setups.'
              : `Signal adherence: ${adherence}% (${signalsFollowed}/${signalsSeen} signals followed)`}
          </BodyText>
          <PixelButton color={colors.blue} onPress={restart} style={{ marginTop: 14, alignSelf: 'stretch' }}>
            ↻ PRACTICE AGAIN (NEW MARKET)
          </PixelButton>
        </Card>
      )}
    </ScrollView>
  );
}
