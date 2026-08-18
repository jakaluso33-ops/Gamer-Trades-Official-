import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

export interface StartCheckoutOptions {
  /** false forces no trial (e.g. "Subscribe Now"); omit/true lets the server decide eligibility. */
  trial?: boolean;
  /** How many free days if a trial is granted. Defaults to 7 server-side if omitted. */
  trialDays?: number;
  successUrl?: string;
  cancelUrl?: string;
}

export async function startCheckout(priceId: string, options?: StartCheckoutOptions): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>('create-checkout', {
    body: {
      priceId,
      trial: options?.trial,
      trialDays: options?.trialDays,
      successUrl: options?.successUrl ?? 'gamertrades://dashboard/profile?tab=upgrade&success=true',
      cancelUrl: options?.cancelUrl ?? 'gamertrades://dashboard/profile?tab=upgrade&success=false',
    },
  });
  if (error || !data?.url) {
    throw new Error(data?.error ?? error?.message ?? 'Could not start checkout');
  }
  await WebBrowser.openAuthSessionAsync(data.url, 'gamertrades://dashboard/profile');
}
