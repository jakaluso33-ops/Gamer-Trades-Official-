import { supabase } from './supabase';

export type ActivityEventType =
  | 'trade_closed'
  | 'ai_battle_played'
  | 'ai_battle_won'
  | 'pvp_battle_played'
  | 'pvp_battle_won'
  | 'friend_request_sent'
  | 'friend_added'
  | 'daily_checkin'
  | 'funds_deposited'
  | 'lesson_completed'
  | 'skill_quiz_passed'
  | 'skill_trade_challenge_passed'
  | 'chart_classroom_correct';

export async function logEvent(userId: string, eventType: ActivityEventType, metadata: Record<string, unknown> = {}) {
  await supabase.from('activity_events').insert({ user_id: userId, event_type: eventType, metadata });
}
