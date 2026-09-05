import { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { Card, PixelText, BodyText, PixelButton } from './ui';
import { colors } from '../lib/theme';
import { useAuth } from '../lib/AuthContext';
import {
  getActiveChallenges,
  getMyEntry,
  joinChallenge,
  getChallengeLeaderboard,
  WeeklyChallenge,
  ChallengeEntry,
  ChallengeLeaderboardRow,
} from '../lib/weeklyChallenge';

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

function SingleChallengeCard({ challenge }: { challenge: WeeklyChallenge }) {
  const { user, addPortfolio } = useAuth();
  const [entry, setEntry] = useState<ChallengeEntry | null | undefined>(undefined);
  const [rows, setRows] = useState<ChallengeLeaderboardRow[]>([]);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [myEntry, board] = await Promise.all([
      getMyEntry(user.id, challenge.id),
      getChallengeLeaderboard(challenge.id),
    ]);
    setEntry(myEntry);
    setRows(board);
  }, [user, challenge.id]);

  useEffect(() => { load().catch(console.error); }, [load]);

  const handleJoin = async () => {
    if (!user) return;
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
        <PixelButton color={colors.purple} onPress={handleJoin} disabled={joining || entry === undefined}>
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

/** Renders every currently-active weekly challenge (there can be more than one running
 * at once) as its own joinable card -- every user can join any/all of them, no gating. */
export default function WeeklyChallengeSection({ showHeader = true }: { showHeader?: boolean }) {
  const [challenges, setChallenges] = useState<WeeklyChallenge[] | undefined>(undefined);

  useEffect(() => {
    getActiveChallenges().then(setChallenges).catch(console.error);
  }, []);

  if (challenges === undefined) return null;

  return (
    <View style={{ gap: 12 }}>
      {showHeader && (
        <BodyText color={colors.purple} size={12} weight="semibold">
          🏆 {challenges.length > 1 ? "THIS WEEK'S CHALLENGES" : "THIS WEEK'S CHALLENGE"}
        </BodyText>
      )}
      {challenges.length === 0 ? (
        <Card borderColor={colors.purple}>
          <BodyText color={colors.muted} size={13} style={{ textAlign: 'center' }}>No active weekly challenge right now — check back soon.</BodyText>
        </Card>
      ) : (
        challenges.map(c => <SingleChallengeCard key={c.id} challenge={c} />)
      )}
    </View>
  );
}
