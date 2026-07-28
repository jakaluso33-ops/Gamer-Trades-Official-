'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MiniChart from '@/components/trading/MiniChart';
import PvpBattle from '@/components/trading/PvpBattle';
import { logEvent } from '@/lib/activity';
import { useAuth } from '@/lib/AuthContext';
import { recordAiBattle, AiOpponentId, AiDifficulty } from '@/lib/aiBattles';

const AI_OPPONENTS = [
  {
    id: 'algoace',
    name: 'ALGO ACE',
    icon: '🤖',
    strategy: 'RSI SCALPER',
    style: 'Aggressive short-term momentum trader. Enters on RSI extremes.',
    color: '#00aaff',
    difficulty: 'VETERAN',
    winRate: '71%',
    avgReturn: '+2.4%',
    speciality: 'SCALPING',
  },
  {
    id: 'trendtina',
    name: 'TREND TINA',
    icon: '⚡',
    strategy: 'MACD SWING',
    style: 'Methodical swing trader. Follows MACD crossovers and trend momentum.',
    color: '#8b5cf6',
    difficulty: 'LEGEND',
    winRate: '65%',
    avgReturn: '+5.8%',
    speciality: 'SWING',
  },
  {
    id: 'gridgareth',
    name: 'GRID GARETH',
    icon: '🧙',
    strategy: 'BREAKOUT',
    style: 'Defensive breakout trader. Waits for Donchian channel breaks.',
    color: '#ffd700',
    difficulty: 'ROOKIE',
    winRate: '58%',
    avgReturn: '+1.2%',
    speciality: 'BREAKOUT',
  },
];

const BATTLE_MODES = [
  { id: 'scalp', label: 'SCALP BATTLE', duration: '5 min', desc: 'Fast trades, high frequency' },
  { id: 'swing', label: 'SWING BATTLE', duration: '30 min', desc: 'Trend following, patience' },
  { id: 'long', label: 'LONG BATTLE', duration: '1 hour', desc: 'Hold your nerve' },
  { id: 'short', label: 'SHORT BATTLE', duration: '15 min', desc: 'Bearish strategies only' },
];

type Phase = 'select' | 'battle' | 'result';

function secondsForMode(modeId: string): number {
  return modeId === 'scalp' ? 300 : modeId === 'short' ? 900 : modeId === 'swing' ? 1800 : 3600;
}

interface BattleAction {
  time: string;
  actor: 'YOU' | string;
  action: string;
  color: string;
}

export default function BattlePage() {
  return (
    <Suspense fallback={null}>
      <BattleModeSwitcher />
    </Suspense>
  );
}

function BattleModeSwitcher() {
  const searchParams = useSearchParams();
  const challengeId = searchParams.get('challenge');
  const [battleType, setBattleType] = useState<'ai' | 'friend'>(challengeId ? 'friend' : 'ai');

  return (
    <div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        <button
          onClick={() => setBattleType('ai')}
          className="pixel-btn"
          style={{
            fontSize: '11px', padding: '9px 16px',
            background: battleType === 'ai' ? '#8b5cf622' : '#0a0e1a',
            color: battleType === 'ai' ? '#8b5cf6' : '#64748b',
            borderColor: battleType === 'ai' ? '#8b5cf6' : '#1e3a5f',
          }}
        >
          ★ VS AI
        </button>
        <button
          onClick={() => setBattleType('friend')}
          className="pixel-btn"
          style={{
            fontSize: '11px', padding: '9px 16px',
            background: battleType === 'friend' ? '#00ffff22' : '#0a0e1a',
            color: battleType === 'friend' ? '#00ffff' : '#64748b',
            borderColor: battleType === 'friend' ? '#00ffff' : '#1e3a5f',
          }}
        >
          ⚔ VS FRIEND
        </button>
      </div>
      {battleType === 'ai' ? <AiBattle /> : <PvpBattle presetChallengeId={challengeId ?? undefined} />}
    </div>
  );
}

function AiBattle() {
  const { user } = useAuth();
  const [selectedAI, setSelectedAI] = useState(AI_OPPONENTS[0]);
  const [selectedMode, setSelectedMode] = useState(BATTLE_MODES[0]);
  const [difficulty, setDifficulty] = useState<'ROOKIE' | 'VETERAN' | 'LEGEND'>('VETERAN');
  const [phase, setPhase] = useState<Phase>('select');
  const [playerPnL, setPlayerPnL] = useState(0);
  const [aiPnL, setAIPnL] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [actions, setActions] = useState<BattleAction[]>([]);
  const [playerTrades, setPlayerTrades] = useState(0);
  const [aiTrades, setAITrades] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordedRef = useRef(false);

  const startBattle = () => {
    setPhase('battle');
    setPlayerPnL(0);
    setAIPnL(0);
    setPlayerTrades(0);
    setAITrades(0);
    setActions([]);
    recordedRef.current = false;
    setTimeLeft(secondsForMode(selectedMode.id));
  };

  // Battle simulation
  useEffect(() => {
    if (phase !== 'battle') return;

    // AI auto-trades
    const aiInterval = setInterval(() => {
      const delta = (Math.random() - (difficulty === 'LEGEND' ? 0.35 : difficulty === 'VETERAN' ? 0.42 : 0.48)) * 120;
      setAIPnL(p => parseFloat((p + delta).toFixed(2)));
      setAITrades(t => t + 1);
      const syms = ['AAPL', 'BTC', 'TSLA', 'ETH'];
      const sides = ['BOUGHT', 'SOLD SHORT'];
      const sym = syms[Math.floor(Math.random() * syms.length)];
      const side = sides[Math.floor(Math.random() * sides.length)];
      setActions(prev => [{
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        actor: selectedAI.name,
        action: `${side} 10x ${sym}`,
        color: selectedAI.color,
      }, ...prev.slice(0, 14)]);
    }, difficulty === 'LEGEND' ? 2500 : difficulty === 'VETERAN' ? 4000 : 6000);

    // Timer countdown
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          clearInterval(aiInterval);
          setPhase('result');
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      clearInterval(aiInterval);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, difficulty, selectedAI]);

  // Record battle completion once when the result phase is reached
  useEffect(() => {
    if (phase !== 'result' || !user || recordedRef.current) return;
    recordedRef.current = true;
    logEvent(user.id, 'ai_battle_played', { aiId: selectedAI.id });
    if (playerPnL > aiPnL) logEvent(user.id, 'ai_battle_won', { aiId: selectedAI.id });
    recordAiBattle(user.id, {
      opponentId: selectedAI.id as AiOpponentId,
      difficulty,
      mode: selectedMode.id as 'scalp' | 'swing' | 'long' | 'short',
      durationSeconds: secondsForMode(selectedMode.id),
      playerPnl: playerPnL,
      aiPnl: aiPnL,
      playerTrades,
      aiTrades,
    }).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handlePlayerTrade = (side: 'BUY' | 'SELL') => {
    const delta = (Math.random() - 0.45) * 100;
    setPlayerPnL(p => parseFloat((p + delta).toFixed(2)));
    setPlayerTrades(t => t + 1);
    if (user) logEvent(user.id, 'trade_closed', { context: 'ai_battle' });
    const syms = ['AAPL', 'BTC', 'TSLA', 'ETH'];
    const sym = syms[Math.floor(Math.random() * syms.length)];
    setActions(prev => [{
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      actor: 'YOU',
      action: `${side === 'BUY' ? 'BOUGHT' : 'SOLD SHORT'} 10x ${sym}`,
      color: '#00ffff',
    }, ...prev.slice(0, 14)]);
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const playerWon = playerPnL > aiPnL;
  const diffColors = { ROOKIE: '#00ff88', VETERAN: '#ffd700', LEGEND: '#ff3355' } as const;

  // ── SELECT PHASE ──
  if (phase === 'select') return (
    <div className="grid-bg" style={{ minHeight: '100%' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '6px' }}>★ HUMAN VS AI MODE</div>
        <h1 className="font-pixel" style={{ fontSize: '12px', color: '#8b5cf6', textShadow: '0 0 12px #8b5cf6', margin: 0 }}>SELECT YOUR OPPONENT</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Left: AI selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>CHOOSE AI OPPONENT</div>
          {AI_OPPONENTS.map(ai => (
            <div
              key={ai.id}
              onClick={() => setSelectedAI(ai)}
              style={{
                padding: '16px',
                background: selectedAI.id === ai.id ? `${ai.color}11` : '#0f1629',
                border: `2px solid ${selectedAI.id === ai.id ? ai.color : '#1e3a5f'}`,
                boxShadow: selectedAI.id === ai.id ? `4px 4px 0 #000, 0 0 16px ${ai.color}44` : '4px 4px 0 #000',
                cursor: 'pointer',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: '36px', lineHeight: 1 }}>{ai.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '9px', color: ai.color, textShadow: `0 0 8px ${ai.color}` }}>{ai.name}</span>
                  <span style={{ fontSize: '10px', color: diffColors[ai.difficulty as keyof typeof diffColors], border: `1px solid ${diffColors[ai.difficulty as keyof typeof diffColors]}`, padding: '2px 5px' }}>
                    {ai.difficulty}
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '6px' }}>{ai.strategy}</div>
                <div style={{ fontSize: '9px', color: '#64748b', lineHeight: 2 }}>{ai.style}</div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '10px' }}>
                  <span style={{ color: '#64748b' }}>WIN RATE: <span style={{ color: '#00ff88' }}>{ai.winRate}</span></span>
                  <span style={{ color: '#64748b' }}>AVG RTN: <span style={{ color: '#ffd700' }}>{ai.avgReturn}</span></span>
                </div>
              </div>
            </div>
          ))}

          {/* Difficulty override */}
          <div className="retro-card" style={{ padding: '12px' }}>
            <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '8px' }}>DIFFICULTY OVERRIDE</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['ROOKIE', 'VETERAN', 'LEGEND'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className="pixel-btn"
                  style={{
                    flex: 1, fontSize: '10px', padding: '7px 4px',
                    background: difficulty === d ? `${diffColors[d]}22` : '#0a0e1a',
                    color: difficulty === d ? diffColors[d] : '#64748b',
                    borderColor: difficulty === d ? diffColors[d] : '#1e3a5f',
                    boxShadow: difficulty === d ? `0 0 8px ${diffColors[d]}44` : 'none',
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: battle mode + preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>BATTLE MODE</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {BATTLE_MODES.map(mode => (
              <div
                key={mode.id}
                onClick={() => setSelectedMode(mode)}
                style={{
                  padding: '12px',
                  background: selectedMode.id === mode.id ? 'rgba(0,255,255,0.06)' : '#0f1629',
                  border: `2px solid ${selectedMode.id === mode.id ? '#00ffff' : '#1e3a5f'}`,
                  boxShadow: selectedMode.id === mode.id ? '4px 4px 0 #000, 0 0 12px #00ffff33' : '4px 4px 0 #000',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: selectedMode.id === mode.id ? '#00ffff' : '#e2e8f0', marginBottom: '4px', textShadow: selectedMode.id === mode.id ? '0 0 8px #00ffff' : 'none' }}>
                  {mode.label}
                </div>
                <div style={{ fontSize: '12px', color: '#ffd700', textShadow: '0 0 6px #ffd700', marginBottom: '3px' }}>{mode.duration}</div>
                <div style={{ fontSize: '9px', color: '#64748b' }}>{mode.desc}</div>
              </div>
            ))}
          </div>

          {/* Match preview */}
          <div className="retro-card" style={{ padding: '16px', flex: 1 }}>
            <div style={{ fontSize: '11px', color: '#ffd700', textShadow: '0 0 8px #ffd700', marginBottom: '12px', textAlign: 'center' }}>
              ⚔ MATCH PREVIEW
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px', marginBottom: '4px' }}>🎮</div>
                <div style={{ fontSize: '11px', color: '#00ffff', textShadow: '0 0 8px #00ffff' }}>YOU</div>
                <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>PLAYER_01</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#ff3355', textShadow: '0 0 10px #ff3355' }}>VS</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px', marginBottom: '4px' }}>{selectedAI.icon}</div>
                <div style={{ fontSize: '11px', color: selectedAI.color, textShadow: `0 0 8px ${selectedAI.color}` }}>{selectedAI.name}</div>
                <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>{selectedAI.strategy}</div>
              </div>
            </div>
            {[
              { k: 'MODE', v: selectedMode.label },
              { k: 'DURATION', v: selectedMode.duration },
              { k: 'DIFFICULTY', v: difficulty, c: diffColors[difficulty] },
              { k: 'STARTING CAPITAL', v: '$10,000 each' },
              { k: 'WIN CONDITION', v: 'Highest % P&L' },
            ].map(({ k, v, c }) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #0f1629', fontSize: '10px' }}>
                <span style={{ color: '#64748b' }}>{k}</span>
                <span style={{ color: c ?? '#e2e8f0' }}>{v}</span>
              </div>
            ))}
            <button onClick={startBattle} className="pixel-btn pixel-btn-green" style={{ width: '100%', fontSize: '9px', padding: '12px', marginTop: '16px' }}>
              ▶ START BATTLE
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── RESULT PHASE ──
  if (phase === 'result') return (
    <div className="grid-bg" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div className="retro-card" style={{
        padding: '40px',
        textAlign: 'center',
        maxWidth: '520px',
        width: '100%',
        borderColor: playerWon ? '#00ff88' : '#ff3355',
        boxShadow: `4px 4px 0 #000, 0 0 20px ${playerWon ? '#00ff8844' : '#ff335544'}`,
      }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>{playerWon ? '🏆' : '😵'}</div>
        <div style={{ fontSize: '16px', color: playerWon ? '#00ff88' : '#ff3355', textShadow: `0 0 16px ${playerWon ? '#00ff88' : '#ff3355'}`, marginBottom: '8px' }}>
          {playerWon ? 'YOU WIN!' : 'AI WINS!'}
        </div>
        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '24px' }}>
          {playerWon ? `▶ YOU DEFEATED ${selectedAI.name}` : `▶ ${selectedAI.name} OUTTRADED YOU`}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'YOUR P&L', value: `${playerPnL >= 0 ? '+' : ''}$${playerPnL.toFixed(2)}`, color: playerPnL >= 0 ? '#00ff88' : '#ff3355', icon: '🎮' },
            { label: `${selectedAI.name} P&L`, value: `${aiPnL >= 0 ? '+' : ''}$${aiPnL.toFixed(2)}`, color: aiPnL >= 0 ? '#00ff88' : '#ff3355', icon: selectedAI.icon },
          ].map(s => (
            <div key={s.label} style={{ padding: '12px', background: '#0a0e1a', border: `2px solid ${s.color}44` }}>
              <div style={{ fontSize: '18px', marginBottom: '4px' }}>{s.icon}</div>
              <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '10px', color: s.color, textShadow: `0 0 8px ${s.color}` }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px', fontSize: '10px', color: '#64748b' }}>
          <span>YOUR TRADES: <b style={{ color: '#e2e8f0' }}>{playerTrades}</b></span>
          <span>|</span>
          <span>AI TRADES: <b style={{ color: '#e2e8f0' }}>{aiTrades}</b></span>
        </div>

        {playerWon && (
          <div style={{ padding: '8px', background: '#8b5cf622', border: '2px solid #8b5cf6', marginBottom: '16px', fontSize: '11px', color: '#8b5cf6', textShadow: '0 0 6px #8b5cf6' }}>
            +{difficulty === 'LEGEND' ? 400 : difficulty === 'VETERAN' ? 150 : 50} XP EARNED!
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setPhase('select')} className="pixel-btn pixel-btn-blue" style={{ flex: 1, fontSize: '11px', padding: '10px' }}>
            ◀ NEW BATTLE
          </button>
          <button onClick={startBattle} className="pixel-btn pixel-btn-green" style={{ flex: 1, fontSize: '11px', padding: '10px' }}>
            ▶ REMATCH
          </button>
        </div>
      </div>
    </div>
  );

  // ── BATTLE PHASE ──
  const playerPct = ((playerPnL) / 10000 * 100).toFixed(2);
  const aiPct = ((aiPnL) / 10000 * 100).toFixed(2);
  const playerAhead = playerPnL >= aiPnL;

  return (
    <div className="grid-bg" style={{ minHeight: '100%' }}>
      {/* Battle header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: '#ff3355', textShadow: '0 0 10px #ff3355' }}>
          ⚔ BATTLE IN PROGRESS
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>TIME REMAINING</div>
          <div style={{
            fontSize: '12px',
            color: timeLeft < 30 ? '#ff3355' : '#ffd700',
            textShadow: `0 0 12px ${timeLeft < 30 ? '#ff3355' : '#ffd700'}`,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {formatTime(timeLeft)}
          </div>
        </div>
        <div style={{ fontSize: '10px', color: selectedAI.color }}>{selectedMode.label}</div>
      </div>

      {/* VS scoreboard */}
      <div className="retro-card" style={{ padding: '20px', marginBottom: '16px', borderColor: '#8b5cf6', boxShadow: '4px 4px 0 #000, 0 0 16px #8b5cf633' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', alignItems: 'center' }}>
          {/* Player */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '6px' }}>🎮</div>
            <div style={{ fontSize: '12px', color: '#00ffff', textShadow: '0 0 8px #00ffff', marginBottom: '4px' }}>YOU</div>
            <div style={{ fontSize: '18px', color: playerPnL >= 0 ? '#00ff88' : '#ff3355', textShadow: `0 0 12px ${playerPnL >= 0 ? '#00ff88' : '#ff3355'}`, marginBottom: '4px' }}>
              {playerPnL >= 0 ? '+' : ''}${playerPnL.toFixed(2)}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>{playerPct}% return</div>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{playerTrades} trades</div>
            {playerAhead && <div style={{ fontSize: '10px', color: '#00ff88', marginTop: '4px', textShadow: '0 0 6px #00ff88' }}>▲ LEADING</div>}
          </div>

          <div style={{ textAlign: 'center', fontSize: '9px', color: '#ff3355', textShadow: '0 0 12px #ff3355' }}>VS</div>

          {/* AI */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '6px' }}>{selectedAI.icon}</div>
            <div style={{ fontSize: '12px', color: selectedAI.color, textShadow: `0 0 8px ${selectedAI.color}`, marginBottom: '4px' }}>{selectedAI.name}</div>
            <div style={{ fontSize: '18px', color: aiPnL >= 0 ? '#00ff88' : '#ff3355', textShadow: `0 0 12px ${aiPnL >= 0 ? '#00ff88' : '#ff3355'}`, marginBottom: '4px' }}>
              {aiPnL >= 0 ? '+' : ''}${aiPnL.toFixed(2)}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>{aiPct}% return</div>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{aiTrades} trades</div>
            {!playerAhead && <div style={{ fontSize: '10px', color: selectedAI.color, marginTop: '4px', textShadow: `0 0 6px ${selectedAI.color}` }}>▲ LEADING</div>}
          </div>
        </div>

        {/* P&L bar comparison */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b', marginBottom: '4px' }}>
            <span>YOU</span><span>P&L COMPARISON</span><span>{selectedAI.name}</span>
          </div>
          <div style={{ height: '8px', background: '#0a0e1a', border: '1px solid #1e3a5f', display: 'flex', overflow: 'hidden' }}>
            <div style={{ width: `${Math.max(5, Math.min(95, 50 + (playerPnL / 200)))}%`, background: '#00aaff', boxShadow: '0 0 6px #00aaff', transition: 'width 0.5s' }} />
            <div style={{ flex: 1, background: selectedAI.color, boxShadow: `0 0 6px ${selectedAI.color}`, transition: 'all 0.5s' }} />
          </div>
        </div>
      </div>

      {/* Charts + controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="retro-card" style={{ padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px' }}>
              <span style={{ color: '#00aaff', textShadow: '0 0 6px #00aaff' }}>AAPL — LIVE</span>
              <span style={{ color: '#00ff88' }}>$182.34 ▲</span>
            </div>
            <MiniChart positive={true} height={100} />
          </div>

          {/* Action feed */}
          <div className="retro-card" style={{ padding: '12px' }}>
            <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '8px' }}>◎ BATTLE FEED</div>
            {actions.length === 0
              ? <div style={{ fontSize: '10px', color: '#1e3a5f' }}>Waiting for trades...</div>
              : actions.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', padding: '4px 0', borderBottom: '1px solid #0f1629', fontSize: '10px', opacity: 1 - i * 0.06 }}>
                  <span style={{ color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>{a.time}</span>
                  <span style={{ color: a.color, textShadow: `0 0 4px ${a.color}` }}>{a.actor}</span>
                  <span style={{ color: '#e2e8f0' }}>{a.action}</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Player controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="retro-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '11px', color: '#00ffff', textShadow: '0 0 8px #00ffff', marginBottom: '12px' }}>
              YOUR MOVES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => handlePlayerTrade('BUY')} className="pixel-btn pixel-btn-green" style={{ width: '100%', fontSize: '9px', padding: '14px' }}>
                ▲ BUY AAPL
              </button>
              <button onClick={() => handlePlayerTrade('SELL')} className="pixel-btn pixel-btn-red" style={{ width: '100%', fontSize: '9px', padding: '14px' }}>
                ▼ SELL SHORT
              </button>
            </div>
            <div style={{ marginTop: '12px', padding: '8px', background: '#0a0e1a', border: '1px solid #1e3a5f', fontSize: '10px' }}>
              <div style={{ color: '#64748b', marginBottom: '4px' }}>QUICK SCALP</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {['BTC', 'ETH', 'TSLA', 'NVDA'].map(sym => (
                  <button
                    key={sym}
                    onClick={() => handlePlayerTrade(Math.random() > 0.5 ? 'BUY' : 'SELL')}
                    className="pixel-btn pixel-btn-blue"
                    style={{ fontSize: '9px', padding: '5px' }}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI status card */}
          <div className="retro-card" style={{ padding: '12px', borderColor: selectedAI.color + '66', boxShadow: `4px 4px 0 #000, 0 0 10px ${selectedAI.color}22` }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>{selectedAI.icon}</span>
              <div>
                <div style={{ fontSize: '11px', color: selectedAI.color, textShadow: `0 0 6px ${selectedAI.color}` }}>{selectedAI.name}</div>
                <div style={{ fontSize: '9px', color: '#64748b' }}>{selectedAI.strategy}</div>
              </div>
            </div>
            <div style={{ fontSize: '9px', color: '#64748b', lineHeight: 2 }}>
              {aiTrades > 0
                ? `Last action: ${actions.find(a => a.actor === selectedAI.name)?.action ?? 'Analyzing...'}`
                : 'Scanning market...'}
            </div>
            <div style={{ marginTop: '8px', height: '4px', background: '#0a0e1a', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${(aiTrades % 10) * 10}%`,
                  height: '100%',
                  background: selectedAI.color,
                  boxShadow: `0 0 4px ${selectedAI.color}`,
                  transition: 'width 0.3s',
                }}
              />
            </div>
            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>SIGNAL STRENGTH</div>
          </div>

          <button
            onClick={() => { setPhase('result'); if (timerRef.current) clearInterval(timerRef.current); }}
            className="pixel-btn pixel-btn-red"
            style={{ width: '100%', fontSize: '11px', padding: '10px' }}
          >
            ✕ FORFEIT BATTLE
          </button>
        </div>
      </div>
    </div>
  );
}
