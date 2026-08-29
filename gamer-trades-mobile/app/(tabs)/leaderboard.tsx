import { useState, useEffect, useCallback } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, PixelText, BodyText, PixelButton } from '../../components/ui';
import { colors } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';
import { getLeaderboard, LeaderboardEntry } from '../../lib/leaderboard';
import {
  getActiveChallenge,
  getMyEntry,
  joinChallenge,
  getChallengeLeaderboard,
  WeeklyChallenge,
  ChallengeEntry,
  ChallengeLeaderboardRow,
} from '../../lib/weeklyChallenge';

const RANK_COLORS = [colors.gold, '#94a3b8', '#cd7f32'];

const THEME_ICON: Record<WeeklyChallenge['theme'], string> = {
  open: '🌐',
  single_market: '🎯',
  multi_market: '🧩',
  backtest: '⏮️',
};

function daysLeft(weekEnd: string): number {
  return Math.max(0, Math.ceil((new Date(weekEnd).getTime() - Date.now()) / 86_400_000));
}

function WeeklyChallengeCard() {
  const { user, addPortfolio } = useAuth();
  const [challenge, setChallenge] = useState<WeeklyChallenge | null | undefined>(undefined);
  const [entry, setEntry] = useState<ChallengeEntry | null>(null);
  const [rows, setRows] = useState<ChallengeLeaderboardRow[]>([]);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const active = await getActiveChallenge();
    setChallenge(active);
    if (active && user) {
      const [myEntry, board] = await Promise.all([
        getMyEntry(user.id, active.id),
        getChallengeLeaderboard(active.id),
      ]);
      setEntry(myEntry);
      setRows(board);
    }
  }, [user]);

  useEffect(() => { load().catch(console.error); }, [load]);

  const handleJoin = async () => {
    if (!user || !challenge) return;
    setError(null);
    setJoining(true);
    try {
      await joinChallenge(user.id, challenge, addPortfolio);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join the challenge');
    } finally {
      setJoining(false);
    }
  };

  if (challenge === undefined) return null;
  if (challenge === null) {
    return (
      <Card borderColor={colors.purple}>
        <BodyText color={colors.muted} size={13} style={{ textAlign: 'center' }}>No active weekly challenge right now — check back soon.</BodyText>
      </Card>
    );
  }

  const marketNote = challenge.allowed_asset_classes?.length
    ? `Markets: ${challenge.allowed_asset_classes.join(', ')}`
    : 'Markets: all 6';

  return (
    <Card borderColor={colors.purple}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <PixelText size={22}>{THEME_ICON[challenge.theme]}</PixelText>
        <View style={{ flex: 1 }}>
          <BodyText color={colors.purple} size={14} weight="semibold" glow>{challenge.title}</BodyText>
          <BodyText color={colors.muted} size={11} style={{ marginTop: 2 }}>{daysLeft(challenge.week_end)} DAYS LEFT · {marketNote}</BodyText>
        </View>
      </View>
      <BodyText color={colors.text} size={13} style={{ marginBottom: 12 }}>{challenge.description}</BodyText>

      {error && <BodyText color={colors.red} size={12} style={{ marginBottom: 10 }}>⚠ {error}</BodyText>}

      {!entry ? (
        <PixelButton color={colors.purple} onPress={handleJoin} disabled={joining}>
          {joining ? '...' : `🏆 JOIN — START WITH $${challenge.starting_balance.toLocaleString()}`}
        </PixelButton>
      ) : (
        <>
          <BodyText color={colors.green} size={12} weight="semibold" style={{ marginBottom: 8 }}>✓ YOU'RE IN THIS WEEK'S CHALLENGE</BodyText>
          {rows.length === 0 ? (
            <BodyText color={colors.muted} size={12}>No entries yet — be the first to trade.</BodyText>
          ) : (
            <View style={{ marginTop: 4 }}>
              {rows.slice(0, 10).map(r => {
                const isYou = r.user_id === user?.id;
                return (
                  <View
                    key={r.user_id}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7,
                      borderBottomWidth: 1, borderBottomColor: colors.border,
                      backgroundColor: isYou ? 'rgba(139,92,246,0.08)' : 'transparent',
                    }}
                  >
                    <BodyText color={r.rank <= 3 ? RANK_COLORS[r.rank - 1] : colors.muted} size={12} weight="semibold">#{r.rank}</BodyText>
                    <BodyText color={isYou ? colors.purple : colors.text} size={12} weight="medium" style={{ flex: 1 }}>
                      {r.username}{isYou ? ' (YOU)' : ''}
                    </BodyText>
                    <BodyText color={r.pnl >= 0 ? colors.green : colors.red} size={12}>
                      {r.pnl >= 0 ? '+' : ''}${r.pnl.toFixed(2)}
                    </BodyText>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}
    </Card>
  );
}

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);

  useEffect(() => {
    getLeaderboard().then(setEntries).catch(console.error);
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
      <PixelText color={colors.gold} size={13} glow>♛ LEADERBOARD</PixelText>

      <View>
        <BodyText color={colors.purple} size={12} weight="semibold" style={{ marginBottom: 8 }}>🏆 THIS WEEK'S CHALLENGE</BodyText>
        <WeeklyChallengeCard />
      </View>

      <BodyText color={colors.gold} size={12} weight="semibold" style={{ marginTop: 4 }}>ALL-TIME RANKINGS</BodyText>

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
