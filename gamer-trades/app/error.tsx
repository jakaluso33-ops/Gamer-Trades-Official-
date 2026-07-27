'use client';

import { useEffect } from 'react';

export default function Error({
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
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠</div>
      <h2 style={{ fontSize: '12px', color: '#ff3355', textShadow: '0 0 10px #ff3355', marginBottom: '12px' }}>
        SOMETHING GLITCHED
      </h2>
      <p style={{ fontSize: '7px', color: '#64748b', marginBottom: '24px', maxWidth: '360px', lineHeight: 1.9 }}>
        That screen hit an unexpected error. Your account and trading data are safe — try again below.
      </p>
      <button onClick={() => reset()} className="pixel-btn pixel-btn-blue" style={{ fontSize: '8px', padding: '12px 20px' }}>
        ↺ TRY AGAIN
      </button>
    </div>
  );
}
