'use client';

import { useState } from 'react';
import MiniChart from '@/components/trading/MiniChart';

const HOLDINGS = [
  { symbol: 'AAPL', qty: 50, avgCost: 178.40, current: 182.34, sector: 'TECH', class: 'STOCK' },
  { symbol: 'TSLA', qty: 20, avgCost: 251.00, current: 245.67, sector: 'AUTO', class: 'STOCK' },
  { symbol: 'BTC', qty: 0.5, avgCost: 64200, current: 67420, sector: 'CRYPTO', class: 'CRYPTO' },
  { symbol: 'NVDA', qty: 15, avgCost: 890.00, current: 875.20, sector: 'TECH', class: 'STOCK' },
  { symbol: 'ETH', qty: 2, avgCost: 3400, current: 3521, sector: 'CRYPTO', class: 'CRYPTO' },
  { symbol: 'SPY', qty: 10, avgCost: 515.00, current: 520.88, sector: 'ETF', class: 'STOCK' },
];

const TRADE_HISTORY = [
  { id: 1, date: '06/15 09:32', symbol: 'AAPL', side: 'BUY', qty: 50, entry: 178.40, exit: 182.34, pnl: 197.00, status: 'OPEN' },
  { id: 2, date: '06/14 14:11', symbol: 'TSLA', side: 'SELL', qty: 10, entry: 255.00, exit: 248.50, pnl: 65.00, status: 'CLOSED' },
  { id: 3, date: '06/14 10:05', symbol: 'BTC', side: 'BUY', qty: 0.25, entry: 65000, exit: 67420, pnl: 605.00, status: 'CLOSED' },
  { id: 4, date: '06/13 15:47', symbol: 'NVDA', side: 'BUY', qty: 5, entry: 900.00, exit: 875.20, pnl: -124.00, status: 'CLOSED' },
  { id: 5, date: '06/13 11:20', symbol: 'ETH', side: 'BUY', qty: 1, entry: 3550, exit: 3521, pnl: -29.00, status: 'CLOSED' },
  { id: 6, date: '06/12 09:45', symbol: 'AAPL', side: 'BUY', qty: 20, entry: 176.00, exit: 181.50, pnl: 110.00, status: 'CLOSED' },
  { id: 7, date: '06/11 13:30', symbol: 'SPY', side: 'BUY', qty: 10, entry: 512.00, exit: 520.88, pnl: 88.80, status: 'CLOSED' },
];

const CLASS_COLORS: Record<string, string> = { STOCK: '#00aaff', CRYPTO: '#ffd700', FOREX: '#00ff88', ETF: '#8b5cf6' };

export default function PortfolioPage() {
  const [tab, setTab] = useState<'overview' | 'holdings' | 'history'>('overview');

  const totalValue = HOLDINGS.reduce((s, h) => s + h.current * h.qty, 0);
  const totalCost = HOLDINGS.reduce((s, h) => s + h.avgCost * h.qty, 0);
  const totalPnL = totalValue - totalCost;
  const totalPct = ((totalPnL / totalCost) * 100).toFixed(2);
  const cashBalance = 5830.50;
  const netWorth = totalValue + cashBalance;

  const winners = TRADE_HISTORY.filter(t => t.pnl > 0 && t.status === 'CLOSED').length;
  const losers = TRADE_HISTORY.filter(t => t.pnl < 0 && t.status === 'CLOSED').length;
  const totalRealized = TRADE_HISTORY.filter(t => t.status === 'CLOSED').reduce((s, t) => s + t.pnl, 0);

  return (
    <div className="grid-bg" style={{ minHeight: '100%' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '6px', color: '#64748b', marginBottom: '4px' }}>◉ PORTFOLIO</div>
          <h1 style={{ fontSize: '13px', color: '#00ffff', textShadow: '0 0 10px #00ffff', margin: 0 }}>
            YOUR HOLDINGS
          </h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '6px', color: '#64748b', marginBottom: '2px' }}>NET WORTH</div>
          <div style={{ fontSize: '14px', color: '#ffd700', textShadow: '0 0 12px #ffd700' }}>
            ${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Top stat strip */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {[
          { k: 'TOTAL EQUITY', v: '$' + totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 }), c: '#00aaff', icon: '◈' },
          { k: 'UNREALIZED P&L', v: `${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}`, c: totalPnL >= 0 ? '#00ff88' : '#ff3355', icon: '📈' },
          { k: 'TOTAL RETURN', v: `${totalPnL >= 0 ? '+' : ''}${totalPct}%`, c: totalPnL >= 0 ? '#00ff88' : '#ff3355', icon: '%' },
          { k: 'REALIZED P&L', v: `+$${totalRealized.toFixed(2)}`, c: '#00ff88', icon: '✓' },
          { k: 'CASH', v: '$' + cashBalance.toFixed(2), c: '#64748b', icon: '💰' },
          { k: 'WIN RATE', v: `${Math.round((winners / (winners + losers)) * 100)}%`, c: '#ffd700', icon: '★' },
        ].map(s => (
          <div key={s.k} className="retro-card" style={{ padding: '10px 14px', flex: '1 1 120px' }}>
            <div style={{ fontSize: '6px', color: '#64748b', marginBottom: '6px' }}>{s.icon} {s.k}</div>
            <div style={{ fontSize: '10px', color: s.c, textShadow: `0 0 8px ${s.c}` }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '14px' }}>
        {(['overview', 'holdings', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="pixel-btn"
            style={{
              fontSize: '7px', padding: '8px 14px',
              background: tab === t ? '#001133' : '#0a0e1a',
              color: tab === t ? '#00aaff' : '#64748b',
              borderColor: tab === t ? '#00aaff' : '#1e3a5f',
              boxShadow: tab === t ? '0 0 8px #00aaff44' : 'none',
              textTransform: 'uppercase',
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="retro-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '7px', color: '#00aaff', textShadow: '0 0 8px #00aaff', marginBottom: '10px' }}>EQUITY CHART</div>
            <MiniChart positive={true} color="#00aaff" height={120} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '6px' }}>
              <span style={{ color: '#64748b' }}>30D HIGH: <span style={{ color: '#00ff88' }}>$26,400</span></span>
              <span style={{ color: '#64748b' }}>30D LOW: <span style={{ color: '#ff3355' }}>$22,100</span></span>
            </div>
          </div>

          <div className="retro-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '7px', color: '#ffd700', textShadow: '0 0 8px #ffd700', marginBottom: '10px' }}>ALLOCATION</div>
            {HOLDINGS.map(h => {
              const pct = ((h.current * h.qty) / totalValue) * 100;
              return (
                <div key={h.symbol} style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '6px', marginBottom: '3px' }}>
                    <span style={{ color: CLASS_COLORS[h.class] }}>{h.symbol}</span>
                    <span style={{ color: '#64748b' }}>{pct.toFixed(1)}%</span>
                  </div>
                  <div style={{ height: '5px', background: '#0a0e1a', border: '1px solid #1e3a5f' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: CLASS_COLORS[h.class], boxShadow: `0 0 4px ${CLASS_COLORS[h.class]}` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="retro-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '7px', color: '#8b5cf6', textShadow: '0 0 8px #8b5cf6', marginBottom: '10px' }}>PERFORMANCE</div>
            {[
              { k: 'Today', v: '+$830.50', c: '#00ff88' },
              { k: 'This Week', v: '+$1,240.00', c: '#00ff88' },
              { k: 'This Month', v: '+$2,100.80', c: '#00ff88' },
              { k: 'All Time', v: '+$4,830.50', c: '#00ff88' },
              { k: 'Best Trade', v: '+$605.00 BTC', c: '#ffd700' },
              { k: 'Worst Trade', v: '-$124.00 NVDA', c: '#ff3355' },
            ].map(({ k, v, c }) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #0f1629', fontSize: '6px' }}>
                <span style={{ color: '#64748b' }}>{k}</span>
                <span style={{ color: c }}>{v}</span>
              </div>
            ))}
          </div>

          <div className="retro-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '7px', color: '#00ff88', textShadow: '0 0 8px #00ff88', marginBottom: '10px' }}>TRADE STATS</div>
            {[
              { k: 'Total Trades', v: `${winners + losers}` },
              { k: 'Winners', v: `${winners}`, c: '#00ff88' },
              { k: 'Losers', v: `${losers}`, c: '#ff3355' },
              { k: 'Win Rate', v: `${Math.round((winners / (winners + losers)) * 100)}%`, c: '#ffd700' },
              { k: 'Avg Win', v: '+$213.20', c: '#00ff88' },
              { k: 'Avg Loss', v: '-$76.50', c: '#ff3355' },
              { k: 'Profit Factor', v: '2.8x', c: '#8b5cf6' },
            ].map(({ k, v, c }) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #0f1629', fontSize: '6px' }}>
                <span style={{ color: '#64748b' }}>{k}</span>
                <span style={{ color: c ?? '#e2e8f0' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HOLDINGS */}
      {tab === 'holdings' && (
        <div className="retro-card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 60px 80px 90px 90px 80px 80px 70px', gap: '4px', padding: '7px 12px', borderBottom: '2px solid #1e3a5f', fontSize: '5px', color: '#64748b' }}>
            <span>SYMBOL</span><span>CLASS</span><span>QTY</span><span>AVG COST</span><span>CURRENT</span><span>VALUE</span><span>P&L</span><span>RETURN</span>
          </div>
          {HOLDINGS.map(h => {
            const pnl = (h.current - h.avgCost) * h.qty;
            const pct = ((h.current - h.avgCost) / h.avgCost) * 100;
            const up = pnl >= 0;
            return (
              <div key={h.symbol} style={{ display: 'grid', gridTemplateColumns: '80px 60px 80px 90px 90px 80px 80px 70px', gap: '4px', padding: '9px 12px', borderBottom: '1px solid #0f1629', fontSize: '7px', alignItems: 'center' }}>
                <span style={{ color: CLASS_COLORS[h.class], textShadow: `0 0 6px ${CLASS_COLORS[h.class]}` }}>{h.symbol}</span>
                <span style={{ fontSize: '5px', color: CLASS_COLORS[h.class], border: `1px solid ${CLASS_COLORS[h.class]}44`, padding: '2px 3px', display: 'inline-block' }}>{h.class}</span>
                <span style={{ color: '#e2e8f0' }}>{h.qty}</span>
                <span style={{ color: '#64748b' }}>${h.avgCost.toLocaleString()}</span>
                <span style={{ color: '#e2e8f0' }}>${h.current.toLocaleString()}</span>
                <span style={{ color: '#e2e8f0' }}>${(h.current * h.qty).toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                <span style={{ color: up ? '#00ff88' : '#ff3355', textShadow: up ? '0 0 6px #00ff88' : '0 0 6px #ff3355' }}>
                  {up ? '+' : ''}${pnl.toFixed(2)}
                </span>
                <span style={{ color: up ? '#00ff88' : '#ff3355' }}>
                  {up ? '+' : ''}{pct.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* HISTORY */}
      {tab === 'history' && (
        <div className="retro-card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 70px 50px 50px 80px 80px 80px 70px', gap: '4px', padding: '7px 12px', borderBottom: '2px solid #1e3a5f', fontSize: '5px', color: '#64748b' }}>
            <span>DATE</span><span>SYMBOL</span><span>SIDE</span><span>QTY</span><span>ENTRY</span><span>EXIT</span><span>P&L</span><span>STATUS</span>
          </div>
          {TRADE_HISTORY.map(t => (
            <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '90px 70px 50px 50px 80px 80px 80px 70px', gap: '4px', padding: '8px 12px', borderBottom: '1px solid #0f1629', fontSize: '6px', alignItems: 'center' }}>
              <span style={{ color: '#64748b' }}>{t.date}</span>
              <span style={{ color: '#00aaff' }}>{t.symbol}</span>
              <span style={{ color: t.side === 'BUY' ? '#00ff88' : '#ff3355' }}>{t.side}</span>
              <span style={{ color: '#e2e8f0' }}>{t.qty}</span>
              <span style={{ color: '#64748b' }}>${t.entry.toLocaleString()}</span>
              <span style={{ color: '#e2e8f0' }}>${t.exit.toLocaleString()}</span>
              <span style={{ color: t.pnl >= 0 ? '#00ff88' : '#ff3355', textShadow: `0 0 6px ${t.pnl >= 0 ? '#00ff88' : '#ff3355'}` }}>
                {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
              </span>
              <span style={{ fontSize: '5px', color: t.status === 'OPEN' ? '#ffd700' : '#64748b', border: `1px solid ${t.status === 'OPEN' ? '#ffd700' : '#1e3a5f'}`, padding: '2px 4px', display: 'inline-block' }}>
                {t.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
