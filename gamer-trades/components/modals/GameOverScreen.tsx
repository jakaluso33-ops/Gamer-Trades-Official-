'use client';

import { useEffect, useState } from 'react';

interface Props {
  type: 'GAME_OVER' | 'NICE_WORK';
  pnl: number;
  symbol: string;
  onClose: () => void;
  onReplay: () => void;
}

export default function GameOverScreen({ type, pnl, symbol, onClose, onReplay }: Props) {
  const [frame, setFrame] = useState(0);
  const isWin = type === 'NICE_WORK';

  useEffect(() => {
    const id = setInterval(() => setFrame(f => f + 1), 150);
    return () => clearInterval(id);
  }, []);

  const bgColor = isWin ? 'rgba(0, 10, 0, 0.97)' : 'rgba(10, 0, 0, 0.97)';
  const accentColor = isWin ? '#00ff88' : '#ff3355';
  const accentGlow = isWin
    ? '0 0 20px #00ff88, 0 0 40px #00ff8866'
    : '0 0 20px #ff3355, 0 0 40px #ff335566';

  // Simple pixel sprite frames (text-based)
  const winFrames = ['(^‿^)', '(^_^)', '(^‿^)'];
  const loseFrames = ['(x_x)', '(X_X)', '(x_x)'];
  const sprite = isWin ? winFrames[frame % winFrames.length] : loseFrames[frame % loseFrames.length];

  // Money rain chars
  const rainChars = isWin ? ['$', '💰', '★', '$'] : ['✕', '💸', '▼', '✕'];
  const rainColor = isWin ? accentColor : '#ff3355';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: bgColor,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Press Start 2P', monospace",
      }}
    >
      {/* Pixel rain backdrop */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: `${(i / 20) * 100}%`,
              top: `${(frame * 3 + i * 17) % 110}%`,
              fontSize: `${8 + (i % 3) * 4}px`,
              color: rainColor,
              opacity: 0.3 + (i % 3) * 0.15,
              textShadow: `0 0 8px ${rainColor}`,
              transition: 'top 0.15s linear',
            }}
          >
            {rainChars[i % rainChars.length]}
          </span>
        ))}
      </div>

      {/* Main card */}
      <div
        style={{
          position: 'relative',
          border: `4px solid ${accentColor}`,
          boxShadow: `${accentGlow}, 8px 8px 0 #000`,
          background: '#080c18',
          padding: '40px 48px',
          textAlign: 'center',
          maxWidth: '480px',
          width: '90%',
        }}
      >
        {/* Corner decorations */}
        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(corner => (
          <div
            key={corner}
            style={{
              position: 'absolute',
              [corner.includes('top') ? 'top' : 'bottom']: '-4px',
              [corner.includes('left') ? 'left' : 'right']: '-4px',
              width: '12px',
              height: '12px',
              background: accentColor,
              boxShadow: `0 0 8px ${accentColor}`,
            }}
          />
        ))}

        {/* Sprite */}
        <div style={{ fontSize: '36px', marginBottom: '16px', letterSpacing: '4px', color: accentColor, textShadow: accentGlow }}>
          {sprite}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: isWin ? '20px' : '22px',
            color: accentColor,
            textShadow: accentGlow,
            marginBottom: '8px',
            lineHeight: 1.4,
          }}
        >
          {isWin ? 'NICE WORK!' : 'GAME OVER'}
        </div>
        <div style={{ fontSize: '7px', color: '#64748b', marginBottom: '28px' }}>
          {isWin ? '▶ STOP LOSS HIT IN PROFIT ◀' : '▶ STOP LOSS HIT IN LOSS ◀'}
        </div>

        {/* Stats */}
        <div style={{ border: `2px solid ${accentColor}22`, padding: '16px', marginBottom: '24px', background: '#0a0e1a' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { k: 'SYMBOL', v: symbol },
              { k: 'FINAL P&L', v: `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`, c: pnl >= 0 ? '#00ff88' : '#ff3355' },
              { k: 'RESULT', v: isWin ? 'WIN ▲' : 'LOSS ▼', c: accentColor },
              { k: 'XP EARNED', v: isWin ? '+200 XP' : '+25 XP', c: '#8b5cf6' },
            ].map(({ k, v, c }) => (
              <div key={k} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '5px', color: '#64748b', marginBottom: '4px' }}>{k}</div>
                <div style={{ fontSize: '8px', color: c ?? '#e2e8f0', textShadow: c ? `0 0 8px ${c}` : 'none' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="pixel-btn pixel-btn-green"
            style={{ flex: 1, fontSize: '8px', padding: '12px' }}
            onClick={onReplay}
          >
            ▶ PLAY AGAIN
          </button>
          <button
            className="pixel-btn pixel-btn-blue"
            style={{ flex: 1, fontSize: '8px', padding: '12px' }}
            onClick={onClose}
          >
            ⊞ DASHBOARD
          </button>
        </div>
      </div>
    </div>
  );
}
