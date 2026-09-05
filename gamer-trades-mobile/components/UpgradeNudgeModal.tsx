import { useEffect, useState } from 'react';
import { Modal, View, Pressable, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, PixelText, BodyText } from './ui';
import { colors } from '../lib/theme';
import { useAuth } from '../lib/AuthContext';
import PlanComparisonGrid from './PlanComparisonGrid';

const NUDGE_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000; // don't re-show more than once every 3 days
const MIN_ACCOUNT_AGE_MS = 60 * 60 * 1000; // skip for the first hour so it never lands right on top of the onboarding paywall

function nudgeKey(userId: string): string {
  return `gt_upgrade_nudge_last_shown_${userId}`;
}

/**
 * A periodic "here's what you're missing" reminder for free-plan users, shown at most once
 * every few days when they open the app. Free users have already seen the full plan
 * comparison once in onboarding -- this is the recurring version that keeps revisiting it,
 * since a single onboarding screen is easy to dismiss and forget. Pro/Legend users never see it.
 */
export default function UpgradeNudgeModal() {
  const { user, profile } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;
    const isFree = (profile.plan ?? 'free') === 'free';
    if (!isFree) return;

    const accountAge = profile.created_at ? Date.now() - new Date(profile.created_at).getTime() : Infinity;
    if (accountAge < MIN_ACCOUNT_AGE_MS) return;

    AsyncStorage.getItem(nudgeKey(user.id)).then(lastShown => {
      const last = lastShown ? parseInt(lastShown, 10) : 0;
      if (Date.now() - last >= NUDGE_INTERVAL_MS) {
        setVisible(true);
        AsyncStorage.setItem(nudgeKey(user.id), String(Date.now()));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.plan]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={() => setVisible(false)}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
        <View style={{ maxHeight: '85%', backgroundColor: colors.bg, borderTopWidth: 2, borderTopColor: colors.gold }}>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 36 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <PixelText color={colors.gold} size={13} glow>★ UNLOCK MORE</PixelText>
              <Pressable onPress={() => setVisible(false)} hitSlop={12}>
                <BodyText color={colors.muted} size={16}>✕</BodyText>
              </Pressable>
            </View>
            <BodyText color={colors.muted} size={12}>
              Here's everything you get by upgrading — see how Free, Pro, and Legend compare.
            </BodyText>
            <Card borderColor={colors.border} style={{ padding: 10 }}>
              <BodyText color={colors.text} size={12}>
                You're on the <BodyText color={colors.gold} size={12} weight="semibold">FREE</BodyText> plan right now.
              </BodyText>
            </Card>
            <PlanComparisonGrid currentPlan="free" onUpgradeStart={() => setVisible(false)} />
            <Pressable onPress={() => setVisible(false)} style={{ marginTop: 4 }}>
              <BodyText color={colors.muted} size={12} style={{ textAlign: 'center', textDecorationLine: 'underline' }}>
                Maybe later
              </BodyText>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
