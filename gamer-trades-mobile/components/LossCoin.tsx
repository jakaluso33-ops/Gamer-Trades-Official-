import Svg, { Circle, Ellipse, Text as SvgText } from 'react-native-svg';

/** Stylized red wax-seal coin used everywhere a loss/negative P&L needs a visual marker. */
export default function LossCoin({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx={16} cy={16} r={15} fill="#a30f0f" />
      <Circle cx={16} cy={16} r={12.5} fill="#e8391f" />
      <Circle cx={16} cy={16} r={10.5} fill="#ff4d2e" />
      <Ellipse cx={12} cy={11} rx={5.5} ry={3} fill="#ffffff2e" />
      <SvgText x={16} y={22} fontSize="16" fontWeight="bold" fill="#ffffff" textAnchor="middle">$</SvgText>
    </Svg>
  );
}
