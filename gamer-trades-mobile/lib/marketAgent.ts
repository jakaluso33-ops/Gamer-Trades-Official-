import { supabase } from './supabase';

export type Sentiment = 'bullish' | 'bearish' | 'neutral';
export type Verdict = 'aggressive' | 'neutral' | 'cautious' | 'avoid';

export interface MarketAnalysis {
  id: string;
  symbol: string;
  summary: string;
  sentiment: Sentiment;
  key_factors: string[];
  created_at: string;
}

export interface TradeRecommendation {
  id: string;
  analysis_id: string;
  symbol: string;
  verdict: Verdict;
  entry_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  confidence: number;
  reasoning: string;
  created_at: string;
}

export interface MarketAgentResult {
  analysis: MarketAnalysis;
  recommendation: TradeRecommendation;
  cached: boolean;
}

export async function runMarketAgent(symbol: string, technicalContext?: string): Promise<MarketAgentResult> {
  const { data, error } = await supabase.functions.invoke('market-agent', {
    body: { symbol, technicalContext },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as MarketAgentResult;
}

export const VERDICT_COLOR: Record<Verdict, string> = {
  aggressive: '#00ff88',
  neutral: '#00aaff',
  cautious: '#ffd700',
  avoid: '#ff3355',
};

export const VERDICT_LABEL: Record<Verdict, string> = {
  aggressive: 'PRESS THE TRADE',
  neutral: 'NO STRONG EDGE',
  cautious: 'SIZE DOWN / WAIT',
  avoid: 'SIT THIS ONE OUT',
};

export const SENTIMENT_COLOR: Record<Sentiment, string> = {
  bullish: '#00ff88',
  bearish: '#ff3355',
  neutral: '#64748b',
};
