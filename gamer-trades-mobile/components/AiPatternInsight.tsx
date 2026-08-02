import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { BodyText, PixelText } from './ui';
import { colors } from '../lib/theme';
import { StrategySignal } from '../lib/strategyEngine';
import { getStrategy } from '../lib/strategyContent';
import { SkillLevel } from '../lib/curriculum';
import { runPatternAgent, PatternInsight } from '../lib/patternAgent';

const CACHE_MS = 90_000;

interface CacheEntry {
  insight: PatternInsight;
  fetchedAt: number;
}

interface Props {
  symbol: string;
  signal: StrategySignal | null;
  skillLevel: SkillLevel | null;
}

export default function AiPatternInsight({ symbol, signal, skillLevel }: Props) {
  const [insight, setInsight] = useState<PatternInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [errored, setErrored] = useState(false);
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const inFlightKeyRef = useRef<string | null>(null);

  const key = signal ? `${symbol}:${signal.strategyId}:${signal.label}` : null;

  useEffect(() => {
    if (!signal || !key) {
      setInsight(null);
      setErrored(false);
      return;
    }

    const cached = cacheRef.current.get(key);
    if (cached && Date.now() - cached.fetchedAt < CACHE_MS) {
      setInsight(cached.insight);
      setErrored(false);
      return;
    }

    if (inFlightKeyRef.current === key) return;
    inFlightKeyRef.current = key;
    setLoading(true);
    setErrored(false);

    runPatternAgent(symbol, signal, skillLevel)
      .then(result => {
        cacheRef.current.set(key, { insight: result, fetchedAt: Date.now() });
        setInsight(result);
      })
      .catch(err => {
        console.error('pattern-agent failed', err);
        setErrored(true);
      })
      .finally(() => {
        setLoading(false);
        inFlightKeyRef.current = null;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const strat = signal ? getStrategy(signal.strategyId) : null;
  const accentColor = signal ? (signal.direction === 'bullish' ? colors.green : colors.red) : colors.purple;

  return (
    <View style={{ padding: 10, backgroundColor: `${accentColor}0a`, borderWidth: 2, borderColor: `${accentColor}55` }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <PixelText size={13}>🤖</PixelText>
        <BodyText color={accentColor} size={11} weight="semibold" glow>AI COACH</BodyText>
      </View>

      {!signal && (
        <BodyText color={colors.muted} size={12}>Scanning the live market — I'll chime in the moment a real setup forms.</BodyText>
      )}

      {signal && loading && (
        <BodyText color={colors.muted} size={12}>Reading the {strat?.name ?? signal.strategyId} setup forming on {symbol}...</BodyText>
      )}

      {signal && !loading && errored && (
        <BodyText color={colors.muted} size={12}>Couldn't reach the AI coach just now — the {strat?.name ?? signal.strategyId} setup is still active on the Live Signals panel above.</BodyText>
      )}

      {signal && !loading && !errored && insight && (
        <>
          <BodyText color={accentColor} size={13} weight="semibold" style={{ marginBottom: 6 }}>{insight.headline}</BodyText>
          <BodyText color={colors.text} size={12} style={{ marginBottom: 8 }}>{insight.explanation}</BodyText>
          <BodyText color={colors.gold} size={11} weight="medium">👀 {insight.whatToWatch}</BodyText>
        </>
      )}
    </View>
  );
}
