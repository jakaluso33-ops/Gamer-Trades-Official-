import { ScrollView, View } from 'react-native';
import { Card, PixelText } from '../../components/ui';
import { colors } from '../../lib/theme';

const HOLDINGS = [
  { symbol: 'AAPL', qty: 50, value: 9117.0, pnl: 107.0, pct: 1.19 },
  { symbol: 'TSLA', qty: 20, value: 4913.4, pnl: 64.6, pct: 1.3 },
  { symbol: 'BTC', qty: 0.5, value: 33710.0, pnl: 660.0, pct: 2.0 },
  { symbol: 'NVDA', qty: 15, value: 13128.0, pnl: -72.0, pct: -0.55 },
];

export default function PortfolioScreen() {
  const totalValue = HOLDINGS.reduce((s, h) => s + h.value, 0);
  const totalPnl = HOLDINGS.reduce((s, h) => s + h.pnl, 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      <PixelText color={colors.blue} size={13} glow>◉ PORTFOLIO</PixelText>

      <Card borderColor={colors.green}>
        <PixelText color={colors.muted} size={6}>TOTAL VALUE</PixelText>
        <PixelText color={colors.green} size={16} glow style={{ marginTop: 6 }}>${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</PixelText>
        <PixelText color={totalPnl >= 0 ? colors.green : colors.red} size={7} style={{ marginTop: 6 }}>
          {totalPnl >= 0 ? '▲' : '▼'} {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
        </PixelText>
      </Card>

      <Card>
        <PixelText color={colors.blue} size={7} glow style={{ marginBottom: 10 }}>HOLDINGS</PixelText>
        {HOLDINGS.map(h => (
          <View key={h.symbol} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View>
              <PixelText color={colors.blue} size={7}>{h.symbol}</PixelText>
              <PixelText color={colors.muted} size={5} style={{ marginTop: 3 }}>{h.qty} units</PixelText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <PixelText color={colors.text} size={7}>${h.value.toLocaleString()}</PixelText>
              <PixelText color={h.pnl >= 0 ? colors.green : colors.red} size={5} style={{ marginTop: 3 }}>
                {h.pnl >= 0 ? '+' : ''}{h.pct.toFixed(2)}%
              </PixelText>
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}
