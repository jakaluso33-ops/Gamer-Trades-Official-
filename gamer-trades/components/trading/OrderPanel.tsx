'use client';

import { useState } from 'react';

interface Props {
  symbol: string;
  currentPrice: number;
  onOrder?: (order: Order) => void;
}

interface Order {
  type: 'MARKET' | 'LIMIT' | 'STOP';
  side: 'BUY' | 'SELL';
  symbol: string;
  qty: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export default function OrderPanel({ symbol, currentPrice, onOrder }: Props) {
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP'>('MARKET');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [qty, setQty] = useState('10');
  const [limitPrice, setLimitPrice] = useState(currentPrice.toFixed(2));
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const total = parseFloat(qty || '0') * currentPrice;

  const handleSubmit = () => {
    const order: Order = {
      type: orderType,
      side,
      symbol,
      qty: parseFloat(qty),
      price: orderType !== 'MARKET' ? parseFloat(limitPrice) : currentPrice,
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
    };
    onOrder?.(order);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#0a0e1a',
    border: '2px solid #1e3a5f',
    color: '#e2e8f0',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '8px',
    padding: '8px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '6px',
    color: '#64748b',
    display: 'block',
    marginBottom: '4px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Order type tabs */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {(['MARKET', 'LIMIT', 'STOP'] as const).map(t => (
          <button
            key={t}
            onClick={() => setOrderType(t)}
            className="pixel-btn"
            style={{
              flex: 1,
              fontSize: '6px',
              padding: '6px 4px',
              background: orderType === t ? '#001133' : '#0a0e1a',
              color: orderType === t ? '#00aaff' : '#64748b',
              borderColor: orderType === t ? '#00aaff' : '#1e3a5f',
              boxShadow: orderType === t ? '0 0 8px #00aaff44' : 'none',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Buy / Sell toggle */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button
          onClick={() => setSide('BUY')}
          className="pixel-btn"
          style={{
            flex: 1,
            fontSize: '8px',
            padding: '10px',
            background: side === 'BUY' ? '#003322' : '#0a0e1a',
            color: side === 'BUY' ? '#00ff88' : '#64748b',
            borderColor: side === 'BUY' ? '#00ff88' : '#1e3a5f',
            boxShadow: side === 'BUY' ? '0 0 12px #00ff8844' : 'none',
          }}
        >
          ▲ BUY
        </button>
        <button
          onClick={() => setSide('SELL')}
          className="pixel-btn"
          style={{
            flex: 1,
            fontSize: '8px',
            padding: '10px',
            background: side === 'SELL' ? '#330011' : '#0a0e1a',
            color: side === 'SELL' ? '#ff3355' : '#64748b',
            borderColor: side === 'SELL' ? '#ff3355' : '#1e3a5f',
            boxShadow: side === 'SELL' ? '0 0 12px #ff335544' : 'none',
          }}
        >
          ▼ SELL
        </button>
      </div>

      {/* Quantity */}
      <div>
        <label style={labelStyle}>QUANTITY</label>
        <input
          style={inputStyle}
          type="number"
          value={qty}
          onChange={e => setQty(e.target.value)}
          min="1"
        />
      </div>

      {/* Limit / Stop price */}
      {orderType !== 'MARKET' && (
        <div>
          <label style={labelStyle}>{orderType === 'LIMIT' ? 'LIMIT PRICE' : 'STOP PRICE'}</label>
          <input
            style={inputStyle}
            type="number"
            value={limitPrice}
            onChange={e => setLimitPrice(e.target.value)}
            step="0.01"
          />
        </div>
      )}

      {/* Stop loss */}
      <div>
        <label style={labelStyle}>STOP LOSS (optional)</label>
        <input
          style={{ ...inputStyle, borderColor: stopLoss ? '#ff3355' : '#1e3a5f' }}
          type="number"
          placeholder="e.g. 179.00"
          value={stopLoss}
          onChange={e => setStopLoss(e.target.value)}
          step="0.01"
        />
      </div>

      {/* Take profit */}
      <div>
        <label style={labelStyle}>TAKE PROFIT (optional)</label>
        <input
          style={{ ...inputStyle, borderColor: takeProfit ? '#00ff88' : '#1e3a5f' }}
          type="number"
          placeholder="e.g. 190.00"
          value={takeProfit}
          onChange={e => setTakeProfit(e.target.value)}
          step="0.01"
        />
      </div>

      {/* Order summary */}
      <div style={{ padding: '8px', background: '#0a0e1a', border: '1px solid #1e3a5f' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '6px', color: '#64748b', marginBottom: '4px' }}>
          <span>MARKET PRICE</span>
          <span style={{ color: '#e2e8f0' }}>${currentPrice.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '6px', color: '#64748b', marginBottom: '4px' }}>
          <span>QTY</span>
          <span style={{ color: '#e2e8f0' }}>{qty || 0}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7px', borderTop: '1px solid #1e3a5f', paddingTop: '4px' }}>
          <span style={{ color: '#64748b' }}>TOTAL</span>
          <span style={{ color: '#ffd700', textShadow: '0 0 6px #ffd700' }}>${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        className={`pixel-btn ${side === 'BUY' ? 'pixel-btn-green' : 'pixel-btn-red'}`}
        style={{ width: '100%', fontSize: '9px', padding: '12px' }}
      >
        {submitted
          ? '✓ ORDER PLACED!'
          : `${side === 'BUY' ? '▲ BUY' : '▼ SELL'} ${symbol}`}
      </button>
    </div>
  );
}
