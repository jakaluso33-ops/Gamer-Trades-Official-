'use client';

import Link from 'next/link';

export default function UpgradeGate({ title, description }: { title: string; description: string }) {
  return (
    <div className="retro-card" style={{ padding: '32px', textAlign: 'center', borderColor: '#ffd70044', boxShadow: '4px 4px 0 #000, 0 0 12px #ffd70022' }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
      <div className="font-pixel" style={{ fontSize: '11px', color: '#ffd700', textShadow: '0 0 8px #ffd700', marginBottom: '10px' }}>
        {title}
      </div>
      <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.8, marginBottom: '20px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
        {description}
      </div>
      <Link href="/dashboard/profile?tab=upgrade">
        <button className="pixel-btn pixel-btn-green" style={{ fontSize: '11px', padding: '10px 20px' }}>
          ★ UPGRADE TO PRO
        </button>
      </Link>
    </div>
  );
}
