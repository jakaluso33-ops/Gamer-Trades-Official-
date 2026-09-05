'use client';

import { useState, useEffect } from 'react';
import MiniChart from '@/components/trading/MiniChart';
import PnLMoneyFloat from '@/components/trading/PnLMoneyFloat';
import XPBar from '@/components/gamification/XPBar';
import AchievementBadge, { ACHIEVEMENTS } from '@/components/gamification/AchievementBadge';
import { logEvent } from '@/lib/activity';
import { useAuth } from '@/lib/AuthContext';
import InsightsCard from '@/components/gamification/InsightsCard';

// ─── Static mock data ────────────────────────────────────────────────
const POSITIONS = [
  { symbol: 'AAPL', side: 'LONG', qty: 50, entry: 180.20, current: 182.34, pnl: 107.00, pct: 1.19, up: true },
  { symbol: 'TSLA', side: 'SHORT', qty: 20, entry: 248.90, current: 245.67, pnl: 64.60, pct: 1.30, up: true },
  { symbol: 'BTC', side: 'LONG', qty: 0.5, entry: 66100, current: 67420, pnl: 660.00, pct: 2.00, up: true },
  { symbol: 'NVDA', side: 'LONG', qty: 15, entry: 880.00, current: 875.20, pnl: -72.00, pct: -0.55, up: false },
];

const LEADERBOARD = [
  { rank: 1, name: 'PIXEL_WOLF', pnl: '+18.4%', badge: '👑' },
  { rank: 2, name: 'ALGO_ACE', pnl: '+14.2%', badge: '🤖' },
  { rank: 3, name: 'TREND_TINA', pnl: '+11.9%', badge: '⚡' },
  { rank: 4, name: 'YOU', pnl: '+8.3%', badge: '🎮', isYou: true },
  { rank: 5, name: 'GRID_GARETH', pnl: '+6.1%', badge: '🧙' },
];

const CHALLENGES = [
  { id: 1, title: 'SCALP MASTER', desc: 'Win 3 scalp trades today', progress: 2, max: 3, xp: 150, done: false },
  { id: 2, title: 'BEAT THE BOT', desc: 'Defeat Veteran AI on BTC', progress: 0, max: 1, xp: 300, done: false },
  { id: 3, title: 'GREEN DAY', desc: 'Close all trades profitable', progress: 1, max: 1, xp: 200, done: true },
];

const ASSET_CARDS = [
  { name: 'STOCKS', icon: '📈', status: 'LIVE', color: '#00aaff', count: '8,000+ symbols' },
  { name: 'CRYPTO', icon: '₿', status: 'LIVE', color: '#ffd700', count: '500+ pairs' },
  { name: 'FOREX', icon: '💱', status: 'LIVE', color: '#00ff88', count: '50+ pairs' },
  { name: 'OPTIONS', icon: '⚙', status: 'PRO', color: '#8b5cf6', count: 'All expirations' },
  { name: 'FUTURES', icon: '⚡', status: 'PRO', color: '#ff8800', count: 'ES, NQ, CL, GC' },
];

// ─── Sub-components ───────────────────────────────────────────────────
function StatCard({
  label, value, sub, color = '#00aaff', icon
}: {
  label: string; value: string; sub?: string; color?: string; icon: string;
}) {
  return (
    <div
      className="retro-card"
      style={{ padding: '14px 16px', flex: 1, minWidth: '150px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <span style={{ fontSize: '10px', color: '#64748b', letterSpacing: '1px' }}>{label}</span>
        <span style={{ fontSize: '16px' }}>{icon}</span>
      </div>
      <div style={{ fontSize: '11px', color, textShadow: `0 0 10px ${color}`, lineHeight: 1.2 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '9px', color: '#64748b', marginTop: '6px' }}>{sub}</div>
      )}
    </div>
  );
}

function PositionRow({ pos }: { pos: typeof POSITIONS[0] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '80px 50px 50px 70px 70px 80px',
        gap: '8px',
        alignItems: 'center',
        padding: '8px 12px',
        borderBottom: '1px solid #1e3a5f',
        fontSize: '11px',
      }}
    >
      <span style={{ color: '#00aaff', textShadow: '0 0 6px #00aaff' }}>{pos.symbol}</span>
      <span
        style={{
          color: pos.side === 'LONG' ? '#00ff88' : '#ff3355',
          textShadow: pos.side === 'LONG' ? '0 0 6px #00ff88' : '0 0 6px #ff3355',
        }}
      >
        {pos.side}
      </span>
      <span style={{ color: '#e2e8f0' }}>{pos.qty}</span>
      <span style={{ color: '#64748b' }}>${pos.entry.toLocaleString()}</span>
      <span style={{ color: '#e2e8f0' }}>${pos.current.toLocaleString()}</span>
      <span
        style={{
          color: pos.up ? '#00ff88' : '#ff3355',
          textShadow: pos.up ? '0 0 6px #00ff88' : '0 0 6px #ff3355',
          textAlign: 'right',
        }}
      >
        {pos.up ? '+' : ''}${pos.pnl.toFixed(2)}
      </span>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const [totalPnL, setTotalPnL] = useState(759.60);
  const [pnlFlash, setPnlFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      const delta = (Math.random() - 0.45) * 30;
      setTotalPnL((prev) => parseFloat((prev + delta).toFixed(2)));
      setPnlFlash(delta > 0 ? 'up' : 'down');
      setTimeout(() => setPnlFlash(null), 500);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  // Log at most one check-in per day toward the "trade with discipline" goal
  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const key = `gt_checkin_${user.id}_${today}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    logEvent(user.id, 'daily_checkin');
  }, [user]);

  return (
    <div className="grid-bg crt" style={{ minHeight: '100%', padding: '20px' }}>

      {/* ── Welcome header ── */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
            ▶ WELCOME BACK, PLAYER_01
          </div>
          <h1 className="font-pixel" style={{ fontSize: '12px', color: '#00ffff', textShadow: '0 0 12px #00ffff', margin: 0 }}>
            TRADING ARENA
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="pixel-btn pixel-btn-green" style={{ fontSize: '12px' }}>
            ▶ NEW TRADE
          </button>
          <button className="pixel-btn pixel-btn-blue" style={{ fontSize: '12px' }}>
            ★ VS AI
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <StatCard
          label="TOTAL BALANCE"
          value="$24,830.50"
          sub="▲ +3.45% ALL TIME"
          color="#00ff88"
          icon="💰"
        />
        <StatCard
          label="TODAY'S P&L"
          value={`${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}`}
          sub={`${totalPnL >= 0 ? '▲' : '▼'} ${Math.abs(totalPnL / 240 * 100).toFixed(2)}% TODAY`}
          color={totalPnL >= 0 ? '#00ff88' : '#ff3355'}
          icon={totalPnL >= 0 ? '📈' : '📉'}
        />
        <StatCard
          label="OPEN POSITIONS"
          value="4"
          sub="3 PROFITABLE"
          color="#00aaff"
          icon="◈"
        />
        <StatCard
          label="WIN RATE"
          value="68.4%"
          sub="37W / 17L THIS WEEK"
          color="#ffd700"
          icon="🏆"
        />
        <StatCard
          label="AI BATTLES"
          value="12W / 4L"
          sub="▲ RANK #4 GLOBAL"
          color="#8b5cf6"
          icon="🤖"
        />
      </div>

      <InsightsCard />

      {/* ── Main content grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px', marginBottom: '16px' }}>

        {/* Left: positions + charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Open Positions */}
          <div className="retro-card" style={{ overflow: 'hidden' }}>
            <div
              style={{
                padding: '10px 12px',
                borderBottom: '2px solid #1e3a5f',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '12px', color: '#00aaff', textShadow: '0 0 8px #00aaff' }}>
                ◈ OPEN POSITIONS
              </span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>4 ACTIVE</span>
            </div>
            {/* Header row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 50px 50px 70px 70px 80px',
                gap: '8px',
                padding: '6px 12px',
                borderBottom: '1px solid #1e3a5f',
                fontSize: '10px',
                color: '#64748b',
              }}
            >
              <span>SYMBOL</span>
              <span>SIDE</span>
              <span>QTY</span>
              <span>ENTRY</span>
              <span>CURRENT</span>
              <span style={{ textAlign: 'right' }}>P&L</span>
            </div>
            {POSITIONS.map((p) => <PositionRow key={p.symbol} pos={p} />)}
            <div style={{ padding: '10px 12px', display: 'flex', gap: '8px' }}>
              <button className="pixel-btn pixel-btn-red" style={{ fontSize: '11px', padding: '6px 12px' }}>
                ✕ CLOSE ALL
              </button>
              <button className="pixel-btn pixel-btn-blue" style={{ fontSize: '11px', padding: '6px 12px' }}>
                + ADD POSITION
              </button>
            </div>
          </div>

          {/* P&L Float + Chart cards row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

            {/* Live P&L Float */}
            <div className="retro-card" style={{ padding: '12px', overflow: 'hidden' }}>
              <div style={{ fontSize: '11px', color: '#ffd700', textShadow: '0 0 8px #ffd700', marginBottom: '8px' }}>
                💸 LIVE P&L FEED
              </div>
              <PnLMoneyFloat />
              <div
                className={pnlFlash === 'up' ? 'flash-green' : pnlFlash === 'down' ? 'flash-red' : ''}
                style={{
                  textAlign: 'center',
                  marginTop: '4px',
                  fontSize: '9px',
                  color: totalPnL >= 0 ? '#00ff88' : '#ff3355',
                  textShadow: totalPnL >= 0 ? '0 0 12px #00ff88' : '0 0 12px #ff3355',
                  padding: '4px',
                  borderRadius: '2px',
                }}
              >
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
              </div>
            </div>

            {/* AAPL mini chart */}
            <div className="retro-card" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: '#00aaff', textShadow: '0 0 8px #00aaff' }}>
                  AAPL
                </span>
                <span style={{ fontSize: '11px', color: '#00ff88', textShadow: '0 0 6px #00ff88' }}>
                  $182.34 ▲
                </span>
              </div>
              <MiniChart positive={true} height={72} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: '#64748b' }}>
                <span>RSI: 54.2</span>
                <span>MACD: +0.34</span>
                <span>VOL: 2.4M</span>
              </div>
            </div>
          </div>

          {/* Asset class quick access */}
          <div className="retro-card" style={{ padding: '12px' }}>
            <div style={{ fontSize: '11px', color: '#00aaff', textShadow: '0 0 8px #00aaff', marginBottom: '10px' }}>
              ◆ MARKETS
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {ASSET_CARDS.map((a) => (
                <div
                  key={a.name}
                  style={{
                    flex: '1 1 100px',
                    padding: '10px',
                    background: '#0a0e1a',
                    border: `2px solid ${a.color}`,
                    boxShadow: `2px 2px 0 #000, 0 0 8px ${a.color}33`,
                    cursor: 'pointer',
                    textAlign: 'center',
                    position: 'relative',
                  }}
                >
                  {a.status === 'PRO' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-1px',
                        right: '-1px',
                        background: '#8b5cf6',
                        color: '#fff',
                        fontSize: '9px',
                        padding: '2px 4px',
                        letterSpacing: '0.5px',
                      }}
                    >
                      PRO
                    </div>
                  )}
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>{a.icon}</div>
                  <div style={{ fontSize: '10px', color: a.color, textShadow: `0 0 6px ${a.color}`, marginBottom: '2px' }}>
                    {a.name}
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b' }}>{a.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Player stats */}
          <div className="retro-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '11px', color: '#8b5cf6', textShadow: '0 0 8px #8b5cf6', marginBottom: '10px' }}>
              ★ PLAYER STATS
            </div>
            <XPBar current={3240} max={5000} level={12} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
              {[
                { k: 'TRADES', v: '54' },
                { k: 'WIN RATE', v: '68%' },
                { k: 'BEST DAY', v: '+$1,240' },
                { k: 'STREAK', v: '🔥 5W' },
              ].map((s) => (
                <div key={s.k} style={{ padding: '6px 8px', background: '#0a0e1a', border: '1px solid #1e3a5f' }}>
                  <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '3px' }}>{s.k}</div>
                  <div style={{ fontSize: '12px', color: '#e2e8f0' }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="retro-card" style={{ overflow: 'hidden' }}>
            <div
              style={{
                padding: '10px 12px',
                borderBottom: '2px solid #1e3a5f',
                fontSize: '11px',
                color: '#ffd700',
                textShadow: '0 0 8px #ffd700',
              }}
            >
              ♛ LEADERBOARD
            </div>
            {LEADERBOARD.map((entry) => (
              <div
                key={entry.rank}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderBottom: '1px solid #1e3a5f',
                  background: (entry as any).isYou ? 'rgba(0,255,136,0.05)' : 'transparent',
                  borderLeft: (entry as any).isYou ? '3px solid #00ff88' : '3px solid transparent',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    width: '16px',
                    color: entry.rank <= 3 ? '#ffd700' : '#64748b',
                    textShadow: entry.rank <= 3 ? '0 0 6px #ffd700' : 'none',
                  }}
                >
                  #{entry.rank}
                </span>
                <span style={{ fontSize: '10px' }}>{entry.badge}</span>
                <span
                  style={{
                    flex: 1,
                    fontSize: '10px',
                    color: (entry as any).isYou ? '#00ff88' : '#e2e8f0',
                    textShadow: (entry as any).isYou ? '0 0 6px #00ff88' : 'none',
                  }}
                >
                  {entry.name}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#00ff88',
                    textShadow: '0 0 6px #00ff88',
                  }}
                >
                  {entry.pnl}
                </span>
              </div>
            ))}
          </div>

          {/* Daily Challenges */}
          <div className="retro-card" style={{ overflow: 'hidden' }}>
            <div
              style={{
                padding: '10px 12px',
                borderBottom: '2px solid #1e3a5f',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '11px', color: '#00ff88', textShadow: '0 0 8px #00ff88' }}>
                ◆ DAILY CHALLENGES
              </span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>RESETS IN 14:32:07</span>
            </div>
            <div style={{ padding: '10px' }}>
              {CHALLENGES.map((c) => (
                <div
                  key={c.id}
                  style={{
                    marginBottom: '10px',
                    padding: '8px',
                    background: c.done ? 'rgba(0,255,136,0.05)' : '#0a0e1a',
                    border: `1px solid ${c.done ? '#00ff88' : '#1e3a5f'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        color: c.done ? '#00ff88' : '#e2e8f0',
                        textShadow: c.done ? '0 0 6px #00ff88' : 'none',
                      }}
                    >
                      {c.done ? '✓ ' : ''}{c.title}
                    </span>
                    <span style={{ fontSize: '9px', color: '#ffd700', textShadow: '0 0 6px #ffd700' }}>
                      +{c.xp} XP
                    </span>
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '5px' }}>{c.desc}</div>
                  <div style={{ height: '5px', background: '#0f1629', border: '1px solid #1e3a5f' }}>
                    <div
                      style={{
                        width: `${(c.progress / c.max) * 100}%`,
                        height: '100%',
                        background: c.done ? '#00ff88' : '#00aaff',
                        boxShadow: c.done ? '0 0 6px #00ff88' : '0 0 4px #00aaff',
                        transition: 'width 0.5s',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px', textAlign: 'right' }}>
                    {c.progress}/{c.max}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="retro-card" style={{ overflow: 'hidden' }}>
            <div
              style={{
                padding: '10px 12px',
                borderBottom: '2px solid #1e3a5f',
                fontSize: '11px',
                color: '#ffd700',
                textShadow: '0 0 8px #ffd700',
              }}
            >
              🏆 ACHIEVEMENTS
            </div>
            <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {ACHIEVEMENTS.map((a) => (
                <AchievementBadge key={a.name} achievement={a} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Battle quick launch ── */}
      <div
        className="retro-card"
        style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #0d0020 0%, #0a0e1a 100%)',
          borderColor: '#8b5cf6',
          boxShadow: '4px 4px 0 #000, 0 0 20px #8b5cf644',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          marginBottom: '16px',
        }}
      >
        <div style={{ fontSize: '40px' }}>🤖</div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: '9px',
              color: '#8b5cf6',
              textShadow: '0 0 12px #8b5cf6',
              marginBottom: '6px',
            }}
          >
            ★ HUMAN VS AI MODE
          </div>
          <div style={{ fontSize: '10px', color: '#64748b', lineHeight: '1.8' }}>
            Challenge AlgoAce, TrendTina, or GridGareth in live paper trading battles.
            <br />
            Scalp, swing, long or short — your strategy vs theirs, in real-time.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['🤖 ALGOACE', '⚡ TRENDTINA', '🧙 GRIDGARETH'].map((ai) => (
            <button
              key={ai}
              className="pixel-btn"
              style={{
                fontSize: '10px',
                padding: '8px 12px',
                background: '#1a0035',
                color: '#8b5cf6',
                borderColor: '#8b5cf6',
                boxShadow: '3px 3px 0 #8b5cf644',
              }}
            >
              {ai}
            </button>
          ))}
        </div>
      </div>

      {/* ── BTC mini chart + ETH side by side ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="retro-card" style={{ padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#ffd700', textShadow: '0 0 8px #ffd700' }}>
              BTC/USD
            </span>
            <span style={{ fontSize: '11px', color: '#00ff88', textShadow: '0 0 6px #00ff88' }}>
              $67,420 ▲ +1.86%
            </span>
          </div>
          <MiniChart positive={true} color="#ffd700" height={80} />
        </div>
        <div className="retro-card" style={{ padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#8b5cf6', textShadow: '0 0 8px #8b5cf6' }}>
              ETH/USD
            </span>
            <span style={{ fontSize: '11px', color: '#ff3355', textShadow: '0 0 6px #ff3355' }}>
              $3,521 ▼ -1.26%
            </span>
          </div>
          <MiniChart positive={false} color="#8b5cf6" height={80} />
        </div>
      </div>

    </div>
  );
}
