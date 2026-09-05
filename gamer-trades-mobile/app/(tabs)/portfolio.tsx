import { useState, useEffect } from 'react';
import { ScrollView, View, Modal, TextInput, Pressable } from 'react-native';
import { Card, PixelText, BodyText, PixelButton } from '../../components/ui';
import { colors } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';
import { listOpenTrades, computePnl, depositFunds, DbTrade } from '../../lib/trading';
import { getBasePrice } from '../../lib/symbols';
import PnlIcon from '../../components/PnlIcon';
import PortfolioSwitcher from '../../components/PortfolioSwitcher';

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
  const { user, activePortfolio: portfolio, portfoliosLoading, applyPortfolioPatch } = useAuth();
  const [openTrades, setOpenTrades] = useState<DbTrade[]>([]);
  const [tradesLoading, setTradesLoading] = useState(true);
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositBusy, setDepositBusy] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !portfolio) return;
    setTradesLoading(true);
    listOpenTrades(user.id, portfolio.id)
      .then(setOpenTrades)
      .catch(console.error)
      .finally(() => setTradesLoading(false));
  }, [user, portfolio]);

  const loading = portfoliosLoading || tradesLoading;

  const handleDeposit = async () => {
    if (!user || !portfolio) return;
    const amount = parseFloat(depositAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setDepositError('Enter an amount greater than $0');
      return;
    }
    setDepositBusy(true);
    setDepositError(null);
    try {
      const updated = await depositFunds(user.id, portfolio, amount);
      applyPortfolioPatch(updated);
      setShowDeposit(false);
      setDepositAmount('');
    } catch (err) {
      setDepositError(err instanceof Error ? err.message : 'Could not deposit funds');
    } finally {
      setDepositBusy(false);
    }
  };

  const holdings = aggregateHoldings(openTrades);
  const holdingsValue = holdings.reduce((s, h) => s + h.current * h.qty, 0);
  const cashBalance = portfolio?.cash_balance ?? 0;
  const totalValue = holdingsValue + cashBalance;
  const unrealizedPnl = openTrades.reduce((s, t) => s + computePnl(t, getBasePrice(t.symbol) || t.entry_price), 0);

  if (loading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <BodyText color={colors.muted} size={13}>Loading portfolio...</BodyText>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <PixelText color={colors.blue} size={13} glow>◉ PORTFOLIO</PixelText>
        <PortfolioSwitcher />
      </View>

      <Card borderColor={colors.green}>
        <BodyText color={colors.muted} size={11}>TOTAL VALUE</BodyText>
        <PixelText color={colors.green} size={16} glow style={{ marginTop: 6 }}>
          ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </PixelText>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <BodyText color={unrealizedPnl >= 0 ? colors.green : colors.red} size={13} weight="medium">
            {unrealizedPnl >= 0 ? '▲' : '▼'} {unrealizedPnl >= 0 ? '+' : ''}${unrealizedPnl.toFixed(2)} unrealized
          </BodyText>
          <PnlIcon pnl={unrealizedPnl} />
        </View>
        <BodyText color={colors.muted} size={11} style={{ marginTop: 6 }}>
          CASH: ${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </BodyText>
        <PixelButton color={colors.green} onPress={() => setShowDeposit(true)} style={{ marginTop: 10 }}>
          + ADD FUNDS
        </PixelButton>
      </Card>

      <Modal visible={showDeposit} transparent animationType="fade" onRequestClose={() => !depositBusy && setShowDeposit(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onPress={() => !depositBusy && setShowDeposit(false)}
        >
          <Pressable onPress={e => e.stopPropagation()} style={{ width: '100%' }}>
            <Card borderColor={colors.green} style={{ padding: 24 }}>
              <PixelText color={colors.green} size={12} glow style={{ textAlign: 'center', marginBottom: 14 }}>
                💰 ADD FUNDS
              </PixelText>
              <BodyText color={colors.muted} size={12} style={{ textAlign: 'center', marginBottom: 14 }}>
                Top up your paper-trading balance with any amount. This is simulated money — no real charge.
              </BodyText>
              <TextInput
                keyboardType="decimal-pad"
                placeholder="Amount (USD)"
                placeholderTextColor={colors.muted}
                value={depositAmount}
                onChangeText={t => { setDepositAmount(t); setDepositError(null); }}
                style={{
                  fontSize: 15, padding: 12, backgroundColor: colors.bg, color: colors.text,
                  borderWidth: 2, borderColor: colors.border, marginBottom: 10,
                }}
              />
              {depositError && (
                <BodyText color={colors.red} size={11} style={{ textAlign: 'center', marginBottom: 10 }}>
                  ⚠ {depositError}
                </BodyText>
              )}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <PixelButton color={colors.muted} disabled={depositBusy} onPress={() => setShowDeposit(false)} style={{ flex: 1 }}>
                  CANCEL
                </PixelButton>
                <PixelButton color={colors.green} disabled={depositBusy} onPress={handleDeposit} style={{ flex: 1 }}>
                  {depositBusy ? '...' : 'CONFIRM'}
                </PixelButton>
              </View>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>

      <Card>
        <BodyText color={colors.blue} size={12} weight="semibold" glow style={{ marginBottom: 10 }}>HOLDINGS</BodyText>
        {holdings.length === 0 ? (
          <BodyText color={colors.border} size={13}>No open positions</BodyText>
        ) : holdings.map(h => {
          const pnl = (h.current - h.avgCost) * h.qty;
          const pct = h.avgCost > 0 ? ((h.current - h.avgCost) / h.avgCost) * 100 : 0;
          return (
            <View key={h.symbol} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View>
                <BodyText color={colors.blue} size={13} weight="medium">{h.symbol}</BodyText>
                <BodyText color={colors.muted} size={11} style={{ marginTop: 3 }}>{h.qty} units</BodyText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <BodyText color={colors.text} size={13}>${(h.current * h.qty).toLocaleString()}</BodyText>
                <BodyText color={pnl >= 0 ? colors.green : colors.red} size={11} style={{ marginTop: 3 }}>
                  {pnl >= 0 ? '+' : ''}{pct.toFixed(2)}%
                </BodyText>
              </View>
            </View>
          );
        })}
      </Card>
    </ScrollView>
  );
}
