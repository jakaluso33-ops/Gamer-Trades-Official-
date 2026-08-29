import { useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { Card, PixelText, BodyText } from '../../components/ui';
import { colors } from '../../lib/theme';
import { STRATEGIES, StrategyDifficulty } from '../../lib/strategyContent';
import StrategyIcon from '../../components/StrategyIcon';
import StrategyDiagram from '../../components/StrategyDiagram';
import StrategyLiveDemo from '../../components/StrategyLiveDemo';
import { DetectorId } from '../../lib/strategyEngine';
import SkillPathCard from '../../components/SkillPathCard';

const DIFF_COLOR: Record<StrategyDifficulty, string> = {
  BEGINNER: colors.green,
  INTERMEDIATE: colors.gold,
  ADVANCED: colors.red,
};

export default function AcademyScreen() {
  const [selected, setSelected] = useState(STRATEGIES[0]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
      <View>
        <BodyText color={colors.muted} size={12}>🧠 AI STRATEGY ACADEMY</BodyText>
        <PixelText color={colors.cyan} size={13} glow style={{ marginTop: 6 }}>LEARN &amp; DETECT</PixelText>
        <BodyText color={colors.muted} size={12} style={{ marginTop: 8 }}>
          Learn these strategies here, then check the LIVE SIGNALS panel on the Trade screen — the scanner flags these exact setups as they form.
        </BodyText>
      </View>

      <SkillPathCard />

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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <StrategyIcon id={s.id as DetectorId} color={selected.id === s.id ? s.color : colors.muted} size={14} />
              <BodyText color={selected.id === s.id ? s.color : colors.muted} size={12}>{s.icon} {s.name}</BodyText>
            </View>
          </Pressable>
        ))}
      </View>

      <Card borderColor={selected.color}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <PixelText size={26}>{selected.icon}</PixelText>
          <View style={{ flex: 1 }}>
            <BodyText color={selected.color} size={15} weight="semibold" glow>{selected.name}</BodyText>
            <BodyText color={DIFF_COLOR[selected.difficulty]} size={11} style={{ marginTop: 4 }}>{selected.difficulty}</BodyText>
          </View>
        </View>

        <View style={{ alignItems: 'center', paddingVertical: 14, marginBottom: 14, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}>
          <StrategyDiagram id={selected.id as DetectorId} height={170} />
          <BodyText color={colors.muted} size={10} style={{ marginTop: 8 }}>WHAT THE SETUP LOOKS LIKE</BodyText>
        </View>

        <BodyText color={colors.text} size={13} style={{ marginBottom: 14 }}>{selected.summary}</BodyText>

        <BodyText color={colors.muted} size={12} weight="medium" style={{ marginBottom: 8 }}>◆ HOW IT WORKS</BodyText>
        {selected.howItWorks.map((step, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
            <BodyText color={selected.color} size={13}>{i + 1}.</BodyText>
            <BodyText color={colors.text} size={13} style={{ flex: 1 }}>{step}</BodyText>
          </View>
        ))}

        <View style={{ marginTop: 8, padding: 10, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}>
          <BodyText color={colors.blue} size={11} weight="medium" style={{ marginBottom: 6 }}>WHEN TO USE</BodyText>
          <BodyText color={colors.muted} size={13}>{selected.whenToUse}</BodyText>
        </View>
        <View style={{ marginTop: 8, padding: 10, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}>
          <BodyText color={colors.red} size={11} weight="medium" style={{ marginBottom: 6 }}>RISK NOTE</BodyText>
          <BodyText color={colors.muted} size={13}>{selected.riskNote}</BodyText>
        </View>
      </Card>

      <Card borderColor={selected.color}>
        <StrategyLiveDemo key={selected.id} id={selected.id as DetectorId} color={selected.color} />
      </Card>
    </ScrollView>
  );
}
