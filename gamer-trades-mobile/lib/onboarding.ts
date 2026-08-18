import { supabase } from './supabase';

export async function markOnboarded(userId: string): Promise<void> {
  await supabase.from('profiles').update({ onboarded_at: new Date().toISOString() }).eq('id', userId);
}
