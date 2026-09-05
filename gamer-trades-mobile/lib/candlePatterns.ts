import { Candle, StrategySignal } from './strategyEngine';

export type CandlePatternId =
  | 'hammer'
  | 'inverted_hammer'
  | 'hanging_man'
  | 'shooting_star'
  | 'doji'
  | 'bullish_engulfing'
  | 'bearish_engulfing'
  | 'marubozu';

function bodySize(c: Candle): number {
  return Math.abs(c.close - c.open);
}
function range(c: Candle): number {
  return Math.max(c.high - c.low, 0.0001);
}
function upperWick(c: Candle): number {
  return c.high - Math.max(c.open, c.close);
}
function lowerWick(c: Candle): number {
  return Math.min(c.open, c.close) - c.low;
}

/** Simple prior-trend read: compares the close a few candles back to the close right
 * before the pattern candle. Good enough to give single-candle patterns the directional
 * context they actually depend on (a hammer only means anything after a decline). */
function priorTrend(candles: Candle[], beforeIndex: number, lookback = 6): 'up' | 'down' | 'flat' {
  const start = beforeIndex - lookback;
  if (start < 0) return 'flat';
  const from = candles[start].close;
  const to = candles[beforeIndex - 1]?.close ?? from;
  const changePct = ((to - from) / from) * 100;
  if (changePct > 0.3) return 'up';
  if (changePct < -0.3) return 'down';
  return 'flat';
}

/** Scans only the most recent 1-2 candles -- single-candle and two-candle reversal/continuation
 * patterns are inherently about "right now", not a rolling lookback window like the strategy
 * detectors. Returns at most one pattern per call, preferring the most recently formed. */
export function detectCandlePattern(candles: Candle[]): StrategySignal | null {
  if (candles.length < 8) return null;
  const i = candles.length - 1;
  const c = candles[i];
  const prev = candles[i - 1];
  const r = range(c);
  const body = bodySize(c);
  const uw = upperWick(c);
  const lw = lowerWick(c);
  const trend = priorTrend(candles, i);

  // Two-candle patterns first -- they're the stronger signal when both fire.
  const prevBearish = prev.close < prev.open;
  const prevBullish = prev.close > prev.open;
  const currBullish = c.close > c.open;
  const currBearish = c.close < c.open;

  if (prevBearish && currBullish && c.open <= prev.close && c.close >= prev.open) {
    return {
      strategyId: 'bullish_engulfing',
      direction: 'bullish',
      label: 'BULLISH ENGULFING',
      detail: `A full green candle swallowed the prior red candle's entire body at $${c.close.toFixed(2)}.`,
      price: c.close,
      index: i,
    };
  }
  if (prevBullish && currBearish && c.open >= prev.close && c.close <= prev.open) {
    return {
      strategyId: 'bearish_engulfing',
      direction: 'bearish',
      label: 'BEARISH ENGULFING',
      detail: `A full red candle swallowed the prior green candle's entire body at $${c.close.toFixed(2)}.`,
      price: c.close,
      index: i,
    };
  }

  // Marubozu -- body dominates the whole range, almost no wicks either side.
  if (body >= r * 0.92) {
    return {
      strategyId: 'marubozu',
      direction: currBullish ? 'bullish' : 'bearish',
      label: currBullish ? 'BULLISH MARUBOZU' : 'BEARISH MARUBOZU',
      detail: `A near-full-body candle with almost no wicks — one side was in complete control.`,
      price: c.close,
      index: i,
    };
  }

  // Doji -- body is a sliver of the range, indecision.
  if (body <= r * 0.1) {
    return {
      strategyId: 'doji',
      direction: 'bullish',
      label: 'DOJI',
      detail: `Open and close landed almost exactly together — buyers and sellers fought to a draw.`,
      price: c.close,
      index: i,
    };
  }

  const smallBody = body <= r * 0.35;
  const longLowerWick = lw >= body * 2 && uw <= r * 0.15;
  const longUpperWick = uw >= body * 2 && lw <= r * 0.15;

  if (smallBody && longLowerWick && trend === 'down') {
    return {
      strategyId: 'hammer',
      direction: 'bullish',
      label: 'HAMMER',
      detail: `Small body near the top with a long lower wick, after a decline — buyers stepped in hard off the low.`,
      price: c.close,
      index: i,
    };
  }
  if (smallBody && longLowerWick && trend === 'up') {
    return {
      strategyId: 'hanging_man',
      direction: 'bearish',
      label: 'HANGING MAN',
      detail: `Same shape as a hammer, but after an advance — a warning that sellers are starting to test the highs.`,
      price: c.close,
      index: i,
    };
  }
  if (smallBody && longUpperWick && trend === 'down') {
    return {
      strategyId: 'inverted_hammer',
      direction: 'bullish',
      label: 'INVERTED HAMMER',
      detail: `Small body near the bottom with a long upper wick, after a decline — buyers tried to push price up.`,
      price: c.close,
      index: i,
    };
  }
  if (smallBody && longUpperWick && trend === 'up') {
    return {
      strategyId: 'shooting_star',
      direction: 'bearish',
      label: 'SHOOTING STAR',
      detail: `Same shape as an inverted hammer, but after an advance — buyers pushed up, sellers slammed it back down.`,
      price: c.close,
      index: i,
    };
  }

  return null;
}

export function scanCandlePatterns(candles: Candle[]): StrategySignal[] {
  const s = detectCandlePattern(candles);
  return s ? [s] : [];
}
