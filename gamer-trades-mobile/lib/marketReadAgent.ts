import { supabase, unwrapFunctionError } from './supabase';
import { MarketSnapshot } from './marketRead';
import { SkillLevel } from './curriculum';

export interface MarketRead {
  regimeLabel: string;
  read: string;
  momentum: 'bullish' | 'bearish' | 'neutral';
  volatility: 'low' | 'normal' | 'high';
  whatToWatch: string;
}

export async function runMarketReadAgent(symbol: string, snapshot: MarketSnapshot, skillLevel: SkillLevel | null): Promise<MarketRead> {
  const { data, error } = await supabase.functions.invoke('market-read-agent', {
    body: { symbol, snapshot, skillLevel: skillLevel ?? 'beginner' },
  });
  if (error) throw await unwrapFunctionError(error);
  if (data?.error) throw new Error(data.error);
  return (data as { read: MarketRead }).read;
}
