import * as WebBrowser from 'expo-web-browser';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';

/** supabase-js collapses any non-2xx edge function response into a generic
 * "non-2xx status code" message, throwing away the JSON body our functions
 * actually send back (e.g. the real Stripe error) — recover it from the
 * error's raw response instead of letting that generic text reach the UI. */
async function describeFunctionError(error: unknown, fallback: string): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (body?.error) return body.error;
    } catch {
      // response body wasn't JSON — fall through to the generic message below
    }
  }
  return error instanceof Error ? error.message : fallback;
}

export async function startCheckout(priceId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>('create-checkout', {
    body: {
      priceId,
      successUrl: 'gamertrades://dashboard/profile?tab=upgrade&success=true',
      cancelUrl: 'gamertrades://dashboard/profile?tab=upgrade&success=false',
    },
  });
  if (error || !data?.url) {
    const message = data?.error ?? (error ? await describeFunctionError(error, 'Could not start checkout') : 'Could not start checkout');
    throw new Error(message);
  }
  await WebBrowser.openAuthSessionAsync(data.url, 'gamertrades://dashboard/profile');
}
