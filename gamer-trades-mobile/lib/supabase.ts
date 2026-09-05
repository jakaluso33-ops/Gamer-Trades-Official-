import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// supabase-js's FunctionsHttpError.message is always the generic
// "Edge Function returned a non-2xx status code" -- the actual reason lives in
// the response body (error.context is the raw Response). Unwrap it so callers
// can surface the real cause instead of that useless string.
export async function unwrapFunctionError(error: any): Promise<Error> {
  const context = error?.context;
  if (context && typeof context.json === 'function') {
    try {
      const clone = typeof context.clone === 'function' ? context.clone() : context;
      const body = await clone.json();
      if (body?.message || body?.error) return new Error(body.message ?? body.error);
    } catch {
      // body wasn't JSON -- fall through to the generic message
    }
  }
  return error instanceof Error ? error : new Error(String(error));
}

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
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null;
  trading_goal: string | null;
  interested_features: string[];
  completed_lessons: string[];
  quiz_passed_levels: string[];
  trade_passed_levels: string[];
  quiz_topic_stats: Record<string, { correct: number; attempts: number }>;
  active_portfolio_id: string | null;
  subscription_status: string | null;
  onboarded_at: string | null;
  trial_ends_at: string | null;
  notifications_enabled: boolean;
  streak_count: number;
  last_checkin_date: string | null;
  notification_prompt_seen_at: string | null;
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

export type GoalStatus = 'active' | 'archived';

export interface TradingGoal {
  id: string;
  user_id: string;
  template_id: string;
  target_value: number | null;
  status: GoalStatus;
  created_at: string;
}

export type TaskStatus = 'active' | 'completed' | 'expired';

export interface Task {
  id: string;
  user_id: string;
  goal_id: string | null;
  period: 'daily' | 'weekly' | 'monthly';
  event_type: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  xp_reward: number;
  period_start: string;
  period_end: string;
  status: TaskStatus;
  created_at: string;
}
