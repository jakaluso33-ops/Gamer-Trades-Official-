import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
});
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Maps each Stripe Price ID to the plan tier it unlocks. Keep in sync with lib/plans.ts.
const PRICE_TO_PLAN: Record<string, 'pro' | 'legend'> = {
  'price_1TyPNg2L13T2P1hwBpKLA24J': 'pro',
  'price_1TyPOM2L13T2P1hw9tGtlMU9': 'legend',
  'price_1TyPOP2L13T2P1hwLwvXyBdS': 'legend',
};

async function planForSubscription(sub: Stripe.Subscription): Promise<'pro' | 'legend' | null> {
  const priceId = sub.items.data[0]?.price?.id;
  return priceId ? PRICE_TO_PLAN[priceId] ?? null : null;
}

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature ?? '', webhookSecret);
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        if (userId && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          const plan = await planForSubscription(sub);
          await supabaseAdmin.from('profiles').update({
            plan: plan ?? 'pro',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            subscription_status: 'active',
          }).eq('id', userId);
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const activeStatuses = ['active', 'trialing'];
        const isActive = activeStatuses.includes(sub.status);
        const plan = isActive ? (await planForSubscription(sub)) ?? 'pro' : 'free';
        await supabaseAdmin.from('profiles').update({
          plan,
          subscription_status: sub.status,
        }).eq('stripe_customer_id', sub.customer as string);
        break;
      }
      default:
        break;
    }
    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
