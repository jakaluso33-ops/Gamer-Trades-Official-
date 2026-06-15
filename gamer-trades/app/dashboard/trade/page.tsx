'use client';

import { useState, useEffect } from 'react';
import CandlestickChart from '@/components/trading/CandlestickChart';
import OrderPanel from '@/components/trading/OrderPanel';
import GameOverScreen from '@/components/modals/GameOverScreen';
import Link from 'next/link';

const SYMBOLS = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 182.34, class: 'STOCK' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 245.67, class: 'STOCK' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.20, class: 'STOCK' },
  { symbol: 'BTC/USD', name: 'Bitcoin', price: 67420, class: 'CRYPTO' },
  { symbol: 'ETH/USD', name: 'Ethereum', price: 3521, class: 'CRYPTO' },
  { symbol: 'SOL/USD', name: 'Solana', price: 142.55, class: 'CRYPTO' },
  { symbol: 'EUR/USD', name: 'Euro/Dollar', price: 1.0842, class: 'FOREX' },
  { symbol: 'SPY', name: 'S&P 500 ETF', price: 520.88, class: 'STOCK' },
];

const INDICATORS = ['RSI', 'MACD', 'BB', 'EMA'];

interface Position {
  id: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  qty: number;
  entry: number;
  current: number;
}

export default function TradePage() {
  const [selected, setSelected] = useState(SYMBOLS[0]);
  const [livePrice, setLivePrice] = useState(selected.price);
  const [positions, setPositions] = useState<Position[]>([]);
  const [activeIndicators, setActiveIndicators] = useState<string[]>(['RSI']);
  const [timeframe, setTimeframe] = useState('1m');
  const [gameOver, setGameOver] = useState<{ type: 'GAME_OVER' | 'NICE_WORK'; pnl: number } | null>(null);
  const [orderLog, setOrderLog] = useState<string[]>([]);

  // Simulate live price ticking
  useEffect(() => {
    setLivePrice(selected.price);
  }, [selected]);

  useEffect(() => {
    const id = setInterval(() => {
      setLivePrice(p => {
        const delta = (Math.random() - 0.48) * p * 0.001;
        return parseFloat((p + delta).toFixed(selected.price < 10 ? 4 : 2));
      });
    }, 800);
    return () => clearInterval(id);
  }, [selected]);

  // Update position P&L
  useEffect(() => {
    setPositions(prev =>
      prev.map(p => ({ ...p, current: livePrice }))
    );
  }, [livePrice]);

  const handleOrder = (order: { type: string; side: 'BUY' | 'SELL'; symbol: string; qty: number; price?: number; stopLoss?: number }) => {
    const pos: Position = {
      id: Date.now(),
      symbol: order.symbol,
      side: order.side,
      qty: order.qty,
      entry: order.price ?? livePrice,
      current: livePrice,
    };
    setPositions(prev => [...prev, pos]);

    const msg = `${order.side} ${order.qty}x ${order.symbol} @ $${(order.price ?? livePrice).toFixed(2)}`;
    setOrderLog(prev => [msg, ...prev.slice(0, 9)]);

    // If stop loss set, simulate it hitting after random delay
    if (order.stopLoss) {
      const delay = 5000 + Math.random() * 10000;
      setTimeout(() => {
        const entryPnl = order.side === 'BUY'
          ? (order.stopLoss! - pos.entry) * pos.qty
          : (pos.entry - order.stopLoss!) * pos.qty;
        setGameOver({
          type: entryPnl >= 0 ? 'NICE_WORK' : 'GAME_OVER',
          pnl: entryPnl,
        });
        setPositions(prev => prev.filter(p => p.id !== pos.id));
      }, delay);
    }
  };

  const closePosition = (id: number) => {
    setPositions(prev => prev.filter(p => p.id !== id));
    setOrderLog(prev => [`CLOSED position #${id}`, ...prev.slice(0, 9)]);
  };

  const totalPnL = positions.reduce((sum, p) => {
    const diff = p.side === 'BUY' ? (p.current - p.entry) : (p.entry - p.current);
    return sum + diff * p.qty;
  }, 0);

  const classColor = { STOCK: '#00aaff', CRYPTO: '#ffd700', FOREX: '#00ff88' } as Record<string, string>;

  return (
    <div className="grid-bg" style={{ minHeight: '100%' }}>
      {gameOver && (
        <GameOverScreen
          type={gameOver.type}
          pnl={gameOver.pnl}
          symbol={selected.symbol}
          onClose={() => setGameOver(null)}
          onReplay={() => { setGameOver(null); setPositions([]); }}
        />
      )}

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '6px', color: '#64748b', marginBottom: '4px' }}>◈ TRADING ARENA</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', color: '#00ffff', textShadow: '0 0 10px #00ffff' }}>
              {selected.symbol}
            </span>
            <span
              style={{
                fontSize: '12px',
                color: livePrice >= selected.price ? '#00ff88' : '#ff3355',
                textShadow: `0 0 10px ${livePrice >= selected.price ? '#00ff88' : '#ff3355'}`,
              }}
            >
              ${livePrice.toLocaleString()}
            </span>
            <span
              style={{
                fontSize: '7px',
                color: livePrice >= selected.price ? '#00ff88' : '#ff3355',
              }}
            >
              {livePrice >= selected.price ? '▲' : '▼'}{' '}
              {Math.abs(((livePrice - selected.price) / selected.price) * 100).toFixed(2)}%
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '7px', color: '#64748b' }}>SESSION P&L:</span>
          <span
            style={{
              fontSize: '10px',
              color: totalPnL >= 0 ? '#00ff88' : '#ff3355',
              textShadow: totalPnL >= 0 ? '0 0 8px #00ff88' : '0 0 8px #ff3355',
            }}
          >
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
          </span>
          <Link href="/dashboard/battle">
            <button className="pixel-btn pixel-btn-blue" style={{ fontSize: '7px' }}>★ VS AI</button>
          </Link>
        </div>
      </div>

      {/* Symbol selector */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {SYMBOLS.map(s => (
          <button
            key={s.symbol}
            onClick={() => setSelected(s)}
            className="pixel-btn"
            style={{
              fontSize: '6px',
              padding: '5px 8px',
              background: selected.symbol === s.symbol ? `${classColor[s.class]}22` : '#0a0e1a',
              color: selected.symbol === s.symbol ? classColor[s.class] : '#64748b',
              borderColor: selected.symbol === s.symbol ? classColor[s.class] : '#1e3a5f',
              boxShadow: selected.symbol === s.symbol ? `0 0 8px ${classColor[s.class]}44` : 'none',
            }}
          >
            {s.symbol}
          </button>
        ))}
      </div>

      {/* Main 3-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '12px' }}>

        {/* Left: chart + positions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Chart card */}
          <div className="retro-card" style={{ overflow: 'hidden' }}>
            {/* Chart toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderBottom: '1px solid #1e3a5f', flexWrap: 'wrap' }}>
              {/* Timeframes */}
              <div style={{ display: 'flex', gap: '3px' }}>
                {['1m', '5m', '15m', '1h', '4h', '1D'].map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className="pixel-btn"
                    style={{
                      fontSize: '6px',
                      padding: '4px 6px',
                      background: timeframe === tf ? '#001133' : '#0a0e1a',
                      color: timeframe === tf ? '#00aaff' : '#64748b',
                      borderColor: timeframe === tf ? '#00aaff' : '#1e3a5f',
                    }}
                  >
                    {tf}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: '6px', color: '#1e3a5f' }}>|</span>
              {/* Indicators */}
              {INDICATORS.map(ind => (
                <button
                  key={ind}
                  onClick={() =>
                    setActiveIndicators(prev =>
                      prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]
                    )
                  }
                  className="pixel-btn"
                  style={{
                    fontSize: '6px',
                    padding: '4px 6px',
                    background: activeIndicators.includes(ind) ? '#8b5cf622' : '#0a0e1a',
                    color: activeIndicators.includes(ind) ? '#8b5cf6' : '#64748b',
                    borderColor: activeIndicators.includes(ind) ? '#8b5cf6' : '#1e3a5f',
                  }}
                >
                  {ind}
                </button>
              ))}
            </div>

            <CandlestickChart symbol={selected.symbol} basePrice={selected.price} height={300} />

            {/* RSI panel (if active) */}
            {activeIndicators.includes('RSI') && (
              <div style={{ borderTop: '1px solid #1e3a5f', padding: '6px 12px' }}>
                <span style={{ fontSize: '6px', color: '#8b5cf6' }}>RSI(14): </span>
                <span style={{ fontSize: '7px', color: '#e2e8f0' }}>54.2</span>
                <div style={{ marginTop: '4px', height: '30px', background: '#0a0e1a', border: '1px solid #1e3a5f', position: 'relative', overflow: 'hidden' }}>
                  {/* RSI bar */}
                  <div style={{ position: 'absolute', top: '3px', bottom: '3px', left: '30%', right: '30%', background: 'rgba(139,92,246,0.1)', borderLeft: '1px solid #8b5cf633', borderRight: '1px solid #8b5cf633' }} />
                  <div style={{ position: 'absolute', top: '50%', left: `${54}%`, width: '6px', height: '6px', background: '#8b5cf6', transform: 'translate(-50%,-50%)', boxShadow: '0 0 4px #8b5cf6' }} />
                  {['30', '50', '70'].map((v, i) => (
                    <span key={v} style={{ position: 'absolute', top: '2px', left: `${[30, 50, 70][i]}%`, fontSize: '5px', color: '#64748b', transform: 'translateX(-50%)' }}>{v}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Open Positions */}
          <div className="retro-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', borderBottom: '2px solid #1e3a5f', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '7px', color: '#00aaff', textShadow: '0 0 8px #00aaff' }}>◈ POSITIONS</span>
              <span style={{ fontSize: '6px', color: totalPnL >= 0 ? '#00ff88' : '#ff3355' }}>
                P&L: {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
              </span>
            </div>

            {positions.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', fontSize: '7px', color: '#1e3a5f' }}>
                NO OPEN POSITIONS
                <br /><br />
                <span style={{ fontSize: '6px' }}>Place an order to get started ▶</span>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '70px 45px 50px 80px 80px 70px 60px', gap: '4px', padding: '5px 10px', borderBottom: '1px solid #1e3a5f', fontSize: '5px', color: '#64748b' }}>
                  <span>SYMBOL</span><span>SIDE</span><span>QTY</span><span>ENTRY</span><span>CURRENT</span><span>P&L</span><span>ACTION</span>
                </div>
                {positions.map(p => {
                  const diff = p.side === 'BUY' ? (p.current - p.entry) : (p.entry - p.current);
                  const pnl = diff * p.qty;
                  const up = pnl >= 0;
                  return (
                    <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '70px 45px 50px 80px 80px 70px 60px', gap: '4px', padding: '7px 10px', borderBottom: '1px solid #0f1629', alignItems: 'center', fontSize: '7px' }}>
                      <span style={{ color: '#00aaff' }}>{p.symbol}</span>
                      <span style={{ color: p.side === 'BUY' ? '#00ff88' : '#ff3355', fontSize: '6px' }}>{p.side}</span>
                      <span style={{ color: '#e2e8f0' }}>{p.qty}</span>
                      <span style={{ color: '#64748b' }}>${p.entry.toFixed(2)}</span>
                      <span style={{ color: '#e2e8f0' }}>${p.current.toFixed(2)}</span>
                      <span style={{ color: up ? '#00ff88' : '#ff3355', textShadow: up ? '0 0 6px #00ff88' : '0 0 6px #ff3355' }}>
                        {up ? '+' : ''}${pnl.toFixed(2)}
                      </span>
                      <button onClick={() => closePosition(p.id)} className="pixel-btn pixel-btn-red" style={{ fontSize: '5px', padding: '4px 6px' }}>CLOSE</button>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Order log */}
          <div className="retro-card" style={{ padding: '10px 12px' }}>
            <div style={{ fontSize: '6px', color: '#64748b', marginBottom: '6px' }}>◎ ORDER LOG</div>
            {orderLog.length === 0
              ? <div style={{ fontSize: '6px', color: '#1e3a5f' }}>No orders yet...</div>
              : orderLog.map((log, i) => (
                  <div key={i} style={{ fontSize: '6px', color: i === 0 ? '#00ff88' : '#64748b', padding: '2px 0', borderBottom: '1px solid #0f1629' }}>
                    {i === 0 && <span style={{ color: '#ffd700' }}>▶ </span>}{log}
                  </div>
                ))
            }
          </div>
        </div>

        {/* Right: order panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="retro-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '7px', color: '#00aaff', textShadow: '0 0 8px #00aaff', marginBottom: '12px' }}>
              ◈ ORDER PANEL
            </div>
            <OrderPanel symbol={selected.symbol} currentPrice={livePrice} onOrder={handleOrder} />
          </div>

          {/* Symbol info */}
          <div className="retro-card" style={{ padding: '12px' }}>
            <div style={{ fontSize: '6px', color: '#64748b', marginBottom: '8px' }}>◎ MARKET INFO</div>
            {[
              { k: 'ASSET CLASS', v: selected.class, c: classColor[selected.class] },
              { k: 'OPEN', v: '$' + selected.price.toFixed(2) },
              { k: '24H HIGH', v: '$' + (selected.price * 1.018).toFixed(2), c: '#00ff88' },
              { k: '24H LOW', v: '$' + (selected.price * 0.983).toFixed(2), c: '#ff3355' },
              { k: 'VOLUME', v: '2.4M' },
              { k: 'MARKET CAP', v: '$2.8T' },
            ].map(({ k, v, c }) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #0f1629', fontSize: '6px' }}>
                <span style={{ color: '#64748b' }}>{k}</span>
                <span style={{ color: c ?? '#e2e8f0' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Quick tip */}
          <div className="retro-card" style={{ padding: '12px', borderColor: '#ffd70044', boxShadow: '4px 4px 0 #000, 0 0 8px #ffd70022' }}>
            <div style={{ fontSize: '6px', color: '#ffd700', textShadow: '0 0 6px #ffd700', marginBottom: '6px' }}>
              💡 PRO TIP
            </div>
            <div style={{ fontSize: '5px', color: '#64748b', lineHeight: 2 }}>
              Set a stop loss to trigger the
              NICE WORK or GAME OVER screen.
              Stay in the green for bonus XP!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
