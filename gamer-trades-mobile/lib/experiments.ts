import { supabase } from './supabase';

export type ExperimentKey = 'pricing_set' | 'trial_length' | 'onboarding_copy';

/**
 * Assigns a user to a random variant of an experiment the first time they hit it, and
 * persists it so they see the same variant on every future visit. Only variants with
 * active:true are eligible to be assigned to NEW users — a variant can be deactivated
 * (e.g. because its Stripe prices don't exist yet) without breaking anyone already in it.
 */
async function getOrAssignVariant(userId: string, experimentKey: ExperimentKey, activeVariantKeys: string[]): Promise<string> {
  const { data: existing } = await supabase
    .from('experiment_assignments')
    .select('variant_key')
    .eq('user_id', userId)
    .eq('experiment_key', experimentKey)
    .maybeSingle();
  if (existing) return existing.variant_key as string;

  const variant = activeVariantKeys[Math.floor(Math.random() * activeVariantKeys.length)];
  const { error } = await supabase
    .from('experiment_assignments')
    .insert({ user_id: userId, experiment_key: experimentKey, variant_key: variant });

  if (error) {
    // Another concurrent call (e.g. a double-mount) may have already inserted the row —
    // re-fetch so both callers end up agreeing on the same persisted variant.
    const { data: after } = await supabase
      .from('experiment_assignments')
      .select('variant_key')
      .eq('user_id', userId)
      .eq('experiment_key', experimentKey)
      .single();
    return (after?.variant_key as string) ?? variant;
  }
  return variant;
}

// ---------------------------------------------------------------------------
// Pricing set — the whole Pro + Legend price table shown in onboarding. Testing
// the table as a unit (not each price independently) is how real pricing tests
// are run: a user should see one internally-consistent set of numbers.
//
// Benchmarked against comparable gamified/social trading-education apps (Aug 2026):
// Invstr Pro $3.99/mo, Invstr+ $9.99/mo, "Alpha Chart" trading simulator $20/mo.
// GamerTrades' control price already sits at the top of that comp set (Invstr+
// parity) — the "value" variant tests whether undercutting converts better overall
// (lower price, more signups) vs. the "premium" variant testing whether GamerTrades'
// AI-battle/PvP mechanic (which none of those comps have) supports a higher price.
// ---------------------------------------------------------------------------
export interface PricingSetVariant {
  key: 'value' | 'control' | 'premium';
  active: boolean;
  pro: { price: string; priceId: string };
  legend: { price: string; annualPrice: string; priceId: string; annualPriceId: string };
}

export const PRICING_SETS: PricingSetVariant[] = [
  {
    key: 'value',
    // Needs real Stripe Price objects before this can go live — see README note in onboarding.tsx.
    active: false,
    pro: { price: '$7.99/mo', priceId: 'price_TODO_VALUE_PRO' },
    legend: { price: '$19.99/mo', annualPrice: '$96/yr', priceId: 'price_TODO_VALUE_LEGEND', annualPriceId: 'price_TODO_VALUE_LEGEND_ANNUAL' },
  },
  {
    key: 'control',
    active: true,
    pro: { price: '$9.99/mo', priceId: 'price_1TyPNg2L13T2P1hwBpKLA24J' },
    legend: { price: '$24.99/mo', annualPrice: '$120/yr', priceId: 'price_1TyPOM2L13T2P1hw9tGtlMU9', annualPriceId: 'price_1TyPOP2L13T2P1hwLwvXyBdS' },
  },
  {
    key: 'premium',
    active: false,
    pro: { price: '$12.99/mo', priceId: 'price_TODO_PREMIUM_PRO' },
    legend: { price: '$29.99/mo', annualPrice: '$144/yr', priceId: 'price_TODO_PREMIUM_LEGEND', annualPriceId: 'price_TODO_PREMIUM_LEGEND_ANNUAL' },
  },
];

export function getPricingSet(key: string): PricingSetVariant {
  return PRICING_SETS.find(p => p.key === key) ?? PRICING_SETS.find(p => p.key === 'control')!;
}

export async function assignPricingSet(userId: string): Promise<PricingSetVariant> {
  const active = PRICING_SETS.filter(p => p.active).map(p => p.key);
  const key = await getOrAssignVariant(userId, 'pricing_set', active.length > 0 ? active : ['control']);
  return getPricingSet(key);
}

// ---------------------------------------------------------------------------
// Trial length — how many free days before the card is charged.
// ---------------------------------------------------------------------------
export interface TrialLengthVariant {
  key: '3day' | '7day' | '14day';
  active: boolean;
  days: number;
  label: string;
}

export const TRIAL_LENGTHS: TrialLengthVariant[] = [
  { key: '3day', active: true, days: 3, label: '3-Day Free Trial' },
  { key: '7day', active: true, days: 7, label: '7-Day Free Trial' },
  { key: '14day', active: true, days: 14, label: '14-Day Free Trial' },
];

export function getTrialLength(key: string): TrialLengthVariant {
  return TRIAL_LENGTHS.find(t => t.key === key) ?? TRIAL_LENGTHS.find(t => t.key === '7day')!;
}

export async function assignTrialLength(userId: string): Promise<TrialLengthVariant> {
  const active = TRIAL_LENGTHS.filter(t => t.active).map(t => t.key);
  const key = await getOrAssignVariant(userId, 'trial_length', active);
  return getTrialLength(key);
}

// ---------------------------------------------------------------------------
// Onboarding copy — headline/subhead shown above the plan choices. Independent
// of price/trial so it isolates whether messaging alone moves conversion.
// ---------------------------------------------------------------------------
export interface OnboardingCopyVariant {
  key: 'benefit_led' | 'social_proof' | 'simple_direct';
  active: boolean;
  headline: string;
  subhead: string;
}

export const ONBOARDING_COPY: OnboardingCopyVariant[] = [
  {
    key: 'benefit_led',
    active: true,
    headline: 'Trade Smarter. Compete Harder.',
    subhead: 'Unlock AI battles, unlimited AI analysis, and tournament access.',
  },
  {
    key: 'social_proof',
    active: true,
    headline: 'Join the Traders Leveling Up Every Day',
    subhead: 'Pro members get full access to every battle mode and challenge.',
  },
  {
    key: 'simple_direct',
    active: true,
    headline: 'Choose Your Plan',
    subhead: 'Start free, try Pro risk-free, or go straight to Legend.',
  },
];

export function getOnboardingCopy(key: string): OnboardingCopyVariant {
  return ONBOARDING_COPY.find(c => c.key === key) ?? ONBOARDING_COPY.find(c => c.key === 'simple_direct')!;
}

export async function assignOnboardingCopy(userId: string): Promise<OnboardingCopyVariant> {
  const active = ONBOARDING_COPY.filter(c => c.active).map(c => c.key);
  const key = await getOrAssignVariant(userId, 'onboarding_copy', active);
  return getOnboardingCopy(key);
}

export interface OnboardingVariants {
  pricingSet: PricingSetVariant;
  trialLength: TrialLengthVariant;
  copy: OnboardingCopyVariant;
}

/** Resolves (assigning on first visit) all three onboarding experiments for a user in parallel. */
export async function assignOnboardingVariants(userId: string): Promise<OnboardingVariants> {
  const [pricingSet, trialLength, copy] = await Promise.all([
    assignPricingSet(userId),
    assignTrialLength(userId),
    assignOnboardingCopy(userId),
  ]);
  return { pricingSet, trialLength, copy };
}
