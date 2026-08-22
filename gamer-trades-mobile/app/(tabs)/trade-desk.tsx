import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ScrollView, View, Modal, Pressable, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card, PixelText, BodyText, PixelButton } from '../../components/ui';
import { colors } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';
import { Candle, DetectorId, StrategySignal, scanStrategies, computeTradePlan } from '../../lib/strategyEngine';
import { getStrategy } from '../../lib/strategyContent';
import {
  listOpenTrades,
  listPendingOrders,
  placeOrder,
  placePendingOrder,
  cancelPendingOrder,
  shouldFillPendingOrder,
  fillPendingOrder,
  checkStopTakeProfit,
  closeTrade,
  computePnl,
  DbTrade,
  TradeOrderType,
  InsufficientFundsError,
} from '../../lib/trading';
import { ALL_SYMBOLS, SYMBOLS_BY_CLASS, ASSET_CLASS_LABEL, ASSET_CLASS_COLOR, ASSET_CLASS_ICON, SYMBOL_ICON, AssetClass, SymbolInfo } from '../../lib/symbols';
import { pollLiveQuotes } from '../../lib/marketData';
import CandlestickChart, { Timeframe } from '../../components/CandlestickChart';
import StrategyIcon from '../../components/StrategyIcon';
import AiPatternInsight from '../../components/AiPatternInsight';
import MarketReadCard from '../../components/MarketReadCard';
import CryptoHistoryCard from '../../components/CryptoHistoryCard';
import PnlIcon from '../../components/PnlIcon';
import PortfolioSwitcher from '../../components/PortfolioSwitcher';

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

/** Bigger steps at higher quantities so the stepper stays fast to use across a wide range. */
function stepFor(qty: number): number {
  if (qty >= 100) return 10;
  if (qty >= 10) return 5;
  return 1;
}

/** A price nudge sized to the instrument's own price level and decimal precision. */
function priceStepFor(price: number, decimals: number): number {
  const raw = price * 0.002;
  return parseFloat(Math.max(raw, Math.pow(10, -decimals)).toFixed(decimals + 2));
}

const ORDER_TYPES: TradeOrderType[] = ['market', 'limit', 'stop'];

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

export default function TradeDeskScreen() {
  const { user, profile, activePortfolio: portfolio, applyPortfolioPatch } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ symbol?: string; focusStrategy?: string }>();
  const initialSymbol = ALL_SYMBOLS.find(s => s.symbol === params.symbol) ?? ALL_SYMBOLS[0];
  const initialFocus = SCANNER_STRATEGIES.find(s => s.id === params.focusStrategy)?.id ?? null;
  const [classTab, setClassTab] = useState<AssetClass>(initialSymbol.class);
  const [selected, setSelected] = useState<SymbolInfo>(initialSymbol);
  const [qty, setQty] = useState(10);
  const [livePrice, setLivePrice] = useState(initialSymbol.basePrice);
  const [openTrades, setOpenTrades] = useState<DbTrade[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [activeStrategies, setActiveStrategies] = useState<DetectorId[]>(
    initialFocus ? [initialFocus] : SCANNER_STRATEGIES.map(s => s.id)
  );
  const [timeframe, setTimeframe] = useState<Timeframe>('1m');
  const candlesRef = useRef<Candle[]>(generateCandles(60, initialSymbol.basePrice));
  const [signals, setSignals] = useState<StrategySignal[]>([]);
  const [changes, setChanges] = useState<Record<string, number>>({});
  const [chartFullscreen, setChartFullscreen] = useState(false);
  const [orderType, setOrderType] = useState<TradeOrderType>('market');
  const [triggerPrice, setTriggerPrice] = useState<number | null>(null);
  const [stopLossPrice, setStopLossPrice] = useState<number | null>(null);
  const [takeProfitPrice, setTakeProfitPrice] = useState<number | null>(null);
  const [editingLevel, setEditingLevel] = useState<'stop' | 'profit' | null>(null);
  const [pendingOrders, setPendingOrders] = useState<DbTrade[]>([]);
  const livePriceRef = useRef(livePrice);
  useEffect(() => { livePriceRef.current = livePrice; }, [livePrice]);

  // A new symbol may arrive via navigation params while this screen is still mounted
  // (tapping another market in the Trading Arena without leaving the tab stack).
  useEffect(() => {
    if (params.symbol) {
      const s = ALL_SYMBOLS.find(x => x.symbol === params.symbol);
      if (s && s.symbol !== selected.symbol) {
        setSelected(s);
        setClassTab(s.class);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.symbol]);

  // A "VIEW LIVE ON CHART" link from a lesson narrows the scanner to just that concept.
  useEffect(() => {
    const focus = SCANNER_STRATEGIES.find(s => s.id === params.focusStrategy)?.id;
    if (focus) setActiveStrategies([focus]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.focusStrategy]);

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
    if (!user || !portfolio) return;
    listOpenTrades(user.id, portfolio.id).then(setOpenTrades).catch(console.error);
    listPendingOrders(user.id, portfolio.id).then(setPendingOrders).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, portfolio?.id]);

  useEffect(() => {
    setLivePrice(selected.basePrice);
  }, [selected]);

  // Reset the chart when switching instruments — otherwise the old symbol's
  // candle history sticks around and the chart appears frozen.
  useEffect(() => {
    candlesRef.current = generateCandles(60, selected.basePrice);
    setSignals([]);
  }, [selected]);

  // Order builder state is per-instrument — switching symbols clears it rather than
  // carrying a trigger price or SL/TP level over to a market it doesn't apply to.
  useEffect(() => {
    setOrderType('market');
    setTriggerPrice(null);
    setStopLossPrice(null);
    setTakeProfitPrice(null);
    setEditingLevel(null);
  }, [selected.symbol]);

  // Default the trigger price to the current live price the moment the user switches
  // into a limit/stop order, so they're nudging from a sensible starting point.
  useEffect(() => {
    if (orderType === 'market') {
      setTriggerPrice(null);
    } else {
      setTriggerPrice(p => p ?? livePrice);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderType]);

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

  // Watches the currently-selected symbol's live price for two things a real trading
  // platform automates: filling a resting limit/stop order once price crosses its trigger,
  // and closing an open position the moment its stop-loss or take-profit is touched.
  // Deliberately keyed only on [livePrice, selected.symbol] — portfolio/openTrades/pendingOrders
  // are read fresh from the closure each time this fires, which is fine since livePrice ticks
  // every few seconds regardless of whether those other values just changed.
  useEffect(() => {
    if (!user || !portfolio) return;
    const pendingForSymbol = pendingOrders.filter(o => o.symbol === selected.symbol);
    const openWithLevels = openTrades.filter(t => t.symbol === selected.symbol && (t.stop_loss != null || t.take_profit != null));
    if (pendingForSymbol.length === 0 && openWithLevels.length === 0) return;

    let cash = portfolio.cash_balance;
    (async () => {
      for (const order of pendingForSymbol) {
        if (!shouldFillPendingOrder(order, livePrice)) continue;
        try {
          const result = await fillPendingOrder(user.id, { ...portfolio, cash_balance: cash }, order, livePrice);
          cash = result.portfolio.cash_balance;
          applyPortfolioPatch(result.portfolio);
          setPendingOrders(prev => prev.filter(o => o.id !== order.id));
          if (result.filled) {
            setOpenTrades(prev => [result.trade, ...prev]);
            setLog(prev => [`${order.order_type.toUpperCase()} FILLED: ${order.direction === 'long' ? 'BUY' : 'SELL'} ${order.quantity}x ${order.symbol} @ $${livePrice.toFixed(2)}`, ...prev.slice(0, 9)]);
          } else {
            setLog(prev => [`ORDER CANCELLED (insufficient funds): ${order.symbol}`, ...prev.slice(0, 9)]);
          }
        } catch (err) {
          console.error(err);
        }
      }
      for (const trade of openWithLevels) {
        const hit = checkStopTakeProfit(trade, livePrice);
        if (!hit) continue;
        try {
          const { pnl } = await closeTrade(user.id, trade, hit.price);
          setOpenTrades(prev => prev.filter(t => t.id !== trade.id));
          cash = cash + trade.quantity * trade.entry_price + pnl;
          applyPortfolioPatch({ ...portfolio, cash_balance: cash });
          setLog(prev => [
            `${hit.reason === 'stop_loss' ? '⛔ STOP LOSS' : '✓ TAKE PROFIT'} HIT: ${trade.symbol} @ $${hit.price.toFixed(2)} (${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)})`,
            ...prev.slice(0, 9),
          ]);
        } catch (err) {
          console.error(err);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livePrice, selected.symbol]);

  const priceForSymbol = useCallback(
    (sym: string) => (sym === selected.symbol ? livePrice : ALL_SYMBOLS.find(s => s.symbol === sym)?.basePrice ?? livePrice),
    [selected.symbol, livePrice]
  );

  const place = async (side: 'BUY' | 'SELL') => {
    if (!user || !portfolio) return;
    setOrderError(null);
    const direction = side === 'BUY' ? 'long' : 'short';

    if (orderType !== 'market') {
      if (triggerPrice == null) return;
      try {
        const order = await placePendingOrder(user.id, portfolio, {
          symbol: selected.symbol,
          direction,
          orderType,
          quantity: qty,
          triggerPrice,
          stopLoss: stopLossPrice,
          takeProfit: takeProfitPrice,
        });
        setPendingOrders(prev => [order, ...prev]);
        setLog(prev => [`${orderType.toUpperCase()} ${side} ${qty}x ${selected.symbol} @ $${triggerPrice.toFixed(selected.decimals)} (pending)`, ...prev.slice(0, 9)]);
      } catch (err) {
        setOrderError('Could not place order.');
      }
      return;
    }

    try {
      const result = await placeOrder(user.id, portfolio, openTrades, {
        symbol: selected.symbol,
        direction,
        orderType: 'market',
        quantity: qty,
        entryPrice: livePrice,
        stopLoss: stopLossPrice,
        takeProfit: takeProfitPrice,
      });

      applyPortfolioPatch(result.portfolio);
      setOpenTrades(prev => {
        const closedIds = new Set(result.closedTrades.map(t => t.id));
        const updatedById = new Map(result.updatedTrades.map(t => [t.id, t]));
        let next = prev.filter(t => !closedIds.has(t.id)).map(t => updatedById.get(t.id) ?? t);
        if (result.openedTrade) next = [result.openedTrade, ...next];
        return next;
      });

      const lines: string[] = [];
      for (const t of result.closedTrades) {
        const pnl = t.pnl ?? 0;
        lines.push(`CLOSED ${t.quantity}x ${t.symbol} @ $${(t.exit_price ?? 0).toFixed(2)} (${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)})`);
      }
      if (result.openedTrade) {
        lines.push(`${side} ${result.openedTrade.quantity}x ${selected.symbol} @ $${result.openedTrade.entry_price.toFixed(2)}`);
      }
      setLog(prev => [...lines.reverse(), ...prev].slice(0, 10));
    } catch (err) {
      setOrderError(err instanceof InsufficientFundsError ? err.message : 'Could not place order.');
    }
  };

  const cancelPending = async (order: DbTrade) => {
    try {
      await cancelPendingOrder(order.id);
      setPendingOrders(prev => prev.filter(o => o.id !== order.id));
      setLog(prev => [`CANCELLED ${order.order_type.toUpperCase()} ${order.direction === 'long' ? 'BUY' : 'SELL'} ${order.quantity}x ${order.symbol}`, ...prev.slice(0, 9)]);
    } catch (err) {
      console.error(err);
    }
  };

  const closePosition = async (t: DbTrade) => {
    if (!user || !portfolio) return;
    try {
      const exitPrice = priceForSymbol(t.symbol);
      const { pnl } = await closeTrade(user.id, t, exitPrice);
      setOpenTrades(prev => prev.filter(x => x.id !== t.id));
      applyPortfolioPatch({ ...portfolio, cash_balance: portfolio.cash_balance + t.quantity * t.entry_price + pnl });
      setLog(prev => [`CLOSED ${t.symbol} @ $${exitPrice.toFixed(2)} (${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)})`, ...prev.slice(0, 9)]);
    } catch (err) {
      console.error(err);
    }
  };

  const latest = signals[0];
  const tradePlan = useMemo(() => (latest ? computeTradePlan(latest, candlesRef.current) : null), [latest]);
  const totalPnl = openTrades.reduce((sum, t) => sum + computePnl(t, priceForSymbol(t.symbol)), 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <PixelText color={colors.blue} size={13} glow>◈ TRADE DESK</PixelText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <PortfolioSwitcher />
          <BodyText color={colors.muted} size={11} onPress={() => router.push('/(tabs)/trade' as never)}>◀ ARENA</BodyText>
        </View>
      </View>

      <Card borderColor={colors.purple}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <BodyText color={colors.purple} size={12} weight="semibold" glow>🧠 LIVE SIGNALS</BodyText>
          <BodyText color={colors.muted} size={11} onPress={() => router.push('/(tabs)/academy' as never)}>LEARN ▶</BodyText>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {SCANNER_STRATEGIES.map(s => {
            const on = activeStrategies.includes(s.id);
            const color = on ? colors.purple : colors.muted;
            return (
              <Pressable
                key={s.id}
                onPress={() => setActiveStrategies(prev => on ? prev.filter(x => x !== s.id) : [...prev, s.id])}
                style={{
                  flexBasis: '31%',
                  flexGrow: 1,
                  alignItems: 'center',
                  gap: 4,
                  paddingVertical: 8,
                  paddingHorizontal: 4,
                  borderWidth: 2,
                  borderColor: color,
                  backgroundColor: `${color}1a`,
                }}
              >
                <StrategyIcon id={s.id} color={color} size={20} />
                <PixelText color={color} size={7} glow>{s.label}</PixelText>
              </Pressable>
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
        <View style={{ marginTop: 10 }}>
          <AiPatternInsight symbol={selected.symbol} signal={latest ?? null} tradePlan={tradePlan} skillLevel={profile?.skill_level ?? null} />
        </View>
      </Card>

      <MarketReadCard symbol={selected.symbol} candles={candlesRef.current} skillLevel={profile?.skill_level ?? null} />

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
        <View style={{ position: 'relative' }}>
          <Pressable onPress={() => { if (!editingLevel) setChartFullscreen(true); }}>
            <CandlestickChart
              symbol={selected.symbol}
              basePrice={selected.basePrice}
              livePrice={livePrice}
              timeframe={timeframe}
              height={200}
              positions={openTrades
                .filter(t => t.symbol === selected.symbol)
                .map(t => ({ entryPrice: t.entry_price, direction: t.direction, quantity: t.quantity }))}
              signal={latest}
              tradePlan={tradePlan}
              stopLoss={stopLossPrice}
              takeProfit={takeProfitPrice}
              editingLevel={editingLevel}
              onChangeStopLoss={setStopLossPrice}
              onChangeTakeProfit={setTakeProfitPrice}
            />
          </Pressable>
          {/* Quick buy/sell right on the chart itself — uses whatever order type/qty/SL-TP is currently set below */}
          <View style={{ position: 'absolute', right: 6, top: 30, flexDirection: 'row', gap: 6 }}>
            <PixelButton color={colors.green} onPress={() => place('BUY')} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>▲ BUY</PixelButton>
            <PixelButton color={colors.red} onPress={() => place('SELL')} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>▼ SELL</PixelButton>
          </View>
        </View>
        <BodyText color={colors.border} size={10} style={{ textAlign: 'center', marginTop: 4 }}>
          {editingLevel ? 'TAP DONE BELOW WHEN FINISHED PLACING YOUR LEVEL' : 'TAP CHART TO EXPAND ⤢'}
        </BodyText>
        {orderError && (
          <View style={{ marginTop: 10, padding: 8, backgroundColor: '#ff335511', borderWidth: 1, borderColor: '#ff335544' }}>
            <BodyText color={colors.red} size={12}>⚠ {orderError}</BodyText>
          </View>
        )}

        <BodyText color={colors.muted} size={11} style={{ marginTop: 12, marginBottom: 6 }}>ORDER TYPE</BodyText>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {ORDER_TYPES.map(ot => (
            <PixelButton key={ot} color={orderType === ot ? colors.gold : colors.muted} onPress={() => setOrderType(ot)} style={{ flex: 1, paddingVertical: 8 }}>
              {ot.toUpperCase()}
            </PixelButton>
          ))}
        </View>
        {orderType !== 'market' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 }}>
            <BodyText color={colors.muted} size={11}>{orderType.toUpperCase()} PRICE</BodyText>
            <PixelButton
              color={colors.muted}
              onPress={() => setTriggerPrice(p => Math.max(0.01, (p ?? livePrice) - priceStepFor(livePrice, selected.decimals)))}
              style={{ paddingHorizontal: 12, paddingVertical: 6 }}
            >
              −
            </PixelButton>
            <BodyText color={colors.text} size={13} weight="semibold">${(triggerPrice ?? livePrice).toFixed(selected.decimals)}</BodyText>
            <PixelButton
              color={colors.muted}
              onPress={() => setTriggerPrice(p => (p ?? livePrice) + priceStepFor(livePrice, selected.decimals))}
              style={{ paddingHorizontal: 12, paddingVertical: 6 }}
            >
              +
            </PixelButton>
          </View>
        )}

        <BodyText color={colors.muted} size={11} style={{ marginTop: 12, marginBottom: 6 }}>STOP LOSS / TAKE PROFIT — tap to set on the chart</BodyText>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <PixelButton
            color={editingLevel === 'stop' ? colors.red : colors.muted}
            onPress={() => setEditingLevel(prev => (prev === 'stop' ? null : 'stop'))}
            style={{ flex: 1, paddingVertical: 8 }}
          >
            {stopLossPrice != null ? `SL $${stopLossPrice.toFixed(selected.decimals)}` : editingLevel === 'stop' ? 'TAP CHART...' : '+ STOP LOSS'}
          </PixelButton>
          {stopLossPrice != null && (
            <PixelButton
              color={colors.red}
              onPress={() => { setStopLossPrice(null); if (editingLevel === 'stop') setEditingLevel(null); }}
              style={{ paddingHorizontal: 10, paddingVertical: 8 }}
            >
              ✕
            </PixelButton>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
          <PixelButton
            color={editingLevel === 'profit' ? colors.green : colors.muted}
            onPress={() => setEditingLevel(prev => (prev === 'profit' ? null : 'profit'))}
            style={{ flex: 1, paddingVertical: 8 }}
          >
            {takeProfitPrice != null ? `TP $${takeProfitPrice.toFixed(selected.decimals)}` : editingLevel === 'profit' ? 'TAP CHART...' : '+ TAKE PROFIT'}
          </PixelButton>
          {takeProfitPrice != null && (
            <PixelButton
              color={colors.green}
              onPress={() => { setTakeProfitPrice(null); if (editingLevel === 'profit') setEditingLevel(null); }}
              style={{ paddingHorizontal: 10, paddingVertical: 8 }}
            >
              ✕
            </PixelButton>
          )}
        </View>
        {editingLevel && (
          <PixelButton color={colors.blue} onPress={() => setEditingLevel(null)} style={{ marginTop: 8, paddingVertical: 10 }}>
            ✓ DONE PLACING LEVEL
          </PixelButton>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12 }}>
          <PixelButton color={colors.muted} onPress={() => setQty(q => Math.max(1, q - stepFor(q)))} style={{ paddingHorizontal: 14, paddingVertical: 8 }}>−</PixelButton>
          <BodyText color={colors.text} size={15} weight="semibold">QTY: {qty}</BodyText>
          <PixelButton color={colors.muted} onPress={() => setQty(q => q + stepFor(q))} style={{ paddingHorizontal: 14, paddingVertical: 8 }}>+</PixelButton>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <PixelButton color={colors.green} onPress={() => place('BUY')} style={{ flex: 1, paddingVertical: 16 }}>
            {orderType === 'market' ? `▲ BUY ${qty}` : `▲ ${orderType.toUpperCase()} BUY ${qty}`}
          </PixelButton>
          <PixelButton color={colors.red} onPress={() => place('SELL')} style={{ flex: 1, paddingVertical: 16 }}>
            {orderType === 'market' ? `▼ SELL ${qty}` : `▼ ${orderType.toUpperCase()} SELL ${qty}`}
          </PixelButton>
        </View>
      </Card>

      {pendingOrders.length > 0 && (
        <Card borderColor={colors.gold}>
          <BodyText color={colors.gold} size={12} weight="semibold" glow style={{ marginBottom: 8 }}>◷ PENDING ORDERS</BodyText>
          {pendingOrders.map(o => (
            <View key={o.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flex: 1 }}>
                <BodyText color={colors.gold} size={13} weight="medium">{o.symbol}</BodyText>
                <BodyText color={o.direction === 'long' ? colors.green : colors.red} size={11} style={{ marginTop: 2 }}>
                  {o.order_type.toUpperCase()} {o.direction === 'long' ? 'BUY' : 'SELL'} {o.quantity}x @ ${o.entry_price.toFixed(2)}
                </BodyText>
              </View>
              <PixelButton color={colors.muted} onPress={() => cancelPending(o)} style={{ paddingHorizontal: 8, paddingVertical: 6 }}>CANCEL</PixelButton>
            </View>
          ))}
        </Card>
      )}

      <CryptoHistoryCard symbol={selected.symbol} />

      <Modal visible={chartFullscreen} animationType="slide" onRequestClose={() => setChartFullscreen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <ScrollView
            contentContainerStyle={{ paddingTop: 50, paddingHorizontal: 12, paddingBottom: 24, flexGrow: 1 }}
            style={{ flex: 1 }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <PixelText color={colors.cyan} size={13} glow>{selected.symbol}</PixelText>
              <PixelButton color={colors.muted} onPress={() => setChartFullscreen(false)} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
                ✕ CLOSE
              </PixelButton>
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
            <CandlestickChart
              symbol={selected.symbol}
              basePrice={selected.basePrice}
              livePrice={livePrice}
              timeframe={timeframe}
              height={Dimensions.get('window').height - 380}
              positions={openTrades
                .filter(t => t.symbol === selected.symbol)
                .map(t => ({ entryPrice: t.entry_price, direction: t.direction, quantity: t.quantity }))}
              signal={latest}
              tradePlan={tradePlan}
              stopLoss={stopLossPrice}
              takeProfit={takeProfitPrice}
              editingLevel={editingLevel}
              onChangeStopLoss={setStopLossPrice}
              onChangeTakeProfit={setTakeProfitPrice}
            />
            {orderError && (
              <View style={{ marginTop: 10, padding: 8, backgroundColor: '#ff335511', borderWidth: 1, borderColor: '#ff335544' }}>
                <BodyText color={colors.red} size={12}>⚠ {orderError}</BodyText>
              </View>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 }}>
              <PixelButton color={colors.muted} onPress={() => setQty(q => Math.max(1, q - stepFor(q)))} style={{ paddingHorizontal: 14, paddingVertical: 8 }}>−</PixelButton>
              <BodyText color={colors.text} size={15} weight="semibold">QTY: {qty}</BodyText>
              <PixelButton color={colors.muted} onPress={() => setQty(q => q + stepFor(q))} style={{ paddingHorizontal: 14, paddingVertical: 8 }}>+</PixelButton>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <PixelButton color={colors.green} onPress={() => place('BUY')} style={{ flex: 1, paddingVertical: 16 }}>
                {orderType === 'market' ? `▲ BUY ${qty}` : `▲ ${orderType.toUpperCase()} BUY ${qty}`}
              </PixelButton>
              <PixelButton color={colors.red} onPress={() => place('SELL')} style={{ flex: 1, paddingVertical: 16 }}>
                {orderType === 'market' ? `▼ SELL ${qty}` : `▼ ${orderType.toUpperCase()} SELL ${qty}`}
              </PixelButton>
            </View>
          </ScrollView>
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
                  <BodyText size={14}>{SYMBOL_ICON[s.symbol] ?? ASSET_CLASS_ICON[classTab]}</BodyText>
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

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
          <BodyText color={colors.muted} size={11}>CASH</BodyText>
          <BodyText color={colors.text} size={12}>${(portfolio?.cash_balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</BodyText>
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
