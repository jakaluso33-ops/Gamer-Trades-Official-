import { Fragment, useEffect, useRef, useState } from 'react';
import { View, Dimensions, Animated, Easing } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { PixelButton, BodyText } from './ui';
import { colors } from '../lib/theme';
import { Candle } from '../lib/strategyEngine';

export type Timeframe = '1m' | '5m' | '15m' | '1H' | '4H' | '1D';

export const TIMEFRAME_MS: Record<Timeframe, number> = {
  '1m': 60_000,
  '5m': 5 * 60_000,
  '15m': 15 * 60_000,
  '1H': 60 * 60_000,
  '4H': 4 * 60 * 60_000,
  '1D': 24 * 60 * 60_000,
};

const MAX_HISTORY = 300;
const MIN_ZOOM = 15;
const MAX_ZOOM = 80;
const MIN_PRICE_ZOOM = 0.4;
const MAX_PRICE_ZOOM = 3;
const MONEY_PARTICLES = 5;

function generateCandles(count: number, basePrice: number, barMs: number): Candle[] {
  const candles: Candle[] = [];
  let price = basePrice;
  const now = Date.now();
  const volatility = 0.006 * Math.sqrt(barMs / 60_000);
  for (let i = count; i >= 0; i--) {
    const open = price;
    const change = (Math.random() - 0.48) * price * volatility;
    const close = Math.max(1, open + change);
    const high = Math.max(open, close) + Math.random() * price * volatility * 0.4;
    const low = Math.min(open, close) - Math.random() * price * volatility * 0.4;
    candles.push({
      time: now - i * barMs,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(Math.random() * 500000 + 50000),
    });
    price = close;
  }
  return candles;
}

function formatAxisTime(ms: number, barMs: number): string {
  const d = new Date(ms);
  if (barMs >= TIMEFRAME_MS['1D']) return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (barMs >= TIMEFRAME_MS['1H']) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
}

export interface ChartPosition {
  entryPrice: number;
  direction: 'long' | 'short';
  quantity?: number;
}

interface Props {
  symbol: string;
  basePrice: number;
  livePrice?: number;
  timeframe?: Timeframe;
  height?: number;
  /** Open positions for the current symbol — drawn as entry-price marker lines. */
  positions?: ChartPosition[];
}

function touchDelta(touches: { pageX: number; pageY: number }[]): { dx: number; dy: number } {
  const [a, b] = touches;
  return { dx: Math.max(1, Math.abs(a.pageX - b.pageX)), dy: Math.max(1, Math.abs(a.pageY - b.pageY)) };
}

export default function CandlestickChart({ symbol, basePrice, livePrice, timeframe = '1m', height = 220, positions = [] }: Props) {
  const barMs = TIMEFRAME_MS[timeframe];
  const [candles, setCandles] = useState<Candle[]>(() => generateCandles(60, basePrice, barMs));
  const [zoom, setZoom] = useState(50);
  const [priceZoom, setPriceZoom] = useState(1);
  const livePriceRef = useRef(livePrice);
  useEffect(() => { livePriceRef.current = livePrice; }, [livePrice]);
  const pinchStart = useRef<{ dx: number; dy: number } | null>(null);
  const pinchStartZoom = useRef(zoom);
  const pinchStartPriceZoom = useRef(priceZoom);
  const moneyAnims = useRef(Array.from({ length: MONEY_PARTICLES }, () => new Animated.Value(0))).current;
  const moneyX = useRef(Array.from({ length: MONEY_PARTICLES }, () => Math.random())).current;

  useEffect(() => {
    setCandles(generateCandles(60, basePrice, barMs));
    setPriceZoom(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, timeframe]);

  useEffect(() => {
    const id = setInterval(() => {
      setCandles(prev => {
        const last = prev[prev.length - 1];
        const open = last.close;
        const anchor = livePriceRef.current;
        const volatility = 0.006 * Math.sqrt(barMs / 60_000);
        const close = anchor != null ? Math.max(1, anchor) : Math.max(1, open + (Math.random() - 0.48) * open * volatility);
        const high = Math.max(open, close) + Math.random() * open * volatility * 0.4;
        const low = Math.min(open, close) - Math.random() * open * volatility * 0.4;
        const newCandle: Candle = {
          time: last.time + barMs,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: Math.floor(Math.random() * 500000 + 50000),
        };
        return [...prev.slice(-(MAX_HISTORY - 1)), newCandle];
      });
    }, 3000);
    return () => clearInterval(id);
  }, [barMs]);

  const zoomIn = () => setZoom(z => Math.max(MIN_ZOOM, z - 10));
  const zoomOut = () => setZoom(z => Math.min(Math.min(MAX_ZOOM, candles.length), z + 10));
  const priceZoomIn = () => setPriceZoom(z => Math.max(MIN_PRICE_ZOOM, parseFloat((z - 0.2).toFixed(2))));
  const priceZoomOut = () => setPriceZoom(z => Math.min(MAX_PRICE_ZOOM, parseFloat((z + 0.2).toFixed(2))));

  const W = Dimensions.get('window').width - 56;
  const volH = 30;
  const H = height - volH - 16;
  const padL = 4, padR = 44;
  const visible = candles.slice(-zoom);
  const prices = visible.flatMap(c => [c.high, c.low]).concat(positions.map(p => p.entryPrice));
  const rawMinP = Math.min(...prices);
  const rawMaxP = Math.max(...prices);
  const priceMid = (rawMinP + rawMaxP) / 2;
  const range = (rawMaxP - rawMinP || 1) * priceZoom;
  const minP = priceMid - range / 2;
  const maxP = priceMid + range / 2;
  const toY = (p: number) => ((maxP - p) / range) * H;
  const cW = (W - padL - padR) / visible.length;
  const maxVol = Math.max(...visible.map(c => c.volume));
  const currentPrice = livePriceRef.current ?? visible[visible.length - 1]?.close ?? basePrice;

  // Combine same-direction entries into one averaged position line, like a real trading platform.
  const posGroups = new Map<'long' | 'short', { qty: number; notional: number }>();
  positions.forEach(pos => {
    const qty = pos.quantity ?? 1;
    const g = posGroups.get(pos.direction) ?? { qty: 0, notional: 0 };
    g.qty += qty;
    g.notional += qty * pos.entryPrice;
    posGroups.set(pos.direction, g);
  });
  const positionLines = Array.from(posGroups.entries()).map(([direction, g]) => {
    const avgEntry = g.notional / g.qty;
    const pnl = direction === 'long' ? (currentPrice - avgEntry) * g.qty : (avgEntry - currentPrice) * g.qty;
    return { direction, avgEntry, pnl };
  });
  const hasPosition = positionLines.length > 0;
  const positionsProfitable = positionLines.reduce((s, p) => s + p.pnl, 0) >= 0;

  // Continuously drift money-sign emoji up the chart while a position is open on
  // this symbol — green $ when in profit, red when in loss — for instant visual feedback.
  useEffect(() => {
    if (!hasPosition) return;
    const animations = moneyAnims.map((av, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 550),
          Animated.timing(av, { toValue: 1, duration: 3200 + i * 250, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(av, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    );
    animations.forEach(a => a.start());
    return () => animations.forEach(a => a.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPosition]);

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <BodyText color={colors.border} size={8}>TIME</BodyText>
          <PixelButton color={colors.muted} onPress={zoomOut} style={{ paddingHorizontal: 10, paddingVertical: 4 }}>−</PixelButton>
          <PixelButton color={colors.muted} onPress={zoomIn} style={{ paddingHorizontal: 10, paddingVertical: 4 }}>+</PixelButton>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <BodyText color={colors.border} size={8}>PRICE</BodyText>
          <PixelButton color={colors.muted} onPress={priceZoomOut} style={{ paddingHorizontal: 10, paddingVertical: 4 }}>−</PixelButton>
          <PixelButton color={colors.muted} onPress={priceZoomIn} style={{ paddingHorizontal: 10, paddingVertical: 4 }}>+</PixelButton>
        </View>
      </View>
      <View
        style={{ position: 'relative', width: W }}
        onStartShouldSetResponder={(e) => e.nativeEvent.touches.length === 2}
        onMoveShouldSetResponder={(e) => e.nativeEvent.touches.length === 2}
        onResponderGrant={(e) => {
          const touches = e.nativeEvent.touches;
          if (touches.length === 2) {
            pinchStart.current = touchDelta(touches);
            pinchStartZoom.current = zoom;
            pinchStartPriceZoom.current = priceZoom;
          }
        }}
        onResponderMove={(e) => {
          const touches = e.nativeEvent.touches;
          if (touches.length === 2 && pinchStart.current) {
            const { dx, dy } = touchDelta(touches);
            const scaleX = dx / pinchStart.current.dx;
            const scaleY = dy / pinchStart.current.dy;
            const newZoom = Math.round(pinchStartZoom.current / scaleX);
            setZoom(Math.min(Math.max(newZoom, MIN_ZOOM), Math.min(MAX_ZOOM, candles.length)));
            const newPriceZoom = pinchStartPriceZoom.current / scaleY;
            setPriceZoom(Math.min(MAX_PRICE_ZOOM, Math.max(MIN_PRICE_ZOOM, newPriceZoom)));
          }
        }}
        onResponderRelease={() => { pinchStart.current = null; }}
        onResponderTerminate={() => { pinchStart.current = null; }}
      >
      <Svg width={W} height={height}>
        <Defs>
          <LinearGradient id="candleUp" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.green} stopOpacity={0.75} />
            <Stop offset="1" stopColor={colors.green} stopOpacity={0.3} />
          </LinearGradient>
          <LinearGradient id="candleDown" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.red} stopOpacity={0.75} />
            <Stop offset="1" stopColor={colors.red} stopOpacity={0.3} />
          </LinearGradient>
        </Defs>
        {visible.map((c, i) => {
          const x = padL + i * cW;
          const xMid = x + cW / 2;
          const isUp = c.close >= c.open;
          const color = isUp ? colors.green : colors.red;
          const bodyTop = toY(Math.max(c.open, c.close));
          const bodyBot = toY(Math.min(c.open, c.close));
          const bodyW = Math.max(2, cW - 2);
          const bodyH = Math.max(2, bodyBot - bodyTop);
          return (
            <Fragment key={c.time.toString()}>
              <Line x1={xMid} y1={toY(c.high)} x2={xMid} y2={toY(c.low)} stroke={color} strokeWidth={1.2} />
              <Rect
                x={x + 1}
                y={bodyTop}
                width={bodyW}
                height={bodyH}
                rx={Math.min(2, bodyW / 3)}
                fill={isUp ? 'url(#candleUp)' : 'url(#candleDown)'}
                stroke={color}
                strokeWidth={1}
              />
            </Fragment>
          );
        })}
        {/* Price labels */}
        {[0, 1, 2, 3].map(i => {
          const p = minP + (range * i) / 3;
          return (
            <SvgText key={i} x={W - padR + 4} y={toY(p) + 3} fontSize="8" fill={colors.muted}>
              {p.toFixed(2)}
            </SvgText>
          );
        })}
        {/* Open position markers — combined per direction, with a money-emoji P&L pill */}
        {positionLines.map((pos, i) => {
          const inProfit = pos.pnl >= 0;
          const color = inProfit ? colors.green : colors.red;
          const y = toY(pos.avgEntry);
          const yCurrent = toY(currentPrice);
          const emoji = inProfit ? '💰' : '💸';
          const label = `${emoji} ${pos.pnl >= 0 ? '+' : '-'}$${Math.abs(pos.pnl).toFixed(2)}`;
          const labelW = 12 + label.length * 5.5;
          const labelY = y - 10 - i * 18;
          return (
            <Fragment key={'pos' + pos.direction}>
              <Rect
                x={padL}
                y={Math.min(y, yCurrent)}
                width={W - padR - padL}
                height={Math.max(1, Math.abs(yCurrent - y))}
                fill={inProfit ? `${colors.green}0f` : `${colors.red}0f`}
              />
              <Line x1={padL} y1={y} x2={W - padR} y2={y} stroke={color} strokeWidth={1.5} strokeDasharray="2,3" />
              <Rect x={W - padR - labelW} y={labelY} width={labelW} height={16} rx={8} fill={color} />
              <SvgText x={W - padR - labelW + 6} y={labelY + 11} fontSize="8" fill={colors.bg} fontWeight="bold">
                {label}
              </SvgText>
            </Fragment>
          );
        })}
        {/* Live current-price line */}
        <Fragment>
          <Line
            x1={padL}
            y1={toY(currentPrice)}
            x2={W - padR}
            y2={toY(currentPrice)}
            stroke="#e0f0ffb3"
            strokeWidth={1}
            strokeDasharray="5,4"
          />
          <Rect x={W - padR} y={toY(currentPrice) - 8} width={44} height={16} fill={colors.blue} />
          <SvgText x={W - padR + 4} y={toY(currentPrice) + 3} fontSize="7.5" fill={colors.bg} fontWeight="bold">
            {`$${currentPrice.toFixed(2)}`}
          </SvgText>
        </Fragment>
        {/* Volume bars */}
        {visible.map((c, i) => {
          const x = padL + i * cW;
          const isUp = c.close >= c.open;
          const h = (c.volume / maxVol) * volH;
          return (
            <Rect
              key={'v' + c.time}
              x={x + 1}
              y={H + 10 + (volH - h)}
              width={Math.max(1, cW - 2)}
              height={h}
              fill={isUp ? `${colors.green}44` : `${colors.red}44`}
            />
          );
        })}
        {/* Time axis */}
        {visible.map((c, i) => {
          if (i % Math.max(1, Math.round(visible.length / 4)) !== 0) return null;
          const x = padL + i * cW + cW / 2;
          return (
            <SvgText key={'t' + c.time} x={x} y={height - 2} fontSize="7" fill={colors.muted} textAnchor="middle">
              {formatAxisTime(c.time, barMs)}
            </SvgText>
          );
        })}
      </Svg>
      {hasPosition && (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: H }}>
          {moneyAnims.map((av, i) => {
            const translateY = av.interpolate({ inputRange: [0, 1], outputRange: [H, -10] });
            const opacity = av.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] });
            return (
              <Animated.Text
                key={i}
                style={{
                  position: 'absolute',
                  left: `${moneyX[i] * 85}%`,
                  transform: [{ translateY }],
                  opacity,
                  fontSize: 13 + (i % 3) * 3,
                }}
              >
                {positionsProfitable ? '💰' : '💸'}
              </Animated.Text>
            );
          })}
        </View>
      )}
      </View>
      <BodyText color={colors.border} size={10} style={{ textAlign: 'center', marginTop: 2 }}>
        Pinch horizontally or vertically to zoom, or use +/−
      </BodyText>
    </View>
  );
}
