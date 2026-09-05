import { supabase } from './supabase';
import { SkillLevel, TopicStats } from './curriculum';
import { StrategySignal } from './strategyEngine';

export interface AiQuizQuestion {
  topicId: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizAgentMarketContext {
  symbol: string;
  price: number;
  changePct?: number | null;
  signal?: Pick<StrategySignal, 'strategyId' | 'label' | 'direction' | 'detail'> | null;
}

export interface QuizAgentParams {
  level: SkillLevel;
  topics: { id: string; title: string }[];
  topicStats?: TopicStats;
  recentQuestions?: string[];
  market?: QuizAgentMarketContext | null;
}

export async function runQuizAgent(params: QuizAgentParams): Promise<AiQuizQuestion> {
  const { data, error } = await supabase.functions.invoke('quiz-agent', { body: params });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return (data as { question: AiQuizQuestion }).question;
}
