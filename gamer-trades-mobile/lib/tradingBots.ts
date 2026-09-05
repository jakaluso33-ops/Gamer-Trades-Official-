import { supabase } from './supabase';
import { DbTrade } from './trading';

export type BotDirection = 'bullish' | 'bearish';
export type BotLogic = 'AND' | 'OR';
export type ConditionKind = 'strategy' | 'candle';

export interface BotCondition {
  kind: ConditionKind;
  detector: string;
}

export interface TradingBot {
  id: string;
  user_id: string;
  portfolio_id: string;
  name: string;
  symbol: string;
  direction: BotDirection;
  conditions: BotCondition[];
  logic: BotLogic;
  risk_per_trade_pct: number;
  status: 'active' | 'paused';
  created_at: string;
  last_evaluated_at: string | null;
  last_signal_at: string | null;
}

/** Symbols the bot evaluator can actually build real-time candles for (see
 * record-price-snapshots' tracked-symbol list server-side). Keeping the client and server
 * lists in sync matters -- picking an untracked symbol would leave a bot warming up forever. */
export const BOT_SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'SPY', 'BTC/USD', 'ETH/USD', 'SOL/USD', 'EUR/USD'];

export const CONDITION_OPTIONS: { kind: ConditionKind; detector: string; label: string }[] = [
  { kind: 'strategy', detector: 'breakout', label: 'Breakout' },
  { kind: 'strategy', detector: 'support_resistance', label: 'Support / Resistance' },
  { kind: 'strategy', detector: 'ma_crossover', label: 'MA Crossover' },
  { kind: 'strategy', detector: 'rsi_reversal', label: 'RSI Overbought/Oversold' },
  { kind: 'strategy', detector: 'vwap', label: 'VWAP Bounce/Rejection' },
  { kind: 'strategy', detector: 'bollinger_squeeze', label: 'Bollinger Squeeze Breakout' },
  { kind: 'strategy', detector: 'macd', label: 'MACD Crossover' },
  { kind: 'strategy', detector: 'turtle_breakout', label: 'Turtle Trading (Donchian)' },
  { kind: 'strategy', detector: 'momentum', label: 'Momentum / Relative Strength' },
  { kind: 'strategy', detector: 'ichimoku', label: 'Ichimoku TK Cross' },
  { kind: 'strategy', detector: 'parabolic_sar', label: 'Parabolic SAR Flip' },
  { kind: 'candle', detector: 'hammer', label: 'Hammer (candle)' },
  { kind: 'candle', detector: 'inverted_hammer', label: 'Inverted Hammer (candle)' },
  { kind: 'candle', detector: 'hanging_man', label: 'Hanging Man (candle)' },
  { kind: 'candle', detector: 'shooting_star', label: 'Shooting Star (candle)' },
  { kind: 'candle', detector: 'doji', label: 'Doji (candle)' },
  { kind: 'candle', detector: 'marubozu', label: 'Marubozu (candle)' },
  { kind: 'candle', detector: 'bullish_engulfing', label: 'Bullish Engulfing (candle)' },
  { kind: 'candle', detector: 'bearish_engulfing', label: 'Bearish Engulfing (candle)' },
];

export async function listBots(userId: string): Promise<TradingBot[]> {
  const { data, error } = await supabase
    .from('trading_bots')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as TradingBot[];
}

export interface CreateBotParams {
  userId: string;
  portfolioId: string;
  name: string;
  symbol: string;
  direction: BotDirection;
  conditions: BotCondition[];
  logic: BotLogic;
  riskPerTradePct: number;
}

export async function createBot(params: CreateBotParams): Promise<TradingBot> {
  const { data, error } = await supabase
    .from('trading_bots')
    .insert({
      user_id: params.userId,
      portfolio_id: params.portfolioId,
      name: params.name,
      symbol: params.symbol,
      direction: params.direction,
      conditions: params.conditions,
      logic: params.logic,
      risk_per_trade_pct: params.riskPerTradePct,
      status: 'active',
    })
    .select()
    .single();
  if (error) throw error;
  return data as TradingBot;
}

export async function setBotStatus(botId: string, status: 'active' | 'paused'): Promise<void> {
  const { error } = await supabase.from('trading_bots').update({ status }).eq('id', botId);
  if (error) throw error;
}

export async function deleteBot(botId: string): Promise<void> {
  const { error } = await supabase.from('trading_bots').delete().eq('id', botId);
  if (error) throw error;
}

export async function getBotTrades(botId: string): Promise<DbTrade[]> {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('bot_id', botId)
    .order('opened_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data as DbTrade[];
}

export interface BotPerformance {
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  wins: number;
  winRate: number;
  totalPnl: number;
}

export function summarizeBotTrades(trades: DbTrade[]): BotPerformance {
  const closed = trades.filter(t => t.status === 'closed');
  const wins = closed.filter(t => (t.pnl ?? 0) >= 0).length;
  return {
    totalTrades: trades.length,
    openTrades: trades.filter(t => t.status === 'open').length,
    closedTrades: closed.length,
    wins,
    winRate: closed.length > 0 ? (wins / closed.length) * 100 : 0,
    totalPnl: closed.reduce((sum, t) => sum + (t.pnl ?? 0), 0),
  };
}
