import { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollView, View, Modal, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, PixelText, BodyText, PixelButton } from '../../components/ui';
import { colors } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';
import { Candle, DetectorId, StrategySignal, scanStrategies } from '../../lib/strategyEngine';
import { getStrategy } from '../../lib/strategyContent';
import {
  getPortfolio,
  listOpenTrades,
  openTrade,
  closeTrade,
  computePnl,
  Portfolio,
  DbTrade,
  InsufficientFundsError,
} from '../../lib/trading';
import { ALL_SYMBOLS, SYMBOLS_BY_CLASS, ASSET_CLASS_LABEL, ASSET_CLASS_COLOR, ASSET_CLASS_ICON, AssetClass, SymbolInfo } from '../../lib/symbols';
import { pollLiveQuotes } from '../../lib/marketData';
import CandlestickChart, { Timeframe } from '../../components/CandlestickChart';
import PnlIcon from '../../components/PnlIcon';

const ASSET_CLASSES = Object.keys(SYMBOLS_BY_CLASS) as AssetClass[];
const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1H', '4H', '1D'];

const SCANNER_STRATEGIES: { id: DetectorId; label: string }[] = [
  { id: 'breakout', label: 'BREAKOUT' },
  { id: 'orb', label: 'ORB' },
  { id: 'fibonacci', label: 'FIBONACCI' },
  { id: 'support_resistance', label: 'S/R' },
  { id: 'ma_crossover', label: 'MA CROSS' },
  { id: 'rsi_reversal', label: 'RSI' },
];

function generateCandles(count: number, basePrice: number): Candle[] {
  const candles: Candle[] = [];
  let price = basePrice;
  const now = Date.now();
  for (let i = count; i >= 0; i--) {
    const open = price;
    const change = (Math.random() - 0.48) * price * 0.012;
    const close = Math.max(1, open + change);
    const high = Math.max(open, close) + Math.random() * price * 0.005;
    const low = Math.min(open, close) - Math.random() * price * 0.005;
    candles.push({
      time: now - i * 60000,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(Math.random() * 500000 + 50000),
    });
    price = close;
  }
  return candles;
}

export default function TradeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [classTab, setClassTab] = useState<AssetClass>('STOCK');
  const [selected, setSelected] = useState<SymbolInfo>(ALL_SYMBOLS[0]);
  const [qty, setQty] = useState(10);
  const [livePrice, setLivePrice] = useState(ALL_SYMBOLS[0].basePrice);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [openTrades, setOpenTrades] = useState<DbTrade[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [activeStrategies, setActiveStrategies] = useState<DetectorId[]>(SCANNER_STRATEGIES.map(s => s.id));
  const [timeframe, setTimeframe] = useState<Timeframe>('1m');
  const candlesRef = useRef<Candle[]>(generateCandles(60, ALL_SYMBOLS[0].basePrice));
  const [signals, setSignals] = useState<StrategySignal[]>([]);
  const [changes, setChanges] = useState<Record<string, number>>({});
  const [chartFullscreen, setChartFullscreen] = useState(false);
  const livePriceRef = useRef(livePrice);
  useEffect(() => { livePriceRef.current = livePrice; }, [livePrice]);

  // Seed + nudge simulated % change for whatever symbols are visible in the current
  // watchlist tab, so the list feels alive without needing a live quote per row.
  useEffect(() => {
    setChanges(prev => {
      const next = { ...prev };
      for (const s of SYMBOLS_BY_CLASS[classTab]) {
        if (next[s.symbol] === undefined) next[s.symbol] = (Math.random() - 0.5) * 6;
      }
      return next;
    });
    const id = setInterval(() => {
      setChanges(prev => {
        const next = { ...prev };
        for (const s of SYMBOLS_BY_CLASS[classTab]) {
          next[s.symbol] = (next[s.symbol] ?? 0) + (Math.random() - 0.5) * 0.4;
        }
        return next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, [classTab]);

  useEffect(() => {
    if (!user) return;
    getPortfolio(user.id).then(setPortfolio).catch(console.error);
    listOpenTrades(user.id).then(setOpenTrades).catch(console.error);
  }, [user]);

  useEffect(() => {
    setLivePrice(selected.basePrice);
  }, [selected]);

  // Reset the chart when switching instruments — otherwise the old symbol's
  // candle history sticks around and the chart appears frozen.
  useEffect(() => {
    candlesRef.current = generateCandles(60, selected.basePrice);
    setSignals([]);
  }, [selected]);

  // Anchor the live-ticking price to real Polygon.io quotes when available (stocks,
  // crypto, forex, indices). Futures/options aren't directly quotable in the
  // simplified pass and keep ticking from their simulated baseline.
  useEffect(() => {
    const unsub = pollLiveQuotes([selected.symbol], 10000, quotes => {
      const q = quotes[selected.symbol];
      if (q) setLivePrice(parseFloat(q.price.toFixed(selected.decimals)));
    });
    return unsub;
  }, [selected]);

  useEffect(() => {
    // Options are a leveraged proxy of their underlying's move — simulate them noisier.
    const volatility = selected.class === 'OPTIONS' ? 0.006 * (selected.leverage ?? 1) : 0.002;
    const id = setInterval(() => {
      const prev = candlesRef.current;
      const last = prev[prev.length - 1];
      const open = last.close;
      const anchor = livePriceRef.current;
      // Track the real live price when we have one, otherwise fall back to a random walk.
      const close = anchor != null ? Math.max(1, anchor) : Math.max(1, open + (Math.random() - 0.48) * open * 0.008);
      const high = Math.max(open, close) + Math.random() * open * 0.003;
      const low = Math.min(open, close) - Math.random() * open * 0.003;
      const newCandle: Candle = {
        time: Date.now(),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: Math.floor(Math.random() * 500000 + 50000),
      };
      candlesRef.current = [...prev.slice(-59), newCandle];
      setSignals(scanStrategies(candlesRef.current, activeStrategies));
      setLivePrice(p => {
        const delta = (Math.random() - 0.48) * p * volatility;
        return parseFloat(Math.max(0.01, p + delta).toFixed(selected.decimals));
      });
    }, 3000);
    return () => clearInterval(id);
  }, [activeStrategies, selected]);

  const priceForSymbol = useCallback(
    (sym: string) => (sym === selected.symbol ? livePrice : ALL_SYMBOLS.find(s => s.symbol === sym)?.basePrice ?? livePrice),
    [selected.symbol, livePrice]
  );

  const place = async (side: 'BUY' | 'SELL') => {
    if (!user || !portfolio) return;
    setOrderError(null);
    try {
      const { trade, portfolio: updated } = await openTrade(user.id, portfolio, {
        symbol: selected.symbol,
        direction: side === 'BUY' ? 'long' : 'short',
        orderType: 'market',
        quantity: qty,
        entryPrice: livePrice,
      });
      setPortfolio(updated);
      setOpenTrades(prev => [trade, ...prev]);
      setLog(prev => [`${side} ${qty}x ${selected.symbol} @ $${trade.entry_price.toFixed(2)}`, ...prev.slice(0, 9)]);
    } catch (err) {
      setOrderError(err instanceof InsufficientFundsError ? err.message : 'Could not place order.');
    }
  };

  const closePosition = async (t: DbTrade) => {
    if (!user) return;
    try {
      const exitPrice = priceForSymbol(t.symbol);
      const { pnl } = await closeTrade(user.id, t, exitPrice);
      setOpenTrades(prev => prev.filter(x => x.id !== t.id));
      setPortfolio(prev => (prev ? { ...prev, cash_balance: prev.cash_balance + t.quantity * t.entry_price + pnl } : prev));
      setLog(prev => [`CLOSED ${t.symbol} @ $${exitPrice.toFixed(2)} (${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)})`, ...prev.slice(0, 9)]);
    } catch (err) {
      console.error(err);
    }
  };

  const latest = signals[0];
  const totalPnl = openTrades.reduce((sum, t) => sum + computePnl(t, priceForSymbol(t.symbol)), 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      <PixelText color={colors.blue} size={13} glow>◈ TRADE</PixelText>

      <Card borderColor={colors.purple}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <BodyText color={colors.purple} size={12} weight="semibold" glow>🧠 LIVE SIGNALS</BodyText>
          <BodyText color={colors.muted} size={11} onPress={() => router.push('/(tabs)/academy' as never)}>LEARN ▶</BodyText>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
          {SCANNER_STRATEGIES.map(s => {
            const on = activeStrategies.includes(s.id);
            return (
              <PixelButton
                key={s.id}
                color={on ? colors.purple : colors.muted}
                onPress={() => setActiveStrategies(prev => on ? prev.filter(x => x !== s.id) : [...prev, s.id])}
                style={{ paddingHorizontal: 6, paddingVertical: 5 }}
              >
                {s.label}
              </PixelButton>
            );
          })}
        </View>
        {latest ? (() => {
          const strat = getStrategy(latest.strategyId);
          const color = latest.direction === 'bullish' ? colors.green : colors.red;
          return (
            <View style={{ padding: 10, backgroundColor: `${color}0a`, borderWidth: 2, borderColor: `${color}55` }}>
              <BodyText color={color} size={13} weight="medium" glow>{strat?.icon} {strat?.name ?? latest.strategyId} — {latest.label}</BodyText>
              <BodyText color={colors.muted} size={12} style={{ marginTop: 6 }}>{latest.detail}</BodyText>
            </View>
          );
        })() : (
          <BodyText color={colors.muted} size={13}>Scanning the market for setups...</BodyText>
        )}
      </Card>

      <Card borderColor={colors.cyan}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <BodyText color={colors.cyan} size={13} weight="semibold" glow>{selected.symbol}</BodyText>
          <BodyText color={colors.text} size={13} weight="medium">
            ${livePrice.toLocaleString(undefined, { minimumFractionDigits: selected.decimals, maximumFractionDigits: selected.decimals })}
          </BodyText>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
          {TIMEFRAMES.map(tf => (
            <PixelButton
              key={tf}
              color={timeframe === tf ? colors.blue : colors.muted}
              onPress={() => setTimeframe(tf)}
              style={{ paddingHorizontal: 8, paddingVertical: 5 }}
            >
              {tf}
            </PixelButton>
          ))}
        </View>
        <Pressable onPress={() => setChartFullscreen(true)}>
          <CandlestickChart
            symbol={selected.symbol}
            basePrice={selected.basePrice}
            livePrice={livePrice}
            timeframe={timeframe}
            height={200}
            positions={openTrades
              .filter(t => t.symbol === selected.symbol)
              .map(t => ({ entryPrice: t.entry_price, direction: t.direction, quantity: t.quantity }))}
          />
        </Pressable>
        <BodyText color={colors.border} size={10} style={{ textAlign: 'center', marginTop: 4 }}>
          TAP CHART TO EXPAND ⤢
        </BodyText>
      </Card>

      <Modal visible={chartFullscreen} animationType="slide" onRequestClose={() => setChartFullscreen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: 50, paddingHorizontal: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <PixelText color={colors.cyan} size={13} glow>{selected.symbol}</PixelText>
            <PixelButton color={colors.muted} onPress={() => setChartFullscreen(false)} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
              ✕ CLOSE
            </PixelButton>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
            {TIMEFRAMES.map(tf => (
              <PixelButton
                key={tf}
                color={timeframe === tf ? colors.blue : colors.muted}
                onPress={() => setTimeframe(tf)}
                style={{ paddingHorizontal: 8, paddingVertical: 5 }}
              >
                {tf}
              </PixelButton>
            ))}
          </View>
          <CandlestickChart
            symbol={selected.symbol}
            basePrice={selected.basePrice}
            livePrice={livePrice}
            timeframe={timeframe}
            height={Dimensions.get('window').height - 260}
            positions={openTrades
              .filter(t => t.symbol === selected.symbol)
              .map(t => ({ entryPrice: t.entry_price, direction: t.direction, quantity: t.quantity }))}
          />
        </View>
      </Modal>

      <Card>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
          {ASSET_CLASSES.map(cls => (
            <PixelButton
              key={cls}
              color={classTab === cls ? ASSET_CLASS_COLOR[cls] : colors.muted}
              onPress={() => setClassTab(cls)}
              style={{ paddingHorizontal: 8, paddingVertical: 6 }}
            >
              {ASSET_CLASS_LABEL[cls]}
            </PixelButton>
          ))}
        </View>
        <View style={{ borderWidth: 2, borderColor: colors.border }}>
          {SYMBOLS_BY_CLASS[classTab].map((s, i) => {
            const isSelected = selected.symbol === s.symbol;
            const change = changes[s.symbol] ?? 0;
            const up = change >= 0;
            const changeColor = up ? colors.green : colors.red;
            const price = s.symbol === selected.symbol ? livePrice : s.basePrice;
            return (
              <Pressable
                key={s.symbol}
                onPress={() => setSelected(s)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 10,
                  backgroundColor: isSelected ? `${colors.cyan}14` : 'transparent',
                  borderBottomWidth: i === SYMBOLS_BY_CLASS[classTab].length - 1 ? 0 : 1,
                  borderBottomColor: colors.border,
                  borderLeftWidth: isSelected ? 3 : 0,
                  borderLeftColor: colors.cyan,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: `${ASSET_CLASS_COLOR[classTab]}22`,
                    borderWidth: 2,
                    borderColor: ASSET_CLASS_COLOR[classTab],
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BodyText size={14}>{ASSET_CLASS_ICON[classTab]}</BodyText>
                </View>
                <View style={{ flex: 1 }}>
                  <BodyText color={isSelected ? colors.cyan : colors.text} size={13} weight="semibold">{s.symbol}</BodyText>
                  <BodyText color={colors.muted} size={11} style={{ marginTop: 2 }} numberOfLines={1}>{s.name}</BodyText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <BodyText color={colors.text} size={13} weight="medium">
                    {price.toLocaleString(undefined, { minimumFractionDigits: s.decimals, maximumFractionDigits: s.decimals })}
                  </BodyText>
                  <BodyText color={changeColor} size={11} style={{ marginTop: 2 }}>
                    {up ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                  </BodyText>
                </View>
              </Pressable>
            );
          })}
        </View>

        <BodyText color={colors.muted} size={12} style={{ marginTop: 16, marginBottom: 8 }}>QUANTITY: {qty}</BodyText>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[1, 10, 25, 50].map(q => (
            <PixelButton key={q} color={qty === q ? colors.gold : colors.muted} onPress={() => setQty(q)} style={{ flex: 1 }}>
              {q}
            </PixelButton>
          ))}
        </View>

        {orderError && (
          <View style={{ marginTop: 10, padding: 8, backgroundColor: '#ff335511', borderWidth: 1, borderColor: '#ff335544' }}>
            <BodyText color={colors.red} size={12}>⚠ {orderError}</BodyText>
          </View>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
          <BodyText color={colors.muted} size={11}>CASH</BodyText>
          <BodyText color={colors.text} size={12}>${(portfolio?.cash_balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</BodyText>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <PixelButton color={colors.green} onPress={() => place('BUY')} style={{ flex: 1, paddingVertical: 16 }}>▲ BUY</PixelButton>
          <PixelButton color={colors.red} onPress={() => place('SELL')} style={{ flex: 1, paddingVertical: 16 }}>▼ SELL</PixelButton>
        </View>
      </Card>

      <Card borderColor={colors.blue}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <BodyText color={colors.blue} size={12} weight="semibold" glow>◈ POSITIONS</BodyText>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <BodyText color={totalPnl >= 0 ? colors.green : colors.red} size={12} weight="medium">
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
            </BodyText>
            <PnlIcon pnl={totalPnl} />
          </View>
        </View>
        {openTrades.length === 0
          ? <BodyText color={colors.border} size={13}>No open positions</BodyText>
          : openTrades.map(t => {
            const current = priceForSymbol(t.symbol);
            const pnl = computePnl(t, current);
            const up = pnl >= 0;
            return (
              <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <View style={{ flex: 1 }}>
                  <BodyText color={colors.blue} size={13} weight="medium">{t.symbol}</BodyText>
                  <BodyText color={t.direction === 'long' ? colors.green : colors.red} size={11} style={{ marginTop: 2 }}>
                    {t.direction === 'long' ? 'BUY' : 'SELL'} {t.quantity}x @ ${t.entry_price.toFixed(2)}
                  </BodyText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <BodyText color={up ? colors.green : colors.red} size={13}>{up ? '+' : ''}${pnl.toFixed(2)}</BodyText>
                  <PnlIcon pnl={pnl} pct={(pnl / (t.entry_price * t.quantity)) * 100} />
                </View>
                <PixelButton color={colors.red} onPress={() => closePosition(t)} style={{ paddingHorizontal: 8, paddingVertical: 6 }}>CLOSE</PixelButton>
              </View>
            );
          })
        }
      </Card>

      <Card>
        <BodyText color={colors.muted} size={12} weight="medium" style={{ marginBottom: 8 }}>◎ ORDER LOG</BodyText>
        {log.length === 0
          ? <BodyText color={colors.border} size={13}>No trades yet</BodyText>
          : log.map((l, i) => (
            <View key={i} style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <BodyText color={i === 0 ? colors.green : colors.muted} size={12}>{l}</BodyText>
            </View>
          ))
        }
      </Card>
    </ScrollView>
  );
}
