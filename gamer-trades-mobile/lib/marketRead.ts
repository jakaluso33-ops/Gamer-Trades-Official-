import { Candle, sma, computeRSI } from './strategyEngine';

export interface MarketSnapshot {
  price: number;
  changePct20: number;
  trend: 'uptrend' | 'downtrend' | 'sideways';
  rsi: number | null;
  volatilityPct: number;
  volumeTrend: 'rising' | 'falling' | 'flat';
  recentCloses: number[];
}

/** Condenses raw candles into a compact technical snapshot — cheap to compute client-side, cheap to send to an AI agent. */
export function summarizeMarket(candles: Candle[]): MarketSnapshot | null {
  if (candles.length < 21) return null;

  const closes = candles.map(c => c.close);
  const price = closes[closes.length - 1];

  const sma9 = sma(candles, 9);
  const sma21 = sma(candles, 21);
  const fast = sma9[sma9.length - 1];
  const slow = sma21[sma21.length - 1];
  const prevFast = sma9[sma9.length - 6] ?? fast;
  let trend: MarketSnapshot['trend'] = 'sideways';
  if (fast != null && slow != null) {
    const gapPct = ((fast - slow) / slow) * 100;
    const slopePct = prevFast != null && prevFast !== 0 ? ((fast - prevFast) / prevFast) * 100 : 0;
    if (gapPct > 0.15 && slopePct > 0) trend = 'uptrend';
    else if (gapPct < -0.15 && slopePct < 0) trend = 'downtrend';
  }

  const rsi = computeRSI(candles, 14);

  const lookback = Math.min(20, closes.length - 1);
  const past = closes[closes.length - 1 - lookback];
  const changePct20 = past ? ((price - past) / past) * 100 : 0;

  const returns: number[] = [];
  for (let i = closes.length - lookback; i < closes.length; i++) {
    if (i <= 0) continue;
    returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  const meanReturn = returns.reduce((s, r) => s + r, 0) / (returns.length || 1);
  const variance = returns.reduce((s, r) => s + (r - meanReturn) ** 2, 0) / (returns.length || 1);
  const volatilityPct = Math.sqrt(variance) * 100;

  const volumes = candles.map(c => c.volume);
  const recentVol = avg(volumes.slice(-5));
  const priorVol = avg(volumes.slice(-15, -5));
  let volumeTrend: MarketSnapshot['volumeTrend'] = 'flat';
  if (priorVol > 0) {
    const volChangePct = ((recentVol - priorVol) / priorVol) * 100;
    if (volChangePct > 15) volumeTrend = 'rising';
    else if (volChangePct < -15) volumeTrend = 'falling';
  }

  return {
    price,
    changePct20,
    trend,
    rsi,
    volatilityPct,
    volumeTrend,
    recentCloses: closes.slice(-10),
  };
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}
