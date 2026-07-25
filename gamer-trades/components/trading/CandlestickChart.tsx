'use client';

import { useEffect, useRef, useState } from 'react';
import { Candle, DetectorId, StrategySignal, scanStrategies, sma } from '@/lib/strategyEngine';

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
    candles.push({
      time: now - i * 60000,
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
  height?: number;
  enabledStrategies?: DetectorId[];
  onSignal?: (signal: StrategySignal | null) => void;
}

const ALL_DETECTORS: DetectorId[] = ['breakout', 'orb', 'fibonacci', 'support_resistance', 'ma_crossover', 'rsi_reversal'];

export default function CandlestickChart({ symbol, basePrice, height = 320, enabledStrategies = ALL_DETECTORS, onSignal }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [candles, setCandles] = useState<Candle[]>(() => generateCandles(80, basePrice));
  const [hovered, setHovered] = useState<Candle | null>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [signals, setSignals] = useState<StrategySignal[]>([]);
  const onSignalRef = useRef(onSignal);
  useEffect(() => { onSignalRef.current = onSignal; }, [onSignal]);

  // Add new candle every 3 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setCandles(prev => {
        const last = prev[prev.length - 1];
        const open = last.close;
        const change = (Math.random() - 0.48) * open * 0.008;
        const close = Math.max(1, open + change);
        const high = Math.max(open, close) + Math.random() * open * 0.003;
        const low = Math.min(open, close) - Math.random() * open * 0.003;
        const newCandle: Candle = {
          time: Date.now(),
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: Math.floor(Math.random() * 500000 + 50000),
        };
        return [...prev.slice(-79), newCandle];
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

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
    const H = canvas.height - 60; // reserve bottom for volume
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

    const visible = candles;
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

  }, [candles, mouseX, signals, enabledStrategies]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (e.currentTarget.width / rect.width);
    setMouseX(x);
    const cW = (e.currentTarget.width - 64) / candles.length;
    const idx = Math.floor((x - 8) / cW);
    if (idx >= 0 && idx < candles.length) setHovered(candles[idx]);
  };

  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const priceUp = last.close >= prev?.close;

  return (
    <div style={{ position: 'relative' }}>
      {/* OHLCV info bar */}
      <div style={{ display: 'flex', gap: '16px', padding: '6px 10px', fontSize: '7px', borderBottom: '1px solid #1e3a5f', flexWrap: 'wrap' }}>
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
      </div>
      <canvas
        ref={canvasRef}
        width={900}
        height={height + 60}
        style={{ width: '100%', height: `${height + 60}px`, cursor: 'crosshair', display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setMouseX(null); setHovered(null); }}
      />
    </div>
  );
}
