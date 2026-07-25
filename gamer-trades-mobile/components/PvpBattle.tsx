import { useState, useEffect, useCallback, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, PixelText, PixelButton, Avatar } from './ui';
import { colors } from '../lib/theme';
import { supabase, Profile, PvpMatch, PvpMatchTrade, MatchMode } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { logEvent } from '../lib/activity';

const MODES: { id: MatchMode; label: string; duration: string; seconds: number }[] = [
  { id: 'scalp', label: 'SCALP', duration: '5 min', seconds: 300 },
  { id: 'swing', label: 'SWING', duration: '30 min', seconds: 1800 },
  { id: 'long', label: 'LONG', duration: '1 hour', seconds: 3600 },
  { id: 'short', label: 'SHORT', duration: '15 min', seconds: 900 },
];

export default function PvpBattle({ presetChallengeId }: { presetChallengeId?: string }) {
  const { user, profile, refreshProfile } = useAuth();
  const [friends, setFriends] = useState<Profile[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Profile | null>(null);
  const [selectedMode, setSelectedMode] = useState(MODES[0]);
  const [incomingInvites, setIncomingInvites] = useState<(PvpMatch & { opponent: Profile })[]>([]);
  const [outgoingPending, setOutgoingPending] = useState<(PvpMatch & { opponent: Profile })[]>([]);
  const [activeMatch, setActiveMatch] = useState<PvpMatch | null>(null);
  const [opponent, setOpponent] = useState<Profile | null>(null);
  const [trades, setTrades] = useState<PvpMatchTrade[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [creating, setCreating] = useState(false);
  const finalizedRef = useRef(false);
  const finishMatchRef = useRef<() => void>(() => {});
  const loggedResultRef = useRef<Set<string>>(new Set());

  const isPlayer1 = activeMatch && user ? activeMatch.player1_id === user.id : false;
  const myPnl = activeMatch ? (isPlayer1 ? activeMatch.player1_pnl : activeMatch.player2_pnl) : 0;
  const oppPnl = activeMatch ? (isPlayer1 ? activeMatch.player2_pnl : activeMatch.player1_pnl) : 0;

  const loadFriends = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('friendships')
      .select('*')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    if (!data || data.length === 0) { setFriends([]); return; }
    const ids = data.map(f => (f.requester_id === user.id ? f.addressee_id : f.requester_id));
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids);
    setFriends((profiles ?? []) as Profile[]);
  }, [user]);

  const loadIncoming = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('pvp_matches').select('*').eq('player2_id', user.id).eq('status', 'pending');
    if (!data || data.length === 0) { setIncomingInvites([]); return; }
    const ids = data.map(m => m.player1_id);
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids);
    const map = new Map((profiles ?? []).map(p => [p.id, p as Profile]));
    setIncomingInvites(data.map(m => ({ ...(m as PvpMatch), opponent: map.get(m.player1_id)! })).filter(m => m.opponent));
  }, [user]);

  const loadOutgoing = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('pvp_matches').select('*').eq('player1_id', user.id).eq('status', 'pending');
    if (!data || data.length === 0) { setOutgoingPending([]); return; }
    const ids = data.map(m => m.player2_id);
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids);
    const map = new Map((profiles ?? []).map(p => [p.id, p as Profile]));
    setOutgoingPending(data.map(m => ({ ...(m as PvpMatch), opponent: map.get(m.player2_id)! })).filter(m => m.opponent));
  }, [user]);

  const loadMatchState = useCallback(async (matchId: string) => {
    const { data: match } = await supabase.from('pvp_matches').select('*').eq('id', matchId).single();
    if (!match) return;
    setActiveMatch(match as PvpMatch);
    const otherId = match.player1_id === user?.id ? match.player2_id : match.player1_id;
    const { data: opp } = await supabase.from('profiles').select('*').eq('id', otherId).single();
    setOpponent(opp as Profile | null);
    const { data: tradeRows } = await supabase.from('pvp_match_trades').select('*').eq('match_id', matchId).order('created_at', { ascending: false }).limit(20);
    setTrades((tradeRows ?? []) as PvpMatchTrade[]);
  }, [user]);

  const checkForLiveMatch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('pvp_matches')
      .select('*')
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
      .in('status', ['active'])
      .order('created_at', { ascending: false })
      .limit(1);
    if (data && data.length > 0) loadMatchState(data[0].id);
  }, [user, loadMatchState]);

  useEffect(() => {
    loadFriends();
    loadIncoming();
    loadOutgoing();
    checkForLiveMatch();
  }, [loadFriends, loadIncoming, loadOutgoing, checkForLiveMatch]);

  useEffect(() => {
    if (presetChallengeId && friends.length > 0) {
      const f = friends.find(fr => fr.id === presetChallengeId);
      if (f) setSelectedFriend(f);
    }
  }, [presetChallengeId, friends]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('pvp-matches-mine-mobile')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pvp_matches', filter: `player1_id=eq.${user.id}` }, (payload) => {
        const row = (payload.new ?? payload.old) as PvpMatch;
        if (row.status === 'active') loadMatchState(row.id);
        else if (activeMatch?.id === row.id) setActiveMatch(row);
        else { loadIncoming(); loadOutgoing(); }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pvp_matches', filter: `player2_id=eq.${user.id}` }, (payload) => {
        const row = (payload.new ?? payload.old) as PvpMatch;
        if (row.status === 'active') loadMatchState(row.id);
        else if (activeMatch?.id === row.id) setActiveMatch(row);
        else { loadIncoming(); loadOutgoing(); }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loadMatchState, loadIncoming, loadOutgoing]);

  useEffect(() => {
    if (!activeMatch) return;
    const channel = supabase
      .channel(`pvp-trades-mobile-${activeMatch.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pvp_match_trades', filter: `match_id=eq.${activeMatch.id}` }, (payload) => {
        setTrades(prev => [payload.new as PvpMatchTrade, ...prev].slice(0, 20));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeMatch?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Log the match result once, from whichever client observes 'finished' first
  useEffect(() => {
    if (!activeMatch || activeMatch.status !== 'finished' || !user) return;
    if (loggedResultRef.current.has(activeMatch.id)) return;
    loggedResultRef.current.add(activeMatch.id);
    logEvent(user.id, 'pvp_battle_played', { matchId: activeMatch.id });
    if (activeMatch.winner_id === user.id) logEvent(user.id, 'pvp_battle_won', { matchId: activeMatch.id });
  }, [activeMatch, user]);

  useEffect(() => {
    if (!activeMatch || activeMatch.status !== 'active' || !activeMatch.ends_at) return;
    finalizedRef.current = false;
    const tick = () => {
      const remaining = Math.max(0, Math.round((new Date(activeMatch.ends_at!).getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0 && !finalizedRef.current) {
        finalizedRef.current = true;
        finishMatchRef.current();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMatch?.id, activeMatch?.status, activeMatch?.ends_at]);

  const sendChallenge = async () => {
    if (!user || !selectedFriend) return;
    setCreating(true);
    await supabase.from('pvp_matches').insert({
      mode: selectedMode.id,
      duration_seconds: selectedMode.seconds,
      player1_id: user.id,
      player2_id: selectedFriend.id,
      status: 'pending',
    });
    setCreating(false);
    setSelectedFriend(null);
    loadOutgoing();
  };

  const acceptInvite = async (match: PvpMatch) => {
    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + match.duration_seconds * 1000);
    await supabase.from('pvp_matches').update({
      status: 'active', started_at: startedAt.toISOString(), ends_at: endsAt.toISOString(),
    }).eq('id', match.id).eq('status', 'pending');
    loadMatchState(match.id);
  };

  const declineInvite = async (match: PvpMatch) => {
    await supabase.from('pvp_matches').update({ status: 'declined' }).eq('id', match.id).eq('status', 'pending');
    loadIncoming();
  };

  const cancelMyPendingMatch = async (matchId: string) => {
    await supabase.from('pvp_matches').update({ status: 'cancelled' }).eq('id', matchId);
    loadOutgoing();
  };

  const makeTrade = async (side: 'buy' | 'sell') => {
    if (!activeMatch || !user || activeMatch.status !== 'active') return;
    const delta = parseFloat(((Math.random() - 0.45) * 100).toFixed(2));
    const syms = ['AAPL', 'BTC', 'TSLA', 'ETH'];
    const symbol = syms[Math.floor(Math.random() * syms.length)];
    await supabase.from('pvp_match_trades').insert({ match_id: activeMatch.id, user_id: user.id, symbol, side, pnl_delta: delta });
    logEvent(user.id, 'trade_closed', { context: 'pvp_battle', symbol });
    const field = isPlayer1 ? 'player1_pnl' : 'player2_pnl';
    const newPnl = parseFloat((myPnl + delta).toFixed(2));
    const { data } = await supabase.from('pvp_matches').update({ [field]: newPnl }).eq('id', activeMatch.id).select().single();
    if (data) setActiveMatch(data as PvpMatch);
  };

  const finishMatch = async () => {
    if (!activeMatch) return;
    const winnerId = activeMatch.player1_pnl === activeMatch.player2_pnl
      ? null
      : activeMatch.player1_pnl > activeMatch.player2_pnl ? activeMatch.player1_id : activeMatch.player2_id;
    await supabase.from('pvp_matches').update({ status: 'finished', winner_id: winnerId }).eq('id', activeMatch.id).eq('status', 'active');
    if (profile && user) {
      const iWon = winnerId === user.id;
      const iLost = winnerId && winnerId !== user.id;
      if (iWon) await supabase.from('profiles').update({ total_wins: profile.total_wins + 1, xp: profile.xp + 150 }).eq('id', user.id);
      else if (iLost) await supabase.from('profiles').update({ total_losses: profile.total_losses + 1 }).eq('id', user.id);
      refreshProfile();
    }
    loadMatchState(activeMatch.id);
  };
  finishMatchRef.current = finishMatch;

  const exitToLobby = () => {
    setActiveMatch(null);
    setOpponent(null);
    setTrades([]);
    loadFriends();
    loadIncoming();
    loadOutgoing();
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (activeMatch && (activeMatch.status === 'active' || activeMatch.status === 'finished')) {
    const finished = activeMatch.status === 'finished';
    const iWon = finished && activeMatch.winner_id === user?.id;
    const isDraw = finished && !activeMatch.winner_id;

    if (finished) {
      return (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
          <Card borderColor={isDraw ? colors.gold : iWon ? colors.green : colors.red} style={{ width: '100%', padding: 24, alignItems: 'center' }}>
            <PixelText size={40}>{isDraw ? '🤝' : iWon ? '🏆' : '😵'}</PixelText>
            <PixelText color={isDraw ? colors.gold : iWon ? colors.green : colors.red} size={14} glow style={{ marginTop: 10 }}>
              {isDraw ? "IT'S A DRAW!" : iWon ? 'YOU WIN!' : 'YOU LOSE!'}
            </PixelText>
            <PixelText color={colors.muted} size={6} style={{ marginTop: 8, marginBottom: 20 }}>vs {opponent?.username ?? 'opponent'}</PixelText>
            <View style={{ flexDirection: 'row', gap: 10, width: '100%', marginBottom: 16 }}>
              <View style={{ flex: 1, padding: 10, backgroundColor: colors.bg, borderWidth: 2, borderColor: myPnl >= 0 ? colors.green : colors.red }}>
                <PixelText color={colors.muted} size={5}>YOUR P&amp;L</PixelText>
                <PixelText color={myPnl >= 0 ? colors.green : colors.red} size={10} style={{ marginTop: 4 }}>{myPnl >= 0 ? '+' : ''}${myPnl.toFixed(2)}</PixelText>
              </View>
              <View style={{ flex: 1, padding: 10, backgroundColor: colors.bg, borderWidth: 2, borderColor: oppPnl >= 0 ? colors.green : colors.red }}>
                <PixelText color={colors.muted} size={5}>{(opponent?.username ?? 'OPP').toUpperCase()}</PixelText>
                <PixelText color={oppPnl >= 0 ? colors.green : colors.red} size={10} style={{ marginTop: 4 }}>{oppPnl >= 0 ? '+' : ''}${oppPnl.toFixed(2)}</PixelText>
              </View>
            </View>
            {iWon && (
              <View style={{ padding: 8, backgroundColor: '#8b5cf622', borderWidth: 2, borderColor: colors.purple, marginBottom: 16, width: '100%' }}>
                <PixelText color={colors.purple} size={7} style={{ textAlign: 'center' }}>+150 XP EARNED!</PixelText>
              </View>
            )}
            <PixelButton color={colors.blue} onPress={exitToLobby} style={{ width: '100%' }}>◀ BACK TO LOBBY</PixelButton>
          </Card>
        </ScrollView>
      );
    }

    return (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <PixelText color={colors.red} size={7} glow>⚔ LIVE PVP</PixelText>
          <PixelText color={timeLeft < 30 ? colors.red : colors.gold} size={12} glow>{formatTime(timeLeft)}</PixelText>
        </View>

        <Card borderColor={colors.purple}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
            <View style={{ alignItems: 'center' }}>
              <Avatar size={40} />
              <PixelText color={colors.cyan} size={7} style={{ marginTop: 6 }}>{profile?.username ?? 'YOU'}</PixelText>
              <PixelText color={myPnl >= 0 ? colors.green : colors.red} size={12} glow style={{ marginTop: 4 }}>
                {myPnl >= 0 ? '+' : ''}${myPnl.toFixed(2)}
              </PixelText>
            </View>
            <PixelText color={colors.red} size={12} glow>VS</PixelText>
            <View style={{ alignItems: 'center' }}>
              <Avatar size={40} emoji="🕹" />
              <PixelText color={colors.gold} size={7} style={{ marginTop: 6 }}>{opponent?.username ?? '...'}</PixelText>
              <PixelText color={oppPnl >= 0 ? colors.green : colors.red} size={12} glow style={{ marginTop: 4 }}>
                {oppPnl >= 0 ? '+' : ''}${oppPnl.toFixed(2)}
              </PixelText>
            </View>
          </View>
        </Card>

        <Card>
          <PixelText color={colors.cyan} size={7} glow style={{ marginBottom: 10 }}>YOUR MOVES</PixelText>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <PixelButton color={colors.green} onPress={() => makeTrade('buy')} style={{ flex: 1, paddingVertical: 16 }}>▲ BUY</PixelButton>
            <PixelButton color={colors.red} onPress={() => makeTrade('sell')} style={{ flex: 1, paddingVertical: 16 }}>▼ SELL</PixelButton>
          </View>
        </Card>

        <Card>
          <PixelText color={colors.muted} size={6} style={{ marginBottom: 8 }}>◎ BATTLE FEED</PixelText>
          {trades.length === 0
            ? <PixelText color={colors.border} size={6}>Waiting for trades...</PixelText>
            : trades.map(t => (
              <View key={t.id} style={{ flexDirection: 'row', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <PixelText color={t.user_id === user?.id ? colors.cyan : colors.gold} size={6}>
                  {t.user_id === user?.id ? (profile?.username ?? 'YOU') : (opponent?.username ?? 'OPP')}
                </PixelText>
                <PixelText color={colors.text} size={6}>{t.side === 'buy' ? 'BOUGHT' : 'SOLD'} {t.symbol}</PixelText>
              </View>
            ))
          }
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
      {incomingInvites.length > 0 && (
        <Card borderColor={colors.red}>
          <PixelText color={colors.red} size={7} glow style={{ marginBottom: 10 }}>⚔ INCOMING CHALLENGES</PixelText>
          {incomingInvites.map(inv => (
            <View key={inv.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <PixelText color={colors.text} size={6} style={{ marginBottom: 8 }}>
                {inv.opponent.username} challenged you — {MODES.find(m => m.id === inv.mode)?.label}
              </PixelText>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <PixelButton color={colors.green} onPress={() => acceptInvite(inv)} style={{ flex: 1, paddingVertical: 8 }}>✓ ACCEPT</PixelButton>
                <PixelButton color={colors.red} onPress={() => declineInvite(inv)} style={{ flex: 1, paddingVertical: 8 }}>✕ DECLINE</PixelButton>
              </View>
            </View>
          ))}
        </Card>
      )}

      {outgoingPending.length > 0 && (
        <Card borderColor={colors.gold}>
          <PixelText color={colors.gold} size={7} glow style={{ marginBottom: 10 }}>⏳ WAITING</PixelText>
          {outgoingPending.map(inv => (
            <View key={inv.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <PixelText color={colors.text} size={6} style={{ marginBottom: 8 }}>Challenged {inv.opponent.username}</PixelText>
              <PixelButton color={colors.red} onPress={() => cancelMyPendingMatch(inv.id)} style={{ paddingVertical: 8 }}>✕ CANCEL</PixelButton>
            </View>
          ))}
        </Card>
      )}

      {friends.length === 0 ? (
        <Card style={{ alignItems: 'center', padding: 24 }}>
          <PixelText color={colors.muted} size={6}>No friends yet — add some on the FRIENDS tab.</PixelText>
        </Card>
      ) : (
        <>
          <Card>
            <PixelText color={colors.muted} size={6} style={{ marginBottom: 10 }}>CHOOSE A FRIEND</PixelText>
            <View style={{ gap: 8 }}>
              {friends.map(f => (
                <PixelButton
                  key={f.id}
                  color={selectedFriend?.id === f.id ? colors.cyan : colors.muted}
                  onPress={() => setSelectedFriend(f)}
                  style={{ alignItems: 'flex-start', paddingVertical: 10 }}
                >
                  {f.username} · LVL {f.level}
                </PixelButton>
              ))}
            </View>
          </Card>

          <Card>
            <PixelText color={colors.muted} size={6} style={{ marginBottom: 10 }}>BATTLE MODE</PixelText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {MODES.map(m => (
                <PixelButton key={m.id} color={selectedMode.id === m.id ? colors.cyan : colors.muted} onPress={() => setSelectedMode(m)} style={{ paddingHorizontal: 10, paddingVertical: 8 }}>
                  {m.label} ({m.duration})
                </PixelButton>
              ))}
            </View>
          </Card>

          {selectedFriend && (
            <PixelButton color={colors.green} onPress={sendChallenge} disabled={creating} style={{ paddingVertical: 16 }}>
              {creating ? 'SENDING...' : `▶ CHALLENGE ${selectedFriend.username}`}
            </PixelButton>
          )}
        </>
      )}
    </ScrollView>
  );
}
