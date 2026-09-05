import { describe, it, expect } from 'vitest';
import {
  Candle,
  detectBreakout,
  detectORB,
  detectFibonacci,
  detectSupportResistance,
  detectMACrossover,
  computeRSI,
  detectRSIReversal,
  sma,
  scanStrategies,
} from './strategyEngine';

function candle(overrides: Partial<Candle> & { close: number }, i = 0): Candle {
  const { close } = overrides;
  return {
    time: i * 60000,
    open: overrides.open ?? close,
    high: overrides.high ?? close,
    low: overrides.low ?? close,
    close,
    volume: overrides.volume ?? 100000,
  };
}

/** Perfectly flat candles (high === low === close) — zero range, zero momentum. */
function flatSeries(count: number, price: number): Candle[] {
  return Array.from({ length: count }, (_, i) => candle({ close: price }, i));
}

describe('detectBreakout', () => {
  it('returns null with insufficient history', () => {
    expect(detectBreakout(flatSeries(5, 100))).toBeNull();
  });

  it('detects a bullish breakout above resistance', () => {
    const candles = flatSeries(21, 100);
    candles.push(candle({ close: 110, high: 110, low: 109, volume: 200000 }, 21));
    const signal = detectBreakout(candles);
    expect(signal).not.toBeNull();
    expect(signal?.direction).toBe('bullish');
    expect(signal?.label).toBe('BREAKOUT');
  });

  it('detects a bearish breakdown below support', () => {
    const candles = flatSeries(21, 100);
    candles.push(candle({ close: 90, high: 91, low: 90 }, 21));
    const signal = detectBreakout(candles);
    expect(signal).not.toBeNull();
    expect(signal?.direction).toBe('bearish');
    expect(signal?.label).toBe('BREAKDOWN');
  });

  it('returns null when price stays within range', () => {
    const candles = flatSeries(22, 100);
    expect(detectBreakout(candles)).toBeNull();
  });
});

describe('detectORB', () => {
  it('detects breakout above the opening range', () => {
    const opening = flatSeries(5, 100);
    const rest = flatSeries(3, 100);
    rest.push(candle({ close: 108, high: 108, low: 107 }, 8));
    const signal = detectORB([...opening, ...rest]);
    expect(signal?.direction).toBe('bullish');
    expect(signal?.label).toBe('ORB BREAKOUT');
  });

  it('detects breakdown below the opening range', () => {
    const opening = flatSeries(5, 100);
    const rest = flatSeries(3, 100);
    rest.push(candle({ close: 92, high: 93, low: 92 }, 8));
    const signal = detectORB([...opening, ...rest]);
    expect(signal?.direction).toBe('bearish');
    expect(signal?.label).toBe('ORB BREAKDOWN');
  });

  it('returns null inside the opening range', () => {
    const candles = flatSeries(10, 100);
    expect(detectORB(candles)).toBeNull();
  });
});

describe('detectFibonacci', () => {
  it('returns null with a flat (zero-range) series', () => {
    expect(detectFibonacci(flatSeries(30, 100))).toBeNull();
  });

  it('detects a retracement level test during an uptrend', () => {
    // Swing low at index 0 (90), swing high at index 20 (110): range = 20.
    // 50% retracement level = 110 - 20*0.5 = 100.
    const candles: Candle[] = [];
    for (let i = 0; i <= 20; i++) {
      const close = 90 + i;
      candles.push(candle({ close, high: close, low: close }, i));
    }
    // Pull back to exactly the 50% level for the final candle.
    candles.push(candle({ close: 100, high: 100, low: 100 }, 21));
    const signal = detectFibonacci(candles, 22);
    expect(signal).not.toBeNull();
    expect(signal?.direction).toBe('bullish');
  });
});

describe('detectSupportResistance', () => {
  it('returns null on a monotonic ramp with no repeated pivots', () => {
    const candles = Array.from({ length: 45 }, (_, i) => candle({ close: 100 + i, high: 100 + i, low: 100 + i }, i));
    expect(detectSupportResistance(candles)).toBeNull();
  });

  it('identifies a level touched multiple times', () => {
    // Oscillate between a floor (95) and a ceiling (105) repeatedly — both levels
    // get touched 2+ times, and the series ends right back at the ceiling.
    const closes: number[] = [];
    for (let rep = 0; rep < 6; rep++) closes.push(100, 105, 100, 95);
    closes.push(105);
    const candles = closes.map((close, i) => candle({ close, high: close, low: close }, i));
    const signal = detectSupportResistance(candles, candles.length);
    expect(signal).not.toBeNull();
    expect(signal?.label).toBe('AT RESISTANCE');
  });
});

describe('sma', () => {
  it('returns null before the period is filled and averages after', () => {
    const candles = [1, 2, 3, 4, 5].map((close, i) => candle({ close }, i));
    const result = sma(candles, 3);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeNull();
    expect(result[2]).toBe(2); // avg(1,2,3)
    expect(result[4]).toBe(4); // avg(3,4,5)
  });
});

describe('detectMACrossover', () => {
  it('detects a golden cross when fast MA crosses above slow MA', () => {
    const fastPeriod = 9;
    const slowPeriod = 21;
    // Flat run so both MAs settle at the same value, then a sustained rally.
    const closes = [...Array(30).fill(100)];
    for (let i = 1; i <= 20; i++) closes.push(100 + i * 5);

    const allCandles = closes.map((close, i) => candle({ close }, i));
    const fast = sma(allCandles, fastPeriod);
    const slow = sma(allCandles, slowPeriod);

    // Find the first index where the fast MA crosses above the slow MA.
    let crossIndex = -1;
    for (let i = 1; i < allCandles.length; i++) {
      const fPrev = fast[i - 1], fCurr = fast[i], sPrev = slow[i - 1], sCurr = slow[i];
      if (fPrev != null && fCurr != null && sPrev != null && sCurr != null && fPrev <= sPrev && fCurr > sCurr) {
        crossIndex = i;
        break;
      }
    }
    expect(crossIndex).toBeGreaterThan(0);

    const candles = allCandles.slice(0, crossIndex + 1);
    const signal = detectMACrossover(candles, fastPeriod, slowPeriod);
    expect(signal).not.toBeNull();
    expect(signal?.direction).toBe('bullish');
    expect(signal?.label).toBe('GOLDEN CROSS');
  });

  it('returns null with insufficient history', () => {
    expect(detectMACrossover(flatSeries(10, 100))).toBeNull();
  });
});

describe('computeRSI', () => {
  it('returns null with insufficient history', () => {
    expect(computeRSI(flatSeries(5, 100))).toBeNull();
  });

  it('returns 100 for an all-gains series', () => {
    const candles = Array.from({ length: 15 }, (_, i) => candle({ close: 100 + i }, i));
    expect(computeRSI(candles)).toBe(100);
  });

  it('returns 0 for an all-losses series', () => {
    const candles = Array.from({ length: 15 }, (_, i) => candle({ close: 100 - i }, i));
    expect(computeRSI(candles)).toBe(0);
  });

  it('returns a mid-range value for a balanced up/down series', () => {
    const closes = [100];
    for (let i = 0; i < 14; i++) closes.push(closes[closes.length - 1] + (i % 2 === 0 ? 1 : -1));
    const candles = closes.map((close, i) => candle({ close }, i));
    const rsi = computeRSI(candles)!;
    expect(rsi).toBeGreaterThan(30);
    expect(rsi).toBeLessThan(70);
  });
});

describe('detectRSIReversal', () => {
  it('flags overbought conditions after a strong rally', () => {
    const candles = Array.from({ length: 15 }, (_, i) => candle({ close: 100 + i * 2 }, i));
    const signal = detectRSIReversal(candles);
    expect(signal?.direction).toBe('bearish');
    expect(signal?.label).toBe('OVERBOUGHT');
  });

  it('flags oversold conditions after a strong decline', () => {
    const candles = Array.from({ length: 15 }, (_, i) => candle({ close: 100 - i * 2 }, i));
    const signal = detectRSIReversal(candles);
    expect(signal?.direction).toBe('bullish');
    expect(signal?.label).toBe('OVERSOLD');
  });

  it('returns null in neutral RSI territory', () => {
    const closes = [100];
    for (let i = 0; i < 14; i++) closes.push(closes[closes.length - 1] + (i % 2 === 0 ? 1 : -1));
    const candles = closes.map((close, i) => candle({ close }, i));
    expect(detectRSIReversal(candles)).toBeNull();
  });
});

describe('scanStrategies', () => {
  it('only runs enabled detectors', () => {
    const candles = Array.from({ length: 15 }, (_, i) => candle({ close: 100 + i * 2 }, i));
    const allSignals = scanStrategies(candles);
    const rsiOnly = scanStrategies(candles, ['rsi_reversal']);
    expect(rsiOnly.every(s => s.strategyId === 'rsi_reversal')).toBe(true);
    expect(rsiOnly.length).toBeLessThanOrEqual(allSignals.length);
  });

  it('returns an empty array when nothing triggers', () => {
    expect(scanStrategies(flatSeries(10, 100))).toEqual([]);
  });
});
