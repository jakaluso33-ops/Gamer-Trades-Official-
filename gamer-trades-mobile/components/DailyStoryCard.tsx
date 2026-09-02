import { useEffect, useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Rect, Line, G } from 'react-native-svg';
import { Card, PixelText, BodyText } from './ui';
import { colors } from '../lib/theme';
import { getDailyStory, DailyStory } from '../lib/dailyStory';
import { getSymbolInfo, SYMBOL_ICON } from '../lib/symbols';
import { generateCandles } from '../lib/simulatedCandles';

const DIRECTION_COLOR: Record<DailyStory['direction'], string> = {
  bullish: colors.green,
  bearish: colors.red,
  neutral: colors.gold,
};

const DIRECTION_ICON: Record<DailyStory['direction'], string> = {
  bullish: '▲',
  bearish: '▼',
  neutral: '▬',
};

const CHART_W = 320;
const CHART_H = 90;

/** A compact daily-storyline chart, colored by the story's direction — not a live feed,
 * just enough of a candlestick shape to make the symbol's mood legible at a glance. */
function MiniChart({ symbol, color }: { symbol: string; color: string }) {
  const candles = useMemo(() => {
    const info = getSymbolInfo(symbol);
    return generateCandles(24, info?.basePrice ?? 100);
  }, [symbol]);

  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const max = Math.max(...highs);
  const min = Math.min(...lows);
  const range = max - min || 1;
  const slotW = CHART_W / candles.length;

  const y = (price: number) => CHART_H - ((price - min) / range) * CHART_H;

  return (
    <Svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
      {candles.map((c, i) => {
        const x = i * slotW + slotW / 2;
        const bullish = c.close >= c.open;
        const bodyTop = y(Math.max(c.open, c.close));
        const bodyBottom = y(Math.min(c.open, c.close));
        return (
          <G key={i}>
            <Line x1={x} y1={y(c.high)} x2={x} y2={y(c.low)} stroke={color} strokeWidth={1} opacity={0.7} />
            <Rect
              x={x - slotW * 0.28}
              y={bodyTop}
              width={slotW * 0.56}
              height={Math.max(1.5, bodyBottom - bodyTop)}
              fill={color}
              opacity={bullish ? 0.9 : 0.55}
            />
          </G>
        );
      })}
    </Svg>
  );
}

export default function DailyStoryCard() {
  const router = useRouter();
  const [story, setStory] = useState<DailyStory | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getDailyStory().then(setStory).catch(() => setError(true));
  }, []);

  if (error || !story) return null;

  const color = DIRECTION_COLOR[story.direction];
  const info = getSymbolInfo(story.symbol);

  return (
    <Pressable onPress={() => router.push({ pathname: '/(tabs)/trade-desk', params: { symbol: story.symbol } } as never)}>
      <Card borderColor={color} style={{ padding: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <PixelText size={11} color={color} glow>📰 TODAY'S STORY</PixelText>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <PixelText size={16}>{SYMBOL_ICON[story.symbol] ?? '📈'}</PixelText>
          <BodyText color={colors.text} size={15} weight="semibold" style={{ flex: 1 }}>{story.headline}</BodyText>
        </View>

        <MiniChart symbol={story.symbol} color={color} />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 8 }}>
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: color }}>
            <BodyText color={color} size={10} weight="semibold">{DIRECTION_ICON[story.direction]} {story.direction.toUpperCase()}</BodyText>
          </View>
          <BodyText color={colors.muted} size={11} weight="semibold">{story.symbol}{info ? ` — ${info.name}` : ''}</BodyText>
        </View>

        <BodyText color={colors.muted} size={12} style={{ marginBottom: 10 }}>{story.summary}</BodyText>

        <BodyText color={color} size={12} weight="semibold" style={{ textAlign: 'center' }}>▶ TAP TO TRADE {story.symbol}</BodyText>
      </Card>
    </Pressable>
  );
}
