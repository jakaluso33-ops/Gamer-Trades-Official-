'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { EmailOtpType } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

const inputWrapStyle: React.CSSProperties = { fontSize: '13px', lineHeight: 1.8, textAlign: 'center' };

function ConfirmCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get('token_hash');
  const type = (searchParams.get('type') as EmailOtpType | null) ?? 'email';

  const [status, setStatus] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  // Confirmation only runs when the user taps this button, not on page load.
  // Some mail clients (Apple Mail Link Tracking Protection, Gmail's link
  // scanner) auto-visit links inside emails to scan them, which would burn a
  // one-time confirmation link before the user ever sees this page.
  const confirm = async () => {
    if (!tokenHash) {
      setError('This confirmation link is missing information. Request a new one from the login page.');
      setStatus('error');
      return;
    }
    setStatus('busy');
    setError('');
    try {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (error) throw error;
      setStatus('done');
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Could not confirm this link.';
      setError(
        raw.toLowerCase().includes('expired') || raw.toLowerCase().includes('invalid')
          ? 'This link already expired or was already used. Request a fresh confirmation email from the login page.'
          : raw
      );
      setStatus('error');
    }
  };

  if (status === 'done') {
    return <div style={{ ...inputWrapStyle, color: '#00ff88' }}>Email confirmed! Taking you to your dashboard...</div>;
  }

  if (status === 'error' || (!tokenHash && status === 'idle')) {
    return (
      <div style={inputWrapStyle}>
        <div style={{ color: '#ff3355', marginBottom: '16px' }}>{error || 'This confirmation link is invalid.'}</div>
        <Link href="/login" className="pixel-btn" style={{ fontSize: '9px', padding: '10px 16px', display: 'inline-block' }}>
          BACK TO LOGIN
        </Link>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.8, marginBottom: '20px' }}>
        Tap below to confirm your email address and finish signing up.
      </div>
      <button
        onClick={confirm}
        disabled={status === 'busy'}
        className="pixel-btn pixel-btn-green"
        style={{ fontSize: '9px', padding: '12px 20px', opacity: status === 'busy' ? 0.6 : 1 }}
      >
        {status === 'busy' ? '...' : '▶ CONFIRM MY EMAIL'}
      </button>
    </div>
  );
}

export default function ConfirmPage() {
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
          ✉ CONFIRM EMAIL
        </div>
        <Suspense fallback={<div style={{ ...inputWrapStyle, color: '#64748b' }}>Loading...</div>}>
          <ConfirmCard />
        </Suspense>
      </div>
    </main>
  );
}
