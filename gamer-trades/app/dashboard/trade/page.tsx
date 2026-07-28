'use client';

import { useState, useEffect, useCallback } from 'react';
import CandlestickChart from '@/components/trading/CandlestickChart';
import OrderPanel from '@/components/trading/OrderPanel';
import AIAgentPanel from '@/components/trading/AIAgentPanel';
import GameOverScreen from '@/components/modals/GameOverScreen';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { DetectorId, StrategySignal } from '@/lib/strategyEngine';
import { getStrategy } from '@/lib/strategyContent';
import {
  getPortfolio,
  listOpenTrades,
  openTrade,
  closeTrade,
  computePnl,
  Portfolio,
  DbTrade,
  InsufficientFundsError,
} from '@/lib/trading';
import { ALL_SYMBOLS, SYMBOLS_BY_CLASS, ASSET_CLASS_LABEL, ASSET_CLASS_COLOR, AssetClass, SymbolInfo } from '@/lib/symbols';

const ASSET_CLASSES = Object.keys(SYMBOLS_BY_CLASS) as AssetClass[];

const INDICATORS = ['RSI', 'MACD', 'BB', 'EMA'];

const SCANNER_STRATEGIES: { id: DetectorId; label: string }[] = [
  { id: 'breakout', label: 'BREAKOUT' },
  { id: 'orb', label: 'ORB' },
  { id: 'fibonacci', label: 'FIBONACCI' },
  { id: 'support_resistance', label: 'S/R' },
  { id: 'ma_crossover', label: 'MA CROSS' },
  { id: 'rsi_reversal', label: 'RSI' },
];

export default function TradePage() {
  const { user } = useAuth();
  const [classTab, setClassTab] = useState<AssetClass>('STOCK');
  const [selected, setSelected] = useState<SymbolInfo>(ALL_SYMBOLS[0]);
  const [livePrice, setLivePrice] = useState(selected.basePrice);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [openTrades, setOpenTrades] = useState<DbTrade[]>([]);
  const [activeIndicators, setActiveIndicators] = useState<string[]>(['RSI']);
  const [timeframe, setTimeframe] = useState('1m');
  const [gameOver, setGameOver] = useState<{ type: 'GAME_OVER' | 'NICE_WORK'; pnl: number } | null>(null);
  const [orderLog, setOrderLog] = useState<string[]>([]);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [activeStrategies, setActiveStrategies] = useState<DetectorId[]>(SCANNER_STRATEGIES.map(s => s.id));
  const [latestSignal, setLatestSignal] = useState<StrategySignal | null>(null);

  const priceForSymbol = useCallback(
    (symbol: string) => {
      if (symbol === selected.symbol) return livePrice;
      return ALL_SYMBOLS.find(s => s.symbol === symbol)?.basePrice ?? livePrice;
    },
    [selected.symbol, livePrice]
  );

  // Load portfolio + open positions
  useEffect(() => {
    if (!user) return;
    getPortfolio(user.id).then(setPortfolio).catch(console.error);
    listOpenTrades(user.id).then(setOpenTrades).catch(console.error);
  }, [user]);

  // Simulate live price ticking for the selected symbol
  useEffect(() => {
    setLivePrice(selected.basePrice);
  }, [selected]);

  useEffect(() => {
    // Options are a leveraged proxy of their underlying's move — simulate them noisier.
    const volatility = selected.class === 'OPTIONS' ? 0.006 * (selected.leverage ?? 1) : 0.001;
    const id = setInterval(() => {
      setLivePrice(p => {
        const delta = (Math.random() - 0.48) * p * volatility;
        const next = Math.max(0.01, p + delta);
        return parseFloat(next.toFixed(selected.decimals));
      });
    }, 800);
    return () => clearInterval(id);
  }, [selected]);

  const closePositionAt = useCallback(
    async (trade: DbTrade, exitPrice: number, showResult: boolean) => {
      if (!user) return;
      try {
        const { pnl } = await closeTrade(user.id, trade, exitPrice);
        setOpenTrades(prev => prev.filter(t => t.id !== trade.id));
        setPortfolio(prev => (prev ? { ...prev, cash_balance: prev.cash_balance + trade.quantity * trade.entry_price + pnl } : prev));
        setOrderLog(prev => [`CLOSED ${trade.symbol} @ $${exitPrice.toFixed(2)} (${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)})`, ...prev.slice(0, 9)]);
        if (showResult) setGameOver({ type: pnl >= 0 ? 'NICE_WORK' : 'GAME_OVER', pnl });
      } catch (err) {
        console.error(err);
      }
    },
    [user]
  );

  // Auto-close open positions in the selected symbol when price crosses stop-loss/take-profit
  useEffect(() => {
    const hit = openTrades.find(t => {
      if (t.symbol !== selected.symbol) return false;
      if (t.stop_loss != null) {
        if (t.direction === 'long' && livePrice <= t.stop_loss) return true;
        if (t.direction === 'short' && livePrice >= t.stop_loss) return true;
      }
      if (t.take_profit != null) {
        if (t.direction === 'long' && livePrice >= t.take_profit) return true;
        if (t.direction === 'short' && livePrice <= t.take_profit) return true;
      }
      return false;
    });
    if (hit) closePositionAt(hit, livePrice, true);
  }, [livePrice, openTrades, selected.symbol, closePositionAt]);

  const handleOrder = async (order: { type: string; side: 'BUY' | 'SELL'; symbol: string; qty: number; price?: number; stopLoss?: number; takeProfit?: number }) => {
    if (!user || !portfolio) return;
    setOrderError(null);
    setPlacingOrder(true);
    try {
      const { trade, portfolio: updated } = await openTrade(user.id, portfolio, {
        symbol: order.symbol,
        direction: order.side === 'BUY' ? 'long' : 'short',
        orderType: order.type.toLowerCase() as 'market' | 'limit' | 'stop',
        quantity: order.qty,
        entryPrice: order.price ?? livePrice,
        stopLoss: order.stopLoss ?? null,
        takeProfit: order.takeProfit ?? null,
      });
      setPortfolio(updated);
      setOpenTrades(prev => [trade, ...prev]);
      setOrderLog(prev => [`${order.side} ${order.qty}x ${order.symbol} @ $${trade.entry_price.toFixed(2)}`, ...prev.slice(0, 9)]);
    } catch (err) {
      setOrderError(err instanceof InsufficientFundsError ? err.message : 'Could not place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const totalPnL = openTrades.reduce((sum, t) => sum + computePnl(t, priceForSymbol(t.symbol)), 0);

  return (
    <div className="grid-bg" style={{ minHeight: '100%' }}>
      {gameOver && (
        <GameOverScreen
          type={gameOver.type}
          pnl={gameOver.pnl}
          symbol={selected.symbol}
          onClose={() => setGameOver(null)}
          onReplay={() => setGameOver(null)}
        />
      )}

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>◈ TRADING ARENA</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', color: '#00ffff', textShadow: '0 0 10px #00ffff' }}>
              {selected.symbol}
            </span>
            <span
              style={{
                fontSize: '12px',
                color: livePrice >= selected.basePrice ? '#00ff88' : '#ff3355',
                textShadow: `0 0 10px ${livePrice >= selected.basePrice ? '#00ff88' : '#ff3355'}`,
              }}
            >
              ${livePrice.toLocaleString(undefined, { minimumFractionDigits: selected.decimals, maximumFractionDigits: selected.decimals })}
            </span>
            <span
              style={{
                fontSize: '13px',
                color: livePrice >= selected.basePrice ? '#00ff88' : '#ff3355',
              }}
            >
              {livePrice >= selected.basePrice ? '▲' : '▼'}{' '}
              {Math.abs(((livePrice - selected.basePrice) / selected.basePrice) * 100).toFixed(2)}%
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#64748b' }}>CASH:</span>
          <span style={{ fontSize: '9px', color: '#e2e8f0' }}>
            ${(portfolio?.cash_balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span style={{ fontSize: '13px', color: '#64748b', marginLeft: '8px' }}>OPEN P&L:</span>
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
            <button className="pixel-btn pixel-btn-blue" style={{ fontSize: '13px' }}>★ VS AI</button>
          </Link>
        </div>
      </div>

      {/* Asset class tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
        {ASSET_CLASSES.map(cls => (
          <button
            key={cls}
            onClick={() => setClassTab(cls)}
            className="pixel-btn"
            style={{
              fontSize: '12px',
              padding: '6px 10px',
              background: classTab === cls ? `${ASSET_CLASS_COLOR[cls]}22` : '#0a0e1a',
              color: classTab === cls ? ASSET_CLASS_COLOR[cls] : '#64748b',
              borderColor: classTab === cls ? ASSET_CLASS_COLOR[cls] : '#1e3a5f',
              boxShadow: classTab === cls ? `0 0 8px ${ASSET_CLASS_COLOR[cls]}44` : 'none',
            }}
          >
            {ASSET_CLASS_LABEL[cls]}
          </button>
        ))}
      </div>

      {/* Symbol selector (within the active asset class) */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {SYMBOLS_BY_CLASS[classTab].map(s => (
          <button
            key={s.symbol}
            onClick={() => setSelected(s)}
            className="pixel-btn"
            title={s.name}
            style={{
              fontSize: '12px',
              padding: '5px 8px',
              background: selected.symbol === s.symbol ? `${ASSET_CLASS_COLOR[s.class]}22` : '#0a0e1a',
              color: selected.symbol === s.symbol ? ASSET_CLASS_COLOR[s.class] : '#64748b',
              borderColor: selected.symbol === s.symbol ? ASSET_CLASS_COLOR[s.class] : '#1e3a5f',
              boxShadow: selected.symbol === s.symbol ? `0 0 8px ${ASSET_CLASS_COLOR[s.class]}44` : 'none',
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
                      fontSize: '12px',
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
              <span style={{ fontSize: '12px', color: '#1e3a5f' }}>|</span>
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
                    fontSize: '12px',
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

            {/* Live strategy scanner toggles */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderBottom: '1px solid #1e3a5f', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: '#8b5cf6', textShadow: '0 0 6px #8b5cf6' }}>🧠 SCANNER:</span>
              {SCANNER_STRATEGIES.map(s => {
                const on = activeStrategies.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveStrategies(prev => on ? prev.filter(x => x !== s.id) : [...prev, s.id])}
                    className="pixel-btn"
                    style={{
                      fontSize: '11px',
                      padding: '4px 6px',
                      background: on ? '#8b5cf622' : '#0a0e1a',
                      color: on ? '#8b5cf6' : '#64748b',
                      borderColor: on ? '#8b5cf6' : '#1e3a5f',
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>

            <CandlestickChart
              symbol={selected.symbol}
              basePrice={selected.basePrice}
              height={300}
              enabledStrategies={activeStrategies}
              onSignal={setLatestSignal}
            />

            {/* Live signal callout */}
            {latestSignal && (() => {
              const strat = getStrategy(latestSignal.strategyId);
              const color = latestSignal.direction === 'bullish' ? '#00ff88' : '#ff3355';
              return (
                <div style={{ padding: '10px 12px', borderTop: '1px solid #1e3a5f', background: `${color}0a`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>{strat?.icon ?? '🧠'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', color, textShadow: `0 0 6px ${color}` }}>
                      {strat?.name ?? latestSignal.strategyId} — {latestSignal.label}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>{latestSignal.detail}</div>
                  </div>
                  <Link href="/dashboard/academy" style={{ fontSize: '11px', color, textDecoration: 'none' }}>▶ LEARN THIS</Link>
                </div>
              );
            })()}

            {/* RSI panel (if active) */}
            {activeIndicators.includes('RSI') && (
              <div style={{ borderTop: '1px solid #1e3a5f', padding: '6px 12px' }}>
                <span style={{ fontSize: '12px', color: '#8b5cf6' }}>RSI(14): </span>
                <span style={{ fontSize: '13px', color: '#e2e8f0' }}>54.2</span>
                <div style={{ marginTop: '4px', height: '30px', background: '#0a0e1a', border: '1px solid #1e3a5f', position: 'relative', overflow: 'hidden' }}>
                  {/* RSI bar */}
                  <div style={{ position: 'absolute', top: '3px', bottom: '3px', left: '30%', right: '30%', background: 'rgba(139,92,246,0.1)', borderLeft: '1px solid #8b5cf633', borderRight: '1px solid #8b5cf633' }} />
                  <div style={{ position: 'absolute', top: '50%', left: `${54}%`, width: '6px', height: '6px', background: '#8b5cf6', transform: 'translate(-50%,-50%)', boxShadow: '0 0 4px #8b5cf6' }} />
                  {['30', '50', '70'].map((v, i) => (
                    <span key={v} style={{ position: 'absolute', top: '2px', left: `${[30, 50, 70][i]}%`, fontSize: '11px', color: '#64748b', transform: 'translateX(-50%)' }}>{v}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Market Analyst */}
          <AIAgentPanel
            symbol={selected.symbol}
            technicalContext={
              latestSignal
                ? `${latestSignal.label} (${latestSignal.direction}) via ${latestSignal.strategyId} — ${latestSignal.detail}. Current price $${livePrice.toLocaleString()}.`
                : `No active strategy signal. Current price $${livePrice.toLocaleString()}.`
            }
          />

          {/* Open Positions */}
          <div className="retro-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', borderBottom: '2px solid #1e3a5f', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#00aaff', textShadow: '0 0 8px #00aaff' }}>◈ POSITIONS</span>
              <span style={{ fontSize: '12px', color: totalPnL >= 0 ? '#00ff88' : '#ff3355' }}>
                P&L: {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
              </span>
            </div>

            {openTrades.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#1e3a5f' }}>
                NO OPEN POSITIONS
                <br /><br />
                <span style={{ fontSize: '12px' }}>Place an order to get started ▶</span>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '70px 45px 50px 80px 80px 70px 60px', gap: '4px', padding: '5px 10px', borderBottom: '1px solid #1e3a5f', fontSize: '11px', color: '#64748b' }}>
                  <span>SYMBOL</span><span>SIDE</span><span>QTY</span><span>ENTRY</span><span>CURRENT</span><span>P&L</span><span>ACTION</span>
                </div>
                {openTrades.map(t => {
                  const current = priceForSymbol(t.symbol);
                  const pnl = computePnl(t, current);
                  const up = pnl >= 0;
                  return (
                    <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '70px 45px 50px 80px 80px 70px 60px', gap: '4px', padding: '7px 10px', borderBottom: '1px solid #0f1629', alignItems: 'center', fontSize: '13px' }}>
                      <span style={{ color: '#00aaff' }}>{t.symbol}</span>
                      <span style={{ color: t.direction === 'long' ? '#00ff88' : '#ff3355', fontSize: '12px' }}>{t.direction === 'long' ? 'BUY' : 'SELL'}</span>
                      <span style={{ color: '#e2e8f0' }}>{t.quantity}</span>
                      <span style={{ color: '#64748b' }}>${t.entry_price.toFixed(2)}</span>
                      <span style={{ color: '#e2e8f0' }}>${current.toFixed(2)}</span>
                      <span style={{ color: up ? '#00ff88' : '#ff3355', textShadow: up ? '0 0 6px #00ff88' : '0 0 6px #ff3355' }}>
                        {up ? '+' : ''}${pnl.toFixed(2)}
                      </span>
                      <button onClick={() => closePositionAt(t, current, false)} className="pixel-btn pixel-btn-red" style={{ fontSize: '11px', padding: '4px 6px' }}>CLOSE</button>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Order log */}
          <div className="retro-card" style={{ padding: '10px 12px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>◎ ORDER LOG</div>
            {orderLog.length === 0
              ? <div style={{ fontSize: '12px', color: '#1e3a5f' }}>No orders yet...</div>
              : orderLog.map((log, i) => (
                  <div key={i} style={{ fontSize: '12px', color: i === 0 ? '#00ff88' : '#64748b', padding: '2px 0', borderBottom: '1px solid #0f1629' }}>
                    {i === 0 && <span style={{ color: '#ffd700' }}>▶ </span>}{log}
                  </div>
                ))
            }
          </div>
        </div>

        {/* Right: order panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="retro-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '13px', color: '#00aaff', textShadow: '0 0 8px #00aaff', marginBottom: '12px' }}>
              ◈ ORDER PANEL
            </div>
            {orderError && (
              <div style={{ fontSize: '12px', color: '#ff3355', padding: '8px', marginBottom: '10px', background: '#ff335511', border: '1px solid #ff335544' }}>
                ⚠ {orderError}
              </div>
            )}
            <OrderPanel symbol={selected.symbol} currentPrice={livePrice} onOrder={handleOrder} />
            {placingOrder && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>Placing order...</div>}
          </div>

          {/* Symbol info */}
          <div className="retro-card" style={{ padding: '12px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>◎ MARKET INFO</div>
            {[
              { k: 'NAME', v: selected.name },
              { k: 'ASSET CLASS', v: ASSET_CLASS_LABEL[selected.class], c: ASSET_CLASS_COLOR[selected.class] },
              ...(selected.underlying ? [{ k: 'UNDERLYING', v: selected.underlying, c: '#8b5cf6' }] : []),
              { k: 'OPEN', v: '$' + selected.basePrice.toFixed(selected.decimals) },
              { k: '24H HIGH', v: '$' + (selected.basePrice * 1.018).toFixed(selected.decimals), c: '#00ff88' },
              { k: '24H LOW', v: '$' + (selected.basePrice * 0.983).toFixed(selected.decimals), c: '#ff3355' },
            ].map(({ k, v, c }) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #0f1629', fontSize: '12px' }}>
                <span style={{ color: '#64748b' }}>{k}</span>
                <span style={{ color: c ?? '#e2e8f0' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Quick tip */}
          <div className="retro-card" style={{ padding: '12px', borderColor: '#ffd70044', boxShadow: '4px 4px 0 #000, 0 0 8px #ffd70022' }}>
            <div style={{ fontSize: '12px', color: '#ffd700', textShadow: '0 0 6px #ffd700', marginBottom: '6px' }}>
              💡 PRO TIP
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 2 }}>
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
