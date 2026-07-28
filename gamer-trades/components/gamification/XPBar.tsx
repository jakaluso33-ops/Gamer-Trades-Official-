'use client';

import { useState, useEffect } from 'react';

interface Props {
  current?: number;
  max?: number;
  level?: number;
}

export default function XPBar({ current = 3240, max = 5000, level = 12 }: Props) {
  const [displayXP, setDisplayXP] = useState(0);
  const pct = Math.min((current / max) * 100, 100);

  useEffect(() => {
    let frame = 0;
    const total = 40;
    const increment = current / total;
    const id = setInterval(() => {
      frame++;
      setDisplayXP(Math.min(Math.round(increment * frame), current));
      if (frame >= total) clearInterval(id);
    }, 20);
    return () => clearInterval(id);
  }, [current]);

  return (
    <div style={{ padding: '12px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', color: '#8b5cf6', textShadow: '0 0 8px #8b5cf6' }}>
          ★ LEVEL {level}
        </span>
        <span style={{ fontSize: '10px', color: '#64748b' }}>
          {displayXP.toLocaleString()} / {max.toLocaleString()} XP
        </span>
      </div>
      <div
        style={{
          height: '10px',
          background: '#0a0e1a',
          border: '2px solid #1e3a5f',
          boxShadow: '2px 2px 0 #000',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #8b5cf6, #00aaff)',
            boxShadow: '0 0 8px #8b5cf6',
            transition: 'width 1s ease-out',
            position: 'relative',
          }}
        >
          {/* Pixel highlight */}
          <div
            style={{
              position: 'absolute',
              top: '1px',
              left: '2px',
              right: '2px',
              height: '2px',
              background: 'rgba(255,255,255,0.3)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
