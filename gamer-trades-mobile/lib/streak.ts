import { supabase } from './supabase';
import { logEvent } from './activity';

export interface CheckinResult {
  streakCount: number;
  isNewCheckin: boolean;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

/**
 * Records at most one check-in per calendar day and maintains a running streak:
 * consecutive days extend it, a skipped day resets it to 1. Safe to call on every
 * app open — no-ops (and returns the current streak) if already checked in today.
 */
export async function recordDailyCheckin(userId: string): Promise<CheckinResult> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('streak_count, last_checkin_date')
    .eq('id', userId)
    .single();
  if (error) throw error;

  const today = todayStr();
  const last = (profile as { last_checkin_date: string | null }).last_checkin_date;
  const prevStreak = (profile as { streak_count: number }).streak_count;

  if (last === today) {
    return { streakCount: prevStreak, isNewCheckin: false };
  }

  const gap = last ? daysBetween(last, today) : null;
  const nextStreak = gap === 1 ? prevStreak + 1 : 1;

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ streak_count: nextStreak, last_checkin_date: today })
    .eq('id', userId);
  if (updateErr) throw updateErr;

  await logEvent(userId, 'daily_checkin', { streak: nextStreak });

  return { streakCount: nextStreak, isNewCheckin: true };
}
