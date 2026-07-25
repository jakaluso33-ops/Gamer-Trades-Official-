import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, PixelText } from './ui';
import { colors } from '../lib/theme';
import { computeInsights, Insight, InsightTone } from '../lib/insights';
import { useAuth } from '../lib/AuthContext';

const TONE_COLOR: Record<InsightTone, string> = {
  warning: colors.red,
  tip: colors.blue,
  positive: colors.green,
};

const ACTION_HREF: Record<Insight['actionKey'], string> = {
  trade: '/(tabs)/trade',
  battle: '/(tabs)/battle',
  friends: '/(tabs)/friends',
  challenges: '/(tabs)/challenges',
  dashboard: '/(tabs)/dashboard',
};

export default function InsightsCard() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [insights, setInsights] = useState<Insight[] | null>(null);

  useEffect(() => {
    if (!user) return;
    computeInsights(user.id, profile).then(setInsights);
  }, [user, profile]);

  if (!user) return null;

  return (
    <Card borderColor={colors.purple}>
      <PixelText color={colors.purple} size={7} glow style={{ marginBottom: 10 }}>🧠 COACH INSIGHTS</PixelText>

      {insights === null && <PixelText color={colors.muted} size={6}>Analyzing your recent activity...</PixelText>}
      {insights !== null && insights.length === 0 && (
        <PixelText color={colors.muted} size={6}>Nothing urgent — keep trading and check back soon.</PixelText>
      )}

      <View style={{ gap: 8 }}>
        {insights?.map(insight => {
          const color = TONE_COLOR[insight.tone];
          return (
            <View
              key={insight.id}
              style={{ padding: 10, backgroundColor: `${color}0a`, borderWidth: 2, borderColor: `${color}55` }}
            >
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                <PixelText size={16}>{insight.icon}</PixelText>
                <PixelText color={color} size={7} glow style={{ flex: 1 }}>{insight.title}</PixelText>
              </View>
              <PixelText color={colors.muted} size={5} style={{ marginBottom: 8, lineHeight: 9 }}>{insight.message}</PixelText>
              <PixelText color={color} size={5} glow onPress={() => router.push(ACTION_HREF[insight.actionKey] as never)}>
                ▶ {insight.actionLabel}
              </PixelText>
            </View>
          );
        })}
      </View>
    </Card>
  );
}
