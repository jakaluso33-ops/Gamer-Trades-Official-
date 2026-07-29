import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

export async function startCheckout(priceId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>('create-checkout', {
    body: {
      priceId,
      successUrl: 'gamertrades://dashboard/profile?tab=upgrade&success=true',
      cancelUrl: 'gamertrades://dashboard/profile?tab=upgrade&success=false',
    },
  });
  if (error || !data?.url) {
    throw new Error(data?.error ?? error?.message ?? 'Could not start checkout');
  }
  await WebBrowser.openAuthSessionAsync(data.url, 'gamertrades://dashboard/profile');
}
