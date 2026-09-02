import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, PixelText, BodyText } from './ui';
import { colors } from '../lib/theme';
import { ALL_SYMBOLS, ASSET_CLASS_COLOR, ASSET_CLASS_ICON } from '../lib/symbols';
import { useMarketScanner, ScannedSignal } from '../lib/marketScanner';
import { getStrategy } from '../lib/strategyContent';
import { getCandlePattern } from '../lib/candlestickContent';
import { DetectorId } from '../lib/strategyEngine';
import { useAuth } from '../lib/AuthContext';
import { PLANS } from '../lib/plans';
import { startCheckout } from '../lib/checkout';
import StrategyIcon from './StrategyIcon';

const MAX_ROWS = 8;
const PRO_PLAN = PLANS.find(p => p.name === 'pro');

/** Scans every market simultaneously and surfaces whatever's forming right now — both
 * strategy setups (free) and candlestick patterns (Pro) — across all 6 asset classes at
 * once. Tapping a row jumps straight to that setup on the real chart. */
export default function MasterTraderFeed() {
  const router = useRouter();
  const { profile } = useAuth();
  const [expanded, setExpanded] = useState(true);
  const [upgradeBusy, setUpgradeBusy] = useState(false);
  const allSignals = useMarketScanner(ALL_SYMBOLS);

  const isPro = (profile?.plan ?? 'free') !== 'free';
  const strategySignals = allSignals.filter(s => s.kind === 'strategy');
  const candleSignals = allSignals.filter(s => s.kind === 'candle');
  const visible = isPro ? allSignals : strategySignals;
  const rows = visible.slice(0, MAX_ROWS);
  const lockedCandleCount = isPro ? 0 : candleSignals.length;

  const handleUpgrade = async () => {
    if (!PRO_PLAN?.priceId) return;
    setUpgradeBusy(true);
    try {
      await startCheckout(PRO_PLAN.priceId);
    } finally {
      setUpgradeBusy(false);
    }
  };

  return (
    <Card borderColor={colors.cyan}>
      <Pressable onPress={() => setExpanded(e => !e)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <PixelText size={16}>🎙️</PixelText>
          <View>
            <BodyText color={colors.cyan} size={13} weight="semibold" glow>MASTER TRADER SCANNER</BodyText>
            <BodyText color={colors.muted} size={11} style={{ marginTop: 2 }}>Live setups across every market, right now</BodyText>
          </View>
        </View>
        <BodyText color={colors.muted} size={13}>{expanded ? '▲' : '▼'}</BodyText>
      </Pressable>

      {expanded && (
        <View style={{ marginTop: 12 }}>
          {rows.length === 0 ? (
            <BodyText color={colors.muted} size={12}>Scanning every market for a setup...</BodyText>
          ) : (
            rows.map((row: ScannedSignal, i) => {
              const isCandle = row.kind === 'candle';
              const strat = isCandle ? undefined : getStrategy(row.signal.strategyId);
              const pattern = isCandle ? getCandlePattern(row.signal.strategyId) : undefined;
              const dirColor = row.signal.direction === 'bullish' ? colors.green : colors.red;
              return (
                <Pressable
                  key={`${row.symbol}-${row.kind}-${i}`}
                  onPress={() => router.push({
                    pathname: '/(tabs)/trade-desk',
                    params: { symbol: row.symbol, ...(isCandle ? {} : { focusStrategy: row.signal.strategyId }) },
                  } as never)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9,
                    borderBottomWidth: 1, borderBottomColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: `${ASSET_CLASS_COLOR[row.assetClass]}22`, borderWidth: 1.5, borderColor: ASSET_CLASS_COLOR[row.assetClass],
                    }}
                  >
                    <BodyText size={12}>{ASSET_CLASS_ICON[row.assetClass]}</BodyText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <BodyText color={colors.text} size={12} weight="semibold">{row.symbol}</BodyText>
                      {isCandle ? (
                        <PixelText size={11}>{pattern?.icon ?? '🕯️'}</PixelText>
                      ) : (
                        <StrategyIcon id={row.signal.strategyId as DetectorId} color={dirColor} size={11} />
                      )}
                    </View>
                    <BodyText color={colors.muted} size={11} style={{ marginTop: 2 }} numberOfLines={1}>
                      {(isCandle ? pattern?.name : strat?.name) ?? row.signal.strategyId} — {row.signal.label}
                    </BodyText>
                  </View>
                  <BodyText color={dirColor} size={11} weight="semibold">
                    {row.signal.direction === 'bullish' ? '▲ BULL' : '▼ BEAR'}
                  </BodyText>
                </Pressable>
              );
            })
          )}

          {lockedCandleCount > 0 && (
            <Pressable onPress={handleUpgrade} disabled={upgradeBusy} style={{ marginTop: rows.length > 0 ? 10 : 0 }}>
              <View style={{ padding: 10, backgroundColor: `${colors.gold}0a`, borderWidth: 2, borderColor: `${colors.gold}55`, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <PixelText size={14}>🔒</PixelText>
                <View style={{ flex: 1 }}>
                  <BodyText color={colors.gold} size={12} weight="semibold">
                    {lockedCandleCount} candlestick pattern{lockedCandleCount === 1 ? '' : 's'} forming right now
                  </BodyText>
                  <BodyText color={colors.muted} size={11} style={{ marginTop: 2 }}>
                    {upgradeBusy ? 'Starting checkout...' : `Upgrade to Pro to see them across all 6 markets — ${PRO_PLAN?.price ?? ''}`}
                  </BodyText>
                </View>
              </View>
            </Pressable>
          )}
        </View>
      )}
    </Card>
  );
}
