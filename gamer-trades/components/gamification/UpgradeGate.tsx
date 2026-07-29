'use client';

import { useState } from 'react';
import Link from 'next/link';
import { startCheckout } from '@/lib/checkout';
import { PLANS } from '@/lib/plans';

const PRO_PRICE_ID = PLANS.find(p => p.name === 'pro')?.priceId;

export default function UpgradeGate({ title, description }: { title: string; description: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    if (!PRO_PRICE_ID) return;
    setError(null);
    setBusy(true);
    try {
      await startCheckout(PRO_PRICE_ID);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout');
      setBusy(false);
    }
  };

  return (
    <div className="retro-card" style={{ padding: '32px', textAlign: 'center', borderColor: '#ffd70044', boxShadow: '4px 4px 0 #000, 0 0 12px #ffd70022' }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
      <div className="font-pixel" style={{ fontSize: '11px', color: '#ffd700', textShadow: '0 0 8px #ffd700', marginBottom: '10px' }}>
        {title}
      </div>
      <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.8, marginBottom: '20px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
        {description}
      </div>
      <button
        onClick={handleUpgrade}
        disabled={busy}
        className="pixel-btn pixel-btn-green"
        style={{ fontSize: '11px', padding: '10px 20px', opacity: busy ? 0.6 : 1 }}
      >
        {busy ? '...' : '★ UPGRADE TO PRO — $9.99/mo'}
      </button>
      {error && (
        <div style={{ fontSize: '10px', color: '#ff3355', marginTop: '10px' }}>⚠ {error}</div>
      )}
      <div style={{ marginTop: '12px' }}>
        <Link href="/dashboard/profile?tab=upgrade" style={{ fontSize: '10px', color: '#64748b', textDecoration: 'none' }}>
          See all plans (incl. Legend annual) ▶
        </Link>
      </div>
    </div>
  );
}
