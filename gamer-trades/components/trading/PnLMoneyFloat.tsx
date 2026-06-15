'use client';

import { useState, useEffect, useCallback } from 'react';

interface FloatItem {
  id: number;
  value: string;
  positive: boolean;
  x: number;
}

export default function PnLMoneyFloat() {
  const [floats, setFloats] = useState<FloatItem[]>([]);
  const [counter, setCounter] = useState(0);

  const spawnFloat = useCallback((positive: boolean) => {
    const value = positive
      ? `+$${(Math.random() * 500 + 10).toFixed(2)}`
      : `-$${(Math.random() * 300 + 5).toFixed(2)}`;
    const id = counter + Date.now();
    const x = 20 + Math.random() * 60;
    setFloats((prev) => [...prev, { id, value, positive, x }]);
    setCounter((c) => c + 1);
    setTimeout(() => {
      setFloats((prev) => prev.filter((f) => f.id !== id));
    }, 1600);
  }, [counter]);

  useEffect(() => {
    const interval = setInterval(() => {
      const positive = Math.random() > 0.4;
      spawnFloat(positive);
    }, 2200);
    return () => clearInterval(interval);
  }, [spawnFloat]);

  return (
    <div style={{ position: 'relative', height: '80px', overflow: 'hidden' }}>
      {floats.map((f) => (
        <div
          key={f.id}
          className={f.positive ? 'money-float-up' : 'money-float-down'}
          style={{
            position: 'absolute',
            bottom: f.positive ? '10px' : '50px',
            left: `${f.x}%`,
            fontSize: '9px',
            fontFamily: "'Press Start 2P', monospace",
            color: f.positive ? '#00ff88' : '#ff3355',
            textShadow: f.positive ? '0 0 8px #00ff88' : '0 0 8px #ff3355',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {f.positive ? '💚' : '🔴'} {f.value}
        </div>
      ))}
    </div>
  );
}
