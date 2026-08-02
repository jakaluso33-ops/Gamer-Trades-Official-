import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, PixelText, BodyText } from '../../components/ui';
import { colors } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';
import { listOpenTrades, listClosedTrades, computePnl, DbTrade } from '../../lib/trading';
import { getBasePrice } from '../../lib/symbols';

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function TradeRow({ t, pnl }: { t: DbTrade; pnl: number }) {
  const up = pnl >= 0;
  return (
    <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <BodyText color={colors.blue} size={13} weight="medium">{t.symbol}</BodyText>
        <BodyText color={up ? colors.green : colors.red} size={13} weight="medium">
          {up ? '+' : ''}${pnl.toFixed(2)}
        </BodyText>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
        <BodyText color={colors.muted} size={11}>
          {t.direction === 'long' ? 'BUY' : 'SELL'} {t.quantity}x @ ${t.entry_price.toFixed(2)}
          {t.exit_price != null ? ` → $${t.exit_price.toFixed(2)}` : ''}
        </BodyText>
        <BodyText color={colors.border} size={11}>
          {t.status === 'closed' ? formatDate(t.closed_at) : `OPEN · ${formatDate(t.opened_at)}`}
        </BodyText>
      </View>
    </View>
  );
}

export default function TradeHistoryScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [openTrades, setOpenTrades] = useState<DbTrade[]>([]);
  const [closedTrades, setClosedTrades] = useState<DbTrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([listOpenTrades(user.id), listClosedTrades(user.id, 100)])
      .then(([open, closed]) => {
        setOpenTrades(open);
        setClosedTrades(closed);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const realizedTotal = closedTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <PixelText color={colors.blue} size={13} glow>◈ TRADE HISTORY</PixelText>
        <BodyText color={colors.muted} size={11} onPress={() => router.back()}>◀ BACK</BodyText>
      </View>

      <Card borderColor={realizedTotal >= 0 ? colors.green : colors.red}>
        <BodyText color={colors.muted} size={11}>TOTAL REALIZED P&amp;L</BodyText>
        <PixelText color={realizedTotal >= 0 ? colors.green : colors.red} size={16} glow style={{ marginTop: 6 }}>
          {realizedTotal >= 0 ? '+' : ''}${realizedTotal.toFixed(2)}
        </PixelText>
        <BodyText color={colors.border} size={11} style={{ marginTop: 4 }}>
          From {closedTrades.length} closed trade{closedTrades.length === 1 ? '' : 's'}
        </BodyText>
      </Card>

      {loading ? (
        <BodyText color={colors.muted} size={13}>Loading trade history...</BodyText>
      ) : (
        <>
          <Card>
            <BodyText color={colors.blue} size={12} weight="semibold" glow style={{ marginBottom: 4 }}>
              ◈ OPEN ({openTrades.length})
            </BodyText>
            {openTrades.length === 0 ? (
              <BodyText color={colors.border} size={13} style={{ paddingVertical: 8 }}>No open positions</BodyText>
            ) : openTrades.map(t => (
              <TradeRow key={t.id} t={t} pnl={computePnl(t, getBasePrice(t.symbol) || t.entry_price)} />
            ))}
          </Card>

          <Card>
            <BodyText color={colors.muted} size={12} weight="semibold" style={{ marginBottom: 4 }}>
              ◎ CLOSED ({closedTrades.length})
            </BodyText>
            {closedTrades.length === 0 ? (
              <BodyText color={colors.border} size={13} style={{ paddingVertical: 8 }}>No closed trades yet</BodyText>
            ) : closedTrades.map(t => (
              <TradeRow key={t.id} t={t} pnl={t.pnl ?? 0} />
            ))}
          </Card>
        </>
      )}
    </ScrollView>
  );
}
