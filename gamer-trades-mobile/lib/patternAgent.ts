import { supabase } from './supabase';
import { StrategySignal } from './strategyEngine';
import { SkillLevel } from './curriculum';

export interface PatternInsight {
  headline: string;
  explanation: string;
  whatToWatch: string;
}

export async function runPatternAgent(symbol: string, signal: StrategySignal, skillLevel: SkillLevel | null): Promise<PatternInsight> {
  const { data, error } = await supabase.functions.invoke('pattern-agent', {
    body: { symbol, signal, skillLevel: skillLevel ?? 'beginner' },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return (data as { insight: PatternInsight }).insight;
}
