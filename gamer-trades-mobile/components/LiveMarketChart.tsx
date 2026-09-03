import { useEffect, useRef, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Polyline, Line, Circle } from 'react-native-svg';
import { Card, PixelText, BodyText } from './ui';
import { colors } from '../lib/theme';
import { pollLiveQuotes, LiveQuote } from '../lib/marketData';
import { getSymbolInfo, SYMBOL_ICON } from '../lib/symbols';

const CHART_W = 320;
const CHART_H = 100;
const POLL_MS = 15_000;
const MAX_POINTS = 40;

// BTC/USD trades 24/7 -- picked as the default so this card always shows real, fresh
// movement regardless of what's currently open, rather than going stale outside market hours.
const LIVE_SYMBOL = 'BTC/USD';

/** A genuinely live (real Polygon-backed) price chart, polled independently of whatever
 * screen the user is on -- placed at the bottom of Home to fill the empty space below the
 * fold with something that's actually moving, not a static card. */
export default function LiveMarketChart() {
  const router = useRouter();
  const [points, setPoints] = useState<number[]>([]);
  const [quote, setQuote] = useState<LiveQuote | null>(null);
  const pointsRef = useRef<number[]>([]);

  useEffect(() => {
    const unsubscribe = pollLiveQuotes([LIVE_SYMBOL], POLL_MS, quotes => {
      const q = quotes[LIVE_SYMBOL];
      if (!q) return;
      setQuote(q);
      pointsRef.current = [...pointsRef.current, q.price].slice(-MAX_POINTS);
      setPoints(pointsRef.current);
    });
    return unsubscribe;
  }, []);

  const info = getSymbolInfo(LIVE_SYMBOL);
  const bullish = (quote?.changePct ?? 0) >= 0;
  const lineColor = bullish ? colors.green : colors.red;

  const min = points.length ? Math.min(...points) : 0;
  const max = points.length ? Math.max(...points) : 1;
  const range = max - min || 1;
  const slotW = points.length > 1 ? CHART_W / (points.length - 1) : CHART_W;
  const y = (price: number) => CHART_H - ((price - min) / range) * (CHART_H - 10) - 5;
  const polylinePoints = points.map((p, i) => `${i * slotW},${y(p)}`).join(' ');

  return (
    <Pressable onPress={() => router.push({ pathname: '/(tabs)/trade-desk', params: { symbol: LIVE_SYMBOL } } as never)}>
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

        {points.length < 2 ? (
          <View style={{ height: CHART_H, alignItems: 'center', justifyContent: 'center' }}>
            <BodyText color={colors.muted} size={12}>Connecting to live market data...</BodyText>
          </View>
        ) : (
          <Svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
            <Line x1={0} y1={CHART_H / 2} x2={CHART_W} y2={CHART_H / 2} stroke={colors.border} strokeWidth={1} strokeDasharray="3,3" opacity={0.4} />
            <Polyline points={polylinePoints} stroke={lineColor} strokeWidth={2} fill="none" />
            <Circle cx={(points.length - 1) * slotW} cy={y(points[points.length - 1])} r={3.5} fill={lineColor} />
          </Svg>
        )}

        <BodyText color={colors.muted} size={11} style={{ textAlign: 'center', marginTop: 10 }}>▶ TAP TO TRADE {LIVE_SYMBOL}</BodyText>
      </Card>
    </Pressable>
  );
}
