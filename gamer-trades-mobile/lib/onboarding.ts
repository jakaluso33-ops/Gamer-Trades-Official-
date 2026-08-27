import { supabase } from './supabase';

export async function markOnboarded(userId: string): Promise<void> {
  await supabase.from('profiles').update({ onboarded_at: new Date().toISOString() }).eq('id', userId);
}

export async function markNotificationPromptSeen(userId: string): Promise<void> {
  await supabase.from('profiles').update({ notification_prompt_seen_at: new Date().toISOString() }).eq('id', userId);
}
