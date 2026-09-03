import { useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { Card, PixelText, BodyText } from '../../components/ui';
import { colors } from '../../lib/theme';
import { STRATEGIES, StrategyDifficulty } from '../../lib/strategyContent';
import { CANDLE_PATTERNS } from '../../lib/candlestickContent';
import StrategyIcon from '../../components/StrategyIcon';
import StrategyDiagram from '../../components/StrategyDiagram';
import StrategyLiveDemo from '../../components/StrategyLiveDemo';
import StatsBadge from '../../components/StatsBadge';
import { DetectorId, getDetector } from '../../lib/strategyEngine';
import { detectCandlePattern } from '../../lib/candlePatterns';
import SkillPathCard from '../../components/SkillPathCard';
import TradingForDummiesCard from '../../components/TradingForDummiesCard';
import FreeTierBannerAd from '../../components/FreeTierBannerAd';

const DIFF_COLOR: Record<StrategyDifficulty, string> = {
  BEGINNER: colors.green,
  INTERMEDIATE: colors.gold,
  ADVANCED: colors.red,
  EXPERT: colors.purple,
};

type Mode = 'strategies' | 'candles';

export default function AcademyScreen() {
  const [mode, setMode] = useState<Mode>('strategies');
  const [selected, setSelected] = useState(STRATEGIES[0]);
  const [selectedPattern, setSelectedPattern] = useState(CANDLE_PATTERNS[0]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
      <TradingForDummiesCard />

      <FreeTierBannerAd />

      <View>
        <BodyText color={colors.muted} size={12}>🧠 AI STRATEGY ACADEMY</BodyText>
        <PixelText color={colors.cyan} size={13} glow style={{ marginTop: 6 }}>LEARN &amp; DETECT</PixelText>
        <BodyText color={colors.muted} size={12} style={{ marginTop: 8 }}>
          Learn these here, then check the LIVE SIGNALS panel on the Trade screen — the scanner flags these exact setups as they form.
        </BodyText>
      </View>

      <SkillPathCard />

      <View style={{ flexDirection: 'row', gap: 6 }}>
        {([
          { key: 'strategies' as Mode, label: '📐 STRATEGIES' },
          { key: 'candles' as Mode, label: '🕯️ CANDLE PATTERNS' },
        ]).map(t => (
          <Pressable
            key={t.key}
            onPress={() => setMode(t.key)}
            style={{
              flex: 1, alignItems: 'center', paddingVertical: 10,
              borderWidth: 2, borderColor: mode === t.key ? colors.cyan : colors.border,
              backgroundColor: mode === t.key ? `${colors.cyan}18` : 'transparent',
            }}
          >
            <BodyText color={mode === t.key ? colors.cyan : colors.muted} size={12} weight="semibold">{t.label}</BodyText>
          </Pressable>
        ))}
      </View>

      {mode === 'strategies' && (
        <>
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

            <View style={{ marginTop: 14 }}>
              <BodyText color={colors.gold} size={11} weight="medium" style={{ marginBottom: 6 }}>📊 SIMULATED WIN RATE &amp; PROFIT FACTOR</BodyText>
              <StatsBadge key={selected.id} detect={getDetector(selected.id as DetectorId)} />
            </View>

            <View style={{ marginTop: 8, padding: 10, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.green }}>
              <BodyText color={colors.green} size={11} weight="medium" style={{ marginBottom: 6 }}>✓ ENTRY RULES</BodyText>
              {selected.entryRules.map((r, i) => (
                <BodyText key={i} color={colors.text} size={12.5} style={{ marginBottom: 5 }}>• {r}</BodyText>
              ))}
            </View>

            <View style={{ marginTop: 8, padding: 10, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.blue }}>
              <BodyText color={colors.blue} size={11} weight="medium" style={{ marginBottom: 6 }}>◀ EXIT RULES</BodyText>
              {selected.exitRules.map((r, i) => (
                <BodyText key={i} color={colors.text} size={12.5} style={{ marginBottom: 5 }}>• {r}</BodyText>
              ))}
            </View>

            <View style={{ marginTop: 8, padding: 10, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.gold }}>
              <BodyText color={colors.gold} size={11} weight="medium" style={{ marginBottom: 6 }}>💡 WORKED EXAMPLE</BodyText>
              <BodyText color={colors.text} size={12.5}>{selected.example}</BodyText>
            </View>

            <View style={{ marginTop: 8, padding: 10, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.red }}>
              <BodyText color={colors.red} size={11} weight="medium" style={{ marginBottom: 6 }}>✕ COMMON MISTAKES</BodyText>
              {selected.commonMistakes.map((m, i) => (
                <BodyText key={i} color={colors.text} size={12.5} style={{ marginBottom: 5 }}>• {m}</BodyText>
              ))}
            </View>

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
        </>
      )}

      {mode === 'candles' && (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {CANDLE_PATTERNS.map(p => (
              <Pressable
                key={p.id}
                onPress={() => setSelectedPattern(p)}
                style={{
                  paddingHorizontal: 10, paddingVertical: 8,
                  backgroundColor: selectedPattern.id === p.id ? `${p.color}22` : colors.card,
                  borderWidth: 2, borderColor: selectedPattern.id === p.id ? p.color : colors.border,
                }}
              >
                <BodyText color={selectedPattern.id === p.id ? p.color : colors.muted} size={12}>{p.icon} {p.name}</BodyText>
              </Pressable>
            ))}
          </View>

          <Card borderColor={selectedPattern.color}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <PixelText size={30}>{selectedPattern.icon}</PixelText>
              <View style={{ flex: 1 }}>
                <BodyText color={selectedPattern.color} size={15} weight="semibold" glow>{selectedPattern.name}</BodyText>
                <BodyText color={colors.muted} size={11} style={{ marginTop: 4 }}>
                  {selectedPattern.candleCount === 1 ? 'SINGLE-CANDLE PATTERN' : 'TWO-CANDLE PATTERN'}
                </BodyText>
              </View>
            </View>

            <BodyText color={colors.text} size={13} style={{ marginBottom: 14 }}>{selectedPattern.summary}</BodyText>

            <BodyText color={colors.muted} size={12} weight="medium" style={{ marginBottom: 8 }}>◆ HOW TO SPOT IT</BodyText>
            {selectedPattern.appearance.map((a, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
                <BodyText color={selectedPattern.color} size={13}>•</BodyText>
                <BodyText color={colors.text} size={13} style={{ flex: 1 }}>{a}</BodyText>
              </View>
            ))}

            <View style={{ marginTop: 14 }}>
              <BodyText color={colors.gold} size={11} weight="medium" style={{ marginBottom: 6 }}>📊 SIMULATED WIN RATE &amp; PROFIT FACTOR</BodyText>
              <StatsBadge key={selectedPattern.id} detect={detectCandlePattern} />
            </View>

            <View style={{ marginTop: 8, padding: 10, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.blue }}>
              <BodyText color={colors.blue} size={11} weight="medium" style={{ marginBottom: 6 }}>WHAT IT INDICATES</BodyText>
              <BodyText color={colors.text} size={12.5}>{selectedPattern.whatItIndicates}</BodyText>
            </View>

            <View style={{ marginTop: 8, padding: 10, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.gold }}>
              <BodyText color={colors.gold} size={11} weight="medium" style={{ marginBottom: 6 }}>💡 EXAMPLE</BodyText>
              <BodyText color={colors.text} size={12.5}>{selectedPattern.example}</BodyText>
            </View>

            <View style={{ marginTop: 8, padding: 10, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.red }}>
              <BodyText color={colors.red} size={11} weight="medium" style={{ marginBottom: 6 }}>⚠ RELIABILITY</BodyText>
              <BodyText color={colors.text} size={12.5}>{selectedPattern.reliabilityNote}</BodyText>
            </View>
          </Card>
        </>
      )}
    </ScrollView>
  );
}
