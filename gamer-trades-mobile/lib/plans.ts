import AsyncStorage from '@react-native-async-storage/async-storage';
import { TRADERGPT_FREE_DAILY_LIMIT } from './traderGpt';

export type Plan = 'free' | 'pro' | 'legend';

/** Free users get every market, just capped/gated on the social + premium-intel features. */
export const FREE_AI_ANALYST_DAILY_LIMIT = 2;

export function canPlayAiBattle(plan: Plan): boolean {
  return plan !== 'free';
}

export function canPlayPvp(plan: Plan): boolean {
  return plan !== 'free';
}

export function canBuildBots(plan: Plan): boolean {
  return plan === 'legend';
}

export function aiAnalystDailyLimit(plan: Plan): number | null {
  return plan === 'free' ? FREE_AI_ANALYST_DAILY_LIMIT : null;
}

/** Max concurrently-active goals (each active goal generates one daily/weekly/monthly task
 * in Goals & Tasks) -- this is the actual mechanism behind the "1 daily challenge" (free) vs
 * "3 daily challenges" (Pro/Legend) line in the plan comparison, previously just marketing
 * copy with no code enforcing it. */
export function maxActiveGoals(plan: Plan): number {
  return plan === 'free' ? 1 : 3;
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

/** In Practice Mode, revealing the exact computed entry/stop/target for the strategy's
 * currently-firing signal is the "answer key" -- Pro gets one reveal per day (nudges them to
 * actually try reading the setup themselves first), Legend gets unlimited reveals. */
export function practiceRevealDailyLimit(plan: Plan): number | null {
  return plan === 'pro' ? 1 : null;
}

function practiceRevealKey(userId: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `gt_practice_reveal_${userId}_${today}`;
}

export async function getPracticeRevealsToday(userId: string): Promise<number> {
  const v = await AsyncStorage.getItem(practiceRevealKey(userId));
  return parseInt(v ?? '0', 10);
}

export async function incrementPracticeRevealsToday(userId: string): Promise<number> {
  const next = (await getPracticeRevealsToday(userId)) + 1;
  await AsyncStorage.setItem(practiceRevealKey(userId), String(next));
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
      `${TRADERGPT_FREE_DAILY_LIMIT} TraderGPT questions/day`,
    ],
  },
  {
    name: 'pro',
    price: '$6.99/mo',
    priceId: 'price_1TlN8r2OMSlqCc2ouKr7BR73',
    annualPrice: '$69.99/yr',
    annualPriceId: 'price_1TlN942OMSlqCc2oPeVfdiIk',
    color: '#00aaff',
    features: [
      'Everything in Free',
      'Unlimited AI news analysis',
      'Play vs AI opponents',
      'Play vs friends (PvP)',
      '3 active goals (vs 1 free)',
      'Monthly Pro tournament — bigger starting balance, real leaderboard',
      'Live candlestick pattern detection',
      'Proven-profitable strategies (Turtle Trading, Momentum)',
      'Unlimited TraderGPT — ask AI anything about trading',
      'Practice Mode — backtest any strategy risk-free',
      '1 entry/exit reveal/day in Practice Mode',
    ],
  },
  {
    name: 'legend',
    price: '$24.99/mo',
    priceId: 'price_1UBIiz2OMSlqCc2oXaAMjT3o',
    annualPrice: '$199.99/yr',
    annualPriceId: 'price_1UBIj12OMSlqCc2oYaK4dSZt',
    color: '#ffd700',
    features: [
      'Everything in Pro',
      'Build Your Bot — no-code multi-condition strategy builder',
      'Deploy bots to trade live markets autonomously (paper trading)',
      'Live 24/7 execution, even while the app is closed',
      'Priority access to future broker integrations',
      'Unlimited entry/exit reveals in Practice Mode',
    ],
  },
];

export function getPlan(name: Plan) {
  return PLANS.find(p => p.name === name)!;
}
