import { useEffect, useRef, useState } from 'react';
import { Candle, StrategySignal, scanStrategies } from './strategyEngine';
import { detectCandlePattern } from './candlePatterns';
import { generateCandles, advanceCandles } from './simulatedCandles';
import { SymbolInfo, AssetClass } from './symbols';

export interface ScannedSignal {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  signal: StrategySignal;
  /** 'candle' rows are Pro-gated in the feed UI; 'strategy' rows are free. */
  kind: 'strategy' | 'candle';
}

/**
 * Runs the same strategy detectors used on a single chart, plus candlestick pattern
 * detection, across every symbol in the given list simultaneously, ticking each symbol's
 * simulated candle series forward on an interval. Powers the cross-market "master trader"
 * scanner feed — a live view of every setup (and every candle pattern) forming across all
 * 6 asset classes at once, not just the one instrument a user happens to have open.
 */
export function useMarketScanner(symbols: SymbolInfo[], tickMs = 4000): ScannedSignal[] {
  const candlesRef = useRef<Map<string, Candle[]>>(new Map());
  const [results, setResults] = useState<ScannedSignal[]>([]);

  useEffect(() => {
    const tick = () => {
      const out: ScannedSignal[] = [];
      for (const s of symbols) {
        let candles = candlesRef.current.get(s.symbol);
        candles = candles ? advanceCandles(candles) : generateCandles(60, s.basePrice);
        candlesRef.current.set(s.symbol, candles);

        const signals = scanStrategies(candles);
        if (signals[0]) out.push({ symbol: s.symbol, name: s.name, assetClass: s.class, signal: signals[0], kind: 'strategy' });

        const candleSignal = detectCandlePattern(candles);
        if (candleSignal) out.push({ symbol: s.symbol, name: s.name, assetClass: s.class, signal: candleSignal, kind: 'candle' });
      }
      setResults(out);
    };
    tick();
    const id = setInterval(tick, tickMs);
    return () => clearInterval(id);
  }, [symbols, tickMs]);

  return results;
}
