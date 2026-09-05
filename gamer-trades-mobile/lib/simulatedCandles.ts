import { Candle } from './strategyEngine';

/** Seeds a fresh simulated candle history for a symbol, starting from its base price. */
export function generateCandles(count: number, basePrice: number): Candle[] {
  const candles: Candle[] = [];
  let price = basePrice;
  const now = Date.now();
  for (let i = count; i >= 0; i--) {
    const open = price;
    const change = (Math.random() - 0.48) * price * 0.012;
    const close = Math.max(1, open + change);
    const high = Math.max(open, close) + Math.random() * price * 0.005;
    const low = Math.min(open, close) - Math.random() * price * 0.005;
    candles.push({
      time: now - i * 60000,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(Math.random() * 500000 + 50000),
    });
    price = close;
  }
  return candles;
}

/** Appends one new simulated bar onto an existing candle series, trimming to keep it bounded. */
export function advanceCandles(candles: Candle[], maxLength = 120): Candle[] {
  const last = candles[candles.length - 1];
  const change = (Math.random() - 0.48) * last.close * 0.012;
  const close = Math.max(1, last.close + change);
  const next: Candle = {
    time: Date.now(),
    open: last.close,
    high: Math.max(last.close, close) + Math.random() * last.close * 0.005,
    low: Math.min(last.close, close) - Math.random() * last.close * 0.005,
    close: parseFloat(close.toFixed(2)),
    volume: Math.floor(Math.random() * 500000 + 50000),
  };
  return [...candles, next].slice(-maxLength);
}
