import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { colors } from '../lib/theme';

const VB_W = 200;
const VB_H = 150;
const MID_Y = 75;

interface CandleSpec {
  /** Body top/bottom as offsets from the vertical midline, in SVG units (negative = up). */
  bodyTop: number;
  bodyBottom: number;
  wickTop: number;
  wickBottom: number;
  bullish: boolean;
}

function DrawnCandle({ x, spec, label }: { x: number; spec: CandleSpec; label?: string }) {
  const color = spec.bullish ? colors.green : colors.red;
  const bodyH = Math.max(3, spec.bodyBottom - spec.bodyTop);
  return (
    <>
      <Line x1={x} y1={spec.wickTop} x2={x} y2={spec.wickBottom} stroke={color} strokeWidth={2.5} />
      <Rect x={x - 16} y={spec.bodyTop} width={32} height={bodyH} rx={2} fill={color} opacity={0.85} stroke={color} strokeWidth={1.5} />
      {label && <SvgText x={x} y={140} fontSize="9" fill={colors.muted} textAnchor="middle">{label}</SvgText>}
    </>
  );
}

/** A dedicated visual diagram for each candlestick pattern -- distinct from the small icon
 * shown in the pattern picker, this draws the actual candle shape(s) at a size big enough to
 * study, matching the same "WHAT THE SETUP LOOKS LIKE" treatment strategies get via
 * StrategyDiagram. */
export default function CandlePatternDiagram({ id, height = 170 }: { id: string; height?: number }) {
  const width = (VB_W / VB_H) * height;
  const wrap = (children: React.ReactNode) => (
    <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
      <Line x1={10} y1={MID_Y} x2={VB_W - 10} y2={MID_Y} stroke={colors.border} strokeWidth={1} strokeDasharray="3,3" opacity={0.4} />
      {children}
    </Svg>
  );

  switch (id) {
    case 'hammer':
      // Small body near the top, long lower wick -- a rejection of lower prices.
      return wrap(
        <DrawnCandle x={100} spec={{ bodyTop: 60, bodyBottom: 76, wickTop: 55, wickBottom: 128, bullish: true }} label="LONG LOWER WICK" />
      );

    case 'inverted_hammer':
      return wrap(
        <DrawnCandle x={100} spec={{ bodyTop: 74, bodyBottom: 90, wickTop: 20, wickBottom: 95, bullish: true }} label="LONG UPPER WICK" />
      );

    case 'hanging_man':
      return wrap(
        <DrawnCandle x={100} spec={{ bodyTop: 60, bodyBottom: 76, wickTop: 55, wickBottom: 128, bullish: false }} label="AFTER AN UPTREND" />
      );

    case 'shooting_star':
      return wrap(
        <DrawnCandle x={100} spec={{ bodyTop: 74, bodyBottom: 90, wickTop: 20, wickBottom: 95, bullish: false }} label="AFTER AN UPTREND" />
      );

    case 'doji':
      return wrap(
        <>
          <Line x1={100} y1={30} x2={100} y2={120} stroke={colors.gold} strokeWidth={2.5} />
          <Rect x={84} y={73} width={32} height={4} rx={2} fill={colors.gold} />
          <SvgText x={100} y={140} fontSize="9" fill={colors.muted} textAnchor="middle">OPEN ≈ CLOSE</SvgText>
        </>
      );

    case 'bullish_engulfing':
      return wrap(
        <>
          <DrawnCandle x={78} spec={{ bodyTop: 60, bodyBottom: 88, wickTop: 55, wickBottom: 92, bullish: false }} />
          <DrawnCandle x={122} spec={{ bodyTop: 40, bodyBottom: 100, wickTop: 35, wickBottom: 104, bullish: true }} label="2ND CANDLE ENGULFS 1ST" />
        </>
      );

    case 'bearish_engulfing':
      return wrap(
        <>
          <DrawnCandle x={78} spec={{ bodyTop: 60, bodyBottom: 88, wickTop: 55, wickBottom: 92, bullish: true }} />
          <DrawnCandle x={122} spec={{ bodyTop: 40, bodyBottom: 100, wickTop: 35, wickBottom: 104, bullish: false }} label="2ND CANDLE ENGULFS 1ST" />
        </>
      );

    case 'marubozu':
      return wrap(
        <DrawnCandle x={100} spec={{ bodyTop: 30, bodyBottom: 120, wickTop: 30, wickBottom: 120, bullish: true }} label="NO WICKS -- ALL BODY" />
      );

    default:
      return null;
  }
}
