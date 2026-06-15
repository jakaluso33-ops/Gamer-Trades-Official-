'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  color?: string;
  height?: number;
  positive?: boolean;
}

export default function MiniChart({ color, height = 60, positive = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<number[]>(() => {
    const base = positive ? 50 : 70;
    const arr: number[] = [];
    let v = base;
    for (let i = 0; i < 40; i++) {
      v += (Math.random() - (positive ? 0.35 : 0.65)) * 8;
      v = Math.max(10, Math.min(90, v));
      arr.push(v);
    }
    return arr;
  });

  const lineColor = color ?? (positive ? '#00ff88' : '#ff3355');

  useEffect(() => {
    const interval = setInterval(() => {
      setPoints((prev) => {
        const last = prev[prev.length - 1];
        const next = last + (Math.random() - (positive ? 0.4 : 0.6)) * 5;
        return [...prev.slice(1), Math.max(5, Math.min(95, next))];
      });
    }, 800);
    return () => clearInterval(interval);
  }, [positive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;

    const toX = (i: number) => (i / (points.length - 1)) * w;
    const toY = (v: number) => h - ((v - min) / range) * (h - 8) - 4;

    // Fill gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, lineColor + '44');
    grad.addColorStop(1, lineColor + '00');

    ctx.beginPath();
    ctx.moveTo(toX(0), h);
    points.forEach((p, i) => ctx.lineTo(toX(i), toY(p)));
    ctx.lineTo(toX(points.length - 1), h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = lineColor;
    ctx.shadowBlur = 6;
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(toX(i), toY(p));
      else ctx.lineTo(toX(i), toY(p));
    });
    ctx.stroke();
  }, [points, lineColor]);

  return (
    <canvas
      ref={canvasRef}
      width={180}
      height={height}
      style={{ width: '100%', height: `${height}px`, display: 'block' }}
    />
  );
}
