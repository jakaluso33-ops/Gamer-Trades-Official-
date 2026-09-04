import { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { Card, PixelText, BodyText, PixelButton } from './ui';
import { colors } from '../lib/theme';
import { useAuth } from '../lib/AuthContext';
import {
  getActiveTournament,
  getMyTournamentEntry,
  joinTournament,
  getTournamentLeaderboard,
  Tournament,
  TournamentEntry,
  TournamentLeaderboardRow,
} from '../lib/tournament';
import { PLANS } from '../lib/plans';
import { startCheckout } from '../lib/checkout';

const RANK_COLORS = [colors.gold, '#94a3b8', '#cd7f32'];
const PRO_PLAN = PLANS.find(p => p.name === 'pro');

const THEME_ICON: Record<Tournament['theme'], string> = {
  open: '🌐',
  single_market: '🎯',
  multi_market: '🧩',
};

function daysLeft(monthEnd: string): number {
  return Math.max(0, Math.ceil((new Date(monthEnd).getTime() - Date.now()) / 86_400_000));
}

/**
 * The real "Tournament access" feature promised in the Pro/Legend plan comparison -- a
 * month-long, Pro+-exclusive trading competition with a bigger starting balance than the
 * free weekly challenges. Free users see a locked teaser card instead of the join button;
 * the join itself is also enforced server-side via RLS, not just hidden in the UI.
 */
export default function TournamentCard() {
  const { user, profile, addPortfolio } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null | undefined>(undefined);
  const [entry, setEntry] = useState<TournamentEntry | null>(null);
  const [rows, setRows] = useState<TournamentLeaderboardRow[]>([]);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPro = (profile?.plan ?? 'free') !== 'free';

  const load = useCallback(async () => {
    const active = await getActiveTournament();
    setTournament(active);
    if (active && user && isPro) {
      const [myEntry, board] = await Promise.all([
        getMyTournamentEntry(user.id, active.id),
        getTournamentLeaderboard(active.id),
      ]);
      setEntry(myEntry);
      setRows(board);
    }
  }, [user, isPro]);

  useEffect(() => { load().catch(console.error); }, [load]);

  const handleJoin = async () => {
    if (!user || !tournament) return;
    setError(null);
    setJoining(true);
    try {
      await joinTournament(user.id, tournament, addPortfolio);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join the tournament');
    } finally {
      setJoining(false);
    }
  };

  const handleUpgrade = async () => {
    if (!PRO_PLAN?.priceId) return;
    setError(null);
    setJoining(true);
    try {
      await startCheckout(PRO_PLAN.priceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout');
    } finally {
      setJoining(false);
    }
  };

  if (tournament === undefined) return null;
  if (tournament === null) {
    return (
      <Card borderColor={colors.gold}>
        <BodyText color={colors.muted} size={13} style={{ textAlign: 'center' }}>No active tournament right now — check back soon.</BodyText>
      </Card>
    );
  }

  const marketNote = tournament.allowed_asset_classes?.length
    ? `Markets: ${tournament.allowed_asset_classes.join(', ')}`
    : 'Markets: all 6';

  return (
    <Card borderColor={colors.gold}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <PixelText size={22}>{THEME_ICON[tournament.theme]}</PixelText>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <BodyText color={colors.gold} size={14} weight="semibold" glow>{tournament.title}</BodyText>
            <BodyText color={colors.gold} size={9} weight="semibold" style={{ borderWidth: 1, borderColor: colors.gold, paddingHorizontal: 5, paddingVertical: 1 }}>PRO+</BodyText>
          </View>
          <BodyText color={colors.muted} size={11} style={{ marginTop: 2 }}>{daysLeft(tournament.month_end)} DAYS LEFT · {marketNote}</BodyText>
        </View>
      </View>
      <BodyText color={colors.text} size={13} style={{ marginBottom: 12 }}>{tournament.description}</BodyText>

      {error && <BodyText color={colors.red} size={12} style={{ marginBottom: 10 }}>⚠ {error}</BodyText>}

      {!isPro ? (
        <View style={{ padding: 10, backgroundColor: `${colors.gold}0a`, borderWidth: 2, borderColor: `${colors.gold}55` }}>
          <BodyText color={colors.text} size={13} style={{ marginBottom: 8 }}>
            Tournaments are a Pro/Legend perk — a full month, a ${tournament.starting_balance.toLocaleString()} starting balance, and real bragging rights on the leaderboard.
          </BodyText>
          <PixelButton color={colors.gold} onPress={handleUpgrade} disabled={joining}>
            {joining ? '...' : `★ UPGRADE TO PRO — ${PRO_PLAN?.price ?? ''}`}
          </PixelButton>
        </View>
      ) : !entry ? (
        <PixelButton color={colors.gold} onPress={handleJoin} disabled={joining}>
          {joining ? '...' : `🏆 JOIN — START WITH $${tournament.starting_balance.toLocaleString()}`}
        </PixelButton>
      ) : (
        <>
          <BodyText color={colors.green} size={12} weight="semibold" style={{ marginBottom: 8 }}>✓ YOU'RE IN THIS MONTH'S TOURNAMENT</BodyText>
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
                      backgroundColor: isYou ? 'rgba(255,215,0,0.08)' : 'transparent',
                    }}
                  >
                    <BodyText color={r.rank <= 3 ? RANK_COLORS[r.rank - 1] : colors.muted} size={12} weight="semibold">#{r.rank}</BodyText>
                    <BodyText color={isYou ? colors.gold : colors.text} size={12} weight="medium" style={{ flex: 1 }}>
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
