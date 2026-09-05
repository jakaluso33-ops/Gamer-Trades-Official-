export type AssetClass = 'STOCK' | 'CRYPTO' | 'FOREX' | 'FUTURES' | 'OPTIONS' | 'INDEX';

export interface SymbolInfo {
  symbol: string;
  name: string;
  class: AssetClass;
  /** Simulated/seed price until real market data is wired in. */
  basePrice: number;
  /** Decimal places to display (forex needs 4-5, most else 2). */
  decimals: number;
  /** For OPTIONS only: the underlying stock/index this synthetic contract tracks. */
  underlying?: string;
  /** For OPTIONS only. */
  optionType?: 'call' | 'put';
  /** Simplified leverage multiplier applied to the underlying's % move (options only). */
  leverage?: number;
}

export const STOCKS: SymbolInfo[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', class: 'STOCK', basePrice: 182.34, decimals: 2 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', class: 'STOCK', basePrice: 421.10, decimals: 2 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', class: 'STOCK', basePrice: 172.88, decimals: 2 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', class: 'STOCK', basePrice: 186.42, decimals: 2 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', class: 'STOCK', basePrice: 875.20, decimals: 2 },
  { symbol: 'TSLA', name: 'Tesla Inc.', class: 'STOCK', basePrice: 245.67, decimals: 2 },
  { symbol: 'META', name: 'Meta Platforms Inc.', class: 'STOCK', basePrice: 502.30, decimals: 2 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', class: 'STOCK', basePrice: 198.55, decimals: 2 },
  { symbol: 'V', name: 'Visa Inc.', class: 'STOCK', basePrice: 279.40, decimals: 2 },
  { symbol: 'WMT', name: 'Walmart Inc.', class: 'STOCK', basePrice: 68.90, decimals: 2 },
  { symbol: 'DIS', name: 'Walt Disney Co.', class: 'STOCK', basePrice: 112.15, decimals: 2 },
  { symbol: 'NFLX', name: 'Netflix Inc.', class: 'STOCK', basePrice: 628.75, decimals: 2 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', class: 'STOCK', basePrice: 178.20, decimals: 2 },
  { symbol: 'BA', name: 'Boeing Co.', class: 'STOCK', basePrice: 189.40, decimals: 2 },
  { symbol: 'XOM', name: 'Exxon Mobil Corp.', class: 'STOCK', basePrice: 118.60, decimals: 2 },
];

export const CRYPTO: SymbolInfo[] = [
  { symbol: 'BTC/USD', name: 'Bitcoin', class: 'CRYPTO', basePrice: 67420, decimals: 2 },
  { symbol: 'ETH/USD', name: 'Ethereum', class: 'CRYPTO', basePrice: 3521, decimals: 2 },
  { symbol: 'SOL/USD', name: 'Solana', class: 'CRYPTO', basePrice: 142.55, decimals: 2 },
  { symbol: 'XRP/USD', name: 'XRP', class: 'CRYPTO', basePrice: 0.6120, decimals: 4 },
  { symbol: 'DOGE/USD', name: 'Dogecoin', class: 'CRYPTO', basePrice: 0.1580, decimals: 4 },
  { symbol: 'ADA/USD', name: 'Cardano', class: 'CRYPTO', basePrice: 0.4520, decimals: 4 },
  { symbol: 'AVAX/USD', name: 'Avalanche', class: 'CRYPTO', basePrice: 36.80, decimals: 2 },
  { symbol: 'LINK/USD', name: 'Chainlink', class: 'CRYPTO', basePrice: 14.62, decimals: 2 },
];

export const FOREX: SymbolInfo[] = [
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', class: 'FOREX', basePrice: 1.0842, decimals: 4 },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', class: 'FOREX', basePrice: 1.2680, decimals: 4 },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', class: 'FOREX', basePrice: 151.20, decimals: 2 },
  { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', class: 'FOREX', basePrice: 0.9040, decimals: 4 },
  { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', class: 'FOREX', basePrice: 0.6580, decimals: 4 },
  { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', class: 'FOREX', basePrice: 1.3620, decimals: 4 },
  { symbol: 'NZD/USD', name: 'New Zealand Dollar / US Dollar', class: 'FOREX', basePrice: 0.6120, decimals: 4 },
  { symbol: 'EUR/GBP', name: 'Euro / British Pound', class: 'FOREX', basePrice: 0.8550, decimals: 4 },
];

export const INDICES: SymbolInfo[] = [
  { symbol: 'SPX', name: 'S&P 500', class: 'INDEX', basePrice: 5230.50, decimals: 2 },
  { symbol: 'NDX', name: 'Nasdaq 100', class: 'INDEX', basePrice: 18240.30, decimals: 2 },
  { symbol: 'DJI', name: 'Dow Jones Industrial Average', class: 'INDEX', basePrice: 39120.80, decimals: 2 },
  { symbol: 'RUT', name: 'Russell 2000', class: 'INDEX', basePrice: 2080.40, decimals: 2 },
  { symbol: 'VIX', name: 'CBOE Volatility Index', class: 'INDEX', basePrice: 14.20, decimals: 2 },
];

export const FUTURES: SymbolInfo[] = [
  { symbol: 'ES', name: 'E-mini S&P 500', class: 'FUTURES', basePrice: 5232.00, decimals: 2 },
  { symbol: 'NQ', name: 'E-mini Nasdaq 100', class: 'FUTURES', basePrice: 18250.00, decimals: 2 },
  { symbol: 'CL', name: 'Crude Oil', class: 'FUTURES', basePrice: 78.40, decimals: 2 },
  { symbol: 'GC', name: 'Gold', class: 'FUTURES', basePrice: 2340.20, decimals: 2 },
  { symbol: 'SI', name: 'Silver', class: 'FUTURES', basePrice: 27.85, decimals: 2 },
  { symbol: 'NG', name: 'Natural Gas', class: 'FUTURES', basePrice: 2.15, decimals: 3 },
  { symbol: 'ZB', name: '30-Year US Treasury Bond', class: 'FUTURES', basePrice: 118.60, decimals: 2 },
];

/**
 * Simplified options: one at-the-money call and put per major underlying,
 * priced as a leveraged proxy of the underlying's % move rather than a real
 * strike/expiration chain. A real options chain (strikes, expirations,
 * greeks) is a bigger follow-up project.
 */
function buildOptions(underlyings: { symbol: string; name: string; premiumBase: number }[]): SymbolInfo[] {
  return underlyings.flatMap(u => [
    {
      symbol: `${u.symbol} CALL`,
      name: `${u.name} — ATM Call (synthetic)`,
      class: 'OPTIONS' as const,
      basePrice: u.premiumBase,
      decimals: 2,
      underlying: u.symbol,
      optionType: 'call' as const,
      leverage: 6,
    },
    {
      symbol: `${u.symbol} PUT`,
      name: `${u.name} — ATM Put (synthetic)`,
      class: 'OPTIONS' as const,
      basePrice: u.premiumBase,
      decimals: 2,
      underlying: u.symbol,
      optionType: 'put' as const,
      leverage: 6,
    },
  ]);
}

export const OPTIONS: SymbolInfo[] = buildOptions([
  { symbol: 'AAPL', name: 'Apple Inc.', premiumBase: 4.20 },
  { symbol: 'TSLA', name: 'Tesla Inc.', premiumBase: 8.60 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', premiumBase: 22.40 },
  { symbol: 'SPX', name: 'S&P 500', premiumBase: 34.50 },
]);

export const ALL_SYMBOLS: SymbolInfo[] = [...STOCKS, ...CRYPTO, ...FOREX, ...INDICES, ...FUTURES, ...OPTIONS];

export const SYMBOLS_BY_CLASS: Record<AssetClass, SymbolInfo[]> = {
  STOCK: STOCKS,
  CRYPTO: CRYPTO,
  FOREX: FOREX,
  INDEX: INDICES,
  FUTURES: FUTURES,
  OPTIONS: OPTIONS,
};

export const ASSET_CLASS_LABEL: Record<AssetClass, string> = {
  STOCK: 'STOCKS',
  CRYPTO: 'CRYPTO',
  FOREX: 'FOREX',
  INDEX: 'INDICES',
  FUTURES: 'FUTURES',
  OPTIONS: 'OPTIONS',
};

export const ASSET_CLASS_ICON: Record<AssetClass, string> = {
  STOCK: '📈',
  CRYPTO: '₿',
  FOREX: '💱',
  INDEX: '📊',
  FUTURES: '🛢️',
  OPTIONS: 'Ⓞ',
};

/**
 * Per-instrument icon, one notch more specific than the asset-class icon.
 * Uses generic pictograms (not real company logos/trademarks) so each
 * market is instantly recognizable without any brand-licensing risk —
 * e.g. Gold gets a bar/coin glyph, Amazon gets a shipping box, etc.
 */
export const SYMBOL_ICON: Record<string, string> = {
  // Stocks
  AAPL: '🍎',
  MSFT: '🪟',
  GOOGL: '🔍',
  AMZN: '📦',
  NVDA: '🖥️',
  TSLA: '🚗',
  META: '👓',
  JPM: '🏦',
  V: '💳',
  WMT: '🛒',
  DIS: '🏰',
  NFLX: '🎬',
  AMD: '🔷',
  BA: '✈️',
  XOM: '⛽',
  // Crypto
  'BTC/USD': '₿',
  'ETH/USD': 'Ξ',
  'SOL/USD': '◎',
  'XRP/USD': '✕',
  'DOGE/USD': '🐕',
  'ADA/USD': '₳',
  'AVAX/USD': '🏔️',
  'LINK/USD': '🔗',
  // Forex
  'EUR/USD': '🇪🇺',
  'GBP/USD': '🇬🇧',
  'USD/JPY': '🇯🇵',
  'USD/CHF': '🇨🇭',
  'AUD/USD': '🇦🇺',
  'USD/CAD': '🇨🇦',
  'NZD/USD': '🇳🇿',
  'EUR/GBP': '🇪🇺',
  // Indices
  SPX: '🗽',
  NDX: '💻',
  DJI: '🏭',
  RUT: '🏢',
  VIX: '🌪️',
  // Futures
  ES: '🗽',
  NQ: '💻',
  CL: '🛢️',
  GC: '🪙',
  SI: '🥈',
  NG: '🔥',
  ZB: '📜',
};

export const ASSET_CLASS_COLOR: Record<AssetClass, string> = {
  STOCK: '#00aaff',
  CRYPTO: '#ffd700',
  FOREX: '#00ff88',
  INDEX: '#ff8800',
  FUTURES: '#ff3355',
  OPTIONS: '#8b5cf6',
};

const SYMBOL_LOOKUP = new Map(ALL_SYMBOLS.map(s => [s.symbol, s]));

export function getSymbolInfo(symbol: string): SymbolInfo | undefined {
  return SYMBOL_LOOKUP.get(symbol);
}

export function getBasePrice(symbol: string): number {
  return SYMBOL_LOOKUP.get(symbol)?.basePrice ?? 0;
}
