import { useState, useEffect, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, PixelText, PixelButton } from '../../components/ui';
import { colors } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';
import { logEvent } from '../../lib/activity';
import { Candle, DetectorId, StrategySignal, scanStrategies } from '../../lib/strategyEngine';
import { getStrategy } from '../../lib/strategyContent';

const SYMBOLS = ['AAPL', 'TSLA', 'BTC', 'ETH', 'NVDA'];

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
  const [symbol, setSymbol] = useState('AAPL');
  const [qty, setQty] = useState(10);
  const [log, setLog] = useState<{ side: string; symbol: string; qty: number; time: string }[]>([]);
  const [activeStrategies, setActiveStrategies] = useState<DetectorId[]>(SCANNER_STRATEGIES.map(s => s.id));
  const candlesRef = useRef<Candle[]>(generateCandles(60, 182.34));
  const [signals, setSignals] = useState<StrategySignal[]>([]);

  useEffect(() => {
    const id = setInterval(() => {
      const prev = candlesRef.current;
      const last = prev[prev.length - 1];
      const open = last.close;
      const change = (Math.random() - 0.48) * open * 0.008;
      const close = Math.max(1, open + change);
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
    }, 3000);
    return () => clearInterval(id);
  }, [activeStrategies]);

  const place = (side: 'BUY' | 'SELL') => {
    setLog(prev => [{ side, symbol, qty, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
    if (user) logEvent(user.id, 'trade_closed', { symbol, side });
  };

  const latest = signals[0];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      <PixelText color={colors.blue} size={13} glow>◈ TRADE</PixelText>

      <Card borderColor={colors.purple}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <PixelText color={colors.purple} size={7} glow>🧠 LIVE SIGNALS</PixelText>
          <PixelText color={colors.muted} size={5} onPress={() => router.push('/(tabs)/academy' as never)}>LEARN ▶</PixelText>
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
              <PixelText color={color} size={7} glow>{strat?.icon} {strat?.name ?? latest.strategyId} — {latest.label}</PixelText>
              <PixelText color={colors.muted} size={5} style={{ marginTop: 6, lineHeight: 9 }}>{latest.detail}</PixelText>
            </View>
          );
        })() : (
          <PixelText color={colors.muted} size={6}>Scanning the market for setups...</PixelText>
        )}
      </Card>

      <Card>
        <PixelText color={colors.muted} size={6} style={{ marginBottom: 8 }}>SYMBOL</PixelText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {SYMBOLS.map(s => (
            <PixelButton key={s} color={symbol === s ? colors.cyan : colors.muted} onPress={() => setSymbol(s)} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
              {s}
            </PixelButton>
          ))}
        </View>

        <PixelText color={colors.muted} size={6} style={{ marginTop: 16, marginBottom: 8 }}>QUANTITY: {qty}</PixelText>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[1, 10, 25, 50].map(q => (
            <PixelButton key={q} color={qty === q ? colors.gold : colors.muted} onPress={() => setQty(q)} style={{ flex: 1 }}>
              {q}
            </PixelButton>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          <PixelButton color={colors.green} onPress={() => place('BUY')} style={{ flex: 1, paddingVertical: 16 }}>▲ BUY</PixelButton>
          <PixelButton color={colors.red} onPress={() => place('SELL')} style={{ flex: 1, paddingVertical: 16 }}>▼ SELL</PixelButton>
        </View>
      </Card>

      <Card>
        <PixelText color={colors.muted} size={6} style={{ marginBottom: 8 }}>◎ ORDER LOG</PixelText>
        {log.length === 0
          ? <PixelText color={colors.border} size={6}>No trades yet</PixelText>
          : log.map((l, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <PixelText color={colors.muted} size={5}>{l.time}</PixelText>
              <PixelText color={l.side === 'BUY' ? colors.green : colors.red} size={6}>{l.side}</PixelText>
              <PixelText color={colors.text} size={6}>{l.qty}x {l.symbol}</PixelText>
            </View>
          ))
        }
      </Card>
    </ScrollView>
  );
}
