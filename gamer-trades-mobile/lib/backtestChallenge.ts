import { supabase } from './supabase';
import { AssetClass } from './symbols';

export type BacktestChallengeStatus = 'upcoming' | 'active' | 'completed';

export interface BacktestChallenge {
  id: string;
  symbol: string;
  market_class: AssetClass;
  seed: number;
  candle_count: number;
  starting_balance: number;
  week_start: string;
  week_end: string;
  status: BacktestChallengeStatus;
  winner_user_id: string | null;
}

export interface BacktestChallengeEntry {
  id: string;
  challenge_id: string;
  user_id: string;
  final_balance: number;
  trades_taken: number;
  submitted_at: string;
}

export interface BacktestLeaderboardRow {
  user_id: string;
  username: string;
  pnl: number;
  rank: number;
}

/** The challenge row is created a few days ahead of its weekend (so it's ready the instant
 * Friday's close hits) but only actually playable once "now" falls inside its own
 * week_start/week_end window -- checked here against real time rather than trusting the
 * row's own status label, since rotate-backtest-challenge marks it 'active' as soon as it's
 * created, ahead of the weekend itself. */
export async function getActiveBacktestChallenge(): Promise<BacktestChallenge | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('backtest_challenges')
    .select('*')
    .lte('week_start', now)
    .gte('week_end', now)
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as BacktestChallenge | null;
}

export async function getMyBacktestEntry(userId: string, challengeId: string): Promise<BacktestChallengeEntry | null> {
  const { data, error } = await supabase
    .from('backtest_challenge_entries')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as BacktestChallengeEntry | null;
}

/** Submits (or improves) a final backtest result. A user can retry the same fixed price
 * series as many times as they like -- only their best final balance is kept. */
export async function submitBacktestResult(
  userId: string,
  challengeId: string,
  finalBalance: number,
  tradesTaken: number
): Promise<BacktestChallengeEntry> {
  const existing = await getMyBacktestEntry(userId, challengeId);
  if (existing && existing.final_balance >= finalBalance) return existing;

  const { data, error } = await supabase
    .from('backtest_challenge_entries')
    .upsert(
      { challenge_id: challengeId, user_id: userId, final_balance: finalBalance, trades_taken: tradesTaken, submitted_at: new Date().toISOString() },
      { onConflict: 'challenge_id,user_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return data as BacktestChallengeEntry;
}

export async function getBacktestLeaderboard(challengeId: string, startingBalance: number): Promise<BacktestLeaderboardRow[]> {
  const { data: entries, error } = await supabase
    .from('backtest_challenge_entries')
    .select('user_id, final_balance, profiles(username)')
    .eq('challenge_id', challengeId);
  if (error) throw error;

  const rows = (entries ?? [])
    .map((e: any) => ({
      user_id: e.user_id as string,
      username: (e.profiles?.username as string) ?? 'Trader',
      pnl: (e.final_balance ?? startingBalance) - startingBalance,
    }))
    .sort((a, b) => b.pnl - a.pnl)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  return rows;
}
