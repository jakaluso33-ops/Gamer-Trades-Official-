'use client';

interface Props {
  strategyId: string;
  color: string;
  height?: number;
}

const W = 400;

function Wrapper({ children, height = 160 }: { children: React.ReactNode; height?: number }) {
  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} style={{ display: 'block' }}>
      {children}
    </svg>
  );
}

function toPolyPoints(pts: [number, number][]) {
  return pts.map(p => p.join(',')).join(' ');
}

export default function StrategyDiagram({ strategyId, color, height = 160 }: Props) {
  const grid = (
    <g stroke="#1e3a5f" strokeWidth={1} opacity={0.5}>
      {[0, 1, 2, 3].map(i => <line key={i} x1={0} y1={(height / 4) * i} x2={W} y2={(height / 4) * i} />)}
    </g>
  );

  if (strategyId === 'breakout') {
    const line: [number, number][] = [[10, 120], [60, 70], [110, 72], [160, 68], [210, 71], [260, 66], [300, 30], [390, 10]];
    return (
      <Wrapper height={height}>
        {grid}
        <line x1={10} y1={68} x2={300} y2={68} stroke="#ff3355" strokeDasharray="6 4" strokeWidth={1.5} />
        <text x={12} y={60} fill="#ff3355" fontSize={9} fontFamily="monospace">RESISTANCE</text>
        <polyline points={toPolyPoints(line)} fill="none" stroke={color} strokeWidth={2} />
        <circle cx={300} cy={30} r={4} fill={color} />
        <text x={306} y={26} fill={color} fontSize={9} fontFamily="monospace">BREAKOUT</text>
      </Wrapper>
    );
  }

  if (strategyId === 'orb') {
    const line: [number, number][] = [[10, 90], [40, 60], [70, 95], [100, 70], [130, 85], [160, 60], [220, 55], [280, 30], [390, 5]];
    return (
      <Wrapper height={height}>
        {grid}
        <rect x={10} y={55} width={120} height={45} fill={`${color}22`} stroke={color} strokeDasharray="4 3" />
        <text x={14} y={112} fill={color} fontSize={9} fontFamily="monospace">OPENING RANGE</text>
        <polyline points={toPolyPoints(line)} fill="none" stroke="#00ffff" strokeWidth={2} />
        <circle cx={280} cy={30} r={4} fill="#00ffff" />
        <text x={286} y={26} fill="#00ffff" fontSize={9} fontFamily="monospace">ORB BREAK</text>
      </Wrapper>
    );
  }

  if (strategyId === 'fibonacci') {
    const levels = [
      { pct: '0%', y: 15 },
      { pct: '23.6%', y: 40 },
      { pct: '38.2%', y: 58 },
      { pct: '50%', y: 72 },
      { pct: '61.8%', y: 86 },
      { pct: '78.6%', y: 105 },
      { pct: '100%', y: 130 },
    ];
    const line: [number, number][] = [[10, 130], [80, 15], [140, 58], [200, 40], [260, 20], [390, 8]];
    return (
      <Wrapper height={height}>
        {levels.map(l => (
          <g key={l.pct}>
            <line x1={0} y1={l.y} x2={W} y2={l.y} stroke="#8b5cf6" strokeDasharray="3 4" strokeWidth={1} opacity={0.6} />
            <text x={4} y={l.y - 2} fill="#8b5cf6" fontSize={8} fontFamily="monospace">{l.pct}</text>
          </g>
        ))}
        <polyline points={toPolyPoints(line)} fill="none" stroke={color} strokeWidth={2} />
        <circle cx={140} cy={58} r={4} fill={color} />
      </Wrapper>
    );
  }

  if (strategyId === 'support_resistance') {
    const line: [number, number][] = [[10, 100], [50, 30], [90, 95], [140, 32], [190, 92], [240, 34], [290, 90], [340, 35], [390, 60]];
    return (
      <Wrapper height={height}>
        {grid}
        <line x1={0} y1={30} x2={W} y2={30} stroke="#ff3355" strokeDasharray="6 4" strokeWidth={1.5} />
        <text x={4} y={24} fill="#ff3355" fontSize={9} fontFamily="monospace">RESISTANCE</text>
        <line x1={0} y1={95} x2={W} y2={95} stroke="#00ff88" strokeDasharray="6 4" strokeWidth={1.5} />
        <text x={4} y={112} fill="#00ff88" fontSize={9} fontFamily="monospace">SUPPORT</text>
        <polyline points={toPolyPoints(line)} fill="none" stroke={color} strokeWidth={2} />
      </Wrapper>
    );
  }

  if (strategyId === 'ma_crossover') {
    const fast: [number, number][] = [[10, 110], [70, 95], [130, 60], [190, 40], [250, 30], [320, 20], [390, 15]];
    const slow: [number, number][] = [[10, 70], [70, 68], [130, 62], [190, 52], [250, 42], [320, 34], [390, 28]];
    return (
      <Wrapper height={height}>
        {grid}
        <polyline points={toPolyPoints(slow)} fill="none" stroke="#64748b" strokeWidth={2} />
        <text x={330} y={24} fill="#64748b" fontSize={8} fontFamily="monospace">SLOW MA</text>
        <polyline points={toPolyPoints(fast)} fill="none" stroke={color} strokeWidth={2} />
        <text x={330} y={12} fill={color} fontSize={8} fontFamily="monospace">FAST MA</text>
        <circle cx={185} cy={48} r={4} fill="#ffd700" />
        <text x={130} y={30} fill="#ffd700" fontSize={9} fontFamily="monospace">GOLDEN CROSS</text>
      </Wrapper>
    );
  }

  if (strategyId === 'rsi_reversal') {
    const price: [number, number][] = [[10, 100], [60, 70], [110, 40], [160, 20], [210, 15], [260, 45], [320, 70], [390, 60]];
    const rsi: [number, number][] = [[10, 55], [60, 45], [110, 30], [160, 10], [210, 8], [260, 40], [320, 55], [390, 45]];
    return (
      <Wrapper height={height}>
        <text x={4} y={12} fill="#64748b" fontSize={8} fontFamily="monospace">PRICE</text>
        <polyline points={toPolyPoints(price)} fill="none" stroke={color} strokeWidth={2} />
        <line x1={0} y1={12} x2={W} y2={12} stroke="#ff3355" strokeDasharray="3 4" strokeWidth={1} opacity={0.7} />
        <text x={330} y={9} fill="#ff3355" fontSize={7} fontFamily="monospace">RSI 70</text>
        <polyline points={toPolyPoints(rsi)} fill="none" stroke="#ffd700" strokeWidth={1.5} opacity={0.9} />
        <circle cx={210} cy={8} r={3.5} fill="#ffd700" />
        <text x={170} y={130} fill="#ffd700" fontSize={8} fontFamily="monospace">RSI overbought → reversal</text>
      </Wrapper>
    );
  }

  return null;
}
