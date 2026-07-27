import { supabase } from './supabase';

export interface LeaderboardEntry {
  id: string;
  username: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  total_wins: number;
  total_losses: number;
  win_rate: number;
  lifetime_pnl: number;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_leaderboard');
  if (error) throw error;
  return (data ?? []) as LeaderboardEntry[];
}
