'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { DISCLAIMER_TEXT } from '@/lib/legalContent';

export default function LoginPage() {
  const router = useRouter();
  const { session } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) router.replace('/dashboard');
  }, [session, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: username.trim() || undefined } },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0a0e1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundImage:
          'linear-gradient(rgba(0,170,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,170,255,0.03) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      <div className="retro-card" style={{ padding: '32px', width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎮</div>
          <div className="font-pixel" style={{ fontSize: '9px', color: '#00ffff', textShadow: '0 0 10px #00ffff' }}>GAMER TRADES</div>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
          <button
            onClick={() => { setMode('signin'); setError(''); }}
            className="pixel-btn"
            style={{
              flex: 1, fontSize: '11px', padding: '9px',
              background: mode === 'signin' ? '#00ffff22' : '#0a0e1a',
              color: mode === 'signin' ? '#00ffff' : '#64748b',
              borderColor: mode === 'signin' ? '#00ffff' : '#1e3a5f',
            }}
          >
            SIGN IN
          </button>
          <button
            onClick={() => { setMode('signup'); setError(''); }}
            className="pixel-btn"
            style={{
              flex: 1, fontSize: '11px', padding: '9px',
              background: mode === 'signup' ? '#00ff8822' : '#0a0e1a',
              color: mode === 'signup' ? '#00ff88' : '#64748b',
              borderColor: mode === 'signup' ? '#00ff88' : '#1e3a5f',
            }}
          >
            SIGN UP
          </button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {mode === 'signup' && (
            <div>
              <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '4px' }}>USERNAME</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="PLAYER_01"
                maxLength={20}
                style={inputStyle}
              />
            </div>
          )}
          <div>
            <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '4px' }}>EMAIL</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '4px' }}>PASSWORD</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ fontSize: '10px', color: '#ff3355', padding: '8px', background: '#ff335511', border: '1px solid #ff335544' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="pixel-btn pixel-btn-green"
            style={{ fontSize: '9px', padding: '12px', marginTop: '4px', opacity: busy ? 0.6 : 1 }}
          >
            {busy ? '...' : mode === 'signup' ? '▶ CREATE ACCOUNT' : '▶ ENTER'}
          </button>
        </form>

        <p style={{ fontSize: '9px', color: '#1e3a5f', lineHeight: 1.8, marginTop: '18px', textAlign: 'center' }}>
          {DISCLAIMER_TEXT}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '14px' }}>
          <Link href="/privacy" style={{ fontSize: '9px', color: '#64748b', textDecoration: 'none' }}>PRIVACY POLICY</Link>
          <Link href="/terms" style={{ fontSize: '9px', color: '#64748b', textDecoration: 'none' }}>TERMS OF SERVICE</Link>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Link href="/" style={{ fontSize: '10px', color: '#64748b', textDecoration: 'none' }}>◀ BACK TO HOME</Link>
        </div>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0a0e1a',
  border: '2px solid #1e3a5f',
  color: '#e2e8f0',
  fontSize: '12px',
  padding: '10px',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};
