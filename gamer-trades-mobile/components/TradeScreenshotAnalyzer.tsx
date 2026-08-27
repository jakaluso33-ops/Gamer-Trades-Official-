import { useState, RefObject } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { Card, PixelText, BodyText, PixelButton } from './ui';
import { colors } from '../lib/theme';
import { useAuth } from '../lib/AuthContext';
import { runScreenshotAgent, ScreenshotReview, VERDICT_COLOR, VERDICT_LABEL } from '../lib/screenshotAgent';
import { aiAnalystDailyLimit, getAiAnalystRunsToday, incrementAiAnalystRunsToday, PLANS } from '../lib/plans';
import { startCheckout } from '../lib/checkout';

const PRO_PRICE_ID = PLANS.find(p => p.name === 'pro')?.priceId;

export default function TradeScreenshotAnalyzer({
  chartRef,
  symbol,
  livePrice,
}: {
  chartRef: RefObject<View | null>;
  symbol: string;
  livePrice: number;
}) {
  const { user, profile } = useAuth();
  const [review, setReview] = useState<ScreenshotReview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runsToday, setRunsToday] = useState(0);
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  const plan = (profile?.plan ?? 'free') as 'free' | 'pro' | 'legend';
  const dailyLimit = aiAnalystDailyLimit(plan);

  const analyze = async () => {
    if (!chartRef.current || !user) return;
    setError(null);

    if (user) {
      const used = await getAiAnalystRunsToday(user.id);
      setRunsToday(used);
      if (dailyLimit != null && used >= dailyLimit) return;
    }

    setLoading(true);
    setReview(null);
    try {
      const uri = await captureRef(chartRef, { format: 'png', quality: 0.8, result: 'base64' });
      const result = await runScreenshotAgent(uri, symbol, livePrice, profile?.skill_level ?? null);
      setReview(result);
      if (user) setRunsToday(await incrementAiAnalystRunsToday(user.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not analyze the screenshot');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!PRO_PRICE_ID) return;
    setCheckoutBusy(true);
    try {
      await startCheckout(PRO_PRICE_ID);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout');
    } finally {
      setCheckoutBusy(false);
    }
  };

  const limitReached = dailyLimit != null && runsToday >= dailyLimit;
  const verdictColor = review ? VERDICT_COLOR[review.verdict] : colors.cyan;

  return (
    <Card borderColor={verdictColor}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <PixelText color={verdictColor} size={7} glow>📸 SHOULD I TAKE THIS TRADE?</PixelText>
        <PixelButton
          color={limitReached ? colors.green : colors.cyan}
          onPress={limitReached ? handleUpgrade : analyze}
          disabled={loading || checkoutBusy}
          style={{ paddingHorizontal: 8, paddingVertical: 6 }}
        >
          {loading ? '...' : checkoutBusy ? '...' : limitReached ? '★ UPGRADE' : review ? '↻ RE-CHECK' : '▶ ANALYZE'}
        </PixelButton>
      </View>

      {dailyLimit != null && (
        <BodyText color={limitReached ? colors.gold : colors.muted} size={11} style={{ marginBottom: 8 }}>
          {limitReached
            ? `Free plan: ${dailyLimit}/${dailyLimit} AI reviews used today. Upgrade to Pro for unlimited.`
            : `Free plan: ${runsToday}/${dailyLimit} AI reviews used today.`}
        </BodyText>
      )}

      {!review && !loading && !error && !limitReached && (
        <BodyText color={colors.muted} size={13}>
          Snaps the chart exactly as it looks right now and asks the AI for a straight take/skip/wait call on the setup.
        </BodyText>
      )}

      {loading && <BodyText color={colors.cyan} size={13}>Capturing the chart and reviewing the setup...</BodyText>}

      {error && <BodyText color={colors.red} size={13}>⚠ {error}</BodyText>}

      {review && !loading && (
        <View style={{ gap: 10 }}>
          <View style={{ padding: 10, backgroundColor: `${verdictColor}0a`, borderWidth: 2, borderColor: `${verdictColor}55` }}>
            <BodyText color={verdictColor} size={14} weight="semibold" glow>{VERDICT_LABEL[review.verdict]}</BodyText>
            <BodyText color={colors.muted} size={11} style={{ marginTop: 4 }}>CONFIDENCE: {review.confidence}%</BodyText>
          </View>

          <BodyText color={colors.text} size={13} weight="semibold">{review.headline}</BodyText>

          <View style={{ padding: 8, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}>
            <BodyText color={colors.muted} size={11} style={{ marginBottom: 4 }}>WHAT THE AI SEES</BodyText>
            <BodyText color={colors.text} size={13}>{review.whatISee}</BodyText>
          </View>

          <View style={{ padding: 8, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}>
            <BodyText color={colors.muted} size={11} style={{ marginBottom: 4 }}>WHY</BodyText>
            <BodyText color={colors.text} size={13}>{review.reasoning}</BodyText>
          </View>

          <BodyText color={colors.red} size={12}>⚠ Key risk: {review.keyRisk}</BodyText>

          <BodyText color={colors.border} size={11} style={{ textAlign: 'center' }}>
            Educational paper-trading analysis, not financial advice.
          </BodyText>
        </View>
      )}
    </Card>
  );
}
