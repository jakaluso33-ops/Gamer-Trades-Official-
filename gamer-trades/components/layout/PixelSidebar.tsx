'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
  { label: 'DASHBOARD', icon: '⊞', href: '/dashboard' },
  { label: 'TRADE', icon: '◈', href: '/dashboard/trade' },
  { label: 'ACADEMY', icon: '🧠', href: '/dashboard/academy' },
  { label: 'CRYPTO', icon: '🪙', href: '/dashboard/crypto' },
  { label: 'PORTFOLIO', icon: '◉', href: '/dashboard/portfolio' },
  { label: 'VS AI', icon: '★', href: '/dashboard/battle' },
  { label: 'FRIENDS', icon: '♥', href: '/dashboard/friends' },
  { label: 'LEADERBOARD', icon: '♛', href: '/dashboard/leaderboard' },
  { label: 'CHALLENGES', icon: '◆', href: '/dashboard/challenges' },
  { label: 'PROFILE', icon: '◎', href: '/dashboard/profile' },
];

export default function PixelSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const xpForLevel = (level: number) => level * 250;
  const xpNeeded = xpForLevel(profile?.level ?? 1);

  return (
    <aside
      className="flex flex-col"
      style={{
        width: '200px',
        minHeight: '100vh',
        background: '#080c18',
        borderRight: '2px solid #1e3a5f',
        boxShadow: '4px 0 0 #000000',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100,
        padding: '0',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '20px 16px',
          borderBottom: '2px solid #1e3a5f',
          textAlign: 'center',
        }}
      >
        <div
          className="font-pixel"
          style={{
            fontSize: '9px',
            color: '#00ffff',
            textShadow: '0 0 10px #00ffff, 0 0 20px #00ffff44',
            letterSpacing: '1px',
            lineHeight: '1.8',
          }}
        >
          GAMER
        </div>
        <div
          className="font-pixel"
          style={{
            fontSize: '9px',
            color: '#00ff88',
            textShadow: '0 0 10px #00ff88, 0 0 20px #00ff8844',
            letterSpacing: '1px',
          }}
        >
          TRADES
        </div>
        <div
          style={{
            marginTop: '6px',
            fontSize: '9px',
            color: '#ffd700',
            textShadow: '0 0 6px #ffd700',
          }}
        >
          ▶ PAPER TRADING ◀
        </div>
      </div>

      {/* Player card */}
      <div
        style={{
          margin: '12px 10px',
          padding: '10px',
          background: '#0f1629',
          border: '2px solid #1e3a5f',
          boxShadow: '2px 2px 0 #000',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              background: '#001133',
              border: '2px solid #00aaff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              flexShrink: 0,
            }}
          >
            🎮
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#00aaff', textShadow: '0 0 8px #00aaff' }}>
              {profile?.username ?? '...'}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
              LVL {profile?.level ?? 1} TRADER
            </div>
          </div>
        </div>
        {/* XP Bar */}
        <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '3px' }}>
          XP: {(profile?.xp ?? 0).toLocaleString()} / {xpNeeded.toLocaleString()}
        </div>
        <div
          style={{
            height: '6px',
            background: '#0a0e1a',
            border: '1px solid #1e3a5f',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: `${Math.min(100, ((profile?.xp ?? 0) / xpNeeded) * 100)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #8b5cf6, #00aaff)',
              boxShadow: '0 0 6px #8b5cf6',
            }}
          />
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '8px 0' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '11px 16px',
                fontSize: '12px',
                textDecoration: 'none',
                color: isActive ? '#00ffff' : '#64748b',
                background: isActive ? 'rgba(0, 255, 255, 0.05)' : 'transparent',
                borderLeft: isActive ? '3px solid #00ffff' : '3px solid transparent',
                borderRight: 'none',
                textShadow: isActive ? '0 0 8px #00ffff' : 'none',
                transition: 'all 0.15s',
                letterSpacing: '0.5px',
              }}
            >
              <span style={{ fontSize: '10px', lineHeight: 1 }}>{item.icon}</span>
              {item.label}
              {isActive && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '12px',
                    color: '#00ffff',
                  }}
                >
                  ▶
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom balance */}
      <div
        style={{
          padding: '12px',
          borderTop: '2px solid #1e3a5f',
        }}
      >
        <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>BALANCE</div>
        <div
          className="font-pixel"
          style={{
            fontSize: '12px',
            color: '#00ff88',
            textShadow: '0 0 10px #00ff88',
          }}
        >
          $24,830.50
        </div>
        <div style={{ fontSize: '9px', color: '#00ff88', marginTop: '2px', opacity: 0.7 }}>
          ▲ +$830.50 TODAY
        </div>
      </div>

      {/* Settings / logout */}
      <div
        style={{
          padding: '10px 12px',
          borderTop: '1px solid #1e3a5f',
          display: 'flex',
          gap: '8px',
        }}
      >
        <button
          className="pixel-btn pixel-btn-blue"
          style={{ flex: 1, fontSize: '11px', padding: '6px 8px' }}
        >
          ⚙ SET
        </button>
        <button
          onClick={async () => { await signOut(); router.push('/login'); }}
          className="pixel-btn pixel-btn-red"
          style={{ flex: 1, fontSize: '11px', padding: '6px 8px' }}
        >
          ✕ OUT
        </button>
      </div>
    </aside>
  );
}
