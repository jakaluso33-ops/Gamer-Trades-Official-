'use client';

/**
 * Small money-icon cluster that reacts to a P&L value: green cash for profit,
 * red cash for loss, scaling the icon count with the size of the move.
 */
export default function PnlIcon({ pnl, pct }: { pnl: number; pct?: number }) {
  if (pnl === 0) return null;
  const isUp = pnl > 0;
  const magnitude = Math.abs(pct ?? pnl / 100);
  const count = magnitude > 10 ? 3 : magnitude > 3 ? 2 : 1;
  const icon = isUp ? '💰' : '💸';
  const color = isUp ? '#00ff88' : '#ff3355';

  return (
    <span
      aria-hidden
      style={{ marginLeft: '4px', textShadow: `0 0 6px ${color}` }}
    >
      {icon.repeat(count)}
    </span>
  );
}
