export type Plan = 'free' | 'pro' | 'legend';

/** Free users get every market, just capped/gated on the social + premium-intel features. */
export const FREE_AI_ANALYST_DAILY_LIMIT = 2;

export function canPlayAiBattle(plan: Plan): boolean {
  return plan !== 'free';
}

export function canPlayPvp(plan: Plan): boolean {
  return plan !== 'free';
}

export function aiAnalystDailyLimit(plan: Plan): number | null {
  return plan === 'free' ? FREE_AI_ANALYST_DAILY_LIMIT : null;
}

function aiRunsKey(userId: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `gt_ai_runs_${userId}_${today}`;
}

/** Client-side daily counter for the free-tier AI analyst cap. */
export function getAiAnalystRunsToday(userId: string): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(window.localStorage.getItem(aiRunsKey(userId)) ?? '0', 10);
}

export function incrementAiAnalystRunsToday(userId: string): number {
  const next = getAiAnalystRunsToday(userId) + 1;
  if (typeof window !== 'undefined') window.localStorage.setItem(aiRunsKey(userId), String(next));
  return next;
}

export const PLANS = [
  {
    name: 'FREE' as Plan,
    price: '$0',
    color: '#64748b',
    features: [
      'All 6 markets (stocks, crypto, forex, futures, options, indices)',
      `${FREE_AI_ANALYST_DAILY_LIMIT} AI news analyses/day`,
      'View leaderboard',
      '1 daily challenge',
    ],
  },
  {
    name: 'PRO' as Plan,
    price: '$9.99/mo',
    priceId: 'price_1TyPNg2L13T2P1hwBpKLA24J',
    color: '#00aaff',
    features: [
      'Everything in Free',
      'Unlimited AI news analysis',
      'Play vs AI opponents',
      'Play vs friends (PvP)',
      '3 daily challenges',
      'Tournament access',
    ],
  },
  {
    name: 'LEGEND' as Plan,
    price: '$24.99/mo',
    priceId: 'price_1TyPOM2L13T2P1hw9tGtlMU9',
    annualPrice: '$120/yr',
    annualPriceId: 'price_1TyPOP2L13T2P1hwLwvXyBdS',
    color: '#ffd700',
    features: [
      'Everything in PRO',
      'Exclusive AI personalities',
      'Custom avatar skins',
      'Priority leaderboard badge',
      'Early access features',
      'Tournament seeding',
    ],
  },
];
