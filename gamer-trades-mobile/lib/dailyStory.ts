import { supabase } from './supabase';

export interface DailyStory {
  story_date: string;
  symbol: string;
  headline: string;
  summary: string;
  direction: 'bullish' | 'bearish' | 'neutral';
}

export async function getDailyStory(): Promise<DailyStory> {
  const { data, error } = await supabase.functions.invoke('daily-story-agent', { body: {} });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return (data as { story: DailyStory }).story;
}
