import { supabase } from './supabase';
import { Portfolio } from './trading';
import { AssetClass } from './symbols';

export type TournamentTheme = 'open' | 'single_market' | 'multi_market';
export type TournamentStatus = 'upcoming' | 'active' | 'completed';

export interface Tournament {
  id: string;
  title: string;
  description: string;
  theme: TournamentTheme;
  allowed_asset_classes: AssetClass[] | null;
  starting_balance: number;
  month_start: string;
  month_end: string;
  status: TournamentStatus;
  winner_user_id: string | null;
}

export interface TournamentEntry {
  id: string;
  tournament_id: string;
  user_id: string;
  portfolio_id: string;
  joined_at: string;
}

export interface TournamentLeaderboardRow {
  user_id: string;
  username: string;
  pnl: number;
  rank: number;
}

export async function getActiveTournament(): Promise<Tournament | null> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('status', 'active')
    .order('month_start', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Tournament | null;
}

export async function getMyTournamentEntry(userId: string, tournamentId: string): Promise<TournamentEntry | null> {
  const { data, error } = await supabase
    .from('tournament_entries')
    .select('*')
    .eq('tournament_id', tournamentId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as TournamentEntry | null;
}

/** Joining creates a dedicated, isolated portfolio for the tournament (never the user's main
 * one) and links it -- same pattern as joinChallenge. The insert itself is also enforced
 * server-side (RLS requires plan in ('pro','legend')), so this can't be bypassed by calling
 * the client function directly even if the UI gate were somehow skipped. */
export async function joinTournament(
  userId: string,
  tournament: Tournament,
  addPortfolio: (name: string, startingBalance?: number) => Promise<Portfolio>
): Promise<{ entry: TournamentEntry; portfolio: Portfolio }> {
  const portfolio = await addPortfolio(`🏆 ${tournament.title}`, tournament.starting_balance);
  const { data, error } = await supabase
    .from('tournament_entries')
    .insert({ tournament_id: tournament.id, user_id: userId, portfolio_id: portfolio.id })
    .select()
    .single();
  if (error) throw error;
  return { entry: data as TournamentEntry, portfolio };
}

export async function getTournamentLeaderboard(tournamentId: string): Promise<TournamentLeaderboardRow[]> {
  const { data: entries, error } = await supabase
    .from('tournament_entries')
    .select('user_id, portfolios(cash_balance, starting_balance), profiles(username)')
    .eq('tournament_id', tournamentId);
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
