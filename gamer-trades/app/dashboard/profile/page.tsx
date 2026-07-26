'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import XPBar from '@/components/gamification/XPBar';
import AchievementBadge, { ACHIEVEMENTS } from '@/components/gamification/AchievementBadge';
import MiniChart from '@/components/trading/MiniChart';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { deleteAccount } from '@/lib/account';

const PLANS = [
  {
    name: 'FREE', price: '$0', color: '#64748b',
    features: ['3 trades/day', 'Stocks + Crypto', 'Rookie AI only', 'View leaderboard', '1 daily challenge'],
    current: true,
  },
  {
    name: 'PRO', price: '$9.99/mo', color: '#00aaff',
    features: ['Unlimited trades', 'All asset classes', 'All AI difficulties', 'Post to leaderboard', '3 daily challenges', 'Tournament access'],
    current: false,
  },
  {
    name: 'LEGEND', price: '$24.99/mo', color: '#ffd700',
    features: ['Everything in PRO', 'Exclusive AI personalities', 'Custom avatar skins', 'Priority leaderboard badge', 'Early access features', 'Tournament seeding'],
    current: false,
  },
];

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'stats' | 'achievements' | 'settings' | 'upgrade'>('stats');
  const [sound, setSound] = useState(true);
  const [scanlines, setScanlines] = useState(true);
  const [theme, setTheme] = useState('SYNTHWAVE');
  const [deleting, setDeleting] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'This permanently deletes your account and all trading history, positions, goals, and stats. This cannot be undone. Continue?'
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      await deleteAccount();
      router.push('/login');
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Could not delete account');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="grid-bg" style={{ minHeight: '100%' }}>
      {/* Profile header */}
      <div className="retro-card" style={{ padding: '20px', marginBottom: '16px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <div style={{
          width: '72px', height: '72px', background: '#001133', border: '3px solid #00aaff',
          boxShadow: '0 0 16px #00aaff44, 4px 4px 0 #000',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', flexShrink: 0,
        }}>
          🎮
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#00ffff', textShadow: '0 0 10px #00ffff', marginBottom: '3px' }}>PLAYER_01</div>
              <div style={{ fontSize: '6px', color: '#64748b' }}>Joined June 2026 · 54 trades · #5 Global</div>
            </div>
            <div style={{ padding: '4px 10px', background: '#64748b22', border: '2px solid #64748b', fontSize: '6px', color: '#64748b' }}>
              FREE TIER
            </div>
          </div>
          <XPBar current={3240} max={5000} level={12} />
          <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
            {[
              { k: 'WIN RATE', v: '68%', c: '#00ff88' },
              { k: 'BEST DAY', v: '+$1,240', c: '#ffd700' },
              { k: 'AI WINS', v: '12', c: '#8b5cf6' },
              { k: '🔥 STREAK', v: '5W', c: '#ff8800' },
            ].map(s => (
              <div key={s.k} style={{ textAlign: 'center', padding: '5px 10px', background: '#0a0e1a', border: '1px solid #1e3a5f' }}>
                <div style={{ fontSize: '5px', color: '#64748b', marginBottom: '3px' }}>{s.k}</div>
                <div style={{ fontSize: '8px', color: s.c, textShadow: `0 0 6px ${s.c}` }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {(['stats', 'achievements', 'settings', 'upgrade'] as const).map(t => {
          const colors = { stats: '#00aaff', achievements: '#ffd700', settings: '#8b5cf6', upgrade: '#00ff88' };
          const labels = { stats: '◎ STATS', achievements: '🏆 ACHIEVEMENTS', settings: '⚙ SETTINGS', upgrade: '★ UPGRADE' };
          const active = tab === t;
          return (
            <button key={t} onClick={() => setTab(t)} className="pixel-btn"
              style={{
                fontSize: '7px', padding: '8px 12px',
                background: active ? `${colors[t]}11` : '#0a0e1a',
                color: active ? colors[t] : '#64748b',
                borderColor: active ? colors[t] : '#1e3a5f',
                boxShadow: active ? `0 0 8px ${colors[t]}44` : 'none',
              }}>
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* STATS */}
      {tab === 'stats' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="retro-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '7px', color: '#00aaff', textShadow: '0 0 8px #00aaff', marginBottom: '10px' }}>TRADING PERFORMANCE</div>
            {[
              { k: 'Total Trades', v: '54' },
              { k: 'Profitable Trades', v: '37', c: '#00ff88' },
              { k: 'Losing Trades', v: '17', c: '#ff3355' },
              { k: 'Win Rate', v: '68.4%', c: '#ffd700' },
              { k: 'Total P&L', v: '+$4,830.50', c: '#00ff88' },
              { k: 'Realized P&L', v: '+$3,999.50', c: '#00ff88' },
              { k: 'Unrealized P&L', v: '+$831.00', c: '#00ff88' },
              { k: 'Best Trade', v: '+$605.00 BTC', c: '#ffd700' },
              { k: 'Worst Trade', v: '-$124.00 NVDA', c: '#ff3355' },
              { k: 'Avg Win', v: '+$213.20', c: '#00ff88' },
              { k: 'Avg Loss', v: '-$76.50', c: '#ff3355' },
              { k: 'Profit Factor', v: '2.78x', c: '#8b5cf6' },
              { k: 'Sharpe Ratio', v: '1.42', c: '#8b5cf6' },
            ].map(({ k, v, c }) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #0f1629', fontSize: '6px' }}>
                <span style={{ color: '#64748b' }}>{k}</span>
                <span style={{ color: c ?? '#e2e8f0' }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="retro-card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '7px', color: '#8b5cf6', textShadow: '0 0 8px #8b5cf6', marginBottom: '10px' }}>AI BATTLE RECORD</div>
              {[
                { k: 'Total Battles', v: '16' },
                { k: 'Wins', v: '12', c: '#00ff88' },
                { k: 'Losses', v: '4', c: '#ff3355' },
                { k: 'vs Rookie', v: '6W / 0L', c: '#00ff88' },
                { k: 'vs Veteran', v: '5W / 2L', c: '#ffd700' },
                { k: 'vs Legend', v: '1W / 2L', c: '#ff3355' },
                { k: 'vs AlgoAce', v: '5W / 1L', c: '#00aaff' },
                { k: 'vs TrendTina', v: '4W / 2L', c: '#8b5cf6' },
                { k: 'vs GridGareth', v: '3W / 1L', c: '#ffd700' },
              ].map(({ k, v, c }) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #0f1629', fontSize: '6px' }}>
                  <span style={{ color: '#64748b' }}>{k}</span>
                  <span style={{ color: c ?? '#e2e8f0' }}>{v}</span>
                </div>
              ))}
            </div>

            <div className="retro-card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '7px', color: '#ffd700', textShadow: '0 0 8px #ffd700', marginBottom: '8px' }}>EQUITY CURVE</div>
              <MiniChart positive={true} color="#00ff88" height={80} />
            </div>
          </div>
        </div>
      )}

      {/* ACHIEVEMENTS */}
      {tab === 'achievements' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '6px', color: '#64748b' }}>
            <span>3 / 6 UNLOCKED</span>
            <span style={{ color: '#ffd700' }}>TOTAL XP FROM ACHIEVEMENTS: 650</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {ACHIEVEMENTS.map(a => <AchievementBadge key={a.name} achievement={a} />)}
          </div>
          <div className="retro-card" style={{ padding: '14px', marginTop: '14px', borderColor: '#ffd70044', boxShadow: '4px 4px 0 #000, 0 0 8px #ffd70022' }}>
            <div style={{ fontSize: '7px', color: '#ffd700', marginBottom: '8px' }}>🏅 NEXT TO UNLOCK</div>
            <div style={{ fontSize: '6px', color: '#64748b', lineHeight: 2 }}>
              HOT STREAK — Win 5 trades in a row (2 more to go)
              <br />
              DIAMOND HANDS — Hold a position 24h+ in profit
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS */}
      {tab === 'settings' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="retro-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '7px', color: '#8b5cf6', textShadow: '0 0 8px #8b5cf6', marginBottom: '12px' }}>GAME SETTINGS</div>
            {[
              { k: 'CHIPTUNE SOUNDS', state: sound, toggle: () => setSound(s => !s) },
              { k: 'CRT SCANLINES', state: scanlines, toggle: () => setScanlines(s => !s) },
            ].map(s => (
              <div key={s.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #0f1629' }}>
                <span style={{ fontSize: '6px', color: '#e2e8f0' }}>{s.k}</span>
                <button
                  onClick={s.toggle}
                  style={{
                    width: '40px', height: '18px', background: s.state ? '#003322' : '#0a0e1a',
                    border: `2px solid ${s.state ? '#00ff88' : '#1e3a5f'}`,
                    boxShadow: s.state ? '0 0 6px #00ff8844' : 'none',
                    cursor: 'pointer', position: 'relative',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '1px', width: '12px', height: '10px',
                    background: s.state ? '#00ff88' : '#64748b',
                    left: s.state ? '22px' : '2px',
                    boxShadow: s.state ? '0 0 4px #00ff88' : 'none',
                    transition: 'left 0.15s, background 0.15s',
                  }} />
                </button>
              </div>
            ))}
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '6px', color: '#64748b', marginBottom: '6px' }}>VISUAL THEME</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['SYNTHWAVE', 'FOREST', 'OCEAN', 'FIRE'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className="pixel-btn"
                    style={{
                      fontSize: '5px', padding: '5px 8px',
                      background: theme === t ? 'rgba(139,92,246,0.15)' : '#0a0e1a',
                      color: theme === t ? '#8b5cf6' : '#64748b',
                      borderColor: theme === t ? '#8b5cf6' : '#1e3a5f',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="retro-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '7px', color: '#00aaff', textShadow: '0 0 8px #00aaff', marginBottom: '12px' }}>ACCOUNT</div>
            {[
              { k: 'EMAIL', v: user?.email ?? '—' },
              { k: 'USERNAME', v: 'PLAYER_01' },
              { k: 'MEMBER SINCE', v: 'June 2026' },
              { k: 'PLAN', v: 'FREE TIER' },
            ].map(({ k, v }) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #0f1629', fontSize: '6px' }}>
                <span style={{ color: '#64748b' }}>{k}</span>
                <span style={{ color: '#e2e8f0' }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <button className="pixel-btn pixel-btn-blue" style={{ fontSize: '6px', padding: '8px' }}>✎ EDIT PROFILE</button>
              <button className="pixel-btn pixel-btn-green" style={{ fontSize: '6px', padding: '8px' }}>↺ RESET PORTFOLIO</button>
              <button onClick={handleSignOut} className="pixel-btn pixel-btn-red" style={{ fontSize: '6px', padding: '8px' }}>✕ SIGN OUT</button>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '14px', justifyContent: 'center' }}>
              <Link href="/privacy" style={{ fontSize: '5px', color: '#64748b', textDecoration: 'none' }}>PRIVACY POLICY</Link>
              <Link href="/terms" style={{ fontSize: '5px', color: '#64748b', textDecoration: 'none' }}>TERMS OF SERVICE</Link>
            </div>
          </div>

          <div className="retro-card" style={{ padding: '14px', gridColumn: '1 / -1', borderColor: '#ff335544' }}>
            <div style={{ fontSize: '7px', color: '#ff3355', textShadow: '0 0 8px #ff3355', marginBottom: '10px' }}>⚠ DANGER ZONE</div>
            <div style={{ fontSize: '6px', color: '#64748b', lineHeight: 1.9, marginBottom: '10px' }}>
              Deleting your account permanently removes all your data — trades, positions, goals, and stats. This cannot be undone.
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="pixel-btn pixel-btn-red"
              style={{ fontSize: '6px', padding: '8px 14px', opacity: deleting ? 0.6 : 1 }}
            >
              {deleting ? 'DELETING...' : '🗑 DELETE ACCOUNT'}
            </button>
          </div>
        </div>
      )}

      {/* UPGRADE */}
      {tab === 'upgrade' && (
        <div>
          <div style={{ fontSize: '7px', color: '#64748b', marginBottom: '14px', textAlign: 'center' }}>
            UNLOCK MORE POWER — CHOOSE YOUR PLAN
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {PLANS.map(plan => (
              <div
                key={plan.name}
                style={{
                  flex: 1,
                  padding: '20px',
                  background: plan.current ? '#0a0e1a' : plan.name === 'LEGEND' ? '#1a1000' : '#0f1629',
                  border: `2px solid ${plan.current ? '#1e3a5f' : plan.color}`,
                  boxShadow: `4px 4px 0 #000${plan.current ? '' : `, 0 0 16px ${plan.color}33`}`,
                  position: 'relative',
                  textAlign: 'center',
                }}
              >
                {plan.current && (
                  <div style={{ position: 'absolute', top: '-2px', left: '50%', transform: 'translateX(-50%)', background: '#64748b', padding: '2px 10px', fontSize: '5px', color: '#fff', whiteSpace: 'nowrap' }}>
                    CURRENT PLAN
                  </div>
                )}
                {plan.name === 'LEGEND' && !plan.current && (
                  <div style={{ position: 'absolute', top: '-2px', left: '50%', transform: 'translateX(-50%)', background: '#ffd700', padding: '2px 10px', fontSize: '5px', color: '#000', whiteSpace: 'nowrap' }}>
                    ★ BEST VALUE
                  </div>
                )}
                <div style={{ fontSize: '10px', color: plan.color, textShadow: `0 0 10px ${plan.color}`, marginBottom: '6px', marginTop: '8px' }}>{plan.name}</div>
                <div style={{ fontSize: '12px', color: '#ffd700', textShadow: '0 0 8px #ffd700', marginBottom: '14px' }}>{plan.price}</div>
                {plan.features.map(f => (
                  <div key={f} style={{ fontSize: '5px', color: '#64748b', padding: '4px 0', borderBottom: '1px solid #0f1629', textAlign: 'left' }}>
                    <span style={{ color: plan.color, marginRight: '6px' }}>▶</span>{f}
                  </div>
                ))}
                <button
                  className={`pixel-btn ${plan.current ? '' : plan.name === 'LEGEND' ? 'pixel-btn-green' : 'pixel-btn-blue'}`}
                  style={{
                    width: '100%', fontSize: '7px', padding: '10px', marginTop: '14px',
                    ...(plan.current ? { background: '#0a0e1a', color: '#64748b', borderColor: '#1e3a5f', cursor: 'default' } : {}),
                  }}
                  disabled={plan.current}
                >
                  {plan.current ? '✓ CURRENT' : `UPGRADE TO ${plan.name}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
