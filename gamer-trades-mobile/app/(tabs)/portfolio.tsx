import { useState, useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, PixelText } from '../../components/ui';
import { colors } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';
import { getPortfolio, listOpenTrades, computePnl, Portfolio, DbTrade } from '../../lib/trading';
import { getBasePrice } from '../../lib/symbols';

interface Holding {
  symbol: string;
  qty: number;
  avgCost: number;
  current: number;
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
  }));
}

export default function PortfolioScreen() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [openTrades, setOpenTrades] = useState<DbTrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([getPortfolio(user.id), listOpenTrades(user.id)])
      .then(([p, open]) => {
        setPortfolio(p);
        setOpenTrades(open);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const holdings = aggregateHoldings(openTrades);
  const holdingsValue = holdings.reduce((s, h) => s + h.current * h.qty, 0);
  const cashBalance = portfolio?.cash_balance ?? 0;
  const totalValue = holdingsValue + cashBalance;
  const unrealizedPnl = openTrades.reduce((s, t) => s + computePnl(t, getBasePrice(t.symbol) || t.entry_price), 0);

  if (loading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }}>
        <PixelText color={colors.muted} size={6}>Loading portfolio...</PixelText>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      <PixelText color={colors.blue} size={13} glow>◉ PORTFOLIO</PixelText>

      <Card borderColor={colors.green}>
        <PixelText color={colors.muted} size={6}>TOTAL VALUE</PixelText>
        <PixelText color={colors.green} size={16} glow style={{ marginTop: 6 }}>
          ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </PixelText>
        <PixelText color={unrealizedPnl >= 0 ? colors.green : colors.red} size={7} style={{ marginTop: 6 }}>
          {unrealizedPnl >= 0 ? '▲' : '▼'} {unrealizedPnl >= 0 ? '+' : ''}${unrealizedPnl.toFixed(2)} unrealized
        </PixelText>
        <PixelText color={colors.muted} size={5} style={{ marginTop: 6 }}>
          CASH: ${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </PixelText>
      </Card>

      <Card>
        <PixelText color={colors.blue} size={7} glow style={{ marginBottom: 10 }}>HOLDINGS</PixelText>
        {holdings.length === 0 ? (
          <PixelText color={colors.border} size={6}>No open positions</PixelText>
        ) : holdings.map(h => {
          const pnl = (h.current - h.avgCost) * h.qty;
          const pct = h.avgCost > 0 ? ((h.current - h.avgCost) / h.avgCost) * 100 : 0;
          return (
            <View key={h.symbol} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View>
                <PixelText color={colors.blue} size={7}>{h.symbol}</PixelText>
                <PixelText color={colors.muted} size={5} style={{ marginTop: 3 }}>{h.qty} units</PixelText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <PixelText color={colors.text} size={7}>${(h.current * h.qty).toLocaleString()}</PixelText>
                <PixelText color={pnl >= 0 ? colors.green : colors.red} size={5} style={{ marginTop: 3 }}>
                  {pnl >= 0 ? '+' : ''}{pct.toFixed(2)}%
                </PixelText>
              </View>
            </View>
          );
        })}
      </Card>
    </ScrollView>
  );
}
