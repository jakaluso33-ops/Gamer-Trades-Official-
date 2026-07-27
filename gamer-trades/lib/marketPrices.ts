export const SYMBOL_PRICES: Record<string, number> = {
  AAPL: 182.34,
  TSLA: 245.67,
  NVDA: 875.20,
  'BTC/USD': 67420,
  'ETH/USD': 3521,
  'SOL/USD': 142.55,
  'EUR/USD': 1.0842,
  SPY: 520.88,
};

export const SYMBOL_CLASS: Record<string, string> = {
  AAPL: 'STOCK',
  TSLA: 'STOCK',
  NVDA: 'STOCK',
  'BTC/USD': 'CRYPTO',
  'ETH/USD': 'CRYPTO',
  'SOL/USD': 'CRYPTO',
  'EUR/USD': 'FOREX',
  SPY: 'STOCK',
};

export function getBasePrice(symbol: string): number {
  return SYMBOL_PRICES[symbol] ?? 0;
}
