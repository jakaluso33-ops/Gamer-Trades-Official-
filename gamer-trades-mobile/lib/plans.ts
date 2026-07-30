import AsyncStorage from '@react-native-async-storage/async-storage';

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
export async function getAiAnalystRunsToday(userId: string): Promise<number> {
  const v = await AsyncStorage.getItem(aiRunsKey(userId));
  return parseInt(v ?? '0', 10);
}

export async function incrementAiAnalystRunsToday(userId: string): Promise<number> {
  const next = (await getAiAnalystRunsToday(userId)) + 1;
  await AsyncStorage.setItem(aiRunsKey(userId), String(next));
  return next;
}

export const PLANS: {
  name: Plan;
  price: string;
  priceId?: string;
  annualPrice?: string;
  annualPriceId?: string;
  color: string;
  features: string[];
}[] = [
  {
    name: 'free',
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
    name: 'pro',
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
    name: 'legend',
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
