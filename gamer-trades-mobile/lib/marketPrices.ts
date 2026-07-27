export const SYMBOL_PRICES: Record<string, number> = {
  AAPL: 182.34,
  TSLA: 245.67,
  BTC: 67420,
  ETH: 3521,
  NVDA: 875.20,
};

export function getBasePrice(symbol: string): number {
  return SYMBOL_PRICES[symbol] ?? 0;
}
