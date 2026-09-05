'use client';

import { useState, useEffect } from 'react';

const tickerData = [
  { symbol: 'AAPL', price: '182.34', change: '+1.24', pct: '+0.68%', up: true },
  { symbol: 'TSLA', price: '245.67', change: '-3.45', pct: '-1.39%', up: false },
  { symbol: 'BTC', price: '67,420', change: '+1,230', pct: '+1.86%', up: true },
  { symbol: 'ETH', price: '3,521', change: '-45', pct: '-1.26%', up: false },
  { symbol: 'NVDA', price: '875.20', change: '+12.40', pct: '+1.44%', up: true },
  { symbol: 'SPY', price: '520.88', change: '+2.11', pct: '+0.41%', up: true },
  { symbol: 'EUR/USD', price: '1.0842', change: '-0.0012', pct: '-0.11%', up: false },
  { symbol: 'AMZN', price: '185.90', change: '+3.20', pct: '+1.75%', up: true },
  { symbol: 'GOLD', price: '2,341', change: '+8.50', pct: '+0.36%', up: true },
  { symbol: 'SOL', price: '142.55', change: '-5.30', pct: '-3.58%', up: false },
];

function TickerItem({ item }: { item: typeof tickerData[0] }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginRight: '32px' }}>
      <span style={{ color: '#00aaff', textShadow: '0 0 6px #00aaff' }}>{item.symbol}</span>
      <span style={{ color: '#e2e8f0' }}>{item.price}</span>
      <span
        style={{
          color: item.up ? '#00ff88' : '#ff3355',
          textShadow: item.up ? '0 0 6px #00ff88' : '0 0 6px #ff3355',
        }}
      >
        {item.up ? '▲' : '▼'} {item.pct}
      </span>
    </span>
  );
}

export default function HUDBar() {
  const [time, setTime] = useState('');
  const [marketOpen, setMarketOpen] = useState(true);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
      const hour = now.getHours();
      const min = now.getMinutes();
      const totalMin = hour * 60 + min;
      setMarketOpen(totalMin >= 570 && totalMin < 960);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: '200px',
        right: 0,
        height: '48px',
        background: '#080c18',
        borderBottom: '2px solid #1e3a5f',
        boxShadow: '0 4px 0 #000000',
        zIndex: 99,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top row: status + time */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 16px',
          height: '22px',
          borderBottom: '1px solid #1e3a5f',
        }}
      >
        {/* Market status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className="pulse-dot"
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: marketOpen ? '#00ff88' : '#ff3355',
              boxShadow: marketOpen ? '0 0 6px #00ff88' : '0 0 6px #ff3355',
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontSize: '11px',
              color: marketOpen ? '#00ff88' : '#ff3355',
              textShadow: marketOpen ? '0 0 6px #00ff88' : '0 0 6px #ff3355',
            }}
          >
            {marketOpen ? 'MARKET OPEN' : 'MARKET CLOSED'}
          </span>
          <span style={{ fontSize: '10px', color: '#1e3a5f' }}>|</span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>NYSE • NASDAQ • CRYPTO 24/7</span>
        </div>

        {/* Right: P&L + time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '11px', color: '#64748b' }}>SESSION P&L:</span>
          <span
            style={{
              fontSize: '12px',
              color: '#00ff88',
              textShadow: '0 0 8px #00ff88',
            }}
          >
            +$830.50
          </span>
          <span
            style={{
              fontSize: '11px',
              color: '#00aaff',
              textShadow: '0 0 6px #00aaff',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {time}
          </span>
        </div>
      </div>

      {/* Ticker row */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          fontSize: '11px',
        }}
      >
        <div className="marquee-inner">
          {[...tickerData, ...tickerData].map((item, i) => (
            <TickerItem key={i} item={item} />
          ))}
        </div>
      </div>
    </header>
  );
}
