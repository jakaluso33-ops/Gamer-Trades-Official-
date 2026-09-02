import { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { Card, PixelText, BodyText, PixelButton } from './ui';
import { colors } from '../lib/theme';
import {
  runMarketAgent,
  MarketAgentResult,
  VERDICT_COLOR,
  VERDICT_LABEL,
  SENTIMENT_COLOR,
} from '../lib/marketAgent';
import { useAuth } from '../lib/AuthContext';
import { aiAnalystDailyLimit, getAiAnalystRunsToday, incrementAiAnalystRunsToday, PLANS, Plan } from '../lib/plans';
import { startCheckout } from '../lib/checkout';

const PRO_PRICE_ID = PLANS.find(p => p.name === 'pro')?.priceId;

export default function AIAgentPanel({ symbol, technicalContext }: { symbol: string; technicalContext?: string }) {
  const { user, profile } = useAuth();
  const [result, setResult] = useState<MarketAgentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runsToday, setRunsToday] = useState(0);
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  const plan = (profile?.plan ?? 'free') as Plan;
  const dailyLimit = aiAnalystDailyLimit(plan);
  const limitReached = dailyLimit != null && runsToday >= dailyLimit;

  useEffect(() => {
    if (user) getAiAnalystRunsToday(user.id).then(setRunsToday);
  }, [user]);

  const run = useCallback(() => {
    if (limitReached) return;
    setLoading(true);
    setError(null);
    runMarketAgent(symbol, technicalContext)
      .then(res => {
        setResult(res);
        if (user) incrementAiAnalystRunsToday(user.id).then(setRunsToday);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Analysis failed'))
      .finally(() => setLoading(false));
  }, [symbol, technicalContext, limitReached, user]);

  const handleUpgrade = useCallback(async () => {
    if (!PRO_PRICE_ID) return;
    setCheckoutBusy(true);
    try {
      await startCheckout(PRO_PRICE_ID);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout');
    } finally {
      setCheckoutBusy(false);
    }
  }, []);

  useEffect(() => {
    setResult(null);
    setError(null);
  }, [symbol]);

  const verdict = result?.recommendation.verdict;
  const color = verdict ? VERDICT_COLOR[verdict] : colors.purple;

  return (
    <Card borderColor={color}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <PixelText color={color} size={7} glow>🤖 AI ANALYST</PixelText>
        <PixelButton
          color={limitReached ? colors.green : colors.blue}
          onPress={limitReached ? handleUpgrade : run}
          disabled={loading || checkoutBusy}
          style={{ paddingHorizontal: 8, paddingVertical: 6 }}
        >
          {loading ? '...' : checkoutBusy ? '...' : limitReached ? '★ UPGRADE' : result ? '↻ RE-RUN' : '▶ RUN'}
        </PixelButton>
      </View>

      {dailyLimit != null && (
        <BodyText color={limitReached ? colors.gold : colors.muted} size={11} style={{ marginBottom: 8 }}>
          {limitReached
            ? `Free plan: ${dailyLimit}/${dailyLimit} analyses used today. Upgrade to Pro for unlimited.`
            : `Free plan: ${runsToday}/${dailyLimit} analyses used today.`}
        </BodyText>
      )}

      {!result && !loading && !error && !limitReached && (
        <BodyText color={colors.muted} size={13}>
          Get a live research synthesis for {symbol} — real news, analyzed by AI, with a verdict on
          whether to press this trade or sit it out.
        </BodyText>
      )}

      {loading && <BodyText color={colors.purple} size={13}>Pulling live news and running research synthesis...</BodyText>}

      {error && <BodyText color={colors.red} size={13}>⚠ {error}</BodyText>}

      {result && !loading && (
        <View style={{ gap: 10 }}>
          <View style={{ padding: 10, backgroundColor: `${color}0a`, borderWidth: 2, borderColor: `${color}55` }}>
            <BodyText color={color} size={15} weight="semibold" glow>{verdict && VERDICT_LABEL[verdict]}</BodyText>
            <BodyText color={colors.muted} size={11} style={{ marginTop: 4 }}>
              CONFIDENCE: {result.recommendation.confidence}%{result.cached ? ' · CACHED' : ''}
            </BodyText>
            <BodyText color={SENTIMENT_COLOR[result.analysis.sentiment]} size={11} style={{ marginTop: 4 }}>
              {result.analysis.sentiment.toUpperCase()}
            </BodyText>
          </View>

          <BodyText color={colors.text} size={13}>{result.analysis.summary}</BodyText>

          {result.analysis.key_factors?.length > 0 && (
            <View>
              <BodyText color={colors.muted} size={11} style={{ marginBottom: 6 }}>KEY FACTORS</BodyText>
              {result.analysis.key_factors.map((f, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
                  <BodyText color={color} size={13}>▸</BodyText>
                  <BodyText color={colors.text} size={13} style={{ flex: 1 }}>{f}</BodyText>
                </View>
              ))}
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[
              { k: 'ENTRY', v: result.recommendation.entry_price, c: colors.blue },
              { k: 'STOP', v: result.recommendation.stop_loss, c: colors.red },
              { k: 'TARGET', v: result.recommendation.take_profit, c: colors.green },
            ].map(({ k, v, c }) => (
              <View key={k} style={{ flex: 1, padding: 8, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
                <BodyText color={colors.muted} size={11}>{k}</BodyText>
                <BodyText color={v != null ? c : colors.border} size={13} weight="medium" style={{ marginTop: 4 }}>
                  {v != null ? `$${v.toLocaleString()}` : '—'}
                </BodyText>
              </View>
            ))}
          </View>

          <View style={{ padding: 8, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}>
            <BodyText color={colors.muted} size={11} style={{ marginBottom: 4 }}>WHY</BodyText>
            <BodyText color={colors.muted} size={13}>{result.recommendation.reasoning}</BodyText>
          </View>

          <BodyText color={colors.border} size={11} style={{ textAlign: 'center' }}>
            Educational paper-trading analysis, not financial advice.
          </BodyText>
        </View>
      )}
    </Card>
  );
}
