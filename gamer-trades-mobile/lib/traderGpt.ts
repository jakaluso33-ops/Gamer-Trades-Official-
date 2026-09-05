import { supabase, unwrapFunctionError } from './supabase';
import { SkillLevel } from './curriculum';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface TraderGptResponse {
  reply: string;
  remainingToday: number | null;
}

export const TRADERGPT_FREE_DAILY_LIMIT = 2;

/** Reads today's usage count for a free-tier user directly (RLS-scoped to their own row) so
 * the UI can show "X of 2 used today" before they even ask a question, not just after. */
export async function getTraderGptUsageToday(userId: string): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('tradergpt_usage')
    .select('question_count')
    .eq('user_id', userId)
    .eq('usage_date', today)
    .maybeSingle();
  if (error) throw error;
  return (data as { question_count?: number } | null)?.question_count ?? 0;
}

export async function askTraderGpt(messages: ChatMessage[], skillLevel: SkillLevel | null): Promise<TraderGptResponse> {
  const { data, error } = await supabase.functions.invoke('tradergpt-agent', {
    body: { messages, skillLevel: skillLevel ?? 'beginner' },
  });
  if (error) throw await unwrapFunctionError(error);
  if (data?.error) throw new Error(data.message ?? data.error);
  return data as TraderGptResponse;
}
