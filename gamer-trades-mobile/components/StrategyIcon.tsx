import Svg, { Line, Rect, Polyline, Circle } from 'react-native-svg';
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
    case 'vwap':
      return (
        <Svg width={w} height={h} viewBox="0 0 56 28">
          <Line x1="2" y1="14" x2="54" y2="14" stroke={color} strokeWidth={1.5} strokeDasharray="3,2" opacity={0.6} />
          <Polyline points="2,20 14,10 26,18 38,8 54,4" stroke={color} strokeWidth={strokeWidth} fill="none" />
        </Svg>
      );
    case 'bollinger_squeeze':
      return (
        <Svg width={w} height={h} viewBox="0 0 56 28">
          <Polyline points="2,4 20,10 34,14 40,14 54,2" stroke={color} strokeWidth={1} strokeDasharray="2,2" opacity={0.6} />
          <Polyline points="2,24 20,18 34,14 40,14 54,26" stroke={color} strokeWidth={1} strokeDasharray="2,2" opacity={0.6} />
          <Polyline points="2,14 20,14 34,14 40,14 54,4" stroke={color} strokeWidth={strokeWidth} fill="none" />
        </Svg>
      );
    case 'macd':
      return (
        <Svg width={w} height={h} viewBox="0 0 56 28">
          <Line x1="2" y1="14" x2="54" y2="14" stroke={color} strokeWidth={1} strokeDasharray="2,2" opacity={0.5} />
          <Polyline points="2,20 16,16 30,10 44,6 54,2" stroke={color} strokeWidth={strokeWidth} fill="none" />
          <Polyline points="2,16 16,15 30,13 44,10 54,7" stroke={color} strokeWidth={1.2} fill="none" opacity={0.6} />
        </Svg>
      );
    case 'turtle_breakout':
      return (
        <Svg width={w} height={h} viewBox="0 0 56 28">
          <Line x1="2" y1="6" x2="40" y2="6" stroke={color} strokeWidth={1.2} strokeDasharray="3,2" opacity={0.6} />
          <Line x1="2" y1="22" x2="40" y2="22" stroke={color} strokeWidth={1.2} strokeDasharray="3,2" opacity={0.6} />
          <Polyline points="2,16 14,12 26,18 38,10 54,2" stroke={color} strokeWidth={strokeWidth} fill="none" />
        </Svg>
      );
    case 'momentum':
      return (
        <Svg width={w} height={h} viewBox="0 0 56 28">
          <Polyline points="2,24 12,20 22,18 32,12 42,7 54,2" stroke={color} strokeWidth={strokeWidth} fill="none" />
          <Polyline points="2,24 54,24" stroke={color} strokeWidth={1} strokeDasharray="2,2" opacity={0.4} />
        </Svg>
      );
    case 'ichimoku':
      return (
        <Svg width={w} height={h} viewBox="0 0 56 28">
          <Polyline points="2,10 16,14 30,8 44,16 54,6" stroke={color} strokeWidth={strokeWidth} fill="none" opacity={0.9} />
          <Polyline points="2,18 16,16 30,20 44,10 54,14" stroke={color} strokeWidth={1.2} fill="none" opacity={0.5} />
        </Svg>
      );
    case 'parabolic_sar':
      return (
        <Svg width={w} height={h} viewBox="0 0 56 28">
          <Polyline points="2,22 16,16 30,10 44,6 54,3" stroke={color} strokeWidth={1} strokeDasharray="2,2" opacity={0.5} fill="none" />
          <Circle cx="6" cy="25" r="1.6" fill={color} />
          <Circle cx="16" cy="20" r="1.6" fill={color} />
          <Circle cx="26" cy="16" r="1.6" fill={color} />
          <Circle cx="36" cy="12" r="1.6" fill={color} />
          <Circle cx="46" cy="9" r="1.6" fill={color} />
        </Svg>
      );
    default:
      return null;
  }
}
