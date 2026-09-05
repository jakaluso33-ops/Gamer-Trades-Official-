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
// Pricing set — the Pro price shown in onboarding. There is only one real paid
// tier (Pro) — a "Legend" tier was referenced in this code for a while but never
// actually existed as a Stripe product, which meant checkout was broken for
// anyone hitting that path. Fixed by dropping it entirely; this experiment now
// just tests three real Pro price points against each other.
// ---------------------------------------------------------------------------
export interface PricingSetVariant {
  key: 'value' | 'control' | 'premium';
  active: boolean;
  pro: { price: string; priceId: string; annualPrice: string; annualPriceId: string };
}

export const PRICING_SETS: PricingSetVariant[] = [
  {
    key: 'value',
    active: true,
    pro: { price: '$4.99/mo', priceId: 'price_1U9pYs2OMSlqCc2ooftAb46b', annualPrice: '$47.99/yr', annualPriceId: 'price_1U9pZ22OMSlqCc2oI3QWSKTo' },
  },
  {
    key: 'control',
    active: true,
    pro: { price: '$6.99/mo', priceId: 'price_1TlN8r2OMSlqCc2ouKr7BR73', annualPrice: '$69.99/yr', annualPriceId: 'price_1TlN942OMSlqCc2oPeVfdiIk' },
  },
  {
    key: 'premium',
    active: true,
    pro: { price: '$9.99/mo', priceId: 'price_1U9pZE2OMSlqCc2ojrI8gZgs', annualPrice: '$99.99/yr', annualPriceId: 'price_1U9pZN2OMSlqCc2odlXcPoMZ' },
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
    subhead: 'Start free, or try Pro risk-free.',
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
