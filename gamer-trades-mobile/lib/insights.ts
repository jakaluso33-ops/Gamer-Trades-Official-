import { supabase, Profile, TradingGoal, Task } from './supabase';

export type InsightTone = 'warning' | 'tip' | 'positive';

export interface Insight {
  id: string;
  tone: InsightTone;
  icon: string;
  title: string;
  message: string;
  actionLabel: string;
  actionKey: 'trade' | 'battle' | 'friends' | 'challenges' | 'dashboard';
}

interface EventRow {
  event_type: string;
  created_at: string;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function countSince(events: EventRow[], type: string, since: Date) {
  return events.filter(e => e.event_type === type && new Date(e.created_at) >= since).length;
}

function checkinStreak(events: EventRow[]): number {
  const days = new Set(events.filter(e => e.event_type === 'daily_checkin').map(e => e.created_at.slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  // allow "today not yet checked in" to not break a streak that includes yesterday
  if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export async function computeInsights(userId: string, profile: Profile | null): Promise<Insight[]> {
  const since30 = daysAgo(30);
  const since7 = daysAgo(7);

  const [{ data: events }, { data: goals }, { data: tasks }] = await Promise.all([
    supabase.from('activity_events').select('event_type, created_at').eq('user_id', userId).gte('created_at', since30.toISOString()),
    supabase.from('trading_goals').select('*').eq('user_id', userId).eq('status', 'active'),
    supabase.from('tasks').select('*').eq('user_id', userId).in('status', ['active', 'completed']),
  ]);

  const evs = (events ?? []) as EventRow[];
  const activeGoals = (goals ?? []) as TradingGoal[];
  const activeTasks = (tasks ?? []) as Task[];
  const insights: Insight[] = [];

  // Inactivity
  const accountAgeDays = profile ? (Date.now() - new Date(profile.created_at).getTime()) / 86400000 : 0;
  const recentTrades = countSince(evs, 'trade_closed', since7);
  if (accountAgeDays > 3 && recentTrades === 0) {
    insights.push({
      id: 'inactive',
      tone: 'warning',
      icon: '📉',
      title: 'Gone quiet on trading',
      message: "You haven't closed a trade in the last 7 days. A short session today keeps your streak and goals moving.",
      actionLabel: 'GO TRADE',
      actionKey: 'trade',
    });
  }

  // PvP win rate
  const pvpPlayed = countSince(evs, 'pvp_battle_played', since30);
  const pvpWon = countSince(evs, 'pvp_battle_won', since30);
  if (pvpPlayed >= 3) {
    const winRate = pvpWon / pvpPlayed;
    if (winRate < 0.4) {
      insights.push({
        id: 'pvp_low',
        tone: 'warning',
        icon: '⚔',
        title: 'PvP win rate is slipping',
        message: `${Math.round(winRate * 100)}% wins over your last ${pvpPlayed} PvP battles. Warm up against a Rookie AI to rebuild your strategy before your next friend challenge.`,
        actionLabel: 'PRACTICE VS AI',
        actionKey: 'battle',
      });
    } else if (winRate >= 0.7) {
      insights.push({
        id: 'pvp_high',
        tone: 'positive',
        icon: '🏆',
        title: "You're on a roll in PvP",
        message: `${Math.round(winRate * 100)}% wins over your last ${pvpPlayed} PvP battles. Time to challenge tougher opponents.`,
        actionLabel: 'FIND A CHALLENGE',
        actionKey: 'friends',
      });
    }
  }

  // AI win rate
  const aiPlayed = countSince(evs, 'ai_battle_played', since30);
  const aiWon = countSince(evs, 'ai_battle_won', since30);
  if (aiPlayed >= 3) {
    const winRate = aiWon / aiPlayed;
    if (winRate < 0.35) {
      insights.push({
        id: 'ai_low',
        tone: 'tip',
        icon: '🤖',
        title: 'The bots have your number',
        message: `Only ${Math.round(winRate * 100)}% wins against AI over ${aiPlayed} battles lately. Try dropping to Rookie difficulty to rebuild confidence.`,
        actionLabel: 'ADJUST DIFFICULTY',
        actionKey: 'battle',
      });
    }
  }

  // Check-in streak
  const streak = checkinStreak(evs);
  if (streak >= 3) {
    insights.push({
      id: 'streak',
      tone: 'positive',
      icon: '🔥',
      title: `${streak}-day check-in streak`,
      message: "You've shown up every day this streak. Consistency compounds — keep it going.",
      actionLabel: 'VIEW GOALS',
      actionKey: 'challenges',
    });
  } else if (accountAgeDays > 5 && streak === 0) {
    insights.push({
      id: 'streak_broken',
      tone: 'tip',
      icon: '🧘',
      title: 'Build a daily habit',
      message: "You haven't checked in the last couple of days. A quick daily look at your positions builds real discipline.",
      actionLabel: 'CHECK IN',
      actionKey: 'dashboard',
    });
  }

  // Social gap
  const friendsAdded = countSince(evs, 'friend_added', daysAgo(365));
  if (friendsAdded > 0 && pvpPlayed === 0) {
    insights.push({
      id: 'social_gap',
      tone: 'tip',
      icon: '🤝',
      title: "You've got friends, use them",
      message: "You've added friends but haven't battled any yet. A PvP match is the fastest way to level up.",
      actionLabel: 'CHALLENGE A FRIEND',
      actionKey: 'battle',
    });
  }

  // Most behind-pace task across active goals
  if (activeGoals.length > 0 && activeTasks.length > 0) {
    const now = new Date();
    let worst: { title: string; pct: number; daysLeftFraction: number } | null = null;
    for (const task of activeTasks) {
      if (task.status !== 'active' || task.period === 'daily') continue;
      const start = new Date(`${task.period_start}T00:00:00Z`);
      const end = new Date(`${task.period_end}T23:59:59Z`);
      const totalMs = end.getTime() - start.getTime();
      const elapsedMs = now.getTime() - start.getTime();
      if (totalMs <= 0) continue;
      const elapsedFraction = Math.min(1, Math.max(0, elapsedMs / totalMs));
      const progressFraction = Math.min(1, task.progress / task.target);
      const gap = elapsedFraction - progressFraction;
      if (gap > 0.35 && (!worst || gap > worst.daysLeftFraction)) {
        worst = { title: task.title, pct: Math.round(progressFraction * 100), daysLeftFraction: gap };
      }
    }
    if (worst) {
      insights.push({
        id: 'behind_task',
        tone: 'warning',
        icon: '⏳',
        title: 'Falling behind on a task',
        message: `"${worst.title}" is only ${worst.pct}% done relative to how much time is left in the period.`,
        actionLabel: 'VIEW TASKS',
        actionKey: 'challenges',
      });
    }
  }

  // No goals set at all
  if (activeGoals.length === 0) {
    insights.push({
      id: 'no_goals',
      tone: 'tip',
      icon: '🎯',
      title: 'No active goals yet',
      message: 'Pick a trading goal and get a tailored daily, weekly, and monthly task set built around it.',
      actionLabel: 'SET A GOAL',
      actionKey: 'challenges',
    });
  }

  const priority: Record<InsightTone, number> = { warning: 0, tip: 1, positive: 2 };
  insights.sort((a, b) => priority[a.tone] - priority[b.tone]);
  return insights.slice(0, 4);
}
