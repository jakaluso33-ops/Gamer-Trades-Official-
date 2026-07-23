import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  plan: string;
  xp: number;
  level: number;
  total_wins: number;
  total_losses: number;
  created_at: string;
}

export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
}

export type MatchMode = 'scalp' | 'swing' | 'long' | 'short';
export type MatchStatus = 'pending' | 'active' | 'finished' | 'declined' | 'cancelled';

export interface PvpMatch {
  id: string;
  mode: MatchMode;
  duration_seconds: number;
  status: MatchStatus;
  player1_id: string;
  player2_id: string;
  player1_pnl: number;
  player2_pnl: number;
  winner_id: string | null;
  started_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export interface PvpMatchTrade {
  id: string;
  match_id: string;
  user_id: string;
  symbol: string;
  side: 'buy' | 'sell';
  pnl_delta: number;
  created_at: string;
}
