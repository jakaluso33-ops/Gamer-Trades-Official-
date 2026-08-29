import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, PixelText, BodyText } from './ui';
import { colors } from '../lib/theme';
import { ALL_SYMBOLS, ASSET_CLASS_COLOR, ASSET_CLASS_ICON } from '../lib/symbols';
import { useMarketScanner, ScannedSignal } from '../lib/marketScanner';
import { getStrategy } from '../lib/strategyContent';
import { DetectorId } from '../lib/strategyEngine';
import StrategyIcon from './StrategyIcon';

const MAX_ROWS = 8;

/** Scans every market simultaneously and surfaces whatever's forming right now, across all
 * 6 asset classes at once — tapping a row jumps straight to that setup on the real chart. */
export default function MasterTraderFeed() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const signals = useMarketScanner(ALL_SYMBOLS);

  const rows = signals.slice(0, MAX_ROWS);

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
            rows.map((row: ScannedSignal) => {
              const strat = getStrategy(row.signal.strategyId);
              const dirColor = row.signal.direction === 'bullish' ? colors.green : colors.red;
              return (
                <Pressable
                  key={row.symbol}
                  onPress={() => router.push({
                    pathname: '/(tabs)/trade-desk',
                    params: { symbol: row.symbol, focusStrategy: row.signal.strategyId },
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
                      <StrategyIcon id={row.signal.strategyId as DetectorId} color={dirColor} size={11} />
                    </View>
                    <BodyText color={colors.muted} size={11} style={{ marginTop: 2 }} numberOfLines={1}>
                      {strat?.name ?? row.signal.strategyId} — {row.signal.label}
                    </BodyText>
                  </View>
                  <BodyText color={dirColor} size={11} weight="semibold">
                    {row.signal.direction === 'bullish' ? '▲ BULL' : '▼ BEAR'}
                  </BodyText>
                </Pressable>
              );
            })
          )}
        </View>
      )}
    </Card>
  );
}
