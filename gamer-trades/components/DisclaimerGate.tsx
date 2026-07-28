'use client';

import { useEffect, useState } from 'react';
import { DISCLAIMER_TEXT } from '@/lib/legalContent';

const ACK_KEY = 'gt_disclaimer_ack_v1';

export default function DisclaimerGate() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.localStorage.getItem(ACK_KEY)) setVisible(true);
  }, []);

  if (!visible) return null;

  const acknowledge = () => {
    window.localStorage.setItem(ACK_KEY, '1');
    setVisible(false);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.87)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}
    >
      <div className="retro-card" style={{ maxWidth: '440px', padding: '28px', borderColor: '#ffd700' }}>
        <div style={{ fontSize: '9px', color: '#ffd700', textShadow: '0 0 10px #ffd700', marginBottom: '14px' }}>
          ⚠ BEFORE YOU START
        </div>
        <p style={{ fontSize: '11px', color: '#e2e8f0', lineHeight: 1.9, marginBottom: '20px' }}>
          {DISCLAIMER_TEXT}
        </p>
        <button onClick={acknowledge} className="pixel-btn pixel-btn-green" style={{ fontSize: '12px', padding: '10px 16px', width: '100%' }}>
          ▶ I UNDERSTAND
        </button>
      </div>
    </div>
  );
}
