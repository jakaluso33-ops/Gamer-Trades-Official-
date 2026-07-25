import { supabase } from './supabase';
import { ActivityEventType } from './activity';

export type TaskPeriod = 'daily' | 'weekly' | 'monthly';

export interface TaskBlueprint {
  eventType: ActivityEventType;
  target: number;
  title: string;
  description: string;
  xp: number;
}

export interface GoalTemplate {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  targetUnit: string;
  defaultTarget: number;
  tasks: Record<TaskPeriod, TaskBlueprint>;
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: 'win_rate',
    label: 'SHARPEN YOUR EDGE',
    icon: '🎯',
    color: '#ffd700',
    description: 'Improve your win rate through deliberate practice against AI and other traders.',
    targetUnit: '% win rate',
    defaultTarget: 60,
    tasks: {
      daily: { eventType: 'ai_battle_played', target: 1, title: 'Play 1 AI battle', description: 'Sharpen your strategy against an AI opponent today.', xp: 40 },
      weekly: { eventType: 'pvp_battle_won', target: 2, title: 'Win 2 PvP battles', description: 'Prove your edge against real traders this week.', xp: 200 },
      monthly: { eventType: 'pvp_battle_won', target: 8, title: 'Win 8 PvP battles', description: 'Hit a strong win streak across the month.', xp: 600 },
    },
  },
  {
    id: 'grow_portfolio',
    label: 'GROW YOUR PORTFOLIO',
    icon: '💰',
    color: '#00ff88',
    description: 'Stay active in the market and compound your paper-trading gains.',
    targetUnit: '% growth',
    defaultTarget: 10,
    tasks: {
      daily: { eventType: 'trade_closed', target: 3, title: 'Close 3 trades', description: 'Keep your capital working today.', xp: 40 },
      weekly: { eventType: 'trade_closed', target: 15, title: 'Close 15 trades', description: 'Stay consistently active this week.', xp: 180 },
      monthly: { eventType: 'trade_closed', target: 60, title: 'Close 60 trades', description: 'Build a real track record this month.', xp: 600 },
    },
  },
  {
    id: 'master_asset',
    label: 'MASTER NEW MARKETS',
    icon: '🌐',
    color: '#00aaff',
    description: 'Branch out and get comfortable trading across different asset classes.',
    targetUnit: 'trades',
    defaultTarget: 40,
    tasks: {
      daily: { eventType: 'trade_closed', target: 2, title: 'Trade 2 different assets', description: 'Explore a market outside your comfort zone today.', xp: 40 },
      weekly: { eventType: 'trade_closed', target: 10, title: 'Close 10 trades', description: 'Keep exploring new markets this week.', xp: 180 },
      monthly: { eventType: 'trade_closed', target: 40, title: 'Close 40 trades', description: 'Build real reps across new asset classes.', xp: 600 },
    },
  },
  {
    id: 'discipline',
    label: 'TRADE WITH DISCIPLINE',
    icon: '🧘',
    color: '#8b5cf6',
    description: 'Build the daily habit of checking in and trading with a plan.',
    targetUnit: 'days active',
    defaultTarget: 20,
    tasks: {
      daily: { eventType: 'daily_checkin', target: 1, title: 'Check in on your positions', description: 'Review your open positions and the market today.', xp: 30 },
      weekly: { eventType: 'daily_checkin', target: 5, title: 'Check in 5 days this week', description: 'Build the daily habit — 5 out of 7 days.', xp: 150 },
      monthly: { eventType: 'daily_checkin', target: 20, title: 'Check in 20 days this month', description: 'Consistency compounds — show up most days.', xp: 500 },
    },
  },
  {
    id: 'beat_ai',
    label: 'BEAT THE BOTS',
    icon: '🤖',
    color: '#ff8800',
    description: 'Take down every AI opponent, from Rookie to Legend.',
    targetUnit: 'AI wins',
    defaultTarget: 10,
    tasks: {
      daily: { eventType: 'ai_battle_played', target: 1, title: 'Play 1 AI battle', description: 'Take on an AI opponent today.', xp: 40 },
      weekly: { eventType: 'ai_battle_won', target: 3, title: 'Win 3 AI battles', description: 'Beat the bots 3 times this week.', xp: 200 },
      monthly: { eventType: 'ai_battle_won', target: 10, title: 'Win 10 AI battles', description: 'Dominate the AI leaderboard this month.', xp: 600 },
    },
  },
  {
    id: 'social',
    label: 'BUILD YOUR SQUAD',
    icon: '🤝',
    color: '#00ffff',
    description: 'Grow your network and battle friends instead of bots.',
    targetUnit: 'friends',
    defaultTarget: 5,
    tasks: {
      daily: { eventType: 'friend_request_sent', target: 1, title: 'Send 1 friend request', description: 'Grow your trading circle today.', xp: 30 },
      weekly: { eventType: 'pvp_battle_played', target: 2, title: 'Battle a friend twice', description: 'Challenge a friend to a PvP battle this week.', xp: 150 },
      monthly: { eventType: 'friend_added', target: 5, title: 'Add 5 new friends', description: 'Build out your squad this month.', xp: 500 },
    },
  },
];

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function dayRange(now: Date) {
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  return { start, end: start };
}

function weekRange(now: Date) {
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(now); start.setHours(0, 0, 0, 0); start.setDate(now.getDate() + diffToMonday);
  const end = new Date(start); end.setDate(start.getDate() + 6);
  return { start, end };
}

function monthRange(now: Date) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start, end };
}

export async function ensureTasksForActiveGoals(userId: string) {
  const { data: goals } = await supabase.from('trading_goals').select('*').eq('user_id', userId).eq('status', 'active');
  if (!goals || goals.length === 0) return;

  const now = new Date();
  const periods: { period: TaskPeriod; start: Date; end: Date }[] = [
    { period: 'daily', ...dayRange(now) },
    { period: 'weekly', ...weekRange(now) },
    { period: 'monthly', ...monthRange(now) },
  ];

  for (const goal of goals) {
    const template = GOAL_TEMPLATES.find(t => t.id === goal.template_id);
    if (!template) continue;
    for (const p of periods) {
      const bp = template.tasks[p.period];
      await supabase.from('tasks').upsert(
        {
          user_id: userId,
          goal_id: goal.id,
          period: p.period,
          event_type: bp.eventType,
          title: bp.title,
          description: bp.description,
          target: bp.target,
          xp_reward: bp.xp,
          period_start: toDateStr(p.start),
          period_end: toDateStr(p.end),
        },
        { onConflict: 'user_id,goal_id,period,period_start', ignoreDuplicates: true }
      );
    }
  }
}

export async function refreshTaskProgress(userId: string) {
  const today = toDateStr(new Date());

  await supabase.from('tasks').update({ status: 'expired' }).eq('user_id', userId).eq('status', 'active').lt('period_end', today);

  const { data: tasks } = await supabase.from('tasks').select('*').eq('user_id', userId).eq('status', 'active');
  if (!tasks) return;

  for (const task of tasks) {
    const endExclusive = new Date(`${task.period_end}T00:00:00Z`);
    endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

    const { count } = await supabase
      .from('activity_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('event_type', task.event_type)
      .gte('created_at', `${task.period_start}T00:00:00.000Z`)
      .lt('created_at', endExclusive.toISOString());

    const progress = count ?? 0;
    if (progress === task.progress) continue;

    const completed = progress >= task.target;
    const { data: updated } = await supabase
      .from('tasks')
      .update({ progress, status: completed ? 'completed' : 'active' })
      .eq('id', task.id)
      .eq('status', 'active')
      .select()
      .single();

    if (updated && completed) {
      const { data: profile } = await supabase.from('profiles').select('xp').eq('id', userId).single();
      if (profile) await supabase.from('profiles').update({ xp: profile.xp + task.xp_reward }).eq('id', userId);
    }
  }
}

export async function syncTasks(userId: string) {
  await ensureTasksForActiveGoals(userId);
  await refreshTaskProgress(userId);
}
