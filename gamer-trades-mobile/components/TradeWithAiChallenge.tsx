import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { PixelText, BodyText, PixelButton } from './ui';
import { colors } from '../lib/theme';
import { SkillLevel, CURRICULUM, TRADE_CHALLENGE_TARGET_CORRECT } from '../lib/curriculum';
import { Candle, DetectorId, scanStrategies } from '../lib/strategyEngine';
import { getStrategy } from '../lib/strategyContent';
import CandlestickChart from './CandlestickChart';

interface Props {
  level: SkillLevel;
  color: string;
  alreadyPassed: boolean;
  onPass: () => void;
}

function generateCandles(count: number, basePrice: number): Candle[] {
  const candles: Candle[] = [];
  let price = basePrice;
  const now = Date.now();
  for (let i = count; i >= 0; i--) {
    const open = price;
    const change = (Math.random() - 0.48) * price * 0.012;
    const close = Math.max(1, open + change);
    const high = Math.max(open, close) + Math.random() * price * 0.005;
    const low = Math.min(open, close) - Math.random() * price * 0.005;
    candles.push({ time: now - i * 60000, open, high, low, close, volume: Math.floor(Math.random() * 500000 + 50000) });
    price = close;
  }
  return candles;
}

const BASE_PRICE = 67500;

export default function TradeWithAiChallenge({ level, color, alreadyPassed, onPass }: Props) {
  const detectorIds = Array.from(new Set(CURRICULUM[level].map(l => l.chartConcept).filter((d): d is DetectorId => !!d)));
  const candlesRef = useRef<Candle[]>(generateCandles(60, BASE_PRICE));
  const [livePrice, setLivePrice] = useState(BASE_PRICE);
  const [, forceTick] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState<'right' | 'wrong' | null>(null);
  const passedRef = useRef(alreadyPassed);

  useEffect(() => {
    const id = setInterval(() => {
      const prev = candlesRef.current;
      const last = prev[prev.length - 1];
      const open = last.close;
      const close = Math.max(1, open + (Math.random() - 0.48) * open * 0.008);
      const high = Math.max(open, close) + Math.random() * open * 0.003;
      const low = Math.min(open, close) - Math.random() * open * 0.003;
      const newCandle: Candle = { time: Date.now(), open, high, low, close, volume: Math.floor(Math.random() * 500000 + 50000) };
      candlesRef.current = [...prev.slice(-59), newCandle];
      setLivePrice(close);
      forceTick(t => t + 1);
      setLocked(false);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const signals = scanStrategies(candlesRef.current, detectorIds);
  const activeSignal = signals[0] ?? null;
  const lastCandle = candlesRef.current[candlesRef.current.length - 1];
  const fallbackBullish = lastCandle.close >= lastCandle.open;
  const correctIsBullish = activeSignal ? activeSignal.direction === 'bullish' : fallbackBullish;
  const strat = activeSignal ? getStrategy(activeSignal.strategyId) : null;

  const answer = (guessBullish: boolean) => {
    if (locked || passedRef.current) return;
    setLocked(true);
    const right = guessBullish === correctIsBullish;
    setFeedback(right ? 'right' : 'wrong');
    setAttempts(a => a + 1);
    if (right) {
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      if (nextCorrect >= TRADE_CHALLENGE_TARGET_CORRECT) {
        passedRef.current = true;
        onPass();
      }
    }
  };

  if (alreadyPassed) {
    return (
      <View style={{ alignItems: 'center', padding: 20 }}>
        <PixelText size={30}>✅</PixelText>
        <BodyText color={colors.green} size={14} weight="semibold" style={{ marginTop: 10 }}>CHALLENGE PASSED</BodyText>
        <BodyText color={colors.muted} size={12} style={{ marginTop: 6, textAlign: 'center' }}>
          You've already proven you can spot this level's concepts live. This counted toward unlocking the next level.
        </BodyText>
      </View>
    );
  }

  return (
    <View>
      <BodyText color={colors.muted} size={12} style={{ marginBottom: 10 }}>
        Watch the live-simulated chart. When you spot the setup, call it BULLISH or BEARISH — get {TRADE_CHALLENGE_TARGET_CORRECT} right to pass.
      </BodyText>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <BodyText color={color} size={12} weight="semibold">SCORE: {correct}/{TRADE_CHALLENGE_TARGET_CORRECT}</BodyText>
        <BodyText color={colors.muted} size={11}>{attempts} attempt{attempts === 1 ? '' : 's'}</BodyText>
      </View>

      <CandlestickChart symbol="BTC/USD (practice)" basePrice={BASE_PRICE} livePrice={livePrice} height={180} signal={activeSignal} />

      <View style={{ marginTop: 10, padding: 10, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}>
        <BodyText color={colors.text} size={12}>
          {activeSignal
            ? `${strat?.icon ?? ''} ${strat?.name ?? activeSignal.strategyId} is active right now — is this setup bullish or bearish?`
            : 'No named pattern is active right now — just read the most recent candle: bullish or bearish?'}
        </BodyText>
      </View>

      {feedback && (
        <BodyText color={feedback === 'right' ? colors.green : colors.red} size={13} weight="medium" style={{ marginTop: 10, textAlign: 'center' }}>
          {feedback === 'right' ? '✓ Correct!' : `✗ Not quite — that was ${correctIsBullish ? 'BULLISH' : 'BEARISH'}.`}
        </BodyText>
      )}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <PixelButton color={colors.green} disabled={locked} onPress={() => answer(true)} style={{ flex: 1, paddingVertical: 14 }}>
          ▲ BULLISH
        </PixelButton>
        <PixelButton color={colors.red} disabled={locked} onPress={() => answer(false)} style={{ flex: 1, paddingVertical: 14 }}>
          ▼ BEARISH
        </PixelButton>
      </View>
      {locked && <BodyText color={colors.border} size={10} style={{ marginTop: 8, textAlign: 'center' }}>Waiting for the next candle...</BodyText>}
    </View>
  );
}
