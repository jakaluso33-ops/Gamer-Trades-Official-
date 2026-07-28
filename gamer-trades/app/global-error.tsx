'use client';

import { useEffect } from 'react';
import './globals.css';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: '#0a0e1a', margin: 0 }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎮💥</div>
          <h2 style={{ fontSize: '11px', color: '#ff3355', textShadow: '0 0 12px #ff3355', marginBottom: '12px' }}>
            GAME OVER — APP CRASHED
          </h2>
          <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '24px', maxWidth: '360px', lineHeight: 1.9 }}>
            Something went wrong loading GamerTrades. Your account and trading data are safe on the server —
            reloading should fix this.
          </p>
          <button onClick={() => reset()} className="pixel-btn pixel-btn-blue" style={{ fontSize: '12px', padding: '12px 20px' }}>
            ↺ RELOAD
          </button>
        </div>
      </body>
    </html>
  );
}
