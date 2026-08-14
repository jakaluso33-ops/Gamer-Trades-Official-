'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { DISCLAIMER_TEXT } from '@/lib/legalContent';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Turns raw Supabase/Postgres error text into copy a tester can actually act on. */
function friendlyAuthError(raw: string, mode: 'signup' | 'signin' | 'forgot'): string {
  const msg = raw.toLowerCase();
  if (msg.includes('profiles_username_key') || (msg.includes('username') && msg.includes('duplicate'))) {
    return 'That username is already taken — try a different one.';
  }
  if (msg.includes('user already registered') || msg.includes('already registered')) {
    return 'An account with this email already exists — try signing in instead.';
  }
  if (msg.includes('email not confirmed')) {
    return "Almost there — confirm your email first. Check your inbox (and spam folder) for the link, or resend it below.";
  }
  if (msg.includes('invalid login credentials')) {
    return mode === 'signin' ? 'Incorrect email or password.' : raw;
  }
  if (msg.includes('for security purposes') || msg.includes('rate limit')) {
    return 'Too many attempts — please wait a few seconds and try again.';
  }
  if (msg.includes('password') && msg.includes('at least')) {
    return 'Password must be at least 6 characters.';
  }
  return raw;
}

export default function LoginPage() {
  const router = useRouter();
  const { session } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (session) router.replace('/dashboard');
  }, [session, router]);

  const resetMessages = () => {
    setError('');
    setInfo('');
    setNeedsConfirmation(false);
  };

  const switchMode = (next: 'signin' | 'signup' | 'forgot') => {
    setMode(next);
    resetMessages();
  };

  const resendConfirmation = async () => {
    if (!email.trim()) {
      setError('Enter your email above first, then click resend.');
      return;
    }
    setResending(true);
    setError('');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/confirm` },
      });
      if (error) throw error;
      setInfo(`Confirmation email resent to ${email.trim()} — check your inbox (and spam folder).`);
      setNeedsConfirmation(false);
    } catch (err) {
      setError(friendlyAuthError(err instanceof Error ? err.message : 'Could not resend the email', 'signin'));
    } finally {
      setResending(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !EMAIL_RE.test(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (mode !== 'forgot' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'signup' && username.trim() && !/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) {
      setError('Username must be 3-20 characters — letters, numbers, and underscores only.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: { username: username.trim() || undefined },
            emailRedirectTo: `${window.location.origin}/confirm`,
          },
        });
        if (error) throw error;

        if (data.session) {
          // Email confirmation is off for this project — session is already active.
          router.push('/dashboard');
        } else {
          setInfo(`Account created! We sent a confirmation link to ${trimmedEmail} — check your inbox (and spam folder), click the link, then sign in below.`);
          setMode('signin');
          setPassword('');
        }
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setInfo(`If an account exists for ${trimmedEmail}, a password reset link has been sent.`);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Something went wrong';
      setError(friendlyAuthError(raw, mode));
      if (mode === 'signin' && raw.toLowerCase().includes('email not confirmed')) {
        setNeedsConfirmation(true);
      }
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

        {mode !== 'forgot' && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
            <button
              onClick={() => switchMode('signin')}
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
              onClick={() => switchMode('signup')}
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
        )}

        {mode === 'forgot' && (
          <div className="font-pixel" style={{ fontSize: '10px', color: '#ffd700', textShadow: '0 0 6px #ffd700', marginBottom: '16px' }}>
            ✉ RESET PASSWORD
          </div>
        )}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {mode === 'signup' && (
            <div>
              <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '4px' }}>USERNAME (OPTIONAL)</label>
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
          {mode !== 'forgot' && (
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
          )}

          {mode === 'signin' && (
            <button
              type="button"
              onClick={() => switchMode('forgot')}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '10px', cursor: 'pointer', textAlign: 'right', padding: 0 }}
            >
              Forgot password?
            </button>
          )}

          {info && (
            <div style={{ fontSize: '10px', color: '#00ff88', padding: '8px', background: '#00ff8811', border: '1px solid #00ff8844', lineHeight: 1.7 }}>
              {info}
            </div>
          )}

          {error && (
            <div style={{ fontSize: '10px', color: '#ff3355', padding: '8px', background: '#ff335511', border: '1px solid #ff335544' }}>
              {error}
            </div>
          )}

          {needsConfirmation && (
            <button
              type="button"
              onClick={resendConfirmation}
              disabled={resending}
              className="pixel-btn"
              style={{
                fontSize: '9px', padding: '10px',
                background: '#ffd70022', color: '#ffd700', borderColor: '#ffd700',
                opacity: resending ? 0.6 : 1,
              }}
            >
              {resending ? '...' : '✉ RESEND CONFIRMATION EMAIL'}
            </button>
          )}

          <button
            type="submit"
            disabled={busy}
            className="pixel-btn pixel-btn-green"
            style={{ fontSize: '9px', padding: '12px', marginTop: '4px', opacity: busy ? 0.6 : 1 }}
          >
            {busy ? '...' : mode === 'signup' ? '▶ CREATE ACCOUNT' : mode === 'forgot' ? '▶ SEND RESET LINK' : '▶ ENTER'}
          </button>

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => switchMode('signin')}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '10px', cursor: 'pointer', textAlign: 'center' }}
            >
              ◀ BACK TO SIGN IN
            </button>
          )}
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
