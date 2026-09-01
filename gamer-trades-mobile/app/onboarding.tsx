import { useEffect, useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, PixelText, BodyText, PixelButton } from '../components/ui';
import { colors } from '../lib/theme';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { startCheckout } from '../lib/checkout';
import { markOnboarded } from '../lib/onboarding';
import { logEvent } from '../lib/activity';
import { assignOnboardingVariants, OnboardingVariants } from '../lib/experiments';
import { PLANS } from '../lib/plans';
import { SkillLevel } from '../lib/curriculum';

const PRO_FEATURES = PLANS.find(p => p.name === 'pro')?.features ?? [];

const EXPERIENCE_OPTIONS: { value: SkillLevel; label: string; blurb: string }[] = [
  { value: 'beginner', label: "I've never traded before", blurb: 'Start from the very basics — what a candlestick even is.' },
  { value: 'intermediate', label: 'I know the basics', blurb: 'Support/resistance, trends, risk — ready to build on that.' },
  { value: 'advanced', label: "I'm comfortable trading", blurb: 'Chart patterns, indicators, live strategy detection.' },
  { value: 'expert', label: "I'm a very experienced trader", blurb: 'Risk math, psychology, portfolio discipline.' },
];

const GOAL_OPTIONS: { value: string; label: string; icon: string }[] = [
  { value: 'learn_fundamentals', label: 'Learn how trading actually works', icon: '📚' },
  { value: 'practice_risk_free', label: 'Practice strategies with zero risk', icon: '🎯' },
  { value: 'compete_leaderboard', label: 'Compete and climb the leaderboard', icon: '🏆' },
  { value: 'just_for_fun', label: "I'm just here to have fun", icon: '🎮' },
];

const FEATURE_OPTIONS: { value: string; label: string; icon: string }[] = [
  { value: 'ai_coach', label: 'AI Coach & live market reads', icon: '🤖' },
  { value: 'weekly_challenges', label: 'Weekly trading challenges', icon: '🏆' },
  { value: 'battle', label: 'Battle vs friends & AI', icon: '⚔️' },
  { value: 'skill_path', label: 'Skill Path lessons', icon: '🎓' },
  { value: 'leaderboard', label: 'Leaderboard & rankings', icon: '📊' },
];

/** Polls the profile for a few seconds after checkout so Pro features unlock
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

  const [step, setStep] = useState<'experience' | 'goal' | 'features' | 'paywall'>('experience');
  const [experience, setExperience] = useState<SkillLevel | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [savingSurvey, setSavingSurvey] = useState(false);

  useEffect(() => {
    if (!user) return;
    assignOnboardingVariants(user.id).then(setVariants).catch(console.error);
  }, [user]);

  const toggleFeature = (value: string) => {
    setSelectedFeatures(prev => (prev.includes(value) ? prev.filter(f => f !== value) : [...prev, value]));
  };

  const finishSurvey = async () => {
    if (!user) return;
    setSavingSurvey(true);
    try {
      await supabase
        .from('profiles')
        .update({ skill_level: experience, trading_goal: goal, interested_features: selectedFeatures })
        .eq('id', user.id);
      await logEvent(user.id, 'onboarding_survey_completed', { experience, goal, features: selectedFeatures });
      await refreshProfile();
      setStep('paywall');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your answers');
    } finally {
      setSavingSurvey(false);
    }
  };

  const finish = async () => {
    if (!user) return;
    await markOnboarded(user.id);
    // The root layout's redirect gate decides where to send the user from its own local
    // `profile` state on every navigation -- without refreshing that state first, it still
    // sees the stale (pre-update) onboarded_at and immediately bounces straight back to
    // /onboarding, undoing the replace() below. That's what made this feel like it took
    // several attempts to actually get into the app.
    await refreshProfile();
    router.replace('/notification-permission');
  };

  const startTrial = async () => {
    if (!user || !variants) return;
    setError(null);
    setBusy('pro_trial');
    try {
      const priceId = variants.pricingSet.pro.priceId;
      await startCheckout(priceId, {
        trial: true,
        trialDays: variants.trialLength.days,
        successUrl: 'gamertrades://onboarding?checkout=success',
        cancelUrl: 'gamertrades://onboarding?checkout=cancel',
      });
      await logEvent(user.id, 'onboarding_trial_started', variantMetadata(variants));
      await waitForPlanUpgrade(refreshProfile, () => profile?.plan ?? 'free');
      await finish();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout');
    } finally {
      setBusy(null);
    }
  };

  const subscribeNow = async () => {
    if (!user || !variants) return;
    setError(null);
    setBusy('pro_subscribe');
    try {
      const priceId = variants.pricingSet.pro.priceId;
      await startCheckout(priceId, {
        trial: false,
        successUrl: 'gamertrades://onboarding?checkout=success',
        cancelUrl: 'gamertrades://onboarding?checkout=cancel',
      });
      await logEvent(user.id, 'onboarding_subscribed', variantMetadata(variants));
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

  if (step === 'experience' || step === 'goal' || step === 'features') {
    const stepIndex = step === 'experience' ? 1 : step === 'goal' ? 2 : 3;
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingTop: 60, paddingBottom: 60 }}>
        <BodyText color={colors.muted} size={11} style={{ textAlign: 'center' }}>STEP {stepIndex} OF 3</BodyText>

        {step === 'experience' && (
          <>
            <PixelText color={colors.cyan} size={15} glow style={{ textAlign: 'center', marginTop: 4 }}>Where are you in your trading journey?</PixelText>
            <View style={{ gap: 10, marginTop: 10 }}>
              {EXPERIENCE_OPTIONS.map(opt => {
                const active = experience === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setExperience(opt.value)}
                    style={{ padding: 14, borderWidth: 2, borderColor: active ? colors.cyan : colors.border, backgroundColor: active ? `${colors.cyan}14` : 'transparent' }}
                  >
                    <BodyText color={active ? colors.cyan : colors.text} size={14} weight="semibold">{opt.label}</BodyText>
                    <BodyText color={colors.muted} size={12} style={{ marginTop: 4 }}>{opt.blurb}</BodyText>
                  </Pressable>
                );
              })}
            </View>
            <PixelButton color={colors.cyan} disabled={!experience} onPress={() => setStep('goal')} style={{ marginTop: 14, paddingVertical: 14 }}>
              ▶ CONTINUE
            </PixelButton>
          </>
        )}

        {step === 'goal' && (
          <>
            <PixelText color={colors.cyan} size={15} glow style={{ textAlign: 'center', marginTop: 4 }}>What do you want to get out of GamerTrades?</PixelText>
            <View style={{ gap: 10, marginTop: 10 }}>
              {GOAL_OPTIONS.map(opt => {
                const active = goal === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setGoal(opt.value)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderWidth: 2, borderColor: active ? colors.cyan : colors.border, backgroundColor: active ? `${colors.cyan}14` : 'transparent' }}
                  >
                    <PixelText size={18}>{opt.icon}</PixelText>
                    <BodyText color={active ? colors.cyan : colors.text} size={14} weight="semibold" style={{ flex: 1 }}>{opt.label}</BodyText>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <PixelButton color={colors.muted} onPress={() => setStep('experience')} style={{ paddingVertical: 14, paddingHorizontal: 20 }}>◀</PixelButton>
              <View style={{ flex: 1 }}>
                <PixelButton color={colors.cyan} disabled={!goal} onPress={() => setStep('features')} style={{ paddingVertical: 14 }}>
                  ▶ CONTINUE
                </PixelButton>
              </View>
            </View>
          </>
        )}

        {step === 'features' && (
          <>
            <PixelText color={colors.cyan} size={15} glow style={{ textAlign: 'center', marginTop: 4 }}>Which of these sound interesting?</PixelText>
            <BodyText color={colors.muted} size={12} style={{ textAlign: 'center', marginTop: 6 }}>Pick as many as you like — this just helps us point you at the right stuff first.</BodyText>
            <View style={{ gap: 10, marginTop: 10 }}>
              {FEATURE_OPTIONS.map(opt => {
                const active = selectedFeatures.includes(opt.value);
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => toggleFeature(opt.value)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderWidth: 2, borderColor: active ? colors.cyan : colors.border, backgroundColor: active ? `${colors.cyan}14` : 'transparent' }}
                  >
                    <PixelText size={18}>{opt.icon}</PixelText>
                    <BodyText color={active ? colors.cyan : colors.text} size={14} weight="semibold" style={{ flex: 1 }}>{opt.label}</BodyText>
                    {active && <BodyText color={colors.cyan} size={14}>✓</BodyText>}
                  </Pressable>
                );
              })}
            </View>
            {error && (
              <View style={{ padding: 10, backgroundColor: '#ff335511', borderWidth: 1, borderColor: '#ff335544' }}>
                <BodyText color={colors.red} size={12}>⚠ {error}</BodyText>
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <PixelButton color={colors.muted} onPress={() => setStep('goal')} style={{ paddingVertical: 14, paddingHorizontal: 20 }}>◀</PixelButton>
              <View style={{ flex: 1 }}>
                <PixelButton color={colors.cyan} disabled={savingSurvey} onPress={finishSurvey} style={{ paddingVertical: 14 }}>
                  {savingSurvey ? '...' : '▶ CONTINUE'}
                </PixelButton>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    );
  }

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
        <BodyText color={colors.muted} size={11} style={{ marginTop: 2 }}>or {pricingSet.pro.annualPrice}</BodyText>
        <View style={{ marginTop: 10, gap: 5 }}>
          {PRO_FEATURES.map(f => (
            <BodyText key={f} color={colors.muted} size={12}>• {f}</BodyText>
          ))}
        </View>
        <PixelButton color={colors.green} disabled={busy != null} onPress={startTrial} style={{ marginTop: 14, paddingVertical: 14 }}>
          {busy === 'pro_trial' ? '...' : `▶ START ${trialLength.label.toUpperCase()}`}
        </PixelButton>
        <PixelButton color={colors.blue} disabled={busy != null} onPress={subscribeNow} style={{ marginTop: 8, paddingVertical: 10 }}>
          {busy === 'pro_subscribe' ? '...' : `SUBSCRIBE NOW — ${pricingSet.pro.price}`}
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
