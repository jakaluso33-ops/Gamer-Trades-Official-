import { supabase } from './supabase';
import { logEvent } from './activity';

export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  cash_balance: number;
  starting_balance: number;
}

export type TradeDirection = 'long' | 'short';
export type TradeOrderType = 'market' | 'limit' | 'stop';
export type TradeStatus = 'open' | 'closed' | 'cancelled';

export interface DbTrade {
  id: string;
  portfolio_id: string;
  user_id: string;
  symbol: string;
  direction: TradeDirection;
  order_type: TradeOrderType;
  quantity: number;
  entry_price: number;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  status: TradeStatus;
  pnl: number | null;
  opened_at: string;
  closed_at: string | null;
}

export class InsufficientFundsError extends Error {
  constructor() {
    super('Not enough cash to place this order');
    this.name = 'InsufficientFundsError';
  }
}

export async function getPortfolio(userId: string): Promise<Portfolio> {
  const { data, error } = await supabase.from('portfolios').select('*').eq('user_id', userId).single();
  if (error) throw error;
  return data as Portfolio;
}

export async function listOpenTrades(userId: string): Promise<DbTrade[]> {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'open')
    .order('opened_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbTrade[];
}

export async function listClosedTrades(userId: string, limit = 50): Promise<DbTrade[]> {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'closed')
    .order('closed_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as DbTrade[];
}

export interface OpenTradeParams {
  symbol: string;
  direction: TradeDirection;
  orderType: TradeOrderType;
  quantity: number;
  entryPrice: number;
  stopLoss?: number | null;
  takeProfit?: number | null;
}

/**
 * Opens a trade and reserves its notional value (quantity * entryPrice) from cash as
 * collateral, for both long and short — released back (plus/minus pnl) on close. This
 * keeps the accounting symmetric without modeling real short-selling margin mechanics.
 */
export async function openTrade(userId: string, portfolio: Portfolio, params: OpenTradeParams): Promise<{ trade: DbTrade; portfolio: Portfolio }> {
  const notional = params.quantity * params.entryPrice;
  if (notional > portfolio.cash_balance) {
    throw new InsufficientFundsError();
  }

  const { data: trade, error: tradeErr } = await supabase
    .from('trades')
    .insert({
      portfolio_id: portfolio.id,
      user_id: userId,
      symbol: params.symbol,
      direction: params.direction,
      order_type: params.orderType,
      quantity: params.quantity,
      entry_price: params.entryPrice,
      stop_loss: params.stopLoss ?? null,
      take_profit: params.takeProfit ?? null,
      status: 'open',
    })
    .select()
    .single();
  if (tradeErr) throw tradeErr;

  const newCash = portfolio.cash_balance - notional;
  const { data: updatedPortfolio, error: portfolioErr } = await supabase
    .from('portfolios')
    .update({ cash_balance: newCash })
    .eq('id', portfolio.id)
    .select()
    .single();
  if (portfolioErr) throw portfolioErr;

  return { trade: trade as DbTrade, portfolio: updatedPortfolio as Portfolio };
}

export class InvalidDepositAmountError extends Error {
  constructor() {
    super('Deposit amount must be a positive number');
    this.name = 'InvalidDepositAmountError';
  }
}

/**
 * Manually top up the paper-trading account. Increases both cash and starting_balance so
 * the deposit counts as new principal, not as profit in any future return-on-investment math.
 */
export async function depositFunds(userId: string, portfolio: Portfolio, amount: number): Promise<Portfolio> {
  if (!Number.isFinite(amount) || amount <= 0) throw new InvalidDepositAmountError();

  const { data: updatedPortfolio, error } = await supabase
    .from('portfolios')
    .update({
      cash_balance: portfolio.cash_balance + amount,
      starting_balance: portfolio.starting_balance + amount,
    })
    .eq('id', portfolio.id)
    .select()
    .single();
  if (error) throw error;

  await logEvent(userId, 'funds_deposited', { amount });

  return updatedPortfolio as Portfolio;
}

export function computePnl(trade: Pick<DbTrade, 'direction' | 'quantity' | 'entry_price'>, exitPrice: number): number {
  const diff = trade.direction === 'long' ? exitPrice - trade.entry_price : trade.entry_price - exitPrice;
  return diff * trade.quantity;
}

export interface PlaceOrderResult {
  /** Existing open positions this order fully or partially netted against, now closed. */
  closedTrades: DbTrade[];
  /** Existing open positions that were only partially netted — same id, reduced quantity. */
  updatedTrades: DbTrade[];
  /** Any leftover quantity (after netting) opened as a new position in the new direction. */
  openedTrade: DbTrade | null;
  portfolio: Portfolio;
}

/**
 * Places an order the way a real trading platform does: it nets against any existing
 * opposite-direction open positions on the same symbol first, oldest position first
 * (FIFO), before opening a new position with whatever quantity is left over. E.g. one
 * open BUY 1 + a SELL 1 fully closes it out flat; a BUY 1 followed by a SELL 2 closes
 * the long and leaves a fresh SHORT 1 open. Same-direction orders (adding to an existing
 * long/short) are left alone and simply open as their own new position, same as before.
 */
export async function placeOrder(
  userId: string,
  portfolio: Portfolio,
  currentOpenTrades: DbTrade[],
  params: OpenTradeParams
): Promise<PlaceOrderResult> {
  const opposite: TradeDirection = params.direction === 'long' ? 'short' : 'long';
  const matches = currentOpenTrades
    .filter(t => t.symbol === params.symbol && t.direction === opposite)
    .sort((a, b) => new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime());

  let remaining = params.quantity;
  let cash = portfolio.cash_balance;
  const closedTrades: DbTrade[] = [];
  const updatedTrades: DbTrade[] = [];

  for (const trade of matches) {
    if (remaining <= 0) break;
    const matchQty = Math.min(remaining, trade.quantity);
    const pnl = computePnl({ ...trade, quantity: matchQty }, params.entryPrice);
    const notionalReleased = matchQty * trade.entry_price;

    if (matchQty === trade.quantity) {
      const { data: closed, error } = await supabase
        .from('trades')
        .update({ status: 'closed', exit_price: params.entryPrice, closed_at: new Date().toISOString(), pnl })
        .eq('id', trade.id)
        .select()
        .single();
      if (error) throw error;
      closedTrades.push(closed as DbTrade);
    } else {
      // Partial netting — record the matched slice as its own closed trade (preserving
      // its real entry time for history) and shrink the original position by that amount.
      const { data: closedSlice, error: insErr } = await supabase
        .from('trades')
        .insert({
          portfolio_id: trade.portfolio_id,
          user_id: userId,
          symbol: trade.symbol,
          direction: trade.direction,
          order_type: trade.order_type,
          quantity: matchQty,
          entry_price: trade.entry_price,
          exit_price: params.entryPrice,
          status: 'closed',
          pnl,
          opened_at: trade.opened_at,
          closed_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (insErr) throw insErr;
      closedTrades.push(closedSlice as DbTrade);

      const { data: shrunk, error: updErr } = await supabase
        .from('trades')
        .update({ quantity: trade.quantity - matchQty })
        .eq('id', trade.id)
        .select()
        .single();
      if (updErr) throw updErr;
      updatedTrades.push(shrunk as DbTrade);
    }

    cash += notionalReleased + pnl;
    remaining -= matchQty;
  }

  if (closedTrades.length > 0) {
    const { data: profile } = await supabase.from('profiles').select('total_wins, total_losses').eq('id', userId).single();
    if (profile) {
      const wins = closedTrades.filter(t => (t.pnl ?? 0) >= 0).length;
      const losses = closedTrades.length - wins;
      await supabase
        .from('profiles')
        .update({
          total_wins: (profile as Record<string, number>).total_wins + wins,
          total_losses: (profile as Record<string, number>).total_losses + losses,
        })
        .eq('id', userId);
    }
    for (const t of closedTrades) {
      await logEvent(userId, 'trade_closed', { symbol: t.symbol, direction: t.direction, pnl: t.pnl });
    }
  }

  let openedTrade: DbTrade | null = null;
  if (remaining > 0) {
    const notional = remaining * params.entryPrice;
    if (notional > cash) throw new InsufficientFundsError();
    const { data: trade, error } = await supabase
      .from('trades')
      .insert({
        portfolio_id: portfolio.id,
        user_id: userId,
        symbol: params.symbol,
        direction: params.direction,
        order_type: params.orderType,
        quantity: remaining,
        entry_price: params.entryPrice,
        stop_loss: params.stopLoss ?? null,
        take_profit: params.takeProfit ?? null,
        status: 'open',
      })
      .select()
      .single();
    if (error) throw error;
    openedTrade = trade as DbTrade;
    cash -= notional;
  }

  const { data: updatedPortfolio, error: portfolioErr } = await supabase
    .from('portfolios')
    .update({ cash_balance: cash })
    .eq('id', portfolio.id)
    .select()
    .single();
  if (portfolioErr) throw portfolioErr;

  return { closedTrades, updatedTrades, openedTrade, portfolio: updatedPortfolio as Portfolio };
}

export async function closeTrade(userId: string, trade: DbTrade, exitPrice: number): Promise<{ trade: DbTrade; portfolio: Portfolio; pnl: number }> {
  const pnl = computePnl(trade, exitPrice);

  const { data: closedTrade, error: tradeErr } = await supabase
    .from('trades')
    .update({ status: 'closed', exit_price: exitPrice, closed_at: new Date().toISOString(), pnl })
    .eq('id', trade.id)
    .select()
    .single();
  if (tradeErr) throw tradeErr;

  const notional = trade.quantity * trade.entry_price;
  const { data: portfolio, error: portfolioErr } = await supabase
    .from('portfolios')
    .select('*')
    .eq('id', trade.portfolio_id)
    .single();
  if (portfolioErr) throw portfolioErr;

  const newCash = (portfolio as Portfolio).cash_balance + notional + pnl;
  const { data: updatedPortfolio, error: updateErr } = await supabase
    .from('portfolios')
    .update({ cash_balance: newCash })
    .eq('id', trade.portfolio_id)
    .select()
    .single();
  if (updateErr) throw updateErr;

  const { data: profile } = await supabase.from('profiles').select('total_wins, total_losses').eq('id', userId).single();
  if (profile) {
    const field = pnl >= 0 ? 'total_wins' : 'total_losses';
    await supabase.from('profiles').update({ [field]: (profile as Record<string, number>)[field] + 1 }).eq('id', userId);
  }

  await logEvent(userId, 'trade_closed', { symbol: trade.symbol, direction: trade.direction, pnl });

  return { trade: closedTrade as DbTrade, portfolio: updatedPortfolio as Portfolio, pnl };
}
