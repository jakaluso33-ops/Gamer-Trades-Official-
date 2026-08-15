'use client';

import { useState } from 'react';
import { COINS } from '@/lib/cryptoContent';

export default function CryptoHistoryPage() {
  const [selected, setSelected] = useState(COINS[0]);

  return (
    <div className="grid-bg" style={{ minHeight: '100%' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '6px' }}>🪙 CRYPTO HISTORY</div>
        <h1 className="font-pixel" style={{ fontSize: '12px', color: '#00ffff', textShadow: '0 0 12px #00ffff', margin: 0 }}>WHERE EACH COIN CAME FROM</h1>
        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '8px', maxWidth: '640px', lineHeight: 1.8 }}>
          Before you trade a coin, know its story — who built it, why it exists, and what it&apos;s actually for.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px' }}>
        {/* Coin list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {COINS.map(c => (
            <div
              key={c.symbol}
              onClick={() => setSelected(c)}
              style={{
                padding: '12px',
                background: selected.symbol === c.symbol ? `${c.color}11` : '#0f1629',
                border: `2px solid ${selected.symbol === c.symbol ? c.color : '#1e3a5f'}`,
                boxShadow: selected.symbol === c.symbol ? `4px 4px 0 #000, 0 0 10px ${c.color}33` : '4px 4px 0 #000',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px' }}>{c.icon}</span>
                <span style={{ fontSize: '9px', color: '#64748b' }}>{c.founded}</span>
              </div>
              <div style={{ fontSize: '11px', color: selected.symbol === c.symbol ? c.color : '#e2e8f0', marginTop: '8px', lineHeight: 1.6 }}>
                {c.name} <span style={{ color: '#64748b' }}>({c.ticker})</span>
              </div>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div className="retro-card" style={{ padding: '20px', borderColor: selected.color, boxShadow: `4px 4px 0 #000, 0 0 16px ${selected.color}33` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <span style={{ fontSize: '28px' }}>{selected.icon}</span>
            <div>
              <div style={{ fontSize: '11px', color: selected.color, textShadow: `0 0 8px ${selected.color}` }}>{selected.name}</div>
              <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px' }}>FOUNDED {selected.founded} · {selected.founder}</div>
            </div>
          </div>

          <div style={{ background: '#0a0e1a', border: '2px solid #1e3a5f', marginBottom: '16px', padding: '18px', textAlign: 'center' }}>
            <span style={{ fontSize: '40px', textShadow: `0 0 14px ${selected.color}`, color: selected.color }}>{selected.icon}</span>
            <div style={{ fontSize: '11px', color: '#e2e8f0', marginTop: '10px', lineHeight: 1.8 }}>{selected.tagline}</div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '8px' }}>◆ THE STORY</div>
            {selected.history.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '10px', color: '#e2e8f0', lineHeight: 1.9, marginBottom: '6px' }}>
                <span style={{ color: selected.color }}>{i + 1}.</span>
                <span>{step}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ padding: '10px', background: '#0a0e1a', border: '1px solid #1e3a5f' }}>
              <div style={{ fontSize: '9px', color: '#00aaff', marginBottom: '6px' }}>WHAT IT&apos;S FOR</div>
              <div style={{ fontSize: '10px', color: '#64748b', lineHeight: 1.8 }}>{selected.whatItsFor}</div>
            </div>
            <div style={{ padding: '10px', background: '#0a0e1a', border: '1px solid #1e3a5f' }}>
              <div style={{ fontSize: '9px', color: '#ffd700', marginBottom: '6px' }}>FUN FACT</div>
              <div style={{ fontSize: '10px', color: '#64748b', lineHeight: 1.8 }}>{selected.funFact}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
