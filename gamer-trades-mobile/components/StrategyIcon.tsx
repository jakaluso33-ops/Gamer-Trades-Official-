import Svg, { Line, Rect, Polyline } from 'react-native-svg';
import { DetectorId } from '../lib/strategyEngine';

/** Small line-diagram glyph illustrating the shape of each strategy's setup. */
export default function StrategyIcon({ id, color, size = 28 }: { id: DetectorId; color: string; size?: number }) {
  const w = size * 2;
  const h = size;
  const strokeWidth = 2;

  switch (id) {
    case 'breakout':
      return (
        <Svg width={w} height={h} viewBox="0 0 56 28">
          <Line x1="2" y1="18" x2="30" y2="18" stroke={color} strokeWidth={1.5} strokeDasharray="3,2" opacity={0.6} />
          <Polyline points="2,18 30,18 44,18 54,4" stroke={color} strokeWidth={strokeWidth} fill="none" />
        </Svg>
      );
    case 'orb':
      return (
        <Svg width={w} height={h} viewBox="0 0 56 28">
          <Rect x="4" y="8" width="20" height="12" stroke={color} strokeWidth={strokeWidth} fill="none" />
          <Polyline points="24,12 40,12 54,3" stroke={color} strokeWidth={strokeWidth} fill="none" />
        </Svg>
      );
    case 'fibonacci':
      return (
        <Svg width={w} height={h} viewBox="0 0 56 28">
          <Line x1="2" y1="12" x2="54" y2="12" stroke={color} strokeWidth={1} strokeDasharray="2,2" opacity={0.5} />
          <Polyline points="2,24 20,4 34,15 54,2" stroke={color} strokeWidth={strokeWidth} fill="none" />
        </Svg>
      );
    case 'support_resistance':
      return (
        <Svg width={w} height={h} viewBox="0 0 56 28">
          <Line x1="2" y1="5" x2="54" y2="5" stroke={color} strokeWidth={1} strokeDasharray="2,2" opacity={0.6} />
          <Line x1="2" y1="23" x2="54" y2="23" stroke={color} strokeWidth={1} strokeDasharray="2,2" opacity={0.6} />
          <Polyline points="2,14 12,22 22,6 32,22 42,6 54,14" stroke={color} strokeWidth={strokeWidth} fill="none" />
        </Svg>
      );
    case 'ma_crossover':
      return (
        <Svg width={w} height={h} viewBox="0 0 56 28">
          <Polyline points="2,22 20,16 36,10 54,4" stroke={color} strokeWidth={strokeWidth} fill="none" opacity={0.5} />
          <Polyline points="2,6 20,10 36,16 54,23" stroke={color} strokeWidth={strokeWidth} fill="none" />
        </Svg>
      );
    case 'rsi_reversal':
      return (
        <Svg width={w} height={h} viewBox="0 0 56 28">
          <Polyline points="2,10 16,4 30,22 44,18 54,6" stroke={color} strokeWidth={strokeWidth} fill="none" />
        </Svg>
      );
    default:
      return null;
  }
}
