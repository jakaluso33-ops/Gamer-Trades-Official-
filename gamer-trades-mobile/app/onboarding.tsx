import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, PixelText, BodyText, PixelButton } from '../components/ui';
import { colors } from '../lib/theme';
import { useAuth } from '../lib/AuthContext';
import { startCheckout } from '../lib/checkout';
import { markOnboarded } from '../lib/onboarding';
import { logEvent } from '../lib/activity';
import { assignOnboardingVariants, OnboardingVariants } from '../lib/experiments';
import { PLANS } from '../lib/plans';

const PRO_FEATURES = PLANS.find(p => p.name === 'pro')?.features ?? [];
const LEGEND_FEATURES = PLANS.find(p => p.name === 'legend')?.features ?? [];

/** Polls the profile for a few seconds after checkout so Pro/Legend features unlock
 * before we navigate, instead of waiting for the next unrelated profile refresh. */
async function waitForPlanUpgrade(refreshProfile: () => Promise<void>, getPlan: () => string) {
  for (let i = 0; i < 5; i++) {
    if (getPlan() !== 'free') return;
    await new Promise(r => setTimeout(r, 800));
    await refreshProfile();
  }
}

export default function OnboardingScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const [variants, setVariants] = useState<OnboardingVariants | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    assignOnboardingVariants(user.id).then(setVariants).catch(console.error);
  }, [user]);

  const finish = async () => {
    if (!user) return;
    await markOnboarded(user.id);
    router.replace('/(tabs)/dashboard');
  };

  const startTrial = async (tier: 'pro' | 'legend') => {
    if (!user || !variants) return;
    setError(null);
    setBusy(tier + '_trial');
    try {
      const priceId = variants.pricingSet[tier].priceId;
      await startCheckout(priceId, {
        trial: true,
        trialDays: variants.trialLength.days,
        successUrl: 'gamertrades://onboarding?checkout=success',
        cancelUrl: 'gamertrades://onboarding?checkout=cancel',
      });
      await logEvent(user.id, 'onboarding_trial_started', { tier, ...variantMetadata(variants) });
      await waitForPlanUpgrade(refreshProfile, () => profile?.plan ?? 'free');
      await finish();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout');
    } finally {
      setBusy(null);
    }
  };

  const subscribeNow = async (tier: 'pro' | 'legend') => {
    if (!user || !variants) return;
    setError(null);
    setBusy(tier + '_subscribe');
    try {
      const priceId = variants.pricingSet[tier].priceId;
      await startCheckout(priceId, {
        trial: false,
        successUrl: 'gamertrades://onboarding?checkout=success',
        cancelUrl: 'gamertrades://onboarding?checkout=cancel',
      });
      await logEvent(user.id, 'onboarding_subscribed', { tier, ...variantMetadata(variants) });
      await waitForPlanUpgrade(refreshProfile, () => profile?.plan ?? 'free');
      await finish();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout');
    } finally {
      setBusy(null);
    }
  };

  const continueFree = async () => {
    if (!user || !variants) return;
    setBusy('free');
    await logEvent(user.id, 'onboarding_continued_free', variantMetadata(variants));
    await finish();
  };

  if (!variants) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <BodyText color={colors.muted} size={13}>Loading...</BodyText>
      </View>
    );
  }

  const { pricingSet, trialLength, copy } = variants;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingTop: 60, paddingBottom: 60 }}>
      <View style={{ alignItems: 'center', marginBottom: 4 }}>
        <PixelText color={colors.cyan} size={16} glow style={{ textAlign: 'center' }}>{copy.headline}</PixelText>
        <BodyText color={colors.muted} size={13} style={{ textAlign: 'center', marginTop: 10 }}>{copy.subhead}</BodyText>
      </View>

      {error && (
        <View style={{ padding: 10, backgroundColor: '#ff335511', borderWidth: 1, borderColor: '#ff335544' }}>
          <BodyText color={colors.red} size={12}>⚠ {error}</BodyText>
        </View>
      )}

      <Card borderColor={colors.blue}>
        <BodyText color={colors.blue} size={14} weight="semibold" glow>★ PRO</BodyText>
        <PixelText color={colors.text} size={13} glow style={{ marginTop: 6 }}>{pricingSet.pro.price}</PixelText>
        <View style={{ marginTop: 10, gap: 5 }}>
          {PRO_FEATURES.map(f => (
            <BodyText key={f} color={colors.muted} size={12}>• {f}</BodyText>
          ))}
        </View>
        <PixelButton color={colors.green} disabled={busy != null} onPress={() => startTrial('pro')} style={{ marginTop: 14, paddingVertical: 14 }}>
          {busy === 'pro_trial' ? '...' : `▶ START ${trialLength.label.toUpperCase()}`}
        </PixelButton>
        <PixelButton color={colors.blue} disabled={busy != null} onPress={() => subscribeNow('pro')} style={{ marginTop: 8, paddingVertical: 10 }}>
          {busy === 'pro_subscribe' ? '...' : `SUBSCRIBE NOW — ${pricingSet.pro.price}`}
        </PixelButton>
      </Card>

      <Card borderColor={colors.gold}>
        <BodyText color={colors.gold} size={14} weight="semibold" glow>♛ LEGEND</BodyText>
        <PixelText color={colors.text} size={13} glow style={{ marginTop: 6 }}>{pricingSet.legend.price}</PixelText>
        <BodyText color={colors.muted} size={11} style={{ marginTop: 2 }}>or {pricingSet.legend.annualPrice}</BodyText>
        <View style={{ marginTop: 10, gap: 5 }}>
          {LEGEND_FEATURES.map(f => (
            <BodyText key={f} color={colors.muted} size={12}>• {f}</BodyText>
          ))}
        </View>
        <PixelButton color={colors.green} disabled={busy != null} onPress={() => startTrial('legend')} style={{ marginTop: 14, paddingVertical: 14 }}>
          {busy === 'legend_trial' ? '...' : `▶ START ${trialLength.label.toUpperCase()}`}
        </PixelButton>
        <PixelButton color={colors.gold} disabled={busy != null} onPress={() => subscribeNow('legend')} style={{ marginTop: 8, paddingVertical: 10 }}>
          {busy === 'legend_subscribe' ? '...' : `SUBSCRIBE NOW — ${pricingSet.legend.price}`}
        </PixelButton>
      </Card>

      <BodyText
        color={colors.muted}
        size={12}
        style={{ textAlign: 'center', marginTop: 6, textDecorationLine: 'underline' }}
        onPress={busy == null ? continueFree : undefined}
      >
        {busy === 'free' ? '...' : 'Continue with the free plan'}
      </BodyText>
    </ScrollView>
  );
}

function variantMetadata(variants: OnboardingVariants) {
  return {
    pricing_set: variants.pricingSet.key,
    trial_length: variants.trialLength.key,
    onboarding_copy: variants.copy.key,
  };
}
