import { supabase } from './supabase';
import { getSymbolInfo, SymbolInfo } from './symbols';

export interface LiveQuote {
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
  timestamp: number;
}

type QuoteMap = Record<string, LiveQuote | null>;

const cache = new Map<string, LiveQuote>();
let inflight: Promise<void> | null = null;

/**
 * Fetches live quotes for the given symbols from the market-quotes Edge Function
 * (backed by Polygon.io). FUTURES and OPTIONS aren't directly quotable in the
 * simplified pass — the function returns null for those and callers should keep
 * simulating from the last known price.
 */
export async function fetchLiveQuotes(symbols: string[]): Promise<QuoteMap> {
  const requests = symbols
    .map(getSymbolInfo)
    .filter((s): s is SymbolInfo => !!s)
    .map(s => ({ symbol: s.symbol, class: s.class }));

  if (requests.length === 0) return {};

  const { data, error } = await supabase.functions.invoke<{ quotes: QuoteMap }>('market-quotes', {
    body: { symbols: requests },
  });

  if (error || !data) {
    console.error('fetchLiveQuotes failed', error);
    return {};
  }

  for (const [symbol, quote] of Object.entries(data.quotes)) {
    if (quote) cache.set(symbol, quote);
  }

  return data.quotes;
}

/** Last live quote seen for a symbol, if any (does not trigger a fetch). */
export function getCachedQuote(symbol: string): LiveQuote | undefined {
  return cache.get(symbol);
}

/**
 * Keeps a rolling background poll of live quotes for a set of symbols. Returns
 * an unsubscribe function. Safe to call with an empty/changing symbol list.
 */
export function pollLiveQuotes(symbols: string[], intervalMs: number, onUpdate: (quotes: QuoteMap) => void): () => void {
  if (symbols.length === 0) return () => {};

  let cancelled = false;
  const tick = async () => {
    if (cancelled) return;
    if (inflight) return; // avoid overlapping requests if a previous poll is slow
    inflight = fetchLiveQuotes(symbols)
      .then(quotes => {
        if (!cancelled) onUpdate(quotes);
      })
      .finally(() => {
        inflight = null;
      });
    await inflight;
  };

  tick();
  const id = setInterval(tick, intervalMs);
  return () => {
    cancelled = true;
    clearInterval(id);
  };
}
