'use client';

import { useState } from 'react';
import MiniChart from '@/components/trading/MiniChart';

const GLOBAL_BOARD = [
  { rank: 1, name: 'PIXEL_WOLF', avatar: '🐺', weekly: '+18.4%', allTime: '+142.3%', trades: 234, badge: '👑', streak: 12 },
  { rank: 2, name: 'ALGO_ACE', avatar: '🤖', weekly: '+14.2%', allTime: '+98.7%', trades: 187, badge: '🥈', streak: 8 },
  { rank: 3, name: 'TREND_TINA', avatar: '⚡', weekly: '+11.9%', allTime: '+87.2%', trades: 156, badge: '🥉', streak: 6 },
  { rank: 4, name: 'MOON_CHASER', avatar: '🌙', weekly: '+9.7%', allTime: '+71.4%', trades: 312, badge: null, streak: 4 },
  { rank: 5, name: 'YOU', avatar: '🎮', weekly: '+8.3%', allTime: '+48.5%', trades: 54, badge: null, streak: 5, isYou: true },
  { rank: 6, name: 'GRID_GARETH', avatar: '🧙', weekly: '+6.1%', allTime: '+39.8%', trades: 98, badge: null, streak: 3 },
  { rank: 7, name: 'SCALP_KING', avatar: '⚔', weekly: '+5.8%', allTime: '+33.2%', trades: 445, badge: null, streak: 2 },
  { rank: 8, name: 'DEGEN_DAVE', avatar: '🎰', weekly: '+4.2%', allTime: '+22.1%', trades: 789, badge: null, streak: 1 },
  { rank: 9, name: 'PATIENT_PAM', avatar: '🌺', weekly: '+3.9%', allTime: '+19.7%', trades: 23, badge: null, streak: 7 },
  { rank: 10, name: 'BULL_RUN', avatar: '🐂', weekly: '+2.1%', allTime: '+11.3%', trades: 67, badge: null, streak: 0 },
];

const AI_BOARD = [
  { rank: 1, name: 'PIXEL_WOLF', avatar: '🐺', battles: 28, wins: 21, winRate: '75%', score: 2100 },
  { rank: 2, name: 'YOU', avatar: '🎮', battles: 16, wins: 12, winRate: '75%', score: 1200, isYou: true },
  { rank: 3, name: 'ALGO_ACE', avatar: '🤖', battles: 31, wins: 22, winRate: '71%', score: 2200 },
  { rank: 4, name: 'SCALP_KING', avatar: '⚔', battles: 45, wins: 30, winRate: '67%', score: 3000 },
  { rank: 5, name: 'MOON_CHASER', avatar: '🌙', battles: 12, wins: 7, winRate: '58%', score: 700 },
];

export default function LeaderboardPage() {
  const [tab, setTab] = useState<'weekly' | 'alltime' | 'ai'>('weekly');

  return (
    <div className="grid-bg" style={{ minHeight: '100%' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '6px', color: '#64748b', marginBottom: '4px' }}>♛ RANKINGS</div>
          <h1 style={{ fontSize: '13px', color: '#ffd700', textShadow: '0 0 12px #ffd700', margin: 0 }}>LEADERBOARD</h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '6px', color: '#64748b', marginBottom: '2px' }}>YOUR RANK</div>
          <div style={{ fontSize: '12px', color: '#00ffff', textShadow: '0 0 10px #00ffff' }}>#5 GLOBAL</div>
        </div>
      </div>

      {/* Top 3 podium */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '12px', marginBottom: '20px', padding: '20px 0' }}>
        {/* 2nd */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '4px' }}>{GLOBAL_BOARD[1].avatar}</div>
          <div style={{ padding: '16px 20px', background: '#0f1629', border: '2px solid #94a3b8', boxShadow: '4px 4px 0 #000, 0 0 10px #94a3b844', height: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ fontSize: '6px', color: '#94a3b8' }}>{GLOBAL_BOARD[1].name}</div>
            <div style={{ fontSize: '8px', color: '#00ff88', marginTop: '3px' }}>{GLOBAL_BOARD[1].weekly}</div>
          </div>
          <div style={{ fontSize: '10px', marginTop: '4px' }}>🥈</div>
        </div>
        {/* 1st */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '4px' }}>{GLOBAL_BOARD[0].avatar}</div>
          <div style={{ padding: '16px 24px', background: '#1a1000', border: '2px solid #ffd700', boxShadow: '4px 4px 0 #000, 0 0 16px #ffd70066', height: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ fontSize: '6px', color: '#ffd700', textShadow: '0 0 8px #ffd700' }}>{GLOBAL_BOARD[0].name}</div>
            <div style={{ fontSize: '10px', color: '#00ff88', marginTop: '3px', textShadow: '0 0 8px #00ff88' }}>{GLOBAL_BOARD[0].weekly}</div>
          </div>
          <div style={{ fontSize: '14px', marginTop: '4px' }}>👑</div>
        </div>
        {/* 3rd */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '4px' }}>{GLOBAL_BOARD[2].avatar}</div>
          <div style={{ padding: '16px 20px', background: '#0f1629', border: '2px solid #cd7f32', boxShadow: '4px 4px 0 #000, 0 0 10px #cd7f3244', height: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ fontSize: '6px', color: '#cd7f32' }}>{GLOBAL_BOARD[2].name}</div>
            <div style={{ fontSize: '8px', color: '#00ff88', marginTop: '3px' }}>{GLOBAL_BOARD[2].weekly}</div>
          </div>
          <div style={{ fontSize: '10px', marginTop: '4px' }}>🥉</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
        {(['weekly', 'alltime', 'ai'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="pixel-btn"
            style={{
              fontSize: '7px', padding: '8px 14px',
              background: tab === t ? '#1a1000' : '#0a0e1a',
              color: tab === t ? '#ffd700' : '#64748b',
              borderColor: tab === t ? '#ffd700' : '#1e3a5f',
              boxShadow: tab === t ? '0 0 8px #ffd70044' : 'none',
            }}>
            {t === 'weekly' ? '♛ WEEKLY' : t === 'alltime' ? '★ ALL TIME' : '🤖 AI BATTLES'}
          </button>
        ))}
      </div>

      {/* Leaderboard table */}
      {tab !== 'ai' ? (
        <div className="retro-card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '36px 36px 120px 90px 90px 70px 80px', gap: '6px', padding: '7px 14px', borderBottom: '2px solid #1e3a5f', fontSize: '5px', color: '#64748b' }}>
            <span>RANK</span><span>AVT</span><span>PLAYER</span><span>WEEKLY</span><span>ALL TIME</span><span>TRADES</span><span>STREAK</span>
          </div>
          {GLOBAL_BOARD.map(entry => {
            const isTop3 = entry.rank <= 3;
            const rankColors = ['#ffd700', '#94a3b8', '#cd7f32'];
            const rankColor = isTop3 ? rankColors[entry.rank - 1] : '#64748b';
            const isYou = (entry as any).isYou;

            return (
              <div
                key={entry.rank}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '36px 36px 120px 90px 90px 70px 80px',
                  gap: '6px',
                  padding: '10px 14px',
                  borderBottom: '1px solid #0f1629',
                  background: isYou ? 'rgba(0,255,136,0.05)' : isTop3 ? `${rankColors[entry.rank - 1]}08` : 'transparent',
                  borderLeft: isYou ? '3px solid #00ff88' : '3px solid transparent',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '8px', color: rankColor, textShadow: isTop3 ? `0 0 8px ${rankColor}` : 'none' }}>
                  #{entry.rank}
                </span>
                <span style={{ fontSize: '18px' }}>{entry.avatar}</span>
                <div>
                  <div style={{ fontSize: '7px', color: isYou ? '#00ff88' : '#e2e8f0', textShadow: isYou ? '0 0 6px #00ff88' : 'none' }}>
                    {entry.name}
                  </div>
                  {entry.badge && <span style={{ fontSize: '10px' }}>{entry.badge}</span>}
                </div>
                <span style={{ fontSize: '7px', color: '#00ff88', textShadow: '0 0 6px #00ff88' }}>
                  {tab === 'weekly' ? entry.weekly : entry.allTime}
                </span>
                <span style={{ fontSize: '7px', color: '#64748b' }}>
                  {tab === 'weekly' ? entry.allTime : entry.weekly}
                </span>
                <span style={{ fontSize: '6px', color: '#64748b' }}>{entry.trades}</span>
                <span style={{ fontSize: '6px', color: entry.streak > 5 ? '#ff8800' : '#64748b' }}>
                  {entry.streak > 0 ? `🔥 ${entry.streak}W` : '-'}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="retro-card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '36px 36px 130px 70px 60px 70px 80px', gap: '6px', padding: '7px 14px', borderBottom: '2px solid #1e3a5f', fontSize: '5px', color: '#64748b' }}>
            <span>RANK</span><span>AVT</span><span>PLAYER</span><span>BATTLES</span><span>WINS</span><span>WIN RATE</span><span>SCORE</span>
          </div>
          {AI_BOARD.map(entry => {
            const isYou = (entry as any).isYou;
            return (
              <div key={entry.rank} style={{
                display: 'grid',
                gridTemplateColumns: '36px 36px 130px 70px 60px 70px 80px',
                gap: '6px', padding: '10px 14px', borderBottom: '1px solid #0f1629',
                background: isYou ? 'rgba(0,255,136,0.05)' : 'transparent',
                borderLeft: isYou ? '3px solid #00ff88' : '3px solid transparent',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: '8px', color: entry.rank <= 3 ? '#ffd700' : '#64748b' }}>#{entry.rank}</span>
                <span style={{ fontSize: '18px' }}>{entry.avatar}</span>
                <span style={{ fontSize: '7px', color: isYou ? '#00ff88' : '#e2e8f0' }}>{entry.name}</span>
                <span style={{ fontSize: '6px', color: '#64748b' }}>{entry.battles}</span>
                <span style={{ fontSize: '6px', color: '#00ff88' }}>{entry.wins}</span>
                <span style={{ fontSize: '7px', color: '#ffd700' }}>{entry.winRate}</span>
                <span style={{ fontSize: '8px', color: '#8b5cf6', textShadow: '0 0 6px #8b5cf6' }}>{entry.score.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Mini trend chart */}
      <div className="retro-card" style={{ padding: '14px', marginTop: '14px' }}>
        <div style={{ fontSize: '7px', color: '#64748b', marginBottom: '8px' }}>YOUR WEEKLY RANK TREND</div>
        <MiniChart positive={true} color="#ffd700" height={60} />
      </div>
    </div>
  );
}
