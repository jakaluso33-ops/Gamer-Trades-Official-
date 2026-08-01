import { useState, useEffect } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, PixelText, BodyText } from '../../components/ui';
import { colors } from '../../lib/theme';
import { ASSET_CLASS_LABEL, ASSET_CLASS_COLOR, ASSET_CLASS_ICON, SYMBOL_ICON, SYMBOLS_BY_CLASS, AssetClass } from '../../lib/symbols';
import { isMarketOpen } from '../../lib/marketHours';

const ASSET_CLASSES: AssetClass[] = ['CRYPTO', 'STOCK', 'FOREX', 'INDEX', 'FUTURES', 'OPTIONS'];

export default function TradingArenaScreen() {
  const router = useRouter();
  const [classTab, setClassTab] = useState<AssetClass>('CRYPTO');
  const [, forceTick] = useState(0);

  // Market-open status can flip mid-session — recheck once a minute.
  useEffect(() => {
    const id = setInterval(() => forceTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const openMarkets = ASSET_CLASSES.filter(cls => isMarketOpen(cls));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
      <PixelText color={colors.blue} size={13} glow>◈ TRADING ARENA</PixelText>
      <BodyText color={colors.muted} size={12}>
        {openMarkets.length > 0
          ? `OPEN NOW: ${openMarkets.map(c => ASSET_CLASS_LABEL[c]).join(', ')}`
          : 'ALL MARKETS CLOSED RIGHT NOW'}
      </BodyText>

      <Card>
        <BodyText color={colors.muted} size={11} style={{ marginBottom: 10 }}>MARKETS</BodyText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {ASSET_CLASSES.map(cls => {
            const open = isMarketOpen(cls);
            const active = classTab === cls;
            return (
              <Pressable
                key={cls}
                onPress={() => setClassTab(cls)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 9,
                  paddingVertical: 7,
                  borderWidth: 2,
                  borderColor: active ? ASSET_CLASS_COLOR[cls] : colors.border,
                  backgroundColor: active ? `${ASSET_CLASS_COLOR[cls]}18` : 'transparent',
                }}
              >
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: open ? colors.green : colors.red }} />
                <BodyText color={active ? ASSET_CLASS_COLOR[cls] : colors.text} size={11} weight="semibold">
                  {ASSET_CLASS_LABEL[cls]}
                </BodyText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card borderColor={ASSET_CLASS_COLOR[classTab]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <BodyText color={ASSET_CLASS_COLOR[classTab]} size={12} weight="semibold" glow>
            {ASSET_CLASS_ICON[classTab]} {ASSET_CLASS_LABEL[classTab]}
          </BodyText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: isMarketOpen(classTab) ? colors.green : colors.red }} />
            <BodyText color={isMarketOpen(classTab) ? colors.green : colors.red} size={11} weight="semibold">
              {isMarketOpen(classTab) ? 'MARKET OPEN' : 'MARKET CLOSED'}
            </BodyText>
          </View>
        </View>
        <View style={{ borderWidth: 2, borderColor: colors.border }}>
          {SYMBOLS_BY_CLASS[classTab].map((s, i) => (
            <Pressable
              key={s.symbol}
              onPress={() => router.push({ pathname: '/(tabs)/trade-desk', params: { symbol: s.symbol } } as never)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: 10,
                paddingVertical: 10,
                borderBottomWidth: i === SYMBOLS_BY_CLASS[classTab].length - 1 ? 0 : 1,
                borderBottomColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: `${ASSET_CLASS_COLOR[classTab]}22`,
                  borderWidth: 2,
                  borderColor: ASSET_CLASS_COLOR[classTab],
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BodyText size={14}>{SYMBOL_ICON[s.symbol] ?? ASSET_CLASS_ICON[classTab]}</BodyText>
              </View>
              <View style={{ flex: 1 }}>
                <BodyText color={colors.text} size={13} weight="semibold">{s.symbol}</BodyText>
                <BodyText color={colors.muted} size={11} style={{ marginTop: 2 }} numberOfLines={1}>{s.name}</BodyText>
              </View>
              <BodyText color={colors.border} size={14}>▶</BodyText>
            </Pressable>
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}
