import { Candle, StrategySignal } from './strategyEngine';
import { generateCandles, advanceCandles } from './simulatedCandles';

export interface BacktestStats {
  winRate: number;
  profitFactor: number;
  sampleSize: number;
}

const HORIZON_STEPS = 8;
const WIN_THRESHOLD_PCT = 0.15;
const RUNS = 10;
const STEPS_PER_RUN = 180;

/**
 * Runs a detector against many independent simulated price paths (the same random-walk
 * engine that powers the Master Trader Scanner) and empirically measures how often a
 * detected signal was followed, several candles later, by a real move in its favor.
 *
 * This is a SIMULATED backtest, not real market history -- Polygon's historical-bars
 * endpoint isn't available on the current plan (see market-history function). It's framed
 * to the user as such. What it's genuinely useful for: comparing detectors' relative
 * behavior against each other on a consistent, reproducible-shape random walk, not as a
 * claim about real-world edge.
 */
export function computeDetectorStats(detect: (candles: Candle[]) => StrategySignal | null): BacktestStats {
  let wins = 0;
  let losses = 0;
  let grossProfitPct = 0;
  let grossLossPct = 0;

  for (let run = 0; run < RUNS; run++) {
    const basePrice = 40 + Math.random() * 200;
    let candles = generateCandles(60, basePrice);

    for (let step = 0; step < STEPS_PER_RUN; step++) {
      candles = advanceCandles(candles, 260);
      const signal = detect(candles);
      if (!signal) continue;

      const entryPrice = signal.price;
      let future = candles;
      for (let h = 0; h < HORIZON_STEPS; h++) future = advanceCandles(future, 260);
      const exitPrice = future[future.length - 1].close;
      const movePct = ((exitPrice - entryPrice) / entryPrice) * 100 * (signal.direction === 'bullish' ? 1 : -1);

      if (movePct > WIN_THRESHOLD_PCT) {
        wins++;
        grossProfitPct += movePct;
      } else if (movePct < -WIN_THRESHOLD_PCT) {
        losses++;
        grossLossPct += Math.abs(movePct);
      }
      candles = future;
    }
  }

  const decisive = wins + losses;
  const winRate = decisive > 0 ? (wins / decisive) * 100 : 0;
  const profitFactor = grossLossPct > 0 ? grossProfitPct / grossLossPct : grossProfitPct > 0 ? 9.9 : 0;
  return { winRate, profitFactor, sampleSize: decisive };
}
