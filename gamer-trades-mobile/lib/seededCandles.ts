import { Candle } from './strategyEngine';

/** Mulberry32 -- a small, fast, deterministic PRNG. Given the same seed, every user gets the
 * exact same sequence of "random" numbers, which is what makes the weekend backtest challenge
 * a fair competition: everyone backtests the identical price history, not their own random walk. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generates a deterministic candle series from a seed -- same seed + basePrice + count always
 * produces the exact same candles, unlike the app's other simulated series which use Math.random
 * and differ every run. This is what the weekend backtest challenge is built on. */
export function generateSeededCandles(seed: number, count: number, basePrice: number): Candle[] {
  const rand = mulberry32(seed);
  const candles: Candle[] = [];
  let price = basePrice;
  const now = Date.now();
  // A gentle drift bias per run (still deterministic, from the seed) so the series isn't
  // purely mean-reverting noise -- gives it more of a "real market" shape to read.
  const drift = (rand() - 0.5) * 0.0006;

  for (let i = count; i >= 0; i--) {
    const open = price;
    const change = (rand() - 0.5) * price * 0.012 + price * drift;
    const close = Math.max(1, open + change);
    const high = Math.max(open, close) + rand() * price * 0.005;
    const low = Math.min(open, close) - rand() * price * 0.005;
    candles.push({
      time: now - i * 5 * 60_000,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(rand() * 500000 + 50000),
    });
    price = close;
  }
  return candles;
}
