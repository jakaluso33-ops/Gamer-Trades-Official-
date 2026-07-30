import { Fragment, useEffect, useRef, useState } from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
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

export default function CandlestickChart({ symbol, basePrice, livePrice, timeframe = '1m', height = 220, positions = [] }: Props) {
  const barMs = TIMEFRAME_MS[timeframe];
  const [candles, setCandles] = useState<Candle[]>(() => generateCandles(60, basePrice, barMs));
  const [zoom, setZoom] = useState(50);
  const livePriceRef = useRef(livePrice);
  useEffect(() => { livePriceRef.current = livePrice; }, [livePrice]);

  useEffect(() => {
    setCandles(generateCandles(60, basePrice, barMs));
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

  const W = Dimensions.get('window').width - 56;
  const volH = 30;
  const H = height - volH - 16;
  const padL = 4, padR = 44;
  const visible = candles.slice(-zoom);
  const prices = visible.flatMap(c => [c.high, c.low]).concat(positions.map(p => p.entryPrice));
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const range = maxP - minP || 1;
  const toY = (p: number) => ((maxP - p) / range) * H;
  const cW = (W - padL - padR) / visible.length;
  const maxVol = Math.max(...visible.map(c => c.volume));

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 6, marginBottom: 4 }}>
        <PixelButton color={colors.muted} onPress={zoomOut} style={{ paddingHorizontal: 10, paddingVertical: 4 }}>−</PixelButton>
        <PixelButton color={colors.muted} onPress={zoomIn} style={{ paddingHorizontal: 10, paddingVertical: 4 }}>+</PixelButton>
      </View>
      <Svg width={W} height={height}>
        {visible.map((c, i) => {
          const x = padL + i * cW;
          const xMid = x + cW / 2;
          const isUp = c.close >= c.open;
          const color = isUp ? colors.green : colors.red;
          const bodyTop = toY(Math.max(c.open, c.close));
          const bodyBot = toY(Math.min(c.open, c.close));
          return (
            <Fragment key={c.time.toString()}>
              <Line x1={xMid} y1={toY(c.high)} x2={xMid} y2={toY(c.low)} stroke={color} strokeWidth={1} />
              <Rect
                x={x + 1}
                y={bodyTop}
                width={Math.max(1, cW - 2)}
                height={Math.max(1, bodyBot - bodyTop)}
                fill={`${color}66`}
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
        {/* Open position markers */}
        {positions.map((pos, i) => {
          const currentPrice = livePriceRef.current ?? visible[visible.length - 1]?.close ?? pos.entryPrice;
          const inProfit = pos.direction === 'long' ? currentPrice >= pos.entryPrice : currentPrice <= pos.entryPrice;
          const color = inProfit ? colors.green : colors.red;
          const y = toY(pos.entryPrice);
          const label = `${pos.direction === 'long' ? '▲' : '▼'} $${pos.entryPrice.toFixed(2)}`;
          return (
            <Fragment key={'pos' + i}>
              <Line x1={padL} y1={y} x2={W - padR} y2={y} stroke={color} strokeWidth={1.5} strokeDasharray="2,3" />
              <Rect x={W - padR - 46} y={y - (i === 0 ? 9 : 18)} width={46} height={12} fill={color} />
              <SvgText x={W - padR - 43} y={y - (i === 0 ? 9 : 18) + 9} fontSize="7" fill={colors.bg} fontWeight="bold">
                {label}
              </SvgText>
            </Fragment>
          );
        })}
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
      <BodyText color={colors.border} size={10} style={{ textAlign: 'center', marginTop: 2 }}>
        Pinch not yet supported — use +/− to zoom
      </BodyText>
    </View>
  );
}
