import { supabase, unwrapFunctionError } from './supabase';
import { DbTrade } from './trading';
import { SkillLevel } from './curriculum';

export type JournalOutcome = 'take_profit' | 'stop_loss' | 'manual';

export interface JournalAnalysis {
  headline: string;
  outcomeExplanation: string;
  reasoningAlignment: 'strong' | 'mixed' | 'weak';
  emotionalInfluence: string;
  lesson: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  trade_id: string;
  reasoning: string;
  emotions: string[];
  ai_analysis: JournalAnalysis | null;
  ai_analyzed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const EMOTION_TAGS = [
  'Confident', 'Disciplined', 'Patient', 'Calm',
  'FOMO', 'Revenge Trading', 'Impulsive', 'Anxious', 'Greedy', 'Bored', 'Uncertain', 'Overconfident',
] as const;

function tradeOutcome(trade: DbTrade): JournalOutcome {
  if (trade.exit_price == null) return 'manual';
  if (trade.take_profit != null && Math.abs(trade.exit_price - trade.take_profit) < 0.005 * trade.exit_price) return 'take_profit';
  if (trade.stop_loss != null && Math.abs(trade.exit_price - trade.stop_loss) < 0.005 * trade.exit_price) return 'stop_loss';
  return 'manual';
}

export async function getJournalEntry(userId: string, tradeId: string): Promise<JournalEntry | null> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('trade_id', tradeId)
    .maybeSingle();
  if (error) throw error;
  return data as JournalEntry | null;
}

export async function listJournalEntries(userId: string): Promise<Record<string, JournalEntry>> {
  const { data, error } = await supabase.from('journal_entries').select('*').eq('user_id', userId);
  if (error) throw error;
  const map: Record<string, JournalEntry> = {};
  for (const row of (data ?? []) as JournalEntry[]) map[row.trade_id] = row;
  return map;
}

export async function saveJournalEntry(userId: string, tradeId: string, reasoning: string, emotions: string[]): Promise<JournalEntry> {
  const { data, error } = await supabase
    .from('journal_entries')
    .upsert(
      { user_id: userId, trade_id: tradeId, reasoning, emotions, updated_at: new Date().toISOString() },
      { onConflict: 'trade_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return data as JournalEntry;
}

/** Runs the deeper Legend-only AI journal analysis (backtest-style explanation of why the
 * trade hit its TP/SL, plus how the trader's own reasoning and emotional state connect to
 * the outcome) and caches the result on the journal row so it isn't re-run on every view. */
export async function runJournalAnalysis(
  userId: string,
  trade: DbTrade,
  entry: JournalEntry,
  skillLevel: SkillLevel | null
): Promise<JournalAnalysis> {
  if (trade.status !== 'closed' || trade.exit_price == null || trade.closed_at == null || trade.pnl == null) {
    throw new Error('Only closed trades can be analyzed');
  }
  const { data, error } = await supabase.functions.invoke('journal-analysis-agent', {
    body: {
      trade: {
        symbol: trade.symbol,
        direction: trade.direction,
        quantity: trade.quantity,
        entryPrice: trade.entry_price,
        exitPrice: trade.exit_price,
        stopLoss: trade.stop_loss,
        takeProfit: trade.take_profit,
        pnl: trade.pnl,
        openedAt: trade.opened_at,
        closedAt: trade.closed_at,
        outcome: tradeOutcome(trade),
        reasoning: entry.reasoning,
        emotions: entry.emotions,
      },
      skillLevel: skillLevel ?? 'beginner',
    },
  });
  if (error) throw await unwrapFunctionError(error);
  if (data?.error) throw new Error(data.error);
  const analysis = (data as { analysis: JournalAnalysis }).analysis;

  await supabase
    .from('journal_entries')
    .update({ ai_analysis: analysis, ai_analyzed_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('trade_id', trade.id);

  return analysis;
}
