import { supabase } from './supabase';

export async function startCheckout(priceId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>('create-checkout', {
    body: { priceId },
  });
  if (error || !data?.url) {
    throw new Error(data?.error ?? error?.message ?? 'Could not start checkout');
  }
  window.location.href = data.url;
}
