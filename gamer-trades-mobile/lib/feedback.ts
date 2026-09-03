import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase, unwrapFunctionError } from './supabase';

export type FeedbackCategory = 'general' | 'bug' | 'feature_request' | 'praise';

export const FEEDBACK_CATEGORIES: { value: FeedbackCategory; label: string; icon: string }[] = [
  { value: 'general', label: 'General', icon: '💬' },
  { value: 'bug', label: 'Something Broken', icon: '🐛' },
  { value: 'feature_request', label: 'Feature Idea', icon: '💡' },
  { value: 'praise', label: 'Just Saying Thanks', icon: '⭐' },
];

/** Inserts feedback (RLS-scoped to the caller), then best-effort relays it to Discord for
 * real-time visibility -- a Discord-post failure (e.g. webhook not configured yet) never
 * fails the submission itself, since the feedback is already safely stored either way. */
export async function submitFeedback(userId: string, category: FeedbackCategory, message: string): Promise<void> {
  const appVersion = (Constants.expoConfig?.version as string | undefined) ?? 'unknown';
  const { data, error } = await supabase
    .from('feedback')
    .insert({ user_id: userId, category, message, app_version: appVersion, platform: Platform.OS })
    .select('id')
    .single();
  if (error) throw error;

  supabase.functions
    .invoke('discord-feedback-notify', { body: { feedbackId: (data as { id: string }).id } })
    .then(async ({ error: notifyError }) => {
      if (notifyError) console.error('discord-feedback-notify failed', await unwrapFunctionError(notifyError));
    })
    .catch(err => console.error('discord-feedback-notify failed', err));
}
