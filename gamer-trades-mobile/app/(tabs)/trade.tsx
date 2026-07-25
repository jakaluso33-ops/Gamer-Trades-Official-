import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, PixelText, PixelButton } from '../../components/ui';
import { colors } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';
import { logEvent } from '../../lib/activity';

const SYMBOLS = ['AAPL', 'TSLA', 'BTC', 'ETH', 'NVDA'];

export default function TradeScreen() {
  const { user } = useAuth();
  const [symbol, setSymbol] = useState('AAPL');
  const [qty, setQty] = useState(10);
  const [log, setLog] = useState<{ side: string; symbol: string; qty: number; time: string }[]>([]);

  const place = (side: 'BUY' | 'SELL') => {
    setLog(prev => [{ side, symbol, qty, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
    if (user) logEvent(user.id, 'trade_closed', { symbol, side });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      <PixelText color={colors.blue} size={13} glow>◈ TRADE</PixelText>

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
