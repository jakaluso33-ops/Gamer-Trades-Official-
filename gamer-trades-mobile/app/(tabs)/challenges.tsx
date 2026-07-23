import { ScrollView, View } from 'react-native';
import { Card, PixelText } from '../../components/ui';
import { colors } from '../../lib/theme';

const CHALLENGES = [
  { id: 1, title: 'SCALP MASTER', desc: 'Win 3 scalp trades today', progress: 2, max: 3, xp: 150 },
  { id: 2, title: 'BEAT THE BOT', desc: 'Defeat Veteran AI on BTC', progress: 0, max: 1, xp: 300 },
  { id: 3, title: 'GREEN DAY', desc: 'Close all trades profitable', progress: 1, max: 1, xp: 200 },
];

export default function ChallengesScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      <PixelText color={colors.green} size={13} glow>◆ DAILY CHALLENGES</PixelText>
      <PixelText color={colors.muted} size={6}>RESETS IN 14:32:07</PixelText>

      {CHALLENGES.map(c => {
        const done = c.progress >= c.max;
        return (
          <Card key={c.id} borderColor={done ? colors.green : colors.border}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <PixelText color={done ? colors.green : colors.text} size={7}>{done ? '✓ ' : ''}{c.title}</PixelText>
              <PixelText color={colors.gold} size={6}>+{c.xp} XP</PixelText>
            </View>
            <PixelText color={colors.muted} size={6} style={{ marginBottom: 8 }}>{c.desc}</PixelText>
            <View style={{ height: 6, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ width: `${(c.progress / c.max) * 100}%`, height: '100%', backgroundColor: done ? colors.green : colors.blue }} />
            </View>
            <PixelText color={colors.muted} size={5} style={{ marginTop: 4, textAlign: 'right' }}>{c.progress}/{c.max}</PixelText>
          </Card>
        );
      })}
    </ScrollView>
  );
}
