import { useState } from 'react';
import { View } from 'react-native';
import { Card, PixelText, BodyText, PixelButton } from './ui';
import { colors } from '../lib/theme';
import { startCheckout } from '../lib/checkout';
import { PLANS, Plan } from '../lib/plans';

interface Props {
  /** The user's current plan -- that tier is marked CURRENT PLAN and gets no buttons. */
  currentPlan: Plan;
  /** Override Pro's price/priceId (e.g. onboarding's A/B pricing experiment variant). Legend and Free are unaffected. */
  proOverride?: { price: string; priceId: string; annualPrice: string; annualPriceId: string };
  /** Skip rendering these tiers entirely -- e.g. onboarding shows its own bespoke Pro trial
   * card above this grid, so it passes ['pro'] here to avoid a redundant second Pro card. */
  excludePlans?: Plan[];
  onUpgradeStart?: (plan: Plan) => void;
  /** Fires once the checkout browser session closes, regardless of whether it succeeded --
   * lets a caller like onboarding advance the flow (checkout itself is verified server-side
   * via the Stripe webhook, not by this callback). */
  onUpgradeComplete?: (plan: Plan) => void;
}

/** Full free/pro/legend checklist comparison, reused in onboarding's paywall step, the
 * Profile tab, and the periodic UpgradeNudgeModal -- one place defining what each tier
 * shows and how upgrading works, so all three stay in sync automatically. */
export default function PlanComparisonGrid({ currentPlan, proOverride, excludePlans, onUpgradeStart, onUpgradeComplete }: Props) {
  const [busyPriceId, setBusyPriceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (plan: Plan, priceId: string) => {
    setError(null);
    setBusyPriceId(priceId);
    onUpgradeStart?.(plan);
    try {
      await startCheckout(priceId);
      onUpgradeComplete?.(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout');
    } finally {
      setBusyPriceId(null);
    }
  };

  return (
    <View style={{ gap: 10 }}>
      {PLANS.filter(p => !excludePlans?.includes(p.name)).map(plan => {
        const isCurrent = currentPlan === plan.name;
        const pricing = plan.name === 'pro' && proOverride ? proOverride : plan;
        return (
          <Card key={plan.name} borderColor={isCurrent ? colors.border : plan.color} style={isCurrent ? { opacity: 0.7 } : undefined}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <BodyText color={plan.color} size={13} weight="semibold" glow>{plan.name.toUpperCase()}</BodyText>
              <View style={{ alignItems: 'flex-end' }}>
                <BodyText color={colors.gold} size={13} weight="medium">{pricing.price}</BodyText>
                {'annualPrice' in pricing && pricing.annualPrice && (
                  <BodyText color={colors.green} size={11}>or {pricing.annualPrice}</BodyText>
                )}
              </View>
            </View>
            {plan.features.map(f => (
              <BodyText key={f} color={colors.muted} size={12} style={{ marginBottom: 3 }}>✓ {f}</BodyText>
            ))}
            {isCurrent ? (
              <BodyText color={colors.muted} size={11} weight="semibold" style={{ marginTop: 10, textAlign: 'center' }}>
                ★ YOUR CURRENT PLAN
              </BodyText>
            ) : 'priceId' in pricing && pricing.priceId ? (
              <View style={{ marginTop: 10, gap: 6 }}>
                <PixelButton color={plan.color} disabled={busyPriceId != null} onPress={() => handleUpgrade(plan.name, pricing.priceId!)}>
                  {busyPriceId === pricing.priceId ? '...' : `UPGRADE — ${pricing.price}`}
                </PixelButton>
                {'annualPriceId' in pricing && pricing.annualPriceId && (
                  <PixelButton color={colors.green} disabled={busyPriceId != null} onPress={() => handleUpgrade(plan.name, pricing.annualPriceId!)}>
                    {busyPriceId === pricing.annualPriceId ? '...' : `UPGRADE (ANNUAL) — ${pricing.annualPrice}`}
                  </PixelButton>
                )}
              </View>
            ) : null}
          </Card>
        );
      })}
      {error && (
        <View style={{ padding: 8, backgroundColor: '#ff335511', borderWidth: 1, borderColor: '#ff335544' }}>
          <BodyText color={colors.red} size={12}>⚠ {error}</BodyText>
        </View>
      )}
    </View>
  );
}
