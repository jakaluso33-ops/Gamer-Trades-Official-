import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, PixelText, BodyText } from './ui';
import { colors } from '../lib/theme';
import { useAuth } from '../lib/AuthContext';
import {
  SKILL_LEVELS,
  SKILL_LEVEL_LABEL,
  SKILL_LEVEL_ICON,
  SKILL_LEVEL_COLOR,
  SKILL_LEVEL_BLURB,
  lessonsForLevel,
  setSkillLevel,
} from '../lib/curriculum';

export default function SkillPathCard() {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();

  if (!user || !profile) return null;

  const level = profile.skill_level;

  if (!level) {
    return (
      <Card borderColor={colors.purple}>
        <BodyText color={colors.purple} size={12} weight="semibold" glow style={{ marginBottom: 4 }}>
          🎓 SKILL PATH
        </BodyText>
        <BodyText color={colors.muted} size={12} style={{ marginBottom: 10 }}>
          Pick your trading level and get a step-by-step, interactive lesson path built for you.
        </BodyText>
        <View style={{ gap: 8 }}>
          {SKILL_LEVELS.map(lvl => (
            <Pressable
              key={lvl}
              onPress={async () => {
                await setSkillLevel(user.id, lvl);
                await refreshProfile();
                router.push('/(tabs)/curriculum' as never);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                padding: 10,
                borderWidth: 2,
                borderColor: SKILL_LEVEL_COLOR[lvl],
                backgroundColor: `${SKILL_LEVEL_COLOR[lvl]}14`,
              }}
            >
              <PixelText size={20}>{SKILL_LEVEL_ICON[lvl]}</PixelText>
              <View style={{ flex: 1 }}>
                <BodyText color={SKILL_LEVEL_COLOR[lvl]} size={13} weight="semibold">{SKILL_LEVEL_LABEL[lvl]}</BodyText>
                <BodyText color={colors.muted} size={11} style={{ marginTop: 2 }}>{SKILL_LEVEL_BLURB[lvl]}</BodyText>
              </View>
            </Pressable>
          ))}
        </View>
      </Card>
    );
  }

  const lessons = lessonsForLevel(level);
  const completed = lessons.filter(l => profile.completed_lessons.includes(l.id)).length;
  const color = SKILL_LEVEL_COLOR[level];

  return (
    <Pressable onPress={() => router.push('/(tabs)/curriculum' as never)}>
      <Card borderColor={color}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <BodyText color={color} size={12} weight="semibold" glow>
            {SKILL_LEVEL_ICON[level]} SKILL PATH — {SKILL_LEVEL_LABEL[level]}
          </BodyText>
          <BodyText color={colors.muted} size={11}>{completed}/{lessons.length}</BodyText>
        </View>
        <View style={{ height: 8, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, marginBottom: 10 }}>
          <View style={{ height: '100%', width: `${lessons.length ? (completed / lessons.length) * 100 : 0}%`, backgroundColor: color }} />
        </View>
        <BodyText color={color} size={12} weight="medium">
          {completed >= lessons.length ? '▶ REVIEW LESSONS' : '▶ CONTINUE LEARNING'}
        </BodyText>
      </Card>
    </Pressable>
  );
}
