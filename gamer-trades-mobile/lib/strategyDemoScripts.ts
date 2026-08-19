import { DetectorId } from './strategyEngine';

export interface DemoSignal {
  direction: 'bullish' | 'bearish';
  label: string;
  level?: number;
  level2?: number;
}

export interface DemoStep {
  price: number;
  caption: string;
  signal?: DemoSignal | null;
}

export interface DemoScript {
  basePrice: number;
  steps: DemoStep[];
}

export const DEMO_SCRIPTS: Record<DetectorId, DemoScript> = {
  breakout: {
    basePrice: 100,
    steps: [
      { price: 100, caption: 'Price is coiling in a range — resistance up at $105, support down at $95.' },
      { price: 96, caption: 'Tests support at $95 and bounces. The range holds.' },
      { price: 103, caption: 'Rallies back up toward resistance at $105... rejected again.' },
      { price: 97, caption: 'Chops back down. Buyers and sellers are stuck in a standoff.' },
      { price: 104, caption: 'Pressing against resistance one more time, building energy...' },
      { price: 112, signal: { direction: 'bullish', label: 'BREAKOUT', level: 105 }, caption: '💥 Closes above $105 on strong volume — a real breakout, not just a wick.' },
      { price: 114, signal: { direction: 'bullish', label: 'BREAKOUT', level: 105 }, caption: 'Old resistance at $105 now acts as new support. Trend continues.' },
      { price: 117, signal: { direction: 'bullish', label: 'BREAKOUT', level: 105 }, caption: 'Follow-through confirms it — this is what a clean breakout looks like.' },
    ],
  },
  orb: {
    basePrice: 100,
    steps: [
      { price: 101, caption: 'Market opens. The first few candles set the Opening Range.' },
      { price: 99, caption: 'Range is forming: high near $102, low near $99.' },
      { price: 102, caption: 'Opening Range locked in: $99 – $102. Now we wait for a break.' },
      { price: 100, caption: 'Price chops inside the range — no edge yet.' },
      { price: 106, signal: { direction: 'bullish', label: 'ORB BREAKOUT', level: 102, level2: 99 }, caption: '🔔 Breaks above the Opening Range high of $102 — bullish momentum kicks in.' },
      { price: 109, signal: { direction: 'bullish', label: 'ORB BREAKOUT', level: 102, level2: 99 }, caption: 'The size of the opening range often predicts the size of the move.' },
      { price: 111, signal: { direction: 'bullish', label: 'ORB BREAKOUT', level: 102, level2: 99 }, caption: 'Momentum carries through the rest of the session.' },
    ],
  },
  fibonacci: {
    basePrice: 90,
    steps: [
      { price: 90, caption: 'Marking a swing low at $90 to start.' },
      { price: 105, caption: 'Price rallies hard...' },
      { price: 118, caption: '...and keeps climbing...' },
      { price: 130, caption: 'Swing high hits $130. That $90 → $130 move is our Fibonacci swing.' },
      { price: 121, caption: 'Pulling back now. Watching for a bounce at a key retracement level.' },
      { price: 105, signal: { direction: 'bullish', label: '61.8% FIB LEVEL', level: 105, level2: 130 }, caption: '🌀 Testing the 61.8% retracement near $105 — the level most traders watch.' },
      { price: 112, signal: { direction: 'bullish', label: '61.8% FIB LEVEL', level: 105, level2: 130 }, caption: 'Bounces right at the level and resumes the original uptrend.' },
      { price: 122, signal: { direction: 'bullish', label: '61.8% FIB LEVEL', level: 105, level2: 130 }, caption: 'Trend continuation confirmed — the retracement held.' },
    ],
  },
  support_resistance: {
    basePrice: 100,
    steps: [
      { price: 100, caption: 'Watching $95 as a support level — has it been tested before?' },
      { price: 95, signal: { direction: 'bullish', label: 'AT SUPPORT', level: 95 }, caption: '1st touch — price bounces off $95.' },
      { price: 103, caption: 'Rallies away, then rolls back over...' },
      { price: 95, signal: { direction: 'bullish', label: 'AT SUPPORT', level: 95 }, caption: '2nd touch — $95 holds again. This level is getting respected.' },
      { price: 104, caption: 'Bounces again, drifts back down...' },
      { price: 96, signal: { direction: 'bullish', label: 'AT SUPPORT', level: 95 }, caption: '3rd touch — the more times a level is tested, the more significant it becomes.' },
      { price: 102, signal: { direction: 'bullish', label: 'AT SUPPORT', level: 95 }, caption: 'Buyers step in right on cue, exactly like the prior two bounces.' },
    ],
  },
  ma_crossover: {
    basePrice: 110,
    steps: [
      { price: 110, caption: 'Downtrend in progress — the fast MA(9) is running below the slow MA(21).' },
      { price: 98, caption: 'Price keeps sliding. Death cross already confirmed the bearish trend.' },
      { price: 86, caption: 'Momentum starting to fade near the lows...' },
      { price: 85, caption: 'Basing out — the fast MA is starting to flatten.' },
      { price: 94, caption: 'First push higher. The fast MA is closing the gap on the slow MA.' },
      { price: 103, signal: { direction: 'bullish', label: 'GOLDEN CROSS' }, caption: '✂️ Fast MA(9) crosses above slow MA(21) — a golden cross, emerging bullish momentum.' },
      { price: 111, signal: { direction: 'bullish', label: 'GOLDEN CROSS' }, caption: 'The wider the gap after the cross, the stronger the trend confirmation.' },
    ],
  },
  rsi_reversal: {
    basePrice: 110,
    steps: [
      { price: 110, caption: 'Calm market. RSI(14) is sitting in neutral territory.' },
      { price: 98, caption: 'Sharp sell-off begins...' },
      { price: 87, caption: 'Selling accelerates — RSI is dropping fast.' },
      { price: 80, signal: { direction: 'bullish', label: 'OVERSOLD' }, caption: '⚡ RSI(14) drops below 30 — stretched to the downside, due for a bounce.' },
      { price: 84, signal: { direction: 'bullish', label: 'OVERSOLD' }, caption: 'RSI starts curling back up through the 30 line — the signal many traders wait for.' },
      { price: 92, signal: { direction: 'bullish', label: 'OVERSOLD' }, caption: 'Bounce confirmed. This is the reversal RSI flagged.' },
    ],
  },
};
