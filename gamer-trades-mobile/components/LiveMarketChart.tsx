import { useEffect, useRef, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, PixelText, BodyText } from './ui';
import { colors } from '../lib/theme';
import { pollLiveQuotes, LiveQuote } from '../lib/marketData';
import { getSymbolInfo, SYMBOL_ICON } from '../lib/symbols';
import { Candle, StrategySignal, scanStrategies } from '../lib/strategyEngine';
import { detectCandlePattern } from '../lib/candlePatterns';
import { getStrategy } from '../lib/strategyContent';
import CandlestickChart from './CandlestickChart';

const POLL_MS = 15_000;

// BTC/USD trades 24/7 -- picked as the default so this card always shows real, fresh
// movement regardless of what's currently open, rather than going stale outside market hours.
const LIVE_SYMBOL = 'BTC/USD';

/** A genuinely live (real Polygon-backed) candlestick chart, anchored to real quotes polled
 * independently of whatever screen the user is on. Strategy badges below the chart are
 * computed live from the exact candles being drawn -- only setups actually firing right now
 * are ever shown, never a static list. Placed at the bottom of Home to fill the empty space
 * below the fold with something that's actually moving. */
export default function LiveMarketChart() {
  const router = useRouter();
  const [quote, setQuote] = useState<LiveQuote | null>(null);
  const [activeSignals, setActiveSignals] = useState<StrategySignal[]>([]);
  const candlesRef = useRef<Candle[]>([]);

  useEffect(() => {
    const unsubscribe = pollLiveQuotes([LIVE_SYMBOL], POLL_MS, quotes => {
      const q = quotes[LIVE_SYMBOL];
      if (q) setQuote(q);
    });
    return unsubscribe;
  }, []);

  const handleCandlesUpdate = (candles: Candle[]) => {
    candlesRef.current = candles;
    const strategySignals = scanStrategies(candles);
    const candleSignal = detectCandlePattern(candles);
    setActiveSignals(candleSignal ? [...strategySignals, candleSignal] : strategySignals);
  };

  const info = getSymbolInfo(LIVE_SYMBOL);
  const bullish = (quote?.changePct ?? 0) >= 0;
  const lineColor = bullish ? colors.green : colors.red;
  const topSignal = activeSignals[0] ?? null;

  return (
    <Card borderColor={lineColor} style={{ padding: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <PixelText size={16}>{SYMBOL_ICON[LIVE_SYMBOL] ?? '📈'}</PixelText>
          <View>
            <PixelText size={11} color={lineColor} glow>🔴 LIVE — {LIVE_SYMBOL}</PixelText>
            <BodyText color={colors.muted} size={11} style={{ marginTop: 2 }}>{info?.name ?? LIVE_SYMBOL}</BodyText>
          </View>
        </View>
        {quote && (
          <View style={{ alignItems: 'flex-end' }}>
            <BodyText color={colors.text} size={14} weight="semibold">
              ${quote.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </BodyText>
            <BodyText color={lineColor} size={11} weight="semibold" style={{ marginTop: 2 }}>
              {bullish ? '▲' : '▼'} {quote.changePct >= 0 ? '+' : ''}{quote.changePct.toFixed(2)}%
            </BodyText>
          </View>
        )}
      </View>

      <Pressable onPress={() => router.push({ pathname: '/(tabs)/trade-desk', params: { symbol: LIVE_SYMBOL } } as never)}>
        <CandlestickChart
          symbol={LIVE_SYMBOL}
          basePrice={info?.basePrice ?? 67420}
          livePrice={quote?.price}
          timeframe="1m"
          height={180}
          signal={topSignal}
          tickMs={4000}
          onCandlesUpdate={handleCandlesUpdate}
        />
      </Pressable>

      <View style={{ marginTop: 10 }}>
        <BodyText color={colors.muted} size={10} weight="semibold" style={{ marginBottom: 6 }}>
          {activeSignals.length > 0 ? 'LIVE ON THIS CHART RIGHT NOW' : 'NO SETUPS FIRING RIGHT NOW'}
        </BodyText>
        {activeSignals.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {activeSignals.map(sig => {
              const strat = getStrategy(sig.strategyId);
              const sigColor = sig.direction === 'bullish' ? colors.green : colors.red;
              return (
                <View
                  key={sig.strategyId}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1.5, borderColor: sigColor }}
                >
                  <BodyText size={11}>{strat?.icon ?? '🕯️'}</BodyText>
                  <BodyText color={sigColor} size={10.5} weight="semibold">{sig.label}</BodyText>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <BodyText color={colors.muted} size={11} style={{ textAlign: 'center', marginTop: 10 }}>▶ TAP TO TRADE {LIVE_SYMBOL}</BodyText>
    </Card>
  );
}
