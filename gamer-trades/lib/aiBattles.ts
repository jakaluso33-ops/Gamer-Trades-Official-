import { supabase } from './supabase';

export type AiOpponentId = 'algoace' | 'trendtina' | 'gridgareth';
export type AiDifficulty = 'ROOKIE' | 'VETERAN' | 'LEGEND';
export type BattleMode = 'scalp' | 'swing' | 'long' | 'short';
export type BattleResult = 'win' | 'loss' | 'draw';

const XP_BY_DIFFICULTY: Record<AiDifficulty, number> = { ROOKIE: 50, VETERAN: 150, LEGEND: 400 };

export interface AiBattleParams {
  opponentId: AiOpponentId;
  difficulty: AiDifficulty;
  mode: BattleMode;
  durationSeconds: number;
  playerPnl: number;
  aiPnl: number;
  playerTrades: number;
  aiTrades: number;
}

export async function recordAiBattle(userId: string, params: AiBattleParams): Promise<{ result: BattleResult; xpEarned: number }> {
  const result: BattleResult = params.playerPnl === params.aiPnl ? 'draw' : params.playerPnl > params.aiPnl ? 'win' : 'loss';
  const xpEarned = result === 'win' ? XP_BY_DIFFICULTY[params.difficulty] : 0;

  await supabase.from('ai_battles').insert({
    user_id: userId,
    opponent_id: params.opponentId,
    difficulty: params.difficulty,
    mode: params.mode,
    duration_seconds: params.durationSeconds,
    player_pnl: params.playerPnl,
    ai_pnl: params.aiPnl,
    player_trades: params.playerTrades,
    ai_trades: params.aiTrades,
    result,
    xp_earned: xpEarned,
  });

  if (result === 'win') {
    const { data: profile } = await supabase.from('profiles').select('total_wins, xp').eq('id', userId).single();
    if (profile) {
      await supabase.from('profiles').update({ total_wins: profile.total_wins + 1, xp: profile.xp + xpEarned }).eq('id', userId);
    }
  } else if (result === 'loss') {
    const { data: profile } = await supabase.from('profiles').select('total_losses').eq('id', userId).single();
    if (profile) {
      await supabase.from('profiles').update({ total_losses: profile.total_losses + 1 }).eq('id', userId);
    }
  }

  return { result, xpEarned };
}

export interface AiBattleStats {
  total: number;
  wins: number;
  losses: number;
  byOpponent: Record<string, { wins: number; losses: number }>;
  byDifficulty: Record<string, { wins: number; losses: number }>;
}

export async function getAiBattleStats(userId: string): Promise<AiBattleStats> {
  const { data } = await supabase.from('ai_battles').select('opponent_id, difficulty, result').eq('user_id', userId);
  const rows = (data ?? []) as { opponent_id: string; difficulty: string; result: BattleResult }[];

  const stats: AiBattleStats = { total: rows.length, wins: 0, losses: 0, byOpponent: {}, byDifficulty: {} };
  for (const r of rows) {
    if (r.result === 'win') stats.wins++;
    else if (r.result === 'loss') stats.losses++;

    const opp = stats.byOpponent[r.opponent_id] ?? (stats.byOpponent[r.opponent_id] = { wins: 0, losses: 0 });
    if (r.result === 'win') opp.wins++;
    else if (r.result === 'loss') opp.losses++;

    const diff = stats.byDifficulty[r.difficulty] ?? (stats.byDifficulty[r.difficulty] = { wins: 0, losses: 0 });
    if (r.result === 'win') diff.wins++;
    else if (r.result === 'loss') diff.losses++;
  }
  return stats;
}
