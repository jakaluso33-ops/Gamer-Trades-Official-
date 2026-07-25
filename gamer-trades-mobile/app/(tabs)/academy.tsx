import { useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { Card, PixelText } from '../../components/ui';
import { colors } from '../../lib/theme';
import { STRATEGIES, StrategyDifficulty } from '../../lib/strategyContent';

const DIFF_COLOR: Record<StrategyDifficulty, string> = {
  BEGINNER: colors.green,
  INTERMEDIATE: colors.gold,
  ADVANCED: colors.red,
};

export default function AcademyScreen() {
  const [selected, setSelected] = useState(STRATEGIES[0]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      <View>
        <PixelText color={colors.muted} size={6}>🧠 AI STRATEGY ACADEMY</PixelText>
        <PixelText color={colors.cyan} size={13} glow style={{ marginTop: 6 }}>LEARN &amp; DETECT</PixelText>
        <PixelText color={colors.muted} size={5} style={{ marginTop: 8, lineHeight: 9 }}>
          Learn these strategies here, then check the LIVE SIGNALS panel on the Trade screen — the scanner flags these exact setups as they form.
        </PixelText>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {STRATEGIES.map(s => (
          <Pressable
            key={s.id}
            onPress={() => setSelected(s)}
            style={{
              paddingHorizontal: 10, paddingVertical: 8,
              backgroundColor: selected.id === s.id ? `${s.color}22` : colors.card,
              borderWidth: 2, borderColor: selected.id === s.id ? s.color : colors.border,
            }}
          >
            <PixelText color={selected.id === s.id ? s.color : colors.muted} size={6}>{s.icon} {s.name}</PixelText>
          </Pressable>
        ))}
      </View>

      <Card borderColor={selected.color}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <PixelText size={26}>{selected.icon}</PixelText>
          <View style={{ flex: 1 }}>
            <PixelText color={selected.color} size={9} glow>{selected.name}</PixelText>
            <PixelText color={DIFF_COLOR[selected.difficulty]} size={5} style={{ marginTop: 4 }}>{selected.difficulty}</PixelText>
          </View>
        </View>

        <PixelText color={colors.text} size={6} style={{ lineHeight: 11, marginBottom: 14 }}>{selected.summary}</PixelText>

        <PixelText color={colors.muted} size={6} style={{ marginBottom: 8 }}>◆ HOW IT WORKS</PixelText>
        {selected.howItWorks.map((step, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
            <PixelText color={selected.color} size={6}>{i + 1}.</PixelText>
            <PixelText color={colors.text} size={6} style={{ flex: 1, lineHeight: 10 }}>{step}</PixelText>
          </View>
        ))}

        <View style={{ marginTop: 8, padding: 10, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}>
          <PixelText color={colors.blue} size={5} style={{ marginBottom: 6 }}>WHEN TO USE</PixelText>
          <PixelText color={colors.muted} size={6} style={{ lineHeight: 10 }}>{selected.whenToUse}</PixelText>
        </View>
        <View style={{ marginTop: 8, padding: 10, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}>
          <PixelText color={colors.red} size={5} style={{ marginBottom: 6 }}>RISK NOTE</PixelText>
          <PixelText color={colors.muted} size={6} style={{ lineHeight: 10 }}>{selected.riskNote}</PixelText>
        </View>
      </Card>
    </ScrollView>
  );
}
