import { Text, View } from 'react-native';
import LossCoin from './LossCoin';

/** Small money-icon cluster that reacts to a P&L value: green cash for profit, red coin for loss. */
export default function PnlIcon({ pnl, pct }: { pnl: number; pct?: number }) {
  if (pnl === 0) return null;
  const isUp = pnl > 0;
  const magnitude = Math.abs(pct ?? pnl / 100);
  const count = magnitude > 10 ? 3 : magnitude > 3 ? 2 : 1;

  if (isUp) return <Text style={{ marginLeft: 4 }}>{'💰'.repeat(count)}</Text>;
  return (
    <View style={{ flexDirection: 'row', marginLeft: 4, gap: 1 }}>
      {Array.from({ length: count }).map((_, i) => (
        <LossCoin key={i} size={14} />
      ))}
    </View>
  );
}
