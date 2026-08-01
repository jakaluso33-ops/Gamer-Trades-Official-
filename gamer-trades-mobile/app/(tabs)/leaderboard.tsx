import { useState, useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, PixelText, BodyText } from '../../components/ui';
import { colors } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';
import { getLeaderboard, LeaderboardEntry } from '../../lib/leaderboard';

const RANK_COLORS = [colors.gold, '#94a3b8', '#cd7f32'];

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);

  useEffect(() => {
    getLeaderboard().then(setEntries).catch(console.error);
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
      <PixelText color={colors.gold} size={13} glow>♛ LEADERBOARD</PixelText>

      {entries === null ? (
        <BodyText color={colors.muted} size={13}>Loading leaderboard...</BodyText>
      ) : entries.length === 0 ? (
        <Card>
          <BodyText color={colors.muted} size={13} style={{ textAlign: 'center' }}>No ranked players yet — be the first!</BodyText>
        </Card>
      ) : (
        <Card>
          {entries.map((entry, i) => {
            const rank = i + 1;
            const isYou = entry.id === user?.id;
            return (
              <View
                key={entry.id}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10,
                  borderBottomWidth: 1, borderBottomColor: colors.border,
                  backgroundColor: isYou ? 'rgba(0,255,136,0.06)' : 'transparent',
                  borderLeftWidth: isYou ? 3 : 0, borderLeftColor: colors.green,
                  paddingLeft: isYou ? 8 : 0,
                }}
              >
                <BodyText color={rank <= 3 ? RANK_COLORS[rank - 1] : colors.muted} size={13} weight="semibold">#{rank}</BodyText>
                <View style={{ flex: 1 }}>
                  <BodyText color={isYou ? colors.green : colors.text} size={13} weight="medium">
                    {entry.username}{isYou ? ' (YOU)' : ''}
                  </BodyText>
                  <BodyText color={colors.muted} size={11} style={{ marginTop: 2 }}>LVL {entry.level}</BodyText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <BodyText color={colors.gold} size={13}>{entry.xp.toLocaleString()} XP</BodyText>
                  <BodyText color={entry.lifetime_pnl >= 0 ? colors.green : colors.red} size={11} style={{ marginTop: 2 }}>
                    {entry.lifetime_pnl >= 0 ? '+' : ''}${entry.lifetime_pnl.toFixed(2)}
                  </BodyText>
                </View>
              </View>
            );
          })}
        </Card>
      )}
    </ScrollView>
  );
}
