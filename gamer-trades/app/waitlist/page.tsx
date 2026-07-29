'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'loading') return;
    setStatus('loading');
    setError(null);

    const { error: insertError } = await supabase
      .from('waitlist')
      .insert({ email: email.trim().toLowerCase(), source: 'web-waitlist' });

    if (insertError) {
      if (insertError.code === '23505') {
        setStatus('done');
      } else {
        setError('Something went wrong. Try again.');
        setStatus('error');
      }
      return;
    }

    setStatus('done');
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0a0e1a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center',
        backgroundImage:
          'linear-gradient(rgba(0,170,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,170,255,0.03) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      <div style={{ marginBottom: '24px', fontSize: '48px' }}>🎮</div>

      <h1
        style={{
          fontSize: '28px',
          color: '#00ffff',
          textShadow: '0 0 20px #00ffff, 0 0 40px #00ffff44',
          marginBottom: '8px',
          lineHeight: 1.4,
          fontFamily: "'Press Start 2P', monospace",
        }}
      >
        GAMER
        <br />
        <span
          style={{
            color: '#00ff88',
            textShadow: '0 0 20px #00ff88, 0 0 40px #00ff8844',
          }}
        >
          TRADES
        </span>
      </h1>

      <p
        style={{
          fontSize: '12px',
          color: '#64748b',
          marginBottom: '10px',
          lineHeight: 2,
          fontFamily: "'Press Start 2P', monospace",
        }}
      >
        PAPER TRADING · HUMAN VS AI · REAL-TIME MARKETS
      </p>

      <p
        style={{
          fontSize: '10px',
          color: '#ffd700',
          textShadow: '0 0 8px #ffd700',
          marginBottom: '36px',
          lineHeight: 1.8,
          fontFamily: "'Press Start 2P', monospace",
        }}
      >
        📱 MOBILE APP — COMING SOON
      </p>

      {status === 'done' ? (
        <div
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '10px',
            color: '#00ff88',
            padding: '18px 20px',
            border: '2px solid #00ff88',
            background: '#003322',
            boxShadow: '4px 4px 0 #00ff8844, 0 0 20px #00ff8833',
            maxWidth: '360px',
            lineHeight: 2,
          }}
        >
          ✔ YOU&apos;RE ON THE LIST!
          <br />
          <span style={{ color: '#64748b', fontSize: '9px' }}>
            We&apos;ll email you the second it&apos;s live.
          </span>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            width: '100%',
            maxWidth: '340px',
          }}
        >
          <input
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '10px',
              padding: '14px 12px',
              background: '#0a0e1a',
              color: '#e2e8f0',
              border: '2px solid #1e3a5f',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '9px',
              padding: '14px 28px',
              background: '#003322',
              color: '#00ff88',
              border: '2px solid #00ff88',
              boxShadow: '4px 4px 0 #00ff8844, 0 0 20px #00ff8833',
              cursor: status === 'loading' ? 'default' : 'pointer',
              opacity: status === 'loading' ? 0.6 : 1,
              letterSpacing: '1px',
            }}
          >
            {status === 'loading' ? '...' : '▶ JOIN WAITLIST'}
          </button>
          {error && (
            <div
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '9px',
                color: '#ff3355',
              }}
            >
              ⚠ {error}
            </div>
          )}
        </form>
      )}

      <p
        style={{
          fontSize: '10px',
          color: '#1e3a5f',
          marginTop: '28px',
          fontFamily: "'Press Start 2P', monospace",
        }}
      >
        ▲ FREE TO PLAY · NO REAL MONEY AT RISK ▲
      </p>

      <Link
        href="/login"
        style={{
          marginTop: '20px',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '9px',
          color: '#64748b',
          textDecoration: 'none',
        }}
      >
        already playing on web? log in ▶
      </Link>
    </main>
  );
}
