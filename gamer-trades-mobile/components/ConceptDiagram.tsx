import Svg, { Rect, Line, Text as SvgText, Path, Circle, G } from 'react-native-svg';
import { colors } from '../lib/theme';
import { Lesson } from '../lib/curriculum';
import StrategyDiagram from './StrategyDiagram';

const VB_W = 300;
const VB_H = 150;

export default function ConceptDiagram({ lesson, height = 170 }: { lesson: Lesson; height?: number }) {
  // Chart-pattern lessons (breakout/orb/fibonacci/ma_crossover/rsi_reversal/support_resistance)
  // reuse the exact same illustration shown in the Academy for that strategy.
  if (lesson.chartConcept) {
    return <StrategyDiagram id={lesson.chartConcept} height={height} />;
  }

  const width = (VB_W / VB_H) * height;
  const wrap = (children: React.ReactNode) => <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>{children}</Svg>;

  switch (lesson.id) {
    case 'b_candlesticks':
      return wrap(
        <>
          <Line x1="150" y1="10" x2="150" y2="140" stroke={colors.green} strokeWidth={2} />
          <Rect x="125" y="40" width="50" height="70" rx={3} fill={colors.green} opacity={0.75} stroke={colors.green} strokeWidth={1.5} />
          <SvgText x="185" y="14" fontSize="9" fill={colors.muted}>HIGH</SvgText>
          <Line x1="150" y1="10" x2="178" y2="10" stroke={colors.muted} strokeWidth={1} strokeDasharray="2,2" />
          <SvgText x="185" y="112" fontSize="9" fill={colors.muted}>LOW</SvgText>
          <Line x1="150" y1="140" x2="178" y2="140" stroke={colors.muted} strokeWidth={1} strokeDasharray="2,2" />
          <SvgText x="8" y="44" fontSize="9" fill={colors.gold}>CLOSE</SvgText>
          <Line x1="34" y1="40" x2="123" y2="40" stroke={colors.gold} strokeWidth={1} strokeDasharray="2,2" />
          <SvgText x="8" y="114" fontSize="9" fill={colors.gold}>OPEN</SvgText>
          <Line x1="30" y1="110" x2="123" y2="110" stroke={colors.gold} strokeWidth={1} strokeDasharray="2,2" />
          <SvgText x="120" y="132" fontSize="9" fill={colors.text} textAnchor="middle">BODY</SvgText>
          <SvgText x="150" y="24" fontSize="9" fill={colors.text} textAnchor="middle">WICK</SvgText>
        </>
      );

    case 'b_wicks':
      return wrap(
        <>
          <Line x1="90" y1="15" x2="90" y2="130" stroke={colors.red} strokeWidth={2} />
          <Rect x="70" y="95" width="40" height="20" rx={3} fill={colors.red} opacity={0.75} stroke={colors.red} strokeWidth={1.5} />
          <Path d="M 90 20 L 82 32 L 98 32 Z" fill={colors.red} />
          <SvgText x="90" y="10" fontSize="9" fill={colors.red} textAnchor="middle">REJECTED HERE</SvgText>
          <SvgText x="90" y="140" fontSize="9" fill={colors.muted} textAnchor="middle">long upper wick</SvgText>

          <Line x1="210" y1="20" x2="210" y2="135" stroke={colors.green} strokeWidth={2} />
          <Rect x="190" y="20" width="40" height="20" rx={3} fill={colors.green} opacity={0.75} stroke={colors.green} strokeWidth={1.5} />
          <Path d="M 210 130 L 202 118 L 218 118 Z" fill={colors.green} />
          <SvgText x="210" y="148" fontSize="9" fill={colors.green} textAnchor="middle">REJECTED HERE</SvgText>
          <SvgText x="210" y="8" fontSize="9" fill={colors.muted} textAnchor="middle">long lower wick</SvgText>
        </>
      );

    case 'b_buy_sell':
      return wrap(
        <>
          <Path d="M 20 120 L 60 90 L 100 100 L 140 40" stroke={colors.green} strokeWidth={2.5} fill="none" />
          <Path d="M 140 40 L 128 48 L 138 56 Z" fill={colors.green} />
          <SvgText x="80" y="140" fontSize="11" fill={colors.green} fontWeight="bold" textAnchor="middle">▲ BUY / LONG</SvgText>
          <SvgText x="80" y="20" fontSize="8" fill={colors.muted} textAnchor="middle">profit if price rises</SvgText>

          <Line x1="150" y1="10" x2="150" y2="140" stroke={colors.border} strokeWidth={1} />

          <Path d="M 160 40 L 200 60 L 240 55 L 280 120" stroke={colors.red} strokeWidth={2.5} fill="none" />
          <Path d="M 280 120 L 268 112 L 272 124 Z" fill={colors.red} />
          <SvgText x="220" y="140" fontSize="11" fill={colors.red} fontWeight="bold" textAnchor="middle">▼ SELL / SHORT</SvgText>
          <SvgText x="220" y="20" fontSize="8" fill={colors.muted} textAnchor="middle">profit if price falls</SvgText>
        </>
      );

    case 'b_markets':
      return wrap(
        <>
          {[
            { icon: '📈', label: 'STOCKS', x: 50, y: 40 },
            { icon: '₿', label: 'CRYPTO', x: 150, y: 40 },
            { icon: '💱', label: 'FOREX', x: 250, y: 40 },
            { icon: '🛢️', label: 'FUTURES', x: 50, y: 110 },
            { icon: 'Ⓞ', label: 'OPTIONS', x: 150, y: 110 },
            { icon: '📊', label: 'INDICES', x: 250, y: 110 },
          ].map(m => (
            <G key={m.label}>
              <Circle cx={m.x} cy={m.y} r={22} fill={`${colors.blue}18`} stroke={colors.blue} strokeWidth={1.5} />
              <SvgText x={m.x} y={m.y + 6} fontSize="16" textAnchor="middle">{m.icon}</SvgText>
              <SvgText x={m.x} y={m.y + 36} fontSize="8" fill={colors.muted} textAnchor="middle">{m.label}</SvgText>
            </G>
          ))}
        </>
      );

    case 'b_market_size':
      return wrap(
        <>
          {[
            { label: 'FOREX', value: 100, amount: '$7T+/day' },
            { label: 'STOCKS', value: 45, amount: '~$300B/day' },
            { label: 'FUTURES', value: 30, amount: '~$150B/day' },
            { label: 'CRYPTO', value: 20, amount: '~$70B/day' },
          ].map((b, i) => {
            const y = 20 + i * 30;
            const w = (b.value / 100) * 180;
            return (
              <G key={b.label}>
                <SvgText x="4" y={y + 14} fontSize="9" fill={colors.text}>{b.label}</SvgText>
                <Rect x="70" y={y} width={180} height={16} fill={colors.bg} stroke={colors.border} strokeWidth={1} />
                <Rect x="70" y={y} width={w} height={16} fill={colors.gold} opacity={0.8} />
                <SvgText x={70 + w + 6} y={y + 13} fontSize="8" fill={colors.muted}>{b.amount}</SvgText>
              </G>
            );
          })}
        </>
      );

    case 'i_trends':
      return wrap(
        <>
          <Path d="M 20 120 L 60 90 L 80 100 L 120 60 L 140 70 L 180 35 L 200 45 L 260 15" stroke={colors.green} strokeWidth={2} fill="none" />
          <Line x1="20" y1="120" x2="260" y2="30" stroke={colors.gold} strokeWidth={1.2} strokeDasharray="4,3" />
          {[[60, 90], [120, 60], [180, 35]].map(([x, y], i) => (
            <Circle key={i} cx={x} cy={y} r={3} fill={colors.green} />
          ))}
          <SvgText x="150" y="145" fontSize="10" fill={colors.green} textAnchor="middle">HIGHER HIGHS, HIGHER LOWS</SvgText>
          <SvgText x="230" y="20" fontSize="8" fill={colors.gold}>trendline</SvgText>
        </>
      );

    case 'i_volume': {
      const bars = [10, 14, 12, 40, 16, 12];
      return wrap(
        <>
          {bars.map((h, i) => {
            const x = 30 + i * 40;
            const isBig = h > 30;
            return (
              <G key={i}>
                <Rect x={x} y={40} width={16} height={40} rx={2} fill={isBig ? colors.green : colors.muted} opacity={0.6} />
                <Rect x={x - 2} y={95 - h} width={20} height={h} fill={isBig ? colors.green : colors.blue} opacity={isBig ? 0.9 : 0.5} />
              </G>
            );
          })}
          <Line x1="10" y1="95" x2="290" y2="95" stroke={colors.border} strokeWidth={1} />
          <SvgText x="150" y="130" fontSize="9" fill={colors.muted} textAnchor="middle">VOLUME (bars below price)</SvgText>
          <Path d="M 150 55 L 158 35" stroke={colors.gold} strokeWidth={1.5} />
          <SvgText x="160" y="30" fontSize="8" fill={colors.gold}>big volume = conviction</SvgText>
        </>
      );
    }

    case 'i_risk_basics':
      return wrap(
        <>
          <Rect x="60" y="20" width="180" height="35" fill={`${colors.green}18`} stroke={colors.green} strokeWidth={1} />
          <SvgText x="150" y="42" fontSize="10" fill={colors.green} textAnchor="middle">TAKE PROFIT (+2R)</SvgText>
          <Line x1="60" y1="75" x2="240" y2="75" stroke={colors.text} strokeWidth={2} />
          <SvgText x="150" y="70" fontSize="10" fill={colors.text} textAnchor="middle" fontWeight="bold">ENTRY</SvgText>
          <Rect x="60" y="95" width="180" height="20" fill={`${colors.red}18`} stroke={colors.red} strokeWidth={1} />
          <SvgText x="150" y="109" fontSize="10" fill={colors.red} textAnchor="middle">STOP LOSS (-1R)</SvgText>
          <SvgText x="150" y="135" fontSize="9" fill={colors.muted} textAnchor="middle">Risk $1 to make $2 = 1:2 risk/reward</SvgText>
        </>
      );

    case 'i_orders':
      return wrap(
        <>
          <SvgText x="50" y="16" fontSize="9" fill={colors.blue} textAnchor="middle">MARKET</SvgText>
          <Line x1="20" y1="80" x2="80" y2="80" stroke={colors.border} strokeWidth={1.5} />
          <Circle cx="50" cy="80" r="6" fill={colors.blue} />
          <SvgText x="50" y="105" fontSize="7.5" fill={colors.muted} textAnchor="middle">fills now</SvgText>

          <SvgText x="150" y="16" fontSize="9" fill={colors.gold} textAnchor="middle">LIMIT</SvgText>
          <Line x1="120" y1="60" x2="180" y2="60" stroke={colors.border} strokeWidth={1.5} strokeDasharray="3,2" />
          <Circle cx="150" cy="60" r="6" fill={colors.gold} />
          <Path d="M 150 66 L 150 95" stroke={colors.muted} strokeWidth={1} strokeDasharray="2,2" />
          <SvgText x="150" y="112" fontSize="7.5" fill={colors.muted} textAnchor="middle">fills only at your price</SvgText>

          <SvgText x="250" y="16" fontSize="9" fill={colors.red} textAnchor="middle">STOP</SvgText>
          <Line x1="220" y1="45" x2="280" y2="45" stroke={colors.border} strokeWidth={1.5} strokeDasharray="3,2" />
          <Circle cx="250" cy="45" r="6" fill={colors.red} />
          <Path d="M 250 51 L 250 95" stroke={colors.muted} strokeWidth={1} strokeDasharray="2,2" />
          <SvgText x="250" y="112" fontSize="7.5" fill={colors.muted} textAnchor="middle">triggers a market order</SvgText>
        </>
      );

    case 'e_position_sizing':
      return wrap(
        <>
          <Rect x="60" y="70" width="40" height="50" fill={colors.red} opacity={0.75} />
          <SvgText x="80" y="135" fontSize="10" fill={colors.red} textAnchor="middle">RISK $1</SvgText>
          <Rect x="160" y="20" width="40" height="100" fill={colors.green} opacity={0.75} />
          <SvgText x="180" y="135" fontSize="10" fill={colors.green} textAnchor="middle">REWARD $3</SvgText>
          <SvgText x="130" y="16" fontSize="11" fill={colors.gold} textAnchor="middle" fontWeight="bold">1 : 3</SvgText>
        </>
      );

    case 'e_diversification': {
      const slices = [
        { color: colors.blue, frac: 0.2 },
        { color: colors.gold, frac: 0.2 },
        { color: colors.green, frac: 0.16 },
        { color: colors.red, frac: 0.16 },
        { color: colors.purple, frac: 0.14 },
        { color: colors.cyan, frac: 0.14 },
      ];
      const cx = 150, cy = 75, r = 55;
      let angle = -90;
      const paths = slices.map((s, i) => {
        const a0 = (angle * Math.PI) / 180;
        angle += s.frac * 360;
        const a1 = (angle * Math.PI) / 180;
        const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
        const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
        const large = s.frac > 0.5 ? 1 : 0;
        return <Path key={i} d={`M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`} fill={s.color} opacity={0.8} stroke={colors.bg} strokeWidth={2} />;
      });
      return wrap(
        <>
          {paths}
          <SvgText x="150" y="140" fontSize="9" fill={colors.muted} textAnchor="middle">spread across 6 asset classes</SvgText>
        </>
      );
    }

    case 'e_psychology':
      return wrap(
        <>
          <Path d="M 20 100 L 45 40 L 60 110 L 85 30 L 100 120 L 130 20" stroke={colors.red} strokeWidth={2} fill="none" />
          <SvgText x="75" y="14" fontSize="9" fill={colors.red} textAnchor="middle">REVENGE TRADING</SvgText>
          <Path d="M 170 90 L 200 75 L 230 60 L 260 48 L 280 40" stroke={colors.green} strokeWidth={2.5} fill="none" />
          <SvgText x="225" y="130" fontSize="9" fill={colors.green} textAnchor="middle">DISCIPLINED PLAN</SvgText>
        </>
      );

    case 'e_backtesting':
      return wrap(
        <>
          <Path d="M 20 100 L 50 80 L 80 95 L 110 60 L 140 75 L 170 45" stroke={colors.blue} strokeWidth={2} fill="none" opacity={0.7} />
          <Circle cx="110" cy="60" r="26" fill="none" stroke={colors.gold} strokeWidth={2.5} />
          <Line x1="129" y1="79" x2="150" y2="100" stroke={colors.gold} strokeWidth={4} strokeLinecap="round" />
          <SvgText x="150" y="130" fontSize="9" fill={colors.muted} textAnchor="middle">test across many market conditions</SvgText>
        </>
      );

    default:
      return null;
  }
}
