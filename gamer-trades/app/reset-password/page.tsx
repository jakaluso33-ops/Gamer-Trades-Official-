'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // The recovery link's tokens are parsed from the URL by the Supabase client
    // automatically and fire this event once the recovery session is established.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });

    // If the tab was already open (rare) or the event already fired before this
    // mounted, a session may already be present — check directly too.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    const timeout = setTimeout(() => {
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) setInvalid(true);
      });
    }, 4000);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password');
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
        <div className="font-pixel" style={{ fontSize: '11px', color: '#00ffff', textShadow: '0 0 10px #00ffff', marginBottom: '20px', textAlign: 'center' }}>
          🔑 SET NEW PASSWORD
        </div>

        {done ? (
          <div style={{ fontSize: '13px', color: '#00ff88', textAlign: 'center', lineHeight: 1.8 }}>
            Password updated! Taking you to your dashboard...
          </div>
        ) : invalid ? (
          <div style={{ fontSize: '13px', color: '#ff3355', lineHeight: 1.8, textAlign: 'center' }}>
            This reset link is invalid or has expired. Go back to the login page and request a new one.
          </div>
        ) : !ready ? (
          <div style={{ fontSize: '13px', color: '#64748b', textAlign: 'center' }}>
            Verifying your reset link...
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '4px' }}>NEW PASSWORD</label>
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
            <div>
              <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '4px' }}>CONFIRM PASSWORD</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
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
              {busy ? '...' : '▶ UPDATE PASSWORD'}
            </button>
          </form>
        )}
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
