export type StrategyDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface StrategyInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
  difficulty: StrategyDifficulty;
  summary: string;
  howItWorks: string[];
  whenToUse: string;
  riskNote: string;
}

export const STRATEGIES: StrategyInfo[] = [
  {
    id: 'breakout',
    name: 'BREAKOUT TRADING',
    icon: '🚀',
    color: '#00ff88',
    difficulty: 'BEGINNER',
    summary: 'Enter when price pushes decisively through a well-established support or resistance level.',
    howItWorks: [
      'Identify a price level that has been tested multiple times without breaking (resistance above, support below).',
      'Wait for a candle to close beyond that level, not just wick through it.',
      'Confirm with above-average volume — a breakout on low volume is more likely to fail.',
      'Enter in the direction of the break; the old resistance often becomes new support (and vice versa).',
    ],
    whenToUse: 'Best in trending or consolidating markets that are coiling near a clear range boundary.',
    riskNote: 'Watch for "fakeouts" — a quick break that reverses. A stop just back inside the old range limits the damage.',
  },
  {
    id: 'orb',
    name: 'OPENING RANGE BREAKOUT (ORB)',
    icon: '🔔',
    color: '#00aaff',
    difficulty: 'INTERMEDIATE',
    summary: "Trade the breakout of the range set in a market's first few minutes of activity.",
    howItWorks: [
      'Mark the high and low of the first N candles after the session/period opens — this is the "opening range".',
      'Wait for price to close outside that range, up or down.',
      'A break above the range high signals bullish momentum; a break below the range low signals bearish momentum.',
      'The size of the opening range often predicts the size of the move — a tight range can lead to an explosive breakout.',
    ],
    whenToUse: 'Popular for the first hour of a trading session when volatility and volume are highest.',
    riskNote: 'Early session moves can be choppy. Many traders wait for a retest of the range edge before entering.',
  },
  {
    id: 'fibonacci',
    name: 'FIBONACCI RETRACEMENT',
    icon: '🌀',
    color: '#ffd700',
    difficulty: 'INTERMEDIATE',
    summary: 'Use natural ratios (23.6%, 38.2%, 50%, 61.8%, 78.6%) to find likely pullback levels within a trend.',
    howItWorks: [
      'Identify a clear swing — a recent significant high and low.',
      'Draw retracement levels between that swing high and low.',
      'Watch for price to pull back to one of the key levels (38.2%, 50%, or 61.8% are the most-watched).',
      'A bounce or rejection at one of these levels, especially with other confirmation, can signal a continuation of the original trend.',
    ],
    whenToUse: 'Works best in a strong, established trend that is pulling back rather than reversing.',
    riskNote: "Fib levels are self-fulfilling because many traders watch them — but they're not guaranteed support. Combine with other signals.",
  },
  {
    id: 'support_resistance',
    name: 'SUPPORT & RESISTANCE',
    icon: '📏',
    color: '#8b5cf6',
    difficulty: 'BEGINNER',
    summary: 'Trade the bounces (or breaks) at price levels the market has repeatedly respected.',
    howItWorks: [
      'Look for price levels where the market has reversed direction two or more times.',
      'The more times a level is tested, the more significant it becomes — but each test also slightly weakens it.',
      'Buy near well-tested support, sell/short near well-tested resistance, with a tight stop beyond the level.',
      'If the level finally breaks, it often flips roles — old resistance becomes new support.',
    ],
    whenToUse: 'Useful in range-bound markets, and as context for almost every other strategy.',
    riskNote: 'Levels are zones, not exact prices. Give trades room rather than using a razor-thin stop right at the line.',
  },
  {
    id: 'ma_crossover',
    name: 'MOVING AVERAGE CROSSOVER',
    icon: '✂️',
    color: '#ff8800',
    difficulty: 'BEGINNER',
    summary: 'Trade the trend change signaled when a fast moving average crosses a slower one.',
    howItWorks: [
      'Plot a fast moving average (e.g. 9-period) and a slow moving average (e.g. 21-period).',
      'A "golden cross" — fast crossing above slow — signals emerging bullish momentum.',
      'A "death cross" — fast crossing below slow — signals emerging bearish momentum.',
      'The wider the gap after the cross, the stronger the trend confirmation tends to be.',
    ],
    whenToUse: 'Best in trending markets; produces false signals in choppy, sideways conditions.',
    riskNote: 'Moving averages lag price — you will never catch the exact top or bottom with this strategy.',
  },
  {
    id: 'rsi_reversal',
    name: 'RSI OVERBOUGHT / OVERSOLD',
    icon: '⚡',
    color: '#ff3355',
    difficulty: 'INTERMEDIATE',
    summary: 'Use the Relative Strength Index to spot when a move has stretched too far, too fast.',
    howItWorks: [
      'RSI oscillates between 0 and 100 based on recent gains vs. losses.',
      'A reading above 70 suggests the asset may be overbought and due for a pullback.',
      'A reading below 30 suggests the asset may be oversold and due for a bounce.',
      'The strongest signal comes when RSI crosses back through the 70 or 30 line after being beyond it.',
    ],
    whenToUse: 'Most reliable in range-bound markets; in strong trends, RSI can stay "overbought" or "oversold" for a long time.',
    riskNote: "Don't fight a strong trend just because RSI is extreme — confirm with price action before entering.",
  },
];

export function getStrategy(id: string) {
  return STRATEGIES.find(s => s.id === id);
}
