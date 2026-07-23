'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, Profile, PvpMatch, PvpMatchTrade, MatchMode } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import MiniChart from './MiniChart';

const MODES: { id: MatchMode; label: string; duration: string; seconds: number }[] = [
  { id: 'scalp', label: 'SCALP BATTLE', duration: '5 min', seconds: 300 },
  { id: 'swing', label: 'SWING BATTLE', duration: '30 min', seconds: 1800 },
  { id: 'long', label: 'LONG BATTLE', duration: '1 hour', seconds: 3600 },
  { id: 'short', label: 'SHORT BATTLE', duration: '15 min', seconds: 900 },
];

type FriendOption = Profile;

export default function PvpBattle({ presetChallengeId }: { presetChallengeId?: string }) {
  const { user, profile, refreshProfile } = useAuth();
  const [friends, setFriends] = useState<FriendOption[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<FriendOption | null>(null);
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
    setIncomingInvites(
      data.map(m => ({ ...(m as PvpMatch), opponent: map.get(m.player1_id)! })).filter(m => m.opponent)
    );
  }, [user]);

  const loadOutgoing = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('pvp_matches').select('*').eq('player1_id', user.id).eq('status', 'pending');
    if (!data || data.length === 0) { setOutgoingPending([]); return; }
    const ids = data.map(m => m.player2_id);
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids);
    const map = new Map((profiles ?? []).map(p => [p.id, p as Profile]));
    setOutgoingPending(
      data.map(m => ({ ...(m as PvpMatch), opponent: map.get(m.player2_id)! })).filter(m => m.opponent)
    );
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

  // Watch for any match transitioning to active/finished that involves me
  const checkForLiveMatch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('pvp_matches')
      .select('*')
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
      .in('status', ['active'])
      .order('created_at', { ascending: false })
      .limit(1);
    if (data && data.length > 0) {
      loadMatchState(data[0].id);
    }
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

  // Realtime: matches involving me
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('pvp-matches-mine')
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

  // Realtime: trade feed for the active match
  useEffect(() => {
    if (!activeMatch) return;
    const channel = supabase
      .channel(`pvp-trades-${activeMatch.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pvp_match_trades', filter: `match_id=eq.${activeMatch.id}` }, (payload) => {
        setTrades(prev => [payload.new as PvpMatchTrade, ...prev].slice(0, 20));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeMatch?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer synced to ends_at
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
      status: 'active',
      started_at: startedAt.toISOString(),
      ends_at: endsAt.toISOString(),
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

  // ── LIVE / RESULT VIEW ──
  if (activeMatch && (activeMatch.status === 'active' || activeMatch.status === 'finished')) {
    const finished = activeMatch.status === 'finished';
    const iWon = finished && activeMatch.winner_id === user?.id;
    const isDraw = finished && !activeMatch.winner_id;

    if (finished) {
      return (
        <div className="grid-bg" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div className="retro-card" style={{
            padding: '40px', textAlign: 'center', maxWidth: '520px', width: '100%',
            borderColor: isDraw ? '#ffd700' : iWon ? '#00ff88' : '#ff3355',
            boxShadow: `4px 4px 0 #000, 0 0 20px ${isDraw ? '#ffd70044' : iWon ? '#00ff8844' : '#ff335544'}`,
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>{isDraw ? '🤝' : iWon ? '🏆' : '😵'}</div>
            <div style={{ fontSize: '16px', color: isDraw ? '#ffd700' : iWon ? '#00ff88' : '#ff3355', textShadow: `0 0 16px ${isDraw ? '#ffd700' : iWon ? '#00ff88' : '#ff3355'}`, marginBottom: '8px' }}>
              {isDraw ? "IT'S A DRAW!" : iWon ? 'YOU WIN!' : 'YOU LOSE!'}
            </div>
            <div style={{ fontSize: '7px', color: '#64748b', marginBottom: '24px' }}>
              vs {opponent?.username ?? 'opponent'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div style={{ padding: '12px', background: '#0a0e1a', border: `2px solid ${myPnl >= 0 ? '#00ff8844' : '#ff335544'}` }}>
                <div style={{ fontSize: '5px', color: '#64748b', marginBottom: '4px' }}>YOUR P&L</div>
                <div style={{ fontSize: '12px', color: myPnl >= 0 ? '#00ff88' : '#ff3355' }}>{myPnl >= 0 ? '+' : ''}${myPnl.toFixed(2)}</div>
              </div>
              <div style={{ padding: '12px', background: '#0a0e1a', border: `2px solid ${oppPnl >= 0 ? '#00ff8844' : '#ff335544'}` }}>
                <div style={{ fontSize: '5px', color: '#64748b', marginBottom: '4px' }}>{opponent?.username ?? 'OPPONENT'} P&L</div>
                <div style={{ fontSize: '12px', color: oppPnl >= 0 ? '#00ff88' : '#ff3355' }}>{oppPnl >= 0 ? '+' : ''}${oppPnl.toFixed(2)}</div>
              </div>
            </div>
            {iWon && <div style={{ padding: '8px', background: '#8b5cf622', border: '2px solid #8b5cf6', marginBottom: '16px', fontSize: '7px', color: '#8b5cf6' }}>+150 XP EARNED!</div>}
            <button onClick={exitToLobby} className="pixel-btn pixel-btn-blue" style={{ width: '100%', fontSize: '7px', padding: '10px' }}>◀ BACK TO FRIENDS LOBBY</button>
          </div>
        </div>
      );
    }

    return (
      <div className="grid-bg" style={{ minHeight: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '8px', color: '#ff3355', textShadow: '0 0 10px #ff3355' }}>⚔ LIVE PVP BATTLE</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '6px', color: '#64748b', marginBottom: '2px' }}>TIME REMAINING</div>
            <div style={{ fontSize: '14px', color: timeLeft < 30 ? '#ff3355' : '#ffd700', textShadow: `0 0 12px ${timeLeft < 30 ? '#ff3355' : '#ffd700'}`, fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(timeLeft)}
            </div>
          </div>
          <div style={{ fontSize: '6px', color: '#00ffff' }}>{MODES.find(m => m.id === activeMatch.mode)?.label}</div>
        </div>

        <div className="retro-card" style={{ padding: '20px', marginBottom: '16px', borderColor: '#8b5cf6', boxShadow: '4px 4px 0 #000, 0 0 16px #8b5cf633' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>🎮</div>
              <div style={{ fontSize: '8px', color: '#00ffff', textShadow: '0 0 8px #00ffff', marginBottom: '4px' }}>{profile?.username ?? 'YOU'}</div>
              <div style={{ fontSize: '18px', color: myPnl >= 0 ? '#00ff88' : '#ff3355', textShadow: `0 0 12px ${myPnl >= 0 ? '#00ff88' : '#ff3355'}` }}>
                {myPnl >= 0 ? '+' : ''}${myPnl.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '10px', color: '#ff3355', textShadow: '0 0 12px #ff3355' }}>VS</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>🕹</div>
              <div style={{ fontSize: '8px', color: '#ffd700', textShadow: '0 0 8px #ffd700', marginBottom: '4px' }}>{opponent?.username ?? '...'}</div>
              <div style={{ fontSize: '18px', color: oppPnl >= 0 ? '#00ff88' : '#ff3355', textShadow: `0 0 12px ${oppPnl >= 0 ? '#00ff88' : '#ff3355'}` }}>
                {oppPnl >= 0 ? '+' : ''}${oppPnl.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="retro-card" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '7px' }}>
                <span style={{ color: '#00aaff', textShadow: '0 0 6px #00aaff' }}>AAPL — LIVE</span>
                <span style={{ color: '#00ff88' }}>$182.34 ▲</span>
              </div>
              <MiniChart positive={true} height={100} />
            </div>
            <div className="retro-card" style={{ padding: '12px' }}>
              <div style={{ fontSize: '6px', color: '#64748b', marginBottom: '8px' }}>◎ BATTLE FEED</div>
              {trades.length === 0
                ? <div style={{ fontSize: '6px', color: '#1e3a5f' }}>Waiting for trades...</div>
                : trades.map((t, i) => (
                  <div key={t.id} style={{ display: 'flex', gap: '8px', padding: '4px 0', borderBottom: '1px solid #0f1629', fontSize: '6px', opacity: 1 - i * 0.04 }}>
                    <span style={{ color: '#64748b' }}>{new Date(t.created_at).toLocaleTimeString('en-US', { hour12: false })}</span>
                    <span style={{ color: t.user_id === user?.id ? '#00ffff' : '#ffd700' }}>{t.user_id === user?.id ? (profile?.username ?? 'YOU') : (opponent?.username ?? 'OPP')}</span>
                    <span style={{ color: '#e2e8f0' }}>{t.side === 'buy' ? 'BOUGHT' : 'SOLD SHORT'} {t.symbol}</span>
                  </div>
                ))
              }
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="retro-card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '7px', color: '#00ffff', textShadow: '0 0 8px #00ffff', marginBottom: '12px' }}>YOUR MOVES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={() => makeTrade('buy')} className="pixel-btn pixel-btn-green" style={{ width: '100%', fontSize: '9px', padding: '14px' }}>▲ BUY</button>
                <button onClick={() => makeTrade('sell')} className="pixel-btn pixel-btn-red" style={{ width: '100%', fontSize: '9px', padding: '14px' }}>▼ SELL SHORT</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── LOBBY VIEW ──
  return (
    <div className="grid-bg" style={{ minHeight: '100%' }}>
      {incomingInvites.length > 0 && (
        <div className="retro-card" style={{ padding: '16px', marginBottom: '16px', borderColor: '#ff3355', boxShadow: '4px 4px 0 #000, 0 0 12px #ff335544' }}>
          <div style={{ fontSize: '7px', color: '#ff3355', textShadow: '0 0 8px #ff3355', marginBottom: '10px' }}>⚔ INCOMING CHALLENGES</div>
          {incomingInvites.map(inv => (
            <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #0f1629' }}>
              <span style={{ fontSize: '7px', color: '#e2e8f0', flex: 1 }}>
                <b style={{ color: '#00ffff' }}>{inv.opponent.username}</b> challenged you — {MODES.find(m => m.id === inv.mode)?.label}
              </span>
              <button onClick={() => acceptInvite(inv)} className="pixel-btn pixel-btn-green" style={{ fontSize: '6px', padding: '7px 10px' }}>✓ ACCEPT</button>
              <button onClick={() => declineInvite(inv)} className="pixel-btn pixel-btn-red" style={{ fontSize: '6px', padding: '7px 10px' }}>✕ DECLINE</button>
            </div>
          ))}
        </div>
      )}

      {outgoingPending.length > 0 && (
        <div className="retro-card" style={{ padding: '16px', marginBottom: '16px', borderColor: '#ffd700', boxShadow: '4px 4px 0 #000, 0 0 12px #ffd70044' }}>
          <div style={{ fontSize: '7px', color: '#ffd700', textShadow: '0 0 8px #ffd700', marginBottom: '10px' }}>⏳ WAITING FOR RESPONSE</div>
          {outgoingPending.map(inv => (
            <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #0f1629' }}>
              <span style={{ fontSize: '7px', color: '#e2e8f0', flex: 1 }}>
                Challenged <b style={{ color: '#00ffff' }}>{inv.opponent.username}</b> — {MODES.find(m => m.id === inv.mode)?.label}
              </span>
              <button onClick={() => cancelMyPendingMatch(inv.id)} className="pixel-btn pixel-btn-red" style={{ fontSize: '6px', padding: '7px 10px' }}>✕ CANCEL</button>
            </div>
          ))}
        </div>
      )}

      {friends.length === 0 ? (
        <div className="retro-card" style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '7px', color: '#64748b', marginBottom: '10px' }}>You have no friends added yet.</div>
          <a href="/dashboard/friends" style={{ fontSize: '7px', color: '#00ffff', textShadow: '0 0 6px #00ffff' }}>▶ GO ADD FRIENDS</a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '7px', color: '#64748b', marginBottom: '4px' }}>CHOOSE A FRIEND</div>
            {friends.map(f => (
              <div
                key={f.id}
                onClick={() => setSelectedFriend(f)}
                style={{
                  padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                  background: selectedFriend?.id === f.id ? '#00ffff11' : '#0f1629',
                  border: `2px solid ${selectedFriend?.id === f.id ? '#00ffff' : '#1e3a5f'}`,
                  boxShadow: selectedFriend?.id === f.id ? '4px 4px 0 #000, 0 0 12px #00ffff33' : '4px 4px 0 #000',
                }}
              >
                <div style={{ width: '32px', height: '32px', background: '#001133', border: '2px solid #00aaff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🎮</div>
                <div>
                  <div style={{ fontSize: '8px', color: '#00ffff' }}>{f.username}</div>
                  <div style={{ fontSize: '5px', color: '#64748b' }}>LVL {f.level} · {f.total_wins}W-{f.total_losses}L</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '7px', color: '#64748b', marginBottom: '4px' }}>BATTLE MODE</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {MODES.map(mode => (
                <div
                  key={mode.id}
                  onClick={() => setSelectedMode(mode)}
                  style={{
                    padding: '12px', textAlign: 'center', cursor: 'pointer',
                    background: selectedMode.id === mode.id ? 'rgba(0,255,255,0.06)' : '#0f1629',
                    border: `2px solid ${selectedMode.id === mode.id ? '#00ffff' : '#1e3a5f'}`,
                  }}
                >
                  <div style={{ fontSize: '7px', color: selectedMode.id === mode.id ? '#00ffff' : '#e2e8f0', marginBottom: '4px' }}>{mode.label}</div>
                  <div style={{ fontSize: '8px', color: '#ffd700' }}>{mode.duration}</div>
                </div>
              ))}
            </div>

            <div className="retro-card" style={{ padding: '16px', flex: 1 }}>
              {selectedFriend ? (
                <>
                  <div style={{ fontSize: '7px', color: '#ffd700', marginBottom: '12px', textAlign: 'center' }}>⚔ CHALLENGE {selectedFriend.username}</div>
                  <button onClick={sendChallenge} disabled={creating} className="pixel-btn pixel-btn-green" style={{ width: '100%', fontSize: '9px', padding: '12px', opacity: creating ? 0.6 : 1 }}>
                    {creating ? 'SENDING...' : '▶ SEND CHALLENGE'}
                  </button>
                </>
              ) : (
                <div style={{ fontSize: '6px', color: '#64748b', textAlign: 'center' }}>Select a friend to challenge.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
