import { supabase } from './supabase';
import { SkillLevel } from './curriculum';

export type TradeVerdict = 'take' | 'skip' | 'wait';

export interface ScreenshotReview {
  verdict: TradeVerdict;
  confidence: number;
  headline: string;
  whatISee: string;
  reasoning: string;
  keyRisk: string;
}

export const VERDICT_COLOR: Record<TradeVerdict, string> = {
  take: '#00ff88',
  skip: '#ff3355',
  wait: '#ffd700',
};

export const VERDICT_LABEL: Record<TradeVerdict, string> = {
  take: '✔ LOOKS LIKE A TAKE',
  skip: '✕ SKIP THIS ONE',
  wait: '⏳ WAIT FOR MORE CONFIRMATION',
};

export async function runScreenshotAgent(
  imageBase64: string,
  symbol: string,
  livePrice: number,
  skillLevel: SkillLevel | null
): Promise<ScreenshotReview> {
  const { data, error } = await supabase.functions.invoke('screenshot-trade-agent', {
    body: { imageBase64, mediaType: 'image/png', symbol, livePrice, skillLevel: skillLevel ?? 'beginner' },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return (data as { review: ScreenshotReview }).review;
}
