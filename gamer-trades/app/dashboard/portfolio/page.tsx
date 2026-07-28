'use client';

import { useState, useEffect } from 'react';
import MiniChart from '@/components/trading/MiniChart';
import { useAuth } from '@/lib/AuthContext';
import { getPortfolio, listOpenTrades, listClosedTrades, computePnl, Portfolio, DbTrade } from '@/lib/trading';
import { getBasePrice, getSymbolInfo, ASSET_CLASS_COLOR, AssetClass } from '@/lib/symbols';

interface Holding {
  symbol: string;
  qty: number;
  avgCost: number;
  current: number;
  class: AssetClass;
}

function aggregateHoldings(openTrades: DbTrade[]): Holding[] {
  const bySymbol = new Map<string, { qty: number; cost: number }>();
  for (const t of openTrades) {
    const entry = bySymbol.get(t.symbol) ?? { qty: 0, cost: 0 };
    entry.qty += t.quantity;
    entry.cost += t.quantity * t.entry_price;
    bySymbol.set(t.symbol, entry);
  }
  return Array.from(bySymbol.entries()).map(([symbol, { qty, cost }]) => ({
    symbol,
    qty,
    avgCost: cost / qty,
    current: getBasePrice(symbol) || cost / qty,
    class: getSymbolInfo(symbol)?.class ?? 'STOCK',
  }));
}

export default function PortfolioPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'overview' | 'holdings' | 'history'>('overview');
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [openTrades, setOpenTrades] = useState<DbTrade[]>([]);
  const [closedTrades, setClosedTrades] = useState<DbTrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([getPortfolio(user.id), listOpenTrades(user.id), listClosedTrades(user.id)])
      .then(([p, open, closed]) => {
        setPortfolio(p);
        setOpenTrades(open);
        setClosedTrades(closed);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const holdings = aggregateHoldings(openTrades);
  const totalValue = holdings.reduce((s, h) => s + h.current * h.qty, 0);
  const unrealizedPnl = openTrades.reduce((s, t) => s + computePnl(t, getBasePrice(t.symbol) || t.entry_price), 0);
  const totalCost = holdings.reduce((s, h) => s + h.avgCost * h.qty, 0);
  const totalPct = totalCost > 0 ? ((unrealizedPnl / totalCost) * 100).toFixed(2) : '0.00';
  const cashBalance = portfolio?.cash_balance ?? 0;
  const netWorth = totalValue + cashBalance;

  const winners = closedTrades.filter(t => (t.pnl ?? 0) > 0).length;
  const losers = closedTrades.filter(t => (t.pnl ?? 0) < 0).length;
  const totalRealized = closedTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const winRate = winners + losers > 0 ? Math.round((winners / (winners + losers)) * 100) : 0;
  const avgWin = winners > 0 ? closedTrades.filter(t => (t.pnl ?? 0) > 0).reduce((s, t) => s + (t.pnl ?? 0), 0) / winners : 0;
  const avgLoss = losers > 0 ? closedTrades.filter(t => (t.pnl ?? 0) < 0).reduce((s, t) => s + (t.pnl ?? 0), 0) / losers : 0;
  const grossWin = closedTrades.filter(t => (t.pnl ?? 0) > 0).reduce((s, t) => s + (t.pnl ?? 0), 0);
  const grossLoss = Math.abs(closedTrades.filter(t => (t.pnl ?? 0) < 0).reduce((s, t) => s + (t.pnl ?? 0), 0));
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;
  const bestTrade = closedTrades.reduce((best, t) => (best === null || (t.pnl ?? 0) > (best.pnl ?? 0) ? t : best), null as DbTrade | null);
  const worstTrade = closedTrades.reduce((worst, t) => (worst === null || (t.pnl ?? 0) < (worst.pnl ?? 0) ? t : worst), null as DbTrade | null);

  const history = [...openTrades, ...closedTrades].sort(
    (a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime()
  );

  if (loading) {
    return (
      <div className="grid-bg" style={{ minHeight: '100%', padding: '20px' }}>
        <div style={{ fontSize: '7px', color: '#64748b' }}>Loading portfolio...</div>
      </div>
    );
  }

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
          { k: 'UNREALIZED P&L', v: `${unrealizedPnl >= 0 ? '+' : ''}$${unrealizedPnl.toFixed(2)}`, c: unrealizedPnl >= 0 ? '#00ff88' : '#ff3355', icon: '📈' },
          { k: 'TOTAL RETURN', v: `${unrealizedPnl >= 0 ? '+' : ''}${totalPct}%`, c: unrealizedPnl >= 0 ? '#00ff88' : '#ff3355', icon: '%' },
          { k: 'REALIZED P&L', v: `${totalRealized >= 0 ? '+' : ''}$${totalRealized.toFixed(2)}`, c: totalRealized >= 0 ? '#00ff88' : '#ff3355', icon: '✓' },
          { k: 'CASH', v: '$' + cashBalance.toFixed(2), c: '#64748b', icon: '💰' },
          { k: 'WIN RATE', v: `${winRate}%`, c: '#ffd700', icon: '★' },
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
            <MiniChart positive={unrealizedPnl >= 0} color="#00aaff" height={120} />
            <div style={{ fontSize: '5px', color: '#64748b', marginTop: '8px' }}>
              Illustrative — historical equity tracking coming soon.
            </div>
          </div>

          <div className="retro-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '7px', color: '#ffd700', textShadow: '0 0 8px #ffd700', marginBottom: '10px' }}>ALLOCATION</div>
            {holdings.length === 0 ? (
              <div style={{ fontSize: '6px', color: '#1e3a5f' }}>No open positions</div>
            ) : holdings.map(h => {
              const pct = totalValue > 0 ? ((h.current * h.qty) / totalValue) * 100 : 0;
              return (
                <div key={h.symbol} style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '6px', marginBottom: '3px' }}>
                    <span style={{ color: ASSET_CLASS_COLOR[h.class] }}>{h.symbol}</span>
                    <span style={{ color: '#64748b' }}>{pct.toFixed(1)}%</span>
                  </div>
                  <div style={{ height: '5px', background: '#0a0e1a', border: '1px solid #1e3a5f' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: ASSET_CLASS_COLOR[h.class], boxShadow: `0 0 4px ${ASSET_CLASS_COLOR[h.class]}` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="retro-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '7px', color: '#8b5cf6', textShadow: '0 0 8px #8b5cf6', marginBottom: '10px' }}>PERFORMANCE</div>
            {[
              { k: 'Realized (All Time)', v: `${totalRealized >= 0 ? '+' : ''}$${totalRealized.toFixed(2)}`, c: totalRealized >= 0 ? '#00ff88' : '#ff3355' },
              { k: 'Unrealized (Open)', v: `${unrealizedPnl >= 0 ? '+' : ''}$${unrealizedPnl.toFixed(2)}`, c: unrealizedPnl >= 0 ? '#00ff88' : '#ff3355' },
              { k: 'Best Trade', v: bestTrade ? `${(bestTrade.pnl ?? 0) >= 0 ? '+' : ''}$${(bestTrade.pnl ?? 0).toFixed(2)} ${bestTrade.symbol}` : '—', c: '#ffd700' },
              { k: 'Worst Trade', v: worstTrade ? `${(worstTrade.pnl ?? 0) >= 0 ? '+' : ''}$${(worstTrade.pnl ?? 0).toFixed(2)} ${worstTrade.symbol}` : '—', c: '#ff3355' },
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
              { k: 'Total Closed Trades', v: `${winners + losers}` },
              { k: 'Winners', v: `${winners}`, c: '#00ff88' },
              { k: 'Losers', v: `${losers}`, c: '#ff3355' },
              { k: 'Win Rate', v: `${winRate}%`, c: '#ffd700' },
              { k: 'Avg Win', v: winners > 0 ? `+$${avgWin.toFixed(2)}` : '—', c: '#00ff88' },
              { k: 'Avg Loss', v: losers > 0 ? `$${avgLoss.toFixed(2)}` : '—', c: '#ff3355' },
              { k: 'Profit Factor', v: profitFactor === Infinity ? '∞' : `${profitFactor.toFixed(2)}x`, c: '#8b5cf6' },
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
          {holdings.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', fontSize: '7px', color: '#1e3a5f' }}>NO HOLDINGS</div>
          ) : holdings.map(h => {
            const pnl = (h.current - h.avgCost) * h.qty;
            const pct = ((h.current - h.avgCost) / h.avgCost) * 100;
            const up = pnl >= 0;
            return (
              <div key={h.symbol} style={{ display: 'grid', gridTemplateColumns: '80px 60px 80px 90px 90px 80px 80px 70px', gap: '4px', padding: '9px 12px', borderBottom: '1px solid #0f1629', fontSize: '7px', alignItems: 'center' }}>
                <span style={{ color: ASSET_CLASS_COLOR[h.class], textShadow: `0 0 6px ${ASSET_CLASS_COLOR[h.class]}` }}>{h.symbol}</span>
                <span style={{ fontSize: '5px', color: ASSET_CLASS_COLOR[h.class], border: `1px solid ${ASSET_CLASS_COLOR[h.class]}44`, padding: '2px 3px', display: 'inline-block' }}>{h.class}</span>
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
          {history.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', fontSize: '7px', color: '#1e3a5f' }}>NO TRADE HISTORY YET</div>
          ) : history.map(t => (
            <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '90px 70px 50px 50px 80px 80px 80px 70px', gap: '4px', padding: '8px 12px', borderBottom: '1px solid #0f1629', fontSize: '6px', alignItems: 'center' }}>
              <span style={{ color: '#64748b' }}>{new Date(t.opened_at).toLocaleString(undefined, { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
              <span style={{ color: '#00aaff' }}>{t.symbol}</span>
              <span style={{ color: t.direction === 'long' ? '#00ff88' : '#ff3355' }}>{t.direction === 'long' ? 'BUY' : 'SELL'}</span>
              <span style={{ color: '#e2e8f0' }}>{t.quantity}</span>
              <span style={{ color: '#64748b' }}>${t.entry_price.toLocaleString()}</span>
              <span style={{ color: '#e2e8f0' }}>{t.exit_price != null ? `$${t.exit_price.toLocaleString()}` : '—'}</span>
              <span style={{ color: (t.pnl ?? 0) >= 0 ? '#00ff88' : '#ff3355', textShadow: `0 0 6px ${(t.pnl ?? 0) >= 0 ? '#00ff88' : '#ff3355'}` }}>
                {t.pnl != null ? `${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(2)}` : '—'}
              </span>
              <span style={{ fontSize: '5px', color: t.status === 'open' ? '#ffd700' : '#64748b', border: `1px solid ${t.status === 'open' ? '#ffd700' : '#1e3a5f'}`, padding: '2px 4px', display: 'inline-block' }}>
                {t.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
