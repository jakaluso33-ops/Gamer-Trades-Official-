import { useEffect, useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, PixelText, BodyText } from '../../components/ui';
import { colors } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';
import { listOpenTrades, listClosedTrades, computePnl, DbTrade } from '../../lib/trading';
import { getBasePrice } from '../../lib/symbols';
import { runTradeReviewAgent, TradeReview, TradeVerdict } from '../../lib/tradeReview';
import { SkillLevel } from '../../lib/curriculum';

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

const VERDICT_COLOR: Record<TradeVerdict, string> = {
  good: colors.green,
  mixed: colors.gold,
  bad: colors.red,
};

function TradeRow({ t, pnl, skillLevel }: { t: DbTrade; pnl: number; skillLevel: SkillLevel | null }) {
  const up = pnl >= 0;
  const [expanded, setExpanded] = useState(false);
  const [review, setReview] = useState<TradeReview | null>(null);
  const [loading, setLoading] = useState(false);
  const [errored, setErrored] = useState(false);

  const toggle = () => {
    if (t.status !== 'closed') return;
    setExpanded(prev => !prev);
    if (!review && !loading) {
      setLoading(true);
      setErrored(false);
      runTradeReviewAgent(t, skillLevel)
        .then(setReview)
        .catch(err => {
          console.error('trade-review-agent failed', err);
          setErrored(true);
        })
        .finally(() => setLoading(false));
    }
  };

  return (
    <Pressable onPress={toggle} disabled={t.status !== 'closed'}>
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

        {t.status === 'closed' && (
          <BodyText color={colors.purple} size={10} weight="medium" style={{ marginTop: 6 }}>
            {expanded ? '▲ HIDE AI REVIEW' : '🤖 WHY WAS THIS TRADE GOOD OR BAD? ▶'}
          </BodyText>
        )}

        {expanded && (
          <View style={{ marginTop: 8, padding: 10, backgroundColor: `${colors.purple}0a`, borderWidth: 1, borderColor: `${colors.purple}55` }}>
            {loading && <BodyText color={colors.muted} size={12}>Reviewing this trade...</BodyText>}
            {!loading && errored && (
              <BodyText color={colors.muted} size={12}>Couldn't reach the AI coach just now — try again in a moment.</BodyText>
            )}
            {!loading && !errored && review && (
              <>
                <BodyText color={VERDICT_COLOR[review.verdict]} size={13} weight="semibold" style={{ marginBottom: 6 }}>
                  {review.verdict === 'good' ? '✅' : review.verdict === 'mixed' ? '➖' : '⚠️'} {review.headline}
                </BodyText>
                <BodyText color={colors.green} size={12} style={{ marginBottom: 6 }}>👍 {review.whatWentWell}</BodyText>
                <BodyText color={colors.red} size={12} style={{ marginBottom: 6 }}>👎 {review.whatWentWrong}</BodyText>
                <BodyText color={colors.gold} size={11} weight="medium">💡 {review.lesson}</BodyText>
              </>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function TradeHistoryScreen() {
  const { user, profile, activePortfolio } = useAuth();
  const router = useRouter();
  const [openTrades, setOpenTrades] = useState<DbTrade[]>([]);
  const [closedTrades, setClosedTrades] = useState<DbTrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !activePortfolio) return;
    Promise.all([listOpenTrades(user.id, activePortfolio.id), listClosedTrades(user.id, activePortfolio.id, 100)])
      .then(([open, closed]) => {
        setOpenTrades(open);
        setClosedTrades(closed);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, activePortfolio]);

  const realizedTotal = closedTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <PixelText color={colors.blue} size={13} glow>◈ TRADE HISTORY</PixelText>
        <BodyText color={colors.muted} size={11} onPress={() => router.back()}>◀ BACK</BodyText>
      </View>

      <Pressable onPress={() => router.push('/(tabs)/journal' as never)}>
        <Card borderColor={colors.gold} style={{ padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <PixelText size={20}>📓</PixelText>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <PixelText color={colors.gold} size={11} glow>TRADING JOURNAL</PixelText>
                <BodyText color={colors.gold} size={9} weight="semibold" style={{ borderWidth: 1, borderColor: colors.gold, paddingHorizontal: 5, paddingVertical: 1 }}>LEGEND</BodyText>
              </View>
              <BodyText color={colors.muted} size={11} style={{ marginTop: 4 }}>
                Log the reasoning and emotions behind every trade, then AI-backtest why it hit TP or SL
              </BodyText>
            </View>
            <PixelText color={colors.gold} size={14}>▶</PixelText>
          </View>
        </Card>
      </Pressable>

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
              <TradeRow key={t.id} t={t} pnl={computePnl(t, getBasePrice(t.symbol) || t.entry_price)} skillLevel={profile?.skill_level ?? null} />
            ))}
          </Card>

          <Card>
            <BodyText color={colors.muted} size={12} weight="semibold" style={{ marginBottom: 4 }}>
              ◎ CLOSED ({closedTrades.length})
            </BodyText>
            {closedTrades.length === 0 ? (
              <BodyText color={colors.border} size={13} style={{ paddingVertical: 8 }}>No closed trades yet</BodyText>
            ) : closedTrades.map(t => (
              <TradeRow key={t.id} t={t} pnl={t.pnl ?? 0} skillLevel={profile?.skill_level ?? null} />
            ))}
          </Card>
        </>
      )}
    </ScrollView>
  );
}
