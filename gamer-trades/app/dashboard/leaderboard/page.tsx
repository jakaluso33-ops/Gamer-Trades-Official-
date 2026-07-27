'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getLeaderboard, LeaderboardEntry } from '@/lib/leaderboard';

const RANK_COLORS = ['#ffd700', '#94a3b8', '#cd7f32'];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);

  useEffect(() => {
    getLeaderboard().then(setEntries).catch(console.error);
  }, []);

  const yourRank = entries && user ? entries.findIndex(e => e.id === user.id) + 1 : 0;
  const podium = entries?.slice(0, 3) ?? [];

  return (
    <div className="grid-bg" style={{ minHeight: '100%' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '6px', color: '#64748b', marginBottom: '4px' }}>♛ RANKINGS</div>
          <h1 style={{ fontSize: '13px', color: '#ffd700', textShadow: '0 0 12px #ffd700', margin: 0 }}>LEADERBOARD</h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '6px', color: '#64748b', marginBottom: '2px' }}>YOUR RANK</div>
          <div style={{ fontSize: '12px', color: '#00ffff', textShadow: '0 0 10px #00ffff' }}>
            {yourRank > 0 ? `#${yourRank} GLOBAL` : '—'}
          </div>
        </div>
      </div>

      {entries === null ? (
        <div style={{ fontSize: '7px', color: '#64748b' }}>Loading leaderboard...</div>
      ) : entries.length === 0 ? (
        <div className="retro-card" style={{ padding: '30px', textAlign: 'center' }}>
          <div style={{ fontSize: '8px', color: '#64748b' }}>No ranked players yet — be the first!</div>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          {podium.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '12px', marginBottom: '20px', padding: '20px 0' }}>
              {[podium[1], podium[0], podium[2]].map((entry, i) => {
                if (!entry) return <div key={i} style={{ width: '80px' }} />;
                const rank = entry === podium[0] ? 1 : entry === podium[1] ? 2 : 3;
                const isFirst = rank === 1;
                const color = RANK_COLORS[rank - 1];
                const medal = rank === 1 ? '👑' : rank === 2 ? '🥈' : '🥉';
                return (
                  <div key={entry.id} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: isFirst ? '32px' : '28px', marginBottom: '4px' }}>🎮</div>
                    <div
                      style={{
                        padding: isFirst ? '16px 24px' : '16px 20px',
                        background: isFirst ? '#1a1000' : '#0f1629',
                        border: `2px solid ${color}`,
                        boxShadow: `4px 4px 0 #000, 0 0 ${isFirst ? 16 : 10}px ${color}44`,
                        height: isFirst ? '110px' : rank === 2 ? '80px' : '60px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        minWidth: '90px',
                      }}
                    >
                      <div style={{ fontSize: '6px', color, textShadow: isFirst ? `0 0 8px ${color}` : 'none' }}>{entry.username}</div>
                      <div style={{ fontSize: isFirst ? '10px' : '8px', color: '#00ff88', marginTop: '3px' }}>{entry.xp.toLocaleString()} XP</div>
                    </div>
                    <div style={{ fontSize: isFirst ? '14px' : '10px', marginTop: '4px' }}>{medal}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Leaderboard table */}
          <div className="retro-card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '36px 140px 70px 60px 100px 90px', gap: '6px', padding: '7px 14px', borderBottom: '2px solid #1e3a5f', fontSize: '5px', color: '#64748b' }}>
              <span>RANK</span><span>PLAYER</span><span>LEVEL</span><span>XP</span><span>LIFETIME P&L</span><span>WIN RATE</span>
            </div>
            {entries.map((entry, i) => {
              const rank = i + 1;
              const isTop3 = rank <= 3;
              const rankColor = isTop3 ? RANK_COLORS[rank - 1] : '#64748b';
              const isYou = entry.id === user?.id;

              return (
                <div
                  key={entry.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '36px 140px 70px 60px 100px 90px',
                    gap: '6px',
                    padding: '10px 14px',
                    borderBottom: '1px solid #0f1629',
                    background: isYou ? 'rgba(0,255,136,0.05)' : isTop3 ? `${rankColor}08` : 'transparent',
                    borderLeft: isYou ? '3px solid #00ff88' : '3px solid transparent',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '8px', color: rankColor, textShadow: isTop3 ? `0 0 8px ${rankColor}` : 'none' }}>
                    #{rank}
                  </span>
                  <span style={{ fontSize: '7px', color: isYou ? '#00ff88' : '#e2e8f0', textShadow: isYou ? '0 0 6px #00ff88' : 'none' }}>
                    {entry.username}{isYou ? ' (YOU)' : ''}
                  </span>
                  <span style={{ fontSize: '6px', color: '#64748b' }}>LVL {entry.level}</span>
                  <span style={{ fontSize: '6px', color: '#ffd700' }}>{entry.xp.toLocaleString()}</span>
                  <span style={{ fontSize: '7px', color: entry.lifetime_pnl >= 0 ? '#00ff88' : '#ff3355' }}>
                    {entry.lifetime_pnl >= 0 ? '+' : ''}${entry.lifetime_pnl.toFixed(2)}
                  </span>
                  <span style={{ fontSize: '6px', color: '#64748b' }}>
                    {entry.total_wins + entry.total_losses > 0 ? `${Math.round(entry.win_rate)}%` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
