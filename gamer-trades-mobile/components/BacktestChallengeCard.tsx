import { useState, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, PixelText, BodyText } from './ui';
import { colors } from '../lib/theme';
import { useAuth } from '../lib/AuthContext';
import { getActiveBacktestChallenge, getBacktestLeaderboard, BacktestChallenge, BacktestLeaderboardRow } from '../lib/backtestChallenge';

const RANK_COLORS = [colors.gold, '#94a3b8', '#cd7f32'];

function timeUntil(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'ending soon';
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return `${Math.max(1, Math.floor(ms / 60_000))}m left`;
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
}

/**
 * Open to every user (free, Pro, and Legend alike) -- a weekend-only backtesting competition
 * where everyone trades the exact same fixed, seeded price history for one symbol until
 * markets reopen Monday. Only visible/playable during its own weekend window.
 */
export default function BacktestChallengeCard() {
  const { user } = useAuth();
  const router = useRouter();
  const [challenge, setChallenge] = useState<BacktestChallenge | null | undefined>(undefined);
  const [rows, setRows] = useState<BacktestLeaderboardRow[]>([]);

  useEffect(() => {
    getActiveBacktestChallenge().then(async c => {
      setChallenge(c);
      if (c) setRows(await getBacktestLeaderboard(c.id, c.starting_balance));
    }).catch(console.error);
  }, []);

  if (challenge === undefined || challenge === null) return null;

  return (
    <Pressable onPress={() => router.push('/(tabs)/backtest-play' as never)}>
      <Card borderColor={colors.purple}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <PixelText size={20}>⏮️</PixelText>
          <View style={{ flex: 1 }}>
            <BodyText color={colors.purple} size={13} weight="semibold" glow>WEEKEND BACKTEST — {challenge.symbol}</BodyText>
            <BodyText color={colors.muted} size={11} style={{ marginTop: 2 }}>{timeUntil(challenge.week_end)} · same fixed price history for everyone</BodyText>
          </View>
          <PixelText color={colors.purple} size={14}>▶</PixelText>
        </View>

        {rows.length > 0 && (
          <View style={{ marginTop: 6 }}>
            {rows.slice(0, 3).map(r => {
              const isYou = r.user_id === user?.id;
              return (
                <View key={r.user_id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
                  <BodyText color={RANK_COLORS[r.rank - 1] ?? colors.muted} size={11} weight="semibold">#{r.rank}</BodyText>
                  <BodyText color={isYou ? colors.purple : colors.text} size={11} style={{ flex: 1 }}>{r.username}{isYou ? ' (YOU)' : ''}</BodyText>
                  <BodyText color={r.pnl >= 0 ? colors.green : colors.red} size={11}>{r.pnl >= 0 ? '+' : ''}${r.pnl.toFixed(2)}</BodyText>
                </View>
              );
            })}
          </View>
        )}
      </Card>
    </Pressable>
  );
}
