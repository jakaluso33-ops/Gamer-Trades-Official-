import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Card, PixelText, BodyText, PixelButton } from './ui';
import { colors } from '../lib/theme';
import { Candle } from '../lib/strategyEngine';
import { summarizeMarket } from '../lib/marketRead';
import { runMarketReadAgent, MarketRead } from '../lib/marketReadAgent';
import { SkillLevel } from '../lib/curriculum';

interface Props {
  symbol: string;
  candles: Candle[];
  skillLevel: SkillLevel | null;
}

const REFRESH_MS = 45_000;

const MOMENTUM_COLOR: Record<MarketRead['momentum'], string> = {
  bullish: colors.green,
  bearish: colors.red,
  neutral: colors.muted,
};

const MOMENTUM_ICON: Record<MarketRead['momentum'], string> = {
  bullish: '▲',
  bearish: '▼',
  neutral: '▬',
};

const VOLATILITY_LABEL: Record<MarketRead['volatility'], string> = {
  low: 'LOW VOL',
  normal: 'NORMAL VOL',
  high: 'HIGH VOL',
};

export default function MarketReadCard({ symbol, candles, skillLevel }: Props) {
  const [read, setRead] = useState<MarketRead | null>(null);
  const [loading, setLoading] = useState(false);
  const [errored, setErrored] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const candlesRef = useRef(candles);
  const symbolRef = useRef(symbol);
  const tickRef = useRef<() => void>(() => {});

  useEffect(() => { candlesRef.current = candles; }, [candles]);
  useEffect(() => { symbolRef.current = symbol; }, [symbol]);

  useEffect(() => {
    let cancelled = false;
    // Scoped to this effect instance (one per symbol/skillLevel), not shared across
    // symbol switches -- a shared ref here previously let an in-flight request for the
    // PREVIOUS symbol permanently block the new symbol's fetch from ever starting,
    // leaving the card stuck on "reading..." until the next 45s interval tick (or
    // indefinitely under rapid symbol switching).
    let inFlight = false;

    const tick = async () => {
      if (inFlight) return;
      inFlight = true;
      setLoading(true);
      setErrored(false);
      setErrorMsg(null);
      try {
        const snapshot = summarizeMarket(candlesRef.current);
        if (!snapshot) return;
        const result = await runMarketReadAgent(symbolRef.current, snapshot, skillLevel);
        if (!cancelled) setRead(result);
      } catch (err) {
        console.error('market-read-agent failed', err);
        if (!cancelled) {
          setErrored(true);
          setErrorMsg(err instanceof Error ? err.message : null);
        }
      } finally {
        inFlight = false;
        if (!cancelled) setLoading(false);
      }
    };

    tickRef.current = () => { tick(); };
    setRead(null);
    tick();
    const id = setInterval(tick, REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [symbol, skillLevel]);

  return (
    <Card borderColor={colors.blue}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <BodyText color={colors.blue} size={12} weight="semibold" glow>📡 MARKET READ</BodyText>
        {loading && <BodyText color={colors.muted} size={10}>reading...</BodyText>}
      </View>

      {!read && !errored && (
        <BodyText color={colors.muted} size={12}>
          {loading ? `Reading the tape on ${symbol}...` : `Watching ${symbol} for the next read...`}
        </BodyText>
      )}

      {errored && !read && (
        <View>
          <BodyText color={colors.muted} size={12} style={{ marginBottom: 8 }}>
            {errorMsg ?? "Couldn't reach the market-read agent just now."}
          </BodyText>
          <PixelButton color={colors.blue} onPress={() => tickRef.current()} style={{ alignSelf: 'flex-start', paddingHorizontal: 16 }}>
            ↻ RETRY
          </PixelButton>
        </View>
      )}

      {read && (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <PixelText size={11} color={colors.blue} glow>{read.regimeLabel.toUpperCase()}</PixelText>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: MOMENTUM_COLOR[read.momentum] }}>
              <BodyText color={MOMENTUM_COLOR[read.momentum]} size={11} weight="semibold">
                {MOMENTUM_ICON[read.momentum]} {read.momentum.toUpperCase()}
              </BodyText>
            </View>
            <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: colors.gold }}>
              <BodyText color={colors.gold} size={11} weight="semibold">{VOLATILITY_LABEL[read.volatility]}</BodyText>
            </View>
          </View>
          <BodyText color={colors.text} size={12} style={{ marginBottom: 8 }}>{read.read}</BodyText>
          <BodyText color={colors.muted} size={11}>👀 {read.whatToWatch}</BodyText>
        </>
      )}
    </Card>
  );
}
