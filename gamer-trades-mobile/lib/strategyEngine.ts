export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StrategySignal {
  strategyId: string;
  direction: 'bullish' | 'bearish';
  label: string;
  detail: string;
  price: number;
  index: number;
  /** The key price level this signal revolves around (resistance/support/fib/ORB level), for chart overlays. */
  level?: number;
  /** Secondary level, used by support/resistance ranges and ORB boxes. */
  level2?: number;
}

function avg(nums: number[]) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

export function detectBreakout(candles: Candle[], lookback = 20): StrategySignal | null {
  if (candles.length < lookback + 2) return null;
  const window = candles.slice(-lookback - 1, -1);
  const last = candles[candles.length - 1];
  const resistance = Math.max(...window.map(c => c.high));
  const support = Math.min(...window.map(c => c.low));
  const avgVol = avg(window.map(c => c.volume));

  if (last.close > resistance) {
    return {
      strategyId: 'breakout',
      direction: 'bullish',
      label: 'BREAKOUT',
      detail: `Closed above resistance at $${resistance.toFixed(2)}${last.volume > avgVol * 1.1 ? ' on strong volume' : ''}.`,
      price: last.close,
      index: candles.length - 1,
      level: resistance,
    };
  }
  if (last.close < support) {
    return {
      strategyId: 'breakout',
      direction: 'bearish',
      label: 'BREAKDOWN',
      detail: `Closed below support at $${support.toFixed(2)}${last.volume > avgVol * 1.1 ? ' on strong volume' : ''}.`,
      price: last.close,
      index: candles.length - 1,
      level: support,
    };
  }
  return null;
}

export function detectORB(candles: Candle[], orbSize = 5): StrategySignal | null {
  if (candles.length < orbSize + 2) return null;
  const openingRange = candles.slice(0, orbSize);
  const orHigh = Math.max(...openingRange.map(c => c.high));
  const orLow = Math.min(...openingRange.map(c => c.low));
  const last = candles[candles.length - 1];

  if (last.close > orHigh) {
    return {
      strategyId: 'orb',
      direction: 'bullish',
      label: 'ORB BREAKOUT',
      detail: `Broke above the opening range high of $${orHigh.toFixed(2)}.`,
      price: last.close,
      index: candles.length - 1,
      level: orHigh,
      level2: orLow,
    };
  }
  if (last.close < orLow) {
    return {
      strategyId: 'orb',
      direction: 'bearish',
      label: 'ORB BREAKDOWN',
      detail: `Broke below the opening range low of $${orLow.toFixed(2)}.`,
      price: last.close,
      index: candles.length - 1,
      level: orHigh,
      level2: orLow,
    };
  }
  return null;
}

const FIB_LEVELS = [0.236, 0.382, 0.5, 0.618, 0.786];

export function detectFibonacci(candles: Candle[], lookback = 30, tolerancePct = 0.004): StrategySignal | null {
  if (candles.length < lookback) return null;
  const window = candles.slice(-lookback);
  let highIdx = 0, lowIdx = 0;
  window.forEach((c, i) => {
    if (c.high > window[highIdx].high) highIdx = i;
    if (c.low < window[lowIdx].low) lowIdx = i;
  });
  const swingHigh = window[highIdx].high;
  const swingLow = window[lowIdx].low;
  const range = swingHigh - swingLow;
  if (range <= 0) return null;
  const uptrend = lowIdx < highIdx;
  const last = candles[candles.length - 1];

  for (const level of FIB_LEVELS) {
    const price = uptrend ? swingHigh - range * level : swingLow + range * level;
    if (Math.abs(last.close - price) / price <= tolerancePct) {
      return {
        strategyId: 'fibonacci',
        direction: uptrend ? 'bullish' : 'bearish',
        label: `${(level * 100).toFixed(1)}% FIB LEVEL`,
        detail: `Price is testing the ${(level * 100).toFixed(1)}% retracement at $${price.toFixed(2)} of the ${uptrend ? 'upswing' : 'downswing'} from $${swingLow.toFixed(2)} to $${swingHigh.toFixed(2)}.`,
        price: last.close,
        index: candles.length - 1,
        level: price,
        level2: swingHigh,
      };
    }
  }
  return null;
}

export function detectSupportResistance(candles: Candle[], lookback = 40, pivotWidth = 2, tolerancePct = 0.006): StrategySignal | null {
  if (candles.length < lookback) return null;
  const window = candles.slice(-lookback);
  const pivots: number[] = [];

  for (let i = pivotWidth; i < window.length - pivotWidth; i++) {
    const slice = window.slice(i - pivotWidth, i + pivotWidth + 1);
    const c = window[i];
    if (c.high === Math.max(...slice.map(s => s.high))) pivots.push(c.high);
    if (c.low === Math.min(...slice.map(s => s.low))) pivots.push(c.low);
  }
  if (pivots.length < 2) return null;

  // cluster pivots into levels touched 2+ times
  const clusters: { price: number; count: number }[] = [];
  for (const p of pivots) {
    const cluster = clusters.find(c => Math.abs(c.price - p) / p <= tolerancePct);
    if (cluster) {
      cluster.price = (cluster.price * cluster.count + p) / (cluster.count + 1);
      cluster.count++;
    } else {
      clusters.push({ price: p, count: 1 });
    }
  }
  const strong = clusters.filter(c => c.count >= 2).sort((a, b) => b.count - a.count);
  if (strong.length === 0) return null;

  const last = candles[candles.length - 1];
  const nearby = strong.find(c => Math.abs(last.close - c.price) / c.price <= tolerancePct);
  if (!nearby) return null;

  const isResistance = nearby.price >= last.close;
  return {
    strategyId: 'support_resistance',
    direction: isResistance ? 'bearish' : 'bullish',
    label: isResistance ? 'AT RESISTANCE' : 'AT SUPPORT',
    detail: `Price is testing a level touched ${nearby.count}x near $${nearby.price.toFixed(2)}.`,
    price: last.close,
    index: candles.length - 1,
    level: nearby.price,
  };
}

export function sma(candles: Candle[], period: number): (number | null)[] {
  return candles.map((_, i) => {
    if (i < period - 1) return null;
    return avg(candles.slice(i - period + 1, i + 1).map(c => c.close));
  });
}

export function detectMACrossover(candles: Candle[], fastPeriod = 9, slowPeriod = 21): StrategySignal | null {
  if (candles.length < slowPeriod + 1) return null;
  const fast = sma(candles, fastPeriod);
  const slow = sma(candles, slowPeriod);
  const n = candles.length;
  const fPrev = fast[n - 2], fCurr = fast[n - 1];
  const sPrev = slow[n - 2], sCurr = slow[n - 1];
  if (fPrev == null || fCurr == null || sPrev == null || sCurr == null) return null;

  const last = candles[n - 1];
  if (fPrev <= sPrev && fCurr > sCurr) {
    return {
      strategyId: 'ma_crossover',
      direction: 'bullish',
      label: 'GOLDEN CROSS',
      detail: `${fastPeriod}-period MA crossed above the ${slowPeriod}-period MA.`,
      price: last.close,
      index: n - 1,
    };
  }
  if (fPrev >= sPrev && fCurr < sCurr) {
    return {
      strategyId: 'ma_crossover',
      direction: 'bearish',
      label: 'DEATH CROSS',
      detail: `${fastPeriod}-period MA crossed below the ${slowPeriod}-period MA.`,
      price: last.close,
      index: n - 1,
    };
  }
  return null;
}

export function computeRSI(candles: Candle[], period = 14): number | null {
  if (candles.length < period + 1) return null;
  const closes = candles.slice(-period - 1).map(c => c.close);
  let gains = 0, losses = 0;
  for (let i = 1; i < closes.length; i++) {
    const delta = closes[i] - closes[i - 1];
    if (delta >= 0) gains += delta; else losses -= delta;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function detectRSIReversal(candles: Candle[], period = 14, overbought = 70, oversold = 30): StrategySignal | null {
  const rsi = computeRSI(candles, period);
  if (rsi == null) return null;
  const last = candles[candles.length - 1];
  if (rsi >= overbought) {
    return {
      strategyId: 'rsi_reversal',
      direction: 'bearish',
      label: 'OVERBOUGHT',
      detail: `RSI(${period}) at ${rsi.toFixed(1)} — stretched to the upside, watch for a pullback.`,
      price: last.close,
      index: candles.length - 1,
    };
  }
  if (rsi <= oversold) {
    return {
      strategyId: 'rsi_reversal',
      direction: 'bullish',
      label: 'OVERSOLD',
      detail: `RSI(${period}) at ${rsi.toFixed(1)} — stretched to the downside, watch for a bounce.`,
      price: last.close,
      index: candles.length - 1,
    };
  }
  return null;
}

export function ema(candles: Candle[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const out: (number | null)[] = [];
  let prev: number | null = null;
  candles.forEach((c, i) => {
    if (i < period - 1) { out.push(null); return; }
    if (prev == null) {
      prev = avg(candles.slice(i - period + 1, i + 1).map(x => x.close));
    } else {
      prev = c.close * k + prev * (1 - k);
    }
    out.push(prev);
  });
  return out;
}

/** Session-anchored VWAP (volume-weighted average price) over the full candle window given —
 * the standard intraday "fair value" line institutions trade around. */
export function computeVWAP(candles: Candle[]): (number | null)[] {
  let cumPV = 0, cumVol = 0;
  return candles.map(c => {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    cumPV += typicalPrice * c.volume;
    cumVol += c.volume;
    return cumVol > 0 ? cumPV / cumVol : null;
  });
}

export function detectVWAPBounce(candles: Candle[], minBars = 15): StrategySignal | null {
  if (candles.length < minBars) return null;
  const vwap = computeVWAP(candles);
  const n = candles.length;
  const vPrev = vwap[n - 2], vCurr = vwap[n - 1];
  if (vPrev == null || vCurr == null) return null;
  const prev = candles[n - 2];
  const last = candles[n - 1];

  if (prev.close <= vPrev && last.close > vCurr) {
    return {
      strategyId: 'vwap',
      direction: 'bullish',
      label: 'VWAP RECLAIM',
      detail: `Price closed back above VWAP ($${vCurr.toFixed(2)}) after trading below it — institutional buyers stepping back in at "fair value".`,
      price: last.close,
      index: n - 1,
      level: vCurr,
    };
  }
  if (prev.close >= vPrev && last.close < vCurr) {
    return {
      strategyId: 'vwap',
      direction: 'bearish',
      label: 'VWAP REJECTION',
      detail: `Price closed back below VWAP ($${vCurr.toFixed(2)}) after trading above it — sellers defending "fair value" from above.`,
      price: last.close,
      index: n - 1,
      level: vCurr,
    };
  }
  return null;
}

interface BollingerBands { middle: number; upper: number; lower: number; bandwidthPct: number }

export function computeBollingerBands(candles: Candle[], period = 20, stdevMult = 2): BollingerBands | null {
  if (candles.length < period) return null;
  const window = candles.slice(-period).map(c => c.close);
  const mean = avg(window);
  const variance = avg(window.map(c => (c - mean) ** 2));
  const stdev = Math.sqrt(variance);
  const upper = mean + stdev * stdevMult;
  const lower = mean - stdev * stdevMult;
  return { middle: mean, upper, lower, bandwidthPct: mean > 0 ? ((upper - lower) / mean) * 100 : 0 };
}

export function detectBollingerSqueeze(candles: Candle[], period = 20, lookback = 30, squeezePercentile = 0.3): StrategySignal | null {
  if (candles.length < period + lookback) return null;
  const bandwidths: number[] = [];
  for (let i = candles.length - lookback; i < candles.length; i++) {
    const bb = computeBollingerBands(candles.slice(0, i + 1), period);
    if (bb) bandwidths.push(bb.bandwidthPct);
  }
  if (bandwidths.length < lookback * 0.8) return null;
  const sorted = [...bandwidths].sort((a, b) => a - b);
  const threshold = sorted[Math.floor(sorted.length * squeezePercentile)];
  const wasSqueezed = bandwidths.slice(-6, -1).some(bw => bw <= threshold);
  if (!wasSqueezed) return null;

  const bb = computeBollingerBands(candles, period);
  if (!bb) return null;
  const last = candles[candles.length - 1];

  if (last.close > bb.upper) {
    return {
      strategyId: 'bollinger_squeeze',
      direction: 'bullish',
      label: 'SQUEEZE BREAKOUT',
      detail: `Bands had tightened to a low-volatility squeeze, then price broke above the upper band ($${bb.upper.toFixed(2)}) — a volatility expansion to the upside.`,
      price: last.close,
      index: candles.length - 1,
      level: bb.upper,
      level2: bb.lower,
    };
  }
  if (last.close < bb.lower) {
    return {
      strategyId: 'bollinger_squeeze',
      direction: 'bearish',
      label: 'SQUEEZE BREAKDOWN',
      detail: `Bands had tightened to a low-volatility squeeze, then price broke below the lower band ($${bb.lower.toFixed(2)}) — a volatility expansion to the downside.`,
      price: last.close,
      index: candles.length - 1,
      level: bb.upper,
      level2: bb.lower,
    };
  }
  return null;
}

export function detectMACDCrossover(candles: Candle[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): StrategySignal | null {
  if (candles.length < slowPeriod + signalPeriod) return null;
  const fastEma = ema(candles, fastPeriod);
  const slowEma = ema(candles, slowPeriod);
  const macdLine: (number | null)[] = candles.map((_, i) => {
    const f = fastEma[i], s = slowEma[i];
    return f != null && s != null ? f - s : null;
  });
  const validStart = macdLine.findIndex(v => v != null);
  if (validStart === -1) return null;
  const macdCandles: Candle[] = macdLine.slice(validStart).map((v, i) => ({ time: i, open: v!, high: v!, low: v!, close: v!, volume: 0 }));
  if (macdCandles.length < signalPeriod) return null;
  const signalEma = ema(macdCandles, signalPeriod);

  const n = macdCandles.length;
  const mPrev = macdCandles[n - 2]?.close, mCurr = macdCandles[n - 1]?.close;
  const sPrev = signalEma[n - 2], sCurr = signalEma[n - 1];
  if (mPrev == null || mCurr == null || sPrev == null || sCurr == null) return null;

  const last = candles[candles.length - 1];
  if (mPrev <= sPrev && mCurr > sCurr) {
    return {
      strategyId: 'macd',
      direction: 'bullish',
      label: 'MACD BULLISH CROSS',
      detail: `MACD line crossed above its signal line${mCurr < 0 ? ' below zero — early-stage momentum shift' : ' — momentum turning up'}.`,
      price: last.close,
      index: candles.length - 1,
    };
  }
  if (mPrev >= sPrev && mCurr < sCurr) {
    return {
      strategyId: 'macd',
      direction: 'bearish',
      label: 'MACD BEARISH CROSS',
      detail: `MACD line crossed below its signal line${mCurr > 0 ? ' above zero — early-stage momentum shift' : ' — momentum turning down'}.`,
      price: last.close,
      index: candles.length - 1,
    };
  }
  return null;
}

export interface TradePlan {
  entry: number;
  stopLoss: number;
  takeProfit: number;
  /** |takeProfit - entry| / |entry - stopLoss| — how many dollars of reward per dollar risked. */
  riskRewardRatio: number;
}

/**
 * Turns a detected StrategySignal into a concrete entry/stop/target trade plan, using
 * plain technical-analysis math (no AI) so the numbers are deterministic and reproducible
 * for the same setup. A small buffer (0.15% of price) is added past trigger levels rather
 * than sitting exactly on them, matching how a real trader would enter/stop out.
 *
 * Stop placement is strategy-agnostic: it prefers the signal's level2 (e.g. the opposite
 * side of an ORB range, or a fib swing anchor) but only when that level actually sits on
 * the correct side of entry for the signal's direction — otherwise it falls back to the
 * most recent swing extreme from the candles themselves, which is always well-formed.
 */
export function computeTradePlan(signal: StrategySignal, candles: Candle[]): TradePlan {
  const bullish = signal.direction === 'bullish';
  const price = signal.price;
  const buffer = price * 0.0015;
  const entry = (signal.level ?? price) + (bullish ? buffer : -buffer);

  const recent = candles.slice(-10);
  const swingStop = bullish
    ? Math.min(...recent.map(c => c.low))
    : Math.max(...recent.map(c => c.high));

  const level2Valid = signal.level2 != null && (bullish ? signal.level2 < entry : signal.level2 > entry);
  const stopAnchor = level2Valid ? signal.level2! : swingStop;
  const stopLoss = stopAnchor + (bullish ? -buffer : buffer);

  const riskDist = Math.max(0.01, Math.abs(entry - stopLoss));

  let takeProfit: number;
  if ((signal.strategyId === 'breakout' || signal.strategyId === 'orb' || signal.strategyId === 'bollinger_squeeze') && signal.level != null && signal.level2 != null) {
    const rangeHeight = Math.abs(signal.level - signal.level2);
    const multiple = signal.strategyId === 'orb' ? 2 : 1;
    takeProfit = entry + (bullish ? 1 : -1) * rangeHeight * multiple;
  } else if (signal.strategyId === 'fibonacci') {
    // Target the swing's opposite origin — the classic full-retracement/continuation target.
    const window = candles.slice(-30);
    takeProfit = bullish ? Math.max(...window.map(c => c.high)) : Math.min(...window.map(c => c.low));
  } else if (signal.strategyId === 'support_resistance') {
    const window = candles.slice(-40);
    const opposing = bullish ? Math.max(...window.map(c => c.high)) : Math.min(...window.map(c => c.low));
    const opposingValid = bullish ? opposing > entry : opposing < entry;
    takeProfit = opposingValid ? opposing : entry + (bullish ? 1 : -1) * riskDist * 2;
  } else {
    // ma_crossover / rsi_reversal have no natural price target — use a 2:1 reward:risk projection.
    takeProfit = entry + (bullish ? 1 : -1) * riskDist * 2;
  }

  const riskRewardRatio = Math.abs(takeProfit - entry) / riskDist;
  return { entry, stopLoss, takeProfit, riskRewardRatio };
}

export type DetectorId =
  | 'breakout'
  | 'orb'
  | 'fibonacci'
  | 'support_resistance'
  | 'ma_crossover'
  | 'rsi_reversal'
  | 'vwap'
  | 'bollinger_squeeze'
  | 'macd';

const DETECTORS: Record<DetectorId, (candles: Candle[]) => StrategySignal | null> = {
  breakout: detectBreakout,
  orb: detectORB,
  fibonacci: detectFibonacci,
  support_resistance: detectSupportResistance,
  ma_crossover: detectMACrossover,
  rsi_reversal: detectRSIReversal,
  vwap: detectVWAPBounce,
  bollinger_squeeze: detectBollingerSqueeze,
  macd: detectMACDCrossover,
};

export function scanStrategies(candles: Candle[], enabled: DetectorId[] = Object.keys(DETECTORS) as DetectorId[]): StrategySignal[] {
  return enabled
    .map(id => DETECTORS[id](candles))
    .filter((s): s is StrategySignal => s !== null);
}

export function getDetector(id: DetectorId): (candles: Candle[]) => StrategySignal | null {
  return DETECTORS[id];
}
