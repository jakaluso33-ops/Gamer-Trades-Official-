import { Text } from 'react-native';

/** Small money-icon cluster that reacts to a P&L value: green cash for profit, red for loss. */
export default function PnlIcon({ pnl, pct }: { pnl: number; pct?: number }) {
  if (pnl === 0) return null;
  const isUp = pnl > 0;
  const magnitude = Math.abs(pct ?? pnl / 100);
  const count = magnitude > 10 ? 3 : magnitude > 3 ? 2 : 1;
  const icon = isUp ? '💰' : '💸';

  return <Text style={{ marginLeft: 4 }}>{icon.repeat(count)}</Text>;
}
