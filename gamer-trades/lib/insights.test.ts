import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Profile, TradingGoal, Task } from './supabase';

interface MockEvent {
  event_type: string;
  created_at: string;
}

const mockData: { events: MockEvent[]; goals: Partial<TradingGoal>[]; tasks: Partial<Task>[] } = {
  events: [],
  goals: [],
  tasks: [],
};

function chainable(data: unknown) {
  const builder: Record<string, unknown> = {};
  const self = () => builder;
  builder.select = self;
  builder.eq = self;
  builder.gte = self;
  builder.in = self;
  builder.then = (resolve: (v: { data: unknown; error: null }) => void) => resolve({ data, error: null });
  return builder;
}

vi.mock('./supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'activity_events') return chainable(mockData.events);
      if (table === 'trading_goals') return chainable(mockData.goals);
      if (table === 'tasks') return chainable(mockData.tasks);
      throw new Error(`Unexpected table in test: ${table}`);
    },
  },
}));

const { computeInsights } = await import('./insights');

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'user-1',
    username: 'PLAYER_01',
    avatar_url: null,
    plan: 'free',
    xp: 100,
    level: 1,
    total_wins: 0,
    total_losses: 0,
    created_at: daysAgoISO(30),
    ...overrides,
  };
}

function daysAgoISO(n: number, hour = 12): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function event(type: string, daysAgo: number): MockEvent {
  return { event_type: type, created_at: daysAgoISO(daysAgo) };
}

beforeEach(() => {
  mockData.events = [];
  mockData.goals = [];
  mockData.tasks = [];
});

describe('computeInsights', () => {
  it('flags inactivity when the account is old but no trades closed in 7 days', async () => {
    const insights = await computeInsights('user-1', profile({ created_at: daysAgoISO(10) }));
    expect(insights.some(i => i.id === 'inactive')).toBe(true);
  });

  it('does not flag inactivity for a brand-new account', async () => {
    const insights = await computeInsights('user-1', profile({ created_at: daysAgoISO(1) }));
    expect(insights.some(i => i.id === 'inactive')).toBe(false);
  });

  it('does not flag inactivity when a trade closed recently', async () => {
    mockData.events = [event('trade_closed', 2)];
    const insights = await computeInsights('user-1', profile({ created_at: daysAgoISO(10) }));
    expect(insights.some(i => i.id === 'inactive')).toBe(false);
  });

  it('flags a low PvP win rate after enough battles', async () => {
    mockData.events = [
      ...Array(5).fill(null).map(() => event('pvp_battle_played', 1)),
      ...Array(1).fill(null).map(() => event('pvp_battle_won', 1)),
    ];
    const insights = await computeInsights('user-1', profile());
    const pvpLow = insights.find(i => i.id === 'pvp_low');
    expect(pvpLow).toBeDefined();
    expect(pvpLow?.tone).toBe('warning');
  });

  it('celebrates a high PvP win rate after enough battles', async () => {
    mockData.events = [
      ...Array(5).fill(null).map(() => event('pvp_battle_played', 1)),
      ...Array(4).fill(null).map(() => event('pvp_battle_won', 1)),
    ];
    const insights = await computeInsights('user-1', profile());
    const pvpHigh = insights.find(i => i.id === 'pvp_high');
    expect(pvpHigh).toBeDefined();
    expect(pvpHigh?.tone).toBe('positive');
  });

  it('does not surface a PvP insight with too few battles', async () => {
    mockData.events = [event('pvp_battle_played', 1), event('pvp_battle_won', 1)];
    const insights = await computeInsights('user-1', profile());
    expect(insights.some(i => i.id === 'pvp_low' || i.id === 'pvp_high')).toBe(false);
  });

  it('recognizes an active check-in streak', async () => {
    mockData.events = [event('daily_checkin', 0), event('daily_checkin', 1), event('daily_checkin', 2)];
    const insights = await computeInsights('user-1', profile());
    expect(insights.some(i => i.id === 'streak')).toBe(true);
  });

  it('flags a broken streak on an older, inactive account', async () => {
    const insights = await computeInsights('user-1', profile({ created_at: daysAgoISO(10) }));
    expect(insights.some(i => i.id === 'streak_broken')).toBe(true);
  });

  it('surfaces the social-gap tip when friends exist but no PvP battles played', async () => {
    mockData.events = [event('friend_added', 5)];
    const insights = await computeInsights('user-1', profile());
    expect(insights.some(i => i.id === 'social_gap')).toBe(true);
  });

  it('flags no_goals when there are no active trading goals', async () => {
    const insights = await computeInsights('user-1', profile());
    expect(insights.some(i => i.id === 'no_goals')).toBe(true);
  });

  it('does not flag no_goals when a goal is active', async () => {
    mockData.goals = [{ id: 'g1', user_id: 'user-1', template_id: 'discipline', status: 'active' }];
    const insights = await computeInsights('user-1', profile());
    expect(insights.some(i => i.id === 'no_goals')).toBe(false);
  });

  it('sorts warnings before tips before positives, and caps at 4', async () => {
    mockData.goals = [{ id: 'g1', user_id: 'user-1', template_id: 'discipline', status: 'active' }];
    mockData.events = [
      event('daily_checkin', 0), event('daily_checkin', 1), event('daily_checkin', 2),
      event('friend_added', 5),
    ];
    const insights = await computeInsights('user-1', profile({ created_at: daysAgoISO(10) }));
    expect(insights.length).toBeLessThanOrEqual(4);
    const priority: Record<string, number> = { warning: 0, tip: 1, positive: 2 };
    for (let i = 1; i < insights.length; i++) {
      expect(priority[insights[i - 1].tone]).toBeLessThanOrEqual(priority[insights[i].tone]);
    }
  });

  it('returns an empty list for a quiet, brand-new account with a goal set', async () => {
    mockData.goals = [{ id: 'g1', user_id: 'user-1', template_id: 'discipline', status: 'active' }];
    const insights = await computeInsights('user-1', profile({ created_at: daysAgoISO(1) }));
    expect(insights).toEqual([]);
  });
});
