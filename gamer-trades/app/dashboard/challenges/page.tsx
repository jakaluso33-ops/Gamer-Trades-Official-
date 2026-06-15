'use client';

import { useState } from 'react';

const DAILY = [
  { id: 1, title: 'SCALP MASTER', desc: 'Win 3 scalp trades today', progress: 2, max: 3, xp: 150, done: false, icon: '⚡', expires: '14:32:07' },
  { id: 2, title: 'BEAT THE BOT', desc: 'Defeat Veteran AI on BTC/USD', progress: 0, max: 1, xp: 300, done: false, icon: '🤖', expires: '14:32:07' },
  { id: 3, title: 'GREEN DAY', desc: 'Close all trades in profit', progress: 1, max: 1, xp: 200, done: true, icon: '💚', expires: '14:32:07' },
];

const WEEKLY = [
  { id: 4, title: 'CRYPTO KING', desc: 'Make $500 profit on crypto trades', progress: 312, max: 500, xp: 800, done: false, icon: '₿', reward: '★ BADGE' },
  { id: 5, title: 'AI SLAYER', desc: 'Win 5 battles against any AI', progress: 3, max: 5, xp: 1000, done: false, icon: '⚔', reward: '★ BADGE' },
  { id: 6, title: 'CONSISTENT TRADER', desc: '5 profitable trading days in a row', progress: 4, max: 5, xp: 1500, done: false, icon: '🔥', reward: '★ TITLE' },
];

const SPECIAL = [
  { id: 7, title: 'LEGEND SLAYER', desc: 'Defeat a Legend-difficulty AI opponent', progress: 0, max: 1, xp: 2000, done: false, icon: '👑', reward: '★ EXCLUSIVE SKIN', locked: false },
  { id: 8, title: 'DIAMOND HANDS', desc: 'Hold a position for 24+ hours in profit', progress: 0, max: 1, xp: 500, done: false, icon: '💎', reward: '★ BADGE', locked: false },
  { id: 9, title: 'TOURNAMENT ACE', desc: 'Win a Weekly Tournament', progress: 0, max: 1, xp: 5000, done: false, icon: '🏆', reward: '★ TROPHY', locked: true },
];

interface Challenge {
  id: number; title: string; desc: string; progress: number; max: number;
  xp: number; done: boolean; icon: string; reward?: string; locked?: boolean;
  expires?: string;
}

function ChallengeCard({ c, accent = '#00aaff' }: { c: Challenge; accent?: string }) {
  const pct = Math.min((c.progress / c.max) * 100, 100);
  return (
    <div style={{
      padding: '14px',
      background: c.done ? `${accent}0a` : c.locked ? '#0a0e1a' : '#0f1629',
      border: `2px solid ${c.done ? accent : c.locked ? '#1e3a5f' : '#1e3a5f'}`,
      boxShadow: c.done ? `4px 4px 0 #000, 0 0 10px ${accent}33` : '4px 4px 0 #000',
      opacity: c.locked ? 0.5 : 1,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {c.done && (
        <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '12px' }}>✓</div>
      )}
      {c.locked && (
        <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '12px' }}>🔒</div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <span style={{ fontSize: '24px', lineHeight: 1, filter: c.locked ? 'grayscale(1)' : 'none' }}>{c.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ fontSize: '7px', color: c.done ? accent : '#e2e8f0', textShadow: c.done ? `0 0 6px ${accent}` : 'none' }}>
              {c.done && '✓ '}{c.title}
            </span>
            <span style={{ fontSize: '6px', color: '#ffd700', textShadow: '0 0 6px #ffd700' }}>+{c.xp} XP</span>
          </div>
          <div style={{ fontSize: '5px', color: '#64748b' }}>{c.desc}</div>
          {c.reward && (
            <div style={{ fontSize: '5px', color: '#8b5cf6', marginTop: '3px', textShadow: '0 0 4px #8b5cf6' }}>
              REWARD: {c.reward}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '6px', background: '#0a0e1a', border: '1px solid #1e3a5f', marginBottom: '4px' }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: c.done ? accent : '#00aaff',
          boxShadow: c.done ? `0 0 6px ${accent}` : '0 0 4px #00aaff',
          transition: 'width 0.5s',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '5px', color: '#64748b' }}>
        <span>{c.progress} / {c.max}</span>
        <span>{pct.toFixed(0)}%</span>
        {c.expires && <span>⏱ {c.expires}</span>}
      </div>
    </div>
  );
}

export default function ChallengesPage() {
  const [tab, setTab] = useState<'daily' | 'weekly' | 'special'>('daily');
  const totalXP = DAILY.filter(c => c.done).reduce((s, c) => s + c.xp, 0) +
    WEEKLY.filter(c => c.done).reduce((s, c) => s + c.xp, 0);

  return (
    <div className="grid-bg" style={{ minHeight: '100%' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '6px', color: '#64748b', marginBottom: '4px' }}>◆ MISSIONS</div>
          <h1 style={{ fontSize: '13px', color: '#00ff88', textShadow: '0 0 12px #00ff88', margin: 0 }}>CHALLENGES</h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '6px', color: '#64748b', marginBottom: '2px' }}>TODAY'S XP EARNED</div>
          <div style={{ fontSize: '10px', color: '#ffd700', textShadow: '0 0 10px #ffd700' }}>{totalXP} / 650 XP</div>
        </div>
      </div>

      {/* XP progress for today */}
      <div className="retro-card" style={{ padding: '14px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '6px', color: '#8b5cf6', textShadow: '0 0 6px #8b5cf6' }}>★ DAILY XP PROGRESS</span>
          <span style={{ fontSize: '6px', color: '#64748b' }}>RESETS IN 14:32:07</span>
        </div>
        <div style={{ height: '10px', background: '#0a0e1a', border: '2px solid #1e3a5f', marginBottom: '4px' }}>
          <div style={{
            width: `${(totalXP / 650) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #8b5cf6, #ffd700)',
            boxShadow: '0 0 8px #8b5cf6',
            transition: 'width 0.5s',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '5px', color: '#64748b' }}>
          <span>{totalXP} XP earned</span>
          <span>{650 - totalXP} XP to max</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '14px' }}>
        {(['daily', 'weekly', 'special'] as const).map(t => {
          const colors = { daily: '#00ff88', weekly: '#00aaff', special: '#ffd700' };
          const active = tab === t;
          return (
            <button key={t} onClick={() => setTab(t)} className="pixel-btn"
              style={{
                fontSize: '7px', padding: '8px 14px',
                background: active ? `${colors[t]}11` : '#0a0e1a',
                color: active ? colors[t] : '#64748b',
                borderColor: active ? colors[t] : '#1e3a5f',
                boxShadow: active ? `0 0 8px ${colors[t]}44` : 'none',
              }}>
              {t === 'daily' ? '⚡ DAILY' : t === 'weekly' ? '◆ WEEKLY' : '★ SPECIAL'}
            </button>
          );
        })}
      </div>

      {tab === 'daily' && (
        <div>
          <div style={{ fontSize: '6px', color: '#64748b', marginBottom: '10px' }}>
            ⏱ RESETS IN 14:32:07 — Complete all 3 for bonus XP
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {DAILY.map(c => <ChallengeCard key={c.id} c={c} accent="#00ff88" />)}
          </div>
          {DAILY.every(c => c.done) && (
            <div style={{ marginTop: '14px', padding: '16px', border: '2px solid #ffd700', boxShadow: '0 0 16px #ffd70044', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🌟</div>
              <div style={{ fontSize: '9px', color: '#ffd700', textShadow: '0 0 10px #ffd700' }}>ALL DAILY CHALLENGES COMPLETE!</div>
              <div style={{ fontSize: '6px', color: '#64748b', marginTop: '6px' }}>+100 BONUS XP EARNED</div>
            </div>
          )}
        </div>
      )}

      {tab === 'weekly' && (
        <div>
          <div style={{ fontSize: '6px', color: '#64748b', marginBottom: '10px' }}>
            ⏱ RESETS SUNDAY 00:00 UTC
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {WEEKLY.map(c => <ChallengeCard key={c.id} c={c} accent="#00aaff" />)}
          </div>
        </div>
      )}

      {tab === 'special' && (
        <div>
          <div style={{ fontSize: '6px', color: '#64748b', marginBottom: '10px' }}>
            ★ PERMANENT CHALLENGES — UNLOCK EXCLUSIVE REWARDS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {SPECIAL.map(c => <ChallengeCard key={c.id} c={c} accent="#ffd700" />)}
          </div>
        </div>
      )}
    </div>
  );
}
