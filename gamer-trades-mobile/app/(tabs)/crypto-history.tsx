import { useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { Card, PixelText, BodyText } from '../../components/ui';
import { colors } from '../../lib/theme';
import { COINS } from '../../lib/cryptoContent';

export default function CryptoHistoryScreen() {
  const [selected, setSelected] = useState(COINS[0]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
      <View>
        <BodyText color={colors.muted} size={12}>🪙 CRYPTO HISTORY</BodyText>
        <PixelText color={colors.cyan} size={13} glow style={{ marginTop: 6 }}>WHERE EACH COIN CAME FROM</PixelText>
        <BodyText color={colors.muted} size={12} style={{ marginTop: 8 }}>
          Before you trade a coin, know its story — who built it, why it exists, and what it&apos;s actually for.
        </BodyText>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {COINS.map(c => (
          <Pressable
            key={c.symbol}
            onPress={() => setSelected(c)}
            style={{
              paddingHorizontal: 10, paddingVertical: 8,
              backgroundColor: selected.symbol === c.symbol ? `${c.color}22` : colors.card,
              borderWidth: 2, borderColor: selected.symbol === c.symbol ? c.color : colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <PixelText color={selected.symbol === c.symbol ? c.color : colors.muted} size={12}>{c.icon}</PixelText>
              <BodyText color={selected.symbol === c.symbol ? c.color : colors.muted} size={12}>{c.ticker}</BodyText>
            </View>
          </Pressable>
        ))}
      </View>

      <Card borderColor={selected.color}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <PixelText size={26} color={selected.color}>{selected.icon}</PixelText>
          <View style={{ flex: 1 }}>
            <BodyText color={selected.color} size={15} weight="semibold" glow>{selected.name}</BodyText>
            <BodyText color={colors.muted} size={11} style={{ marginTop: 4 }}>FOUNDED {selected.founded} · {selected.founder}</BodyText>
          </View>
        </View>

        <View style={{ alignItems: 'center', paddingVertical: 14, marginBottom: 14, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}>
          <PixelText size={40} color={selected.color} glow>{selected.icon}</PixelText>
          <BodyText color={colors.text} size={12} style={{ marginTop: 10, textAlign: 'center', paddingHorizontal: 8 }}>{selected.tagline}</BodyText>
        </View>

        <BodyText color={colors.muted} size={12} weight="medium" style={{ marginBottom: 8 }}>◆ THE STORY</BodyText>
        {selected.history.map((step, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
            <BodyText color={selected.color} size={13}>{i + 1}.</BodyText>
            <BodyText color={colors.text} size={13} style={{ flex: 1 }}>{step}</BodyText>
          </View>
        ))}

        <View style={{ marginTop: 8, padding: 10, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}>
          <BodyText color={colors.blue} size={11} weight="medium" style={{ marginBottom: 6 }}>WHAT IT'S FOR</BodyText>
          <BodyText color={colors.muted} size={13}>{selected.whatItsFor}</BodyText>
        </View>
        <View style={{ marginTop: 8, padding: 10, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}>
          <BodyText color={colors.gold} size={11} weight="medium" style={{ marginBottom: 6 }}>FUN FACT</BodyText>
          <BodyText color={colors.muted} size={13}>{selected.funFact}</BodyText>
        </View>
      </Card>
    </ScrollView>
  );
}
