'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { DISCLAIMER_TEXT } from '@/lib/legalContent';

const RESEND_COOLDOWN = 30;

export default function LoginPage() {
  const router = useRouter();
  const { session } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'verify'>('signin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (session) router.replace('/dashboard');
  }, [session, router]);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown(c => {
        if (c <= 1 && cooldownRef.current) clearInterval(cooldownRef.current);
        return c - 1;
      });
    }, 1000);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: username.trim() || undefined } },
        });
        if (error) throw error;
        setMode('verify');
        setInfo(`We sent a 6-digit code to ${email}. Enter it below to confirm your account.`);
        startCooldown();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes('email not confirmed')) {
            setMode('verify');
            setInfo(`Your email isn't confirmed yet. Enter the code we sent to ${email}, or resend it below.`);
            setBusy(false);
            return;
          }
          throw error;
        }
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'signup' });
      if (error) throw error;
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code');
    } finally {
      setBusy(false);
    }
  };

  const resendCode = async () => {
    if (cooldown > 0) return;
    setError('');
    setInfo('');
    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      setInfo(`New code sent to ${email}.`);
      startCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend code');
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
          <div style={{ fontSize: '11px', color: '#00ffff', textShadow: '0 0 10px #00ffff' }}>GAMER TRADES</div>
        </div>

        {mode !== 'verify' && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
            <button
              onClick={() => { setMode('signin'); setError(''); setInfo(''); }}
              className="pixel-btn"
              style={{
                flex: 1, fontSize: '7px', padding: '9px',
                background: mode === 'signin' ? '#00ffff22' : '#0a0e1a',
                color: mode === 'signin' ? '#00ffff' : '#64748b',
                borderColor: mode === 'signin' ? '#00ffff' : '#1e3a5f',
              }}
            >
              SIGN IN
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); setInfo(''); }}
              className="pixel-btn"
              style={{
                flex: 1, fontSize: '7px', padding: '9px',
                background: mode === 'signup' ? '#00ff8822' : '#0a0e1a',
                color: mode === 'signup' ? '#00ff88' : '#64748b',
                borderColor: mode === 'signup' ? '#00ff88' : '#1e3a5f',
              }}
            >
              SIGN UP
            </button>
          </div>
        )}

        {mode === 'verify' ? (
          <form onSubmit={verifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '7px', color: '#ffd700', textShadow: '0 0 6px #ffd700', marginBottom: '4px' }}>
              ✉ CONFIRM YOUR EMAIL
            </div>
            {info && (
              <div style={{ fontSize: '6px', color: '#64748b', lineHeight: 1.8 }}>{info}</div>
            )}
            <div>
              <label style={{ fontSize: '6px', color: '#64748b', display: 'block', marginBottom: '4px' }}>EMAIL</label>
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
              <label style={{ fontSize: '6px', color: '#64748b', display: 'block', marginBottom: '4px' }}>6-DIGIT CODE</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                style={{ ...inputStyle, letterSpacing: '4px', textAlign: 'center', fontSize: '14px' }}
              />
            </div>

            {error && (
              <div style={{ fontSize: '6px', color: '#ff3355', padding: '8px', background: '#ff335511', border: '1px solid #ff335544' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="pixel-btn pixel-btn-green"
              style={{ fontSize: '9px', padding: '12px', marginTop: '4px', opacity: busy || code.length !== 6 ? 0.6 : 1 }}
            >
              {busy ? '...' : '▶ VERIFY'}
            </button>

            <button
              type="button"
              onClick={resendCode}
              disabled={busy || cooldown > 0}
              className="pixel-btn"
              style={{
                fontSize: '6px', padding: '8px',
                background: '#0a0e1a', color: cooldown > 0 ? '#1e3a5f' : '#64748b', borderColor: '#1e3a5f',
              }}
            >
              {cooldown > 0 ? `RESEND CODE (${cooldown}s)` : 'RESEND CODE'}
            </button>

            <button
              type="button"
              onClick={() => { setMode('signin'); setError(''); setInfo(''); setCode(''); }}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '6px', cursor: 'pointer', textAlign: 'center' }}
            >
              ◀ BACK TO SIGN IN
            </button>
          </form>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mode === 'signup' && (
              <div>
                <label style={{ fontSize: '6px', color: '#64748b', display: 'block', marginBottom: '4px' }}>USERNAME</label>
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
              <label style={{ fontSize: '6px', color: '#64748b', display: 'block', marginBottom: '4px' }}>EMAIL</label>
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
              <label style={{ fontSize: '6px', color: '#64748b', display: 'block', marginBottom: '4px' }}>PASSWORD</label>
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
              <div style={{ fontSize: '6px', color: '#ff3355', padding: '8px', background: '#ff335511', border: '1px solid #ff335544' }}>
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

            {mode === 'signin' && (
              <button
                type="button"
                onClick={() => { setMode('verify'); setError(''); setInfo('Enter the code from your confirmation email, or resend a new one.'); }}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '5px', cursor: 'pointer', textAlign: 'center' }}
              >
                Already signed up but need to confirm your email?
              </button>
            )}
          </form>
        )}

        <p style={{ fontSize: '5px', color: '#1e3a5f', lineHeight: 1.8, marginTop: '18px', textAlign: 'center' }}>
          {DISCLAIMER_TEXT}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '14px' }}>
          <Link href="/privacy" style={{ fontSize: '5px', color: '#64748b', textDecoration: 'none' }}>PRIVACY POLICY</Link>
          <Link href="/terms" style={{ fontSize: '5px', color: '#64748b', textDecoration: 'none' }}>TERMS OF SERVICE</Link>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Link href="/" style={{ fontSize: '6px', color: '#64748b', textDecoration: 'none' }}>◀ BACK TO HOME</Link>
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
  fontSize: '8px',
  padding: '10px',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};
