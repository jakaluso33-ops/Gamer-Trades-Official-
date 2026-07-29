'use client';

import { useEffect, useRef, useState } from 'react';
import { Candle, DetectorId, StrategySignal, scanStrategies, sma } from '@/lib/strategyEngine';

export type Timeframe = '1m' | '5m' | '15m' | '1H' | '4H' | '1D';

/** Bar width in ms for each timeframe — this is what makes the candles actually represent the selected timeframe. */
export const TIMEFRAME_MS: Record<Timeframe, number> = {
  '1m': 60_000,
  '5m': 5 * 60_000,
  '15m': 15 * 60_000,
  '1H': 60 * 60_000,
  '4H': 4 * 60 * 60_000,
  '1D': 24 * 60 * 60_000,
};

const MAX_HISTORY = 300;
const MIN_ZOOM = 20;
const MAX_ZOOM = 150;

function generateCandles(count: number, basePrice: number, barMs: number): Candle[] {
  const candles: Candle[] = [];
  let price = basePrice;
  const now = Date.now();
  // Scale per-bar volatility with bar duration (bigger timeframe = bigger swings per bar).
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

interface Props {
  symbol: string;
  basePrice: number;
  /** Latest real-time price (from live quotes or tick simulation) to anchor new candles to. */
  livePrice?: number;
  timeframe?: Timeframe;
  height?: number;
  enabledStrategies?: DetectorId[];
  onSignal?: (signal: StrategySignal | null) => void;
}

const ALL_DETECTORS: DetectorId[] = ['breakout', 'orb', 'fibonacci', 'support_resistance', 'ma_crossover', 'rsi_reversal'];

function formatAxisTime(ms: number, barMs: number): string {
  const d = new Date(ms);
  if (barMs >= TIMEFRAME_MS['1D']) return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (barMs >= TIMEFRAME_MS['1H']) return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function CandlestickChart({ symbol, basePrice, livePrice, timeframe = '1m', height = 320, enabledStrategies = ALL_DETECTORS, onSignal }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barMs = TIMEFRAME_MS[timeframe];
  const [candles, setCandles] = useState<Candle[]>(() => generateCandles(80, basePrice, barMs));
  const [hovered, setHovered] = useState<Candle | null>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [signals, setSignals] = useState<StrategySignal[]>([]);
  const [zoom, setZoom] = useState(80);
  const onSignalRef = useRef(onSignal);
  useEffect(() => { onSignalRef.current = onSignal; }, [onSignal]);
  const livePriceRef = useRef(livePrice);
  useEffect(() => { livePriceRef.current = livePrice; }, [livePrice]);

  // Reset the chart when switching instruments or timeframe — otherwise the old
  // symbol/timeframe's candle history sticks around and the chart looks frozen
  // or mislabeled.
  useEffect(() => {
    setCandles(generateCandles(80, basePrice, barMs));
    setHovered(null);
    setMouseX(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, timeframe]);

  // Push a new bar on a steady real-world cadence, but the bar's own "time" advances
  // by the selected timeframe's width — so a 1H chart shows bars an hour apart even
  // though we're not waiting a real hour between updates.
  useEffect(() => {
    const id = setInterval(() => {
      setCandles(prev => {
        const last = prev[prev.length - 1];
        const open = last.close;
        const anchor = livePriceRef.current;
        const volatility = 0.006 * Math.sqrt(barMs / 60_000);
        // Track the real live price when we have one, otherwise fall back to a random walk.
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

  const zoomIn = () => setZoom(z => Math.max(MIN_ZOOM, z - 15));
  const zoomOut = () => setZoom(z => Math.min(Math.min(MAX_ZOOM, candles.length), z + 15));

  // Live strategy scanner — re-runs on every new candle
  useEffect(() => {
    const found = scanStrategies(candles, enabledStrategies);
    setSignals(found);
    onSignalRef.current?.(found[0] ?? null);
  }, [candles, enabledStrategies]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height - 74; // reserve bottom for volume + time axis
    const padL = 8, padR = 56, padT = 10, padB = 8;

    ctx.clearRect(0, 0, W, canvas.height);

    // Background grid
    ctx.strokeStyle = 'rgba(30, 58, 95, 0.4)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 6; i++) {
      const y = padT + (H - padT - padB) * (i / 6);
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    }
    for (let i = 0; i <= 10; i++) {
      const x = padL + (W - padL - padR) * (i / 10);
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, H - padB); ctx.stroke();
    }

    const visible = candles.slice(-zoom);
    const prices = visible.flatMap(c => [c.high, c.low]);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const priceRange = maxP - minP || 1;

    const toY = (p: number) => padT + ((maxP - p) / priceRange) * (H - padT - padB);
    const cW = (W - padL - padR) / visible.length;

    // Draw candles
    visible.forEach((c, i) => {
      const x = padL + i * cW;
      const xMid = x + cW / 2;
      const isUp = c.close >= c.open;
      const color = isUp ? '#00ff88' : '#ff3355';
      const shadow = isUp ? '0 0 4px #00ff88' : '0 0 4px #ff3355';

      const bodyTop = toY(Math.max(c.open, c.close));
      const bodyBot = toY(Math.min(c.open, c.close));
      const bodyH = Math.max(1, bodyBot - bodyTop);

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.shadowColor = color;
      ctx.shadowBlur = 2;
      ctx.beginPath();
      ctx.moveTo(xMid, toY(c.high));
      ctx.lineTo(xMid, toY(c.low));
      ctx.stroke();

      // Body
      ctx.fillStyle = isUp ? '#00ff8844' : '#ff335544';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 3;
      ctx.fillRect(x + 1, bodyTop, Math.max(1, cW - 2), bodyH);
      ctx.strokeRect(x + 1, bodyTop, Math.max(1, cW - 2), bodyH);
    });

    ctx.shadowBlur = 0;

    // Strategy overlays
    if (enabledStrategies.includes('ma_crossover') && visible.length >= 21) {
      const fast = sma(visible, 9);
      const slow = sma(visible, 21);
      const drawMA = (vals: (number | null)[], color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let started = false;
        vals.forEach((v, i) => {
          if (v == null) return;
          const x = padL + i * cW + cW / 2;
          const y = toY(v);
          if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
        });
        ctx.stroke();
      };
      drawMA(slow, 'rgba(100, 116, 139, 0.9)');
      drawMA(fast, 'rgba(255, 136, 0, 0.9)');
    }

    if (enabledStrategies.includes('orb') && visible.length > 5) {
      const orRange = visible.slice(0, 5);
      const orHigh = Math.max(...orRange.map(c => c.high));
      const orLow = Math.min(...orRange.map(c => c.low));
      const xEnd = padL + 5 * cW;
      ctx.fillStyle = 'rgba(0, 170, 255, 0.08)';
      ctx.fillRect(padL, toY(orHigh), xEnd - padL, toY(orLow) - toY(orHigh));
      ctx.strokeStyle = 'rgba(0, 170, 255, 0.5)';
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(padL, toY(orHigh), xEnd - padL, toY(orLow) - toY(orHigh));
      ctx.setLineDash([]);
    }

    signals.forEach(sig => {
      if (sig.level == null) return;
      const color = sig.strategyId === 'fibonacci' ? '#ffd700' : sig.direction === 'bullish' ? '#00ff88' : '#ff3355';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      const y = toY(sig.level);
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      ctx.font = '8px monospace';
      ctx.fillText(sig.label, padL + 4, y - 4);
    });

    // Crosshair
    if (mouseX !== null) {
      const idx = Math.floor((mouseX - padL) / cW);
      if (idx >= 0 && idx < visible.length) {
        const c = visible[idx];
        const xMid = padL + idx * cW + cW / 2;
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(xMid, padT); ctx.lineTo(xMid, H - padB); ctx.stroke();
        const yClose = toY(c.close);
        ctx.beginPath(); ctx.moveTo(padL, yClose); ctx.lineTo(W - padR, yClose); ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Price labels on right
    ctx.fillStyle = '#64748b';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    for (let i = 0; i <= 4; i++) {
      const p = minP + (priceRange * i) / 4;
      const y = toY(p);
      ctx.fillText('$' + p.toFixed(2), W - padR + 4, y + 3);
    }

    // Volume bars
    const maxVol = Math.max(...visible.map(c => c.volume));
    const volH = 50;
    const volY = H + 4;
    visible.forEach((c, i) => {
      const x = padL + i * cW;
      const isUp = c.close >= c.open;
      const h = (c.volume / maxVol) * volH;
      ctx.fillStyle = isUp ? 'rgba(0,255,136,0.3)' : 'rgba(255,51,85,0.3)';
      ctx.fillRect(x + 1, volY + volH - h, Math.max(1, cW - 2), h);
    });

    // VOLUME label
    ctx.fillStyle = '#1e3a5f';
    ctx.font = '8px monospace';
    ctx.fillText('VOL', padL, volY + 10);

    // Time axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    const labelStep = Math.max(1, Math.round(visible.length / 6));
    for (let i = 0; i < visible.length; i += labelStep) {
      const x = padL + i * cW + cW / 2;
      ctx.fillText(formatAxisTime(visible[i].time, barMs), x, canvas.height - 4);
    }
    ctx.textAlign = 'left';

  }, [candles, mouseX, signals, enabledStrategies, zoom, barMs]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (e.currentTarget.width / rect.width);
    setMouseX(x);
    const visible = candles.slice(-zoom);
    const cW = (e.currentTarget.width - 64) / visible.length;
    const idx = Math.floor((x - 8) / cW);
    if (idx >= 0 && idx < visible.length) setHovered(visible[idx]);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  };

  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const priceUp = last.close >= prev?.close;

  return (
    <div style={{ position: 'relative' }}>
      {/* OHLCV info bar */}
      <div style={{ display: 'flex', gap: '16px', padding: '6px 10px', fontSize: '11px', borderBottom: '1px solid #1e3a5f', flexWrap: 'wrap' }}>
        {[
          { k: 'O', v: (hovered ?? last).open.toFixed(2) },
          { k: 'H', v: (hovered ?? last).high.toFixed(2), c: '#00ff88' },
          { k: 'L', v: (hovered ?? last).low.toFixed(2), c: '#ff3355' },
          { k: 'C', v: (hovered ?? last).close.toFixed(2), c: priceUp ? '#00ff88' : '#ff3355' },
          { k: 'VOL', v: ((hovered ?? last).volume / 1000).toFixed(0) + 'K' },
        ].map(({ k, v, c }) => (
          <span key={k}>
            <span style={{ color: '#64748b' }}>{k}: </span>
            <span style={{ color: c ?? '#e2e8f0' }}>{v}</span>
          </span>
        ))}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span style={{ color: '#1e3a5f' }}>ZOOM</span>
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoom >= Math.min(MAX_ZOOM, candles.length)}
            className="pixel-btn"
            style={{ fontSize: '9px', padding: '2px 7px', lineHeight: 1 }}
          >
            −
          </button>
          <button
            type="button"
            onClick={zoomIn}
            disabled={zoom <= MIN_ZOOM}
            className="pixel-btn"
            style={{ fontSize: '9px', padding: '2px 7px', lineHeight: 1 }}
          >
            +
          </button>
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={900}
        height={height + 74}
        style={{ width: '100%', height: `${height + 74}px`, cursor: 'crosshair', display: 'block' }}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        onMouseLeave={() => { setMouseX(null); setHovered(null); }}
      />
    </div>
  );
}
