import { supabase } from './supabase';
import { Portfolio } from './trading';
import { AssetClass } from './symbols';

export type ChallengeTheme = 'open' | 'single_market' | 'multi_market' | 'backtest';
export type ChallengeStatus = 'upcoming' | 'active' | 'completed';

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  theme: ChallengeTheme;
  allowed_asset_classes: AssetClass[] | null;
  starting_balance: number;
  week_start: string;
  week_end: string;
  status: ChallengeStatus;
  winner_user_id: string | null;
}

export interface ChallengeEntry {
  id: string;
  challenge_id: string;
  user_id: string;
  portfolio_id: string;
  joined_at: string;
}

export interface ChallengeLeaderboardRow {
  user_id: string;
  username: string;
  pnl: number;
  rank: number;
}

export async function getActiveChallenge(): Promise<WeeklyChallenge | null> {
  const all = await getActiveChallenges();
  return all[0] ?? null;
}

/** All of this week's live challenges -- there can be more than one running at once
 * (e.g. an open one and a themed single-market one), and every user should be able
 * to join any/all of them. */
export async function getActiveChallenges(): Promise<WeeklyChallenge[]> {
  const { data, error } = await supabase
    .from('weekly_challenges')
    .select('*')
    .eq('status', 'active')
    .order('week_start', { ascending: false });
  if (error) throw error;
  return (data ?? []) as WeeklyChallenge[];
}

export async function getMyEntry(userId: string, challengeId: string): Promise<ChallengeEntry | null> {
  const { data, error } = await supabase
    .from('weekly_challenge_entries')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as ChallengeEntry | null;
}

/**
 * Joining creates a dedicated, isolated portfolio for the challenge (never the user's main
 * one) and links it. Takes AuthContext's addPortfolio so the new portfolio lands in local
 * state (and becomes active) immediately, instead of needing a full portfolio refetch.
 */
export async function joinChallenge(
  userId: string,
  challenge: WeeklyChallenge,
  addPortfolio: (name: string, startingBalance?: number) => Promise<Portfolio>
): Promise<{ entry: ChallengeEntry; portfolio: Portfolio }> {
  const portfolio = await addPortfolio(`🏆 ${challenge.title}`, challenge.starting_balance);
  const { data, error } = await supabase
    .from('weekly_challenge_entries')
    .insert({ challenge_id: challenge.id, user_id: userId, portfolio_id: portfolio.id })
    .select()
    .single();
  if (error) throw error;
  return { entry: data as ChallengeEntry, portfolio };
}

export async function getChallengeLeaderboard(challengeId: string): Promise<ChallengeLeaderboardRow[]> {
  const { data: entries, error } = await supabase
    .from('weekly_challenge_entries')
    .select('user_id, portfolios(cash_balance, starting_balance), profiles(username)')
    .eq('challenge_id', challengeId);
  if (error) throw error;

  const rows = (entries ?? [])
    .map((e: any) => ({
      user_id: e.user_id as string,
      username: (e.profiles?.username as string) ?? 'Trader',
      pnl: (e.portfolios?.cash_balance ?? 0) - (e.portfolios?.starting_balance ?? 0),
    }))
    .sort((a, b) => b.pnl - a.pnl)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  return rows;
}
