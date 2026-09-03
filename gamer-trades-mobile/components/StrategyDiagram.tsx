import Svg, { Rect, Line, Text as SvgText, Path, G } from 'react-native-svg';
import { colors } from '../lib/theme';
import { DetectorId } from '../lib/strategyEngine';

interface Candle { o: number; h: number; l: number; c: number }

const VB_W = 300;
const VB_H = 150;

function CandleShapes({ candles, x0 = 20, gap = 40 }: { candles: Candle[]; x0?: number; gap?: number }) {
  return (
    <>
      {candles.map((cd, i) => {
        const x = x0 + i * gap;
        const isUp = cd.c < cd.o; // smaller y == higher price
        const color = isUp ? colors.green : colors.red;
        const bodyTop = Math.min(cd.o, cd.c);
        const bodyBot = Math.max(cd.o, cd.c);
        return (
          <G key={i}>
            <Line x1={x} y1={cd.h} x2={x} y2={cd.l} stroke={color} strokeWidth={2} />
            <Rect x={x - 7} y={bodyTop} width={14} height={Math.max(3, bodyBot - bodyTop)} rx={2} fill={color} />
          </G>
        );
      })}
    </>
  );
}

function ArrowLabel({ x, y, up, label, color }: { x: number; y: number; up: boolean; label: string; color: string }) {
  return (
    <>
      <Path
        d={up ? `M ${x} ${y + 14} L ${x - 6} ${y + 24} L ${x + 6} ${y + 24} Z` : `M ${x} ${y - 14} L ${x - 6} ${y - 24} L ${x + 6} ${y - 24} Z`}
        fill={color}
      />
      <SvgText x={x} y={up ? y + 38 : y - 30} fontSize="13" fontWeight="bold" fill={color} textAnchor="middle">
        {label}
      </SvgText>
    </>
  );
}

export default function StrategyDiagram({ id, height = 150 }: { id: DetectorId; height?: number }) {
  const width = (VB_W / VB_H) * height;

  if (id === 'breakout') {
    const candles: Candle[] = [
      { o: 92, h: 82, l: 100, c: 88 },
      { o: 88, h: 80, l: 96, c: 94 },
      { o: 94, h: 84, l: 100, c: 86 },
      { o: 86, h: 78, l: 94, c: 90 },
      { o: 90, h: 80, l: 96, c: 84 },
      { o: 84, h: 40, l: 88, c: 44 },
      { o: 44, h: 26, l: 50, c: 30 },
    ];
    return (
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Line x1="12" y1="80" x2="270" y2="80" stroke={colors.gold} strokeWidth={1.5} strokeDasharray="4,3" />
        <SvgText x="14" y="72" fontSize="10" fill={colors.gold}>RESISTANCE</SvgText>
        <CandleShapes candles={candles} />
        <ArrowLabel x={260} y={40} up label="BREAKOUT" color={colors.green} />
      </Svg>
    );
  }

  if (id === 'orb') {
    const candles: Candle[] = [
      { o: 95, h: 88, l: 100, c: 90 },
      { o: 90, h: 84, l: 96, c: 87 },
      { o: 87, h: 82, l: 92, c: 85 },
      { o: 85, h: 80, l: 90, c: 88 },
      { o: 88, h: 50, l: 92, c: 55 },
      { o: 55, h: 30, l: 60, c: 34 },
    ];
    return (
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Rect x="10" y="80" width="120" height="20" fill={`${colors.blue}22`} stroke={colors.blue} strokeWidth={1} strokeDasharray="3,2" />
        <SvgText x="14" y="72" fontSize="9" fill={colors.blue}>OPENING RANGE</SvgText>
        <CandleShapes candles={candles} />
        <ArrowLabel x={250} y={30} up label="BUY" color={colors.green} />
      </Svg>
    );
  }

  if (id === 'fibonacci') {
    const candles: Candle[] = [
      { o: 100, h: 92, l: 104, c: 94 },
      { o: 94, h: 70, l: 98, c: 74 },
      { o: 74, h: 50, l: 78, c: 54 },
      { o: 54, h: 46, l: 60, c: 58 },
      { o: 58, h: 52, l: 68, c: 64 },
      { o: 64, h: 44, l: 68, c: 48 },
      { o: 48, h: 24, l: 52, c: 28 },
    ];
    return (
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Line x1="12" y1="50" x2="270" y2="50" stroke={colors.muted} strokeWidth={1} strokeDasharray="3,3" />
        <SvgText x="220" y="47" fontSize="8" fill={colors.muted}>61.8%</SvgText>
        <Line x1="12" y1="62" x2="270" y2="62" stroke={colors.gold} strokeWidth={1.2} strokeDasharray="3,3" />
        <SvgText x="220" y="59" fontSize="8" fill={colors.gold}>50%</SvgText>
        <Line x1="12" y1="74" x2="270" y2="74" stroke={colors.muted} strokeWidth={1} strokeDasharray="3,3" />
        <SvgText x="220" y="71" fontSize="8" fill={colors.muted}>38.2%</SvgText>
        <CandleShapes candles={candles} />
        <ArrowLabel x={260} y={24} up label="BOUNCE" color={colors.green} />
      </Svg>
    );
  }

  if (id === 'support_resistance') {
    const candles: Candle[] = [
      { o: 60, h: 30, l: 64, c: 34 },
      { o: 34, h: 30, l: 58, c: 54 },
      { o: 54, h: 32, l: 58, c: 36 },
      { o: 36, h: 32, l: 62, c: 58 },
      { o: 58, h: 34, l: 62, c: 38 },
      { o: 38, h: 34, l: 60, c: 56 },
      { o: 56, h: 26, l: 60, c: 30 },
    ];
    return (
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Line x1="12" y1="30" x2="270" y2="30" stroke={colors.red} strokeWidth={1.5} strokeDasharray="4,3" />
        <SvgText x="14" y="24" fontSize="9" fill={colors.red}>RESISTANCE</SvgText>
        <Line x1="12" y1="62" x2="270" y2="62" stroke={colors.green} strokeWidth={1.5} strokeDasharray="4,3" />
        <SvgText x="14" y="76" fontSize="9" fill={colors.green}>SUPPORT</SvgText>
        <CandleShapes candles={candles} />
      </Svg>
    );
  }

  if (id === 'ma_crossover') {
    const candles: Candle[] = [
      { o: 92, h: 86, l: 98, c: 90 },
      { o: 90, h: 84, l: 96, c: 88 },
      { o: 88, h: 78, l: 92, c: 80 },
      { o: 80, h: 66, l: 84, c: 68 },
      { o: 68, h: 52, l: 72, c: 55 },
      { o: 55, h: 40, l: 60, c: 43 },
      { o: 43, h: 26, l: 48, c: 30 },
    ];
    return (
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <CandleShapes candles={candles} />
        <Path d="M 20 96 Q 100 90 140 76 Q 200 55 260 34" stroke={colors.blue} strokeWidth={2} fill="none" opacity={0.85} />
        <Path d="M 20 84 Q 100 84 140 82 Q 200 70 260 44" stroke={colors.gold} strokeWidth={2} fill="none" opacity={0.85} />
        <SvgText x="150" y="70" fontSize="8" fill={colors.gold}>FAST MA</SvgText>
        <SvgText x="150" y="95" fontSize="8" fill={colors.blue}>SLOW MA</SvgText>
        <ArrowLabel x={225} y={40} up label="CROSS" color={colors.green} />
      </Svg>
    );
  }

  if (id === 'vwap') {
    const candles: Candle[] = [
      { o: 60, h: 54, l: 66, c: 62 },
      { o: 62, h: 56, l: 70, c: 66 },
      { o: 66, h: 58, l: 72, c: 60 },
      { o: 60, h: 52, l: 64, c: 54 },
      { o: 54, h: 46, l: 58, c: 50 },
      { o: 50, h: 38, l: 54, c: 42 },
      { o: 42, h: 26, l: 46, c: 30 },
    ];
    return (
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Line x1="12" y1="56" x2="270" y2="56" stroke={colors.gold} strokeWidth={1.5} strokeDasharray="4,3" />
        <SvgText x="14" y="50" fontSize="10" fill={colors.gold}>VWAP</SvgText>
        <CandleShapes candles={candles} />
        <ArrowLabel x={230} y={40} up label="REJECTION" color={colors.red} />
      </Svg>
    );
  }

  if (id === 'bollinger_squeeze') {
    return (
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Path d="M 20 20 Q 100 50 150 66 Q 200 74 260 20" stroke={colors.muted} strokeWidth={1.2} fill="none" opacity={0.6} />
        <Path d="M 20 110 Q 100 80 150 66 Q 200 58 260 118" stroke={colors.muted} strokeWidth={1.2} fill="none" opacity={0.6} />
        <SvgText x="150" y="90" fontSize="9" fill={colors.blue} textAnchor="middle">SQUEEZE</SvgText>
        <CandleShapes
          candles={[
            { o: 70, h: 60, l: 76, c: 66 },
            { o: 66, h: 62, l: 72, c: 68 },
            { o: 68, h: 64, l: 72, c: 66 },
            { o: 66, h: 62, l: 70, c: 64 },
            { o: 64, h: 60, l: 68, c: 62 },
            { o: 62, h: 40, l: 66, c: 44 },
            { o: 44, h: 20, l: 48, c: 24 },
          ]}
        />
        <ArrowLabel x={260} y={40} up label="EXPANSION" color={colors.green} />
      </Svg>
    );
  }

  if (id === 'macd') {
    return (
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <CandleShapes
          candles={[
            { o: 92, h: 86, l: 98, c: 90 },
            { o: 90, h: 82, l: 96, c: 84 },
            { o: 84, h: 74, l: 90, c: 78 },
            { o: 78, h: 62, l: 82, c: 66 },
            { o: 66, h: 50, l: 70, c: 54 },
            { o: 54, h: 38, l: 60, c: 42 },
            { o: 42, h: 24, l: 48, c: 28 },
          ]}
        />
        <Line x1="12" y1="132" x2="270" y2="132" stroke={colors.muted} strokeWidth={1} strokeDasharray="3,2" />
        <SvgText x="14" y="129" fontSize="8" fill={colors.muted}>ZERO LINE</SvgText>
        <Path d="M 20 140 Q 80 138 120 132 Q 170 122 260 100" stroke={colors.blue} strokeWidth={2} fill="none" />
        <Path d="M 20 138 Q 80 140 120 138 Q 170 128 260 112" stroke={colors.gold} strokeWidth={1.5} fill="none" opacity={0.8} />
        <SvgText x="150" y="150" fontSize="8" fill={colors.blue}>MACD</SvgText>
        <ArrowLabel x={225} y={70} up label="CROSS UP" color={colors.green} />
      </Svg>
    );
  }

  // rsi_reversal
  const candles: Candle[] = [
    { o: 70, h: 60, l: 76, c: 64 },
    { o: 64, h: 52, l: 68, c: 56 },
    { o: 56, h: 44, l: 60, c: 48 },
    { o: 48, h: 36, l: 52, c: 40 },
    { o: 40, h: 34, l: 48, c: 44 },
    { o: 44, h: 32, l: 60, c: 56 },
    { o: 56, h: 26, l: 60, c: 30 },
  ];
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
      <CandleShapes candles={candles} x0={20} gap={40} />
      <Line x1="12" y1="118" x2="270" y2="118" stroke={colors.red} strokeWidth={1} strokeDasharray="3,2" />
      <SvgText x="230" y="115" fontSize="8" fill={colors.red}>OVERSOLD</SvgText>
      <Path d="M 20 128 Q 60 132 100 130 Q 140 128 180 122 Q 220 110 260 90" stroke={colors.purple} strokeWidth={2} fill="none" />
      <SvgText x="20" y="142" fontSize="8" fill={colors.purple}>RSI</SvgText>
      <ArrowLabel x={225} y={65} up label="REVERSAL" color={colors.green} />
    </Svg>
  );
}
