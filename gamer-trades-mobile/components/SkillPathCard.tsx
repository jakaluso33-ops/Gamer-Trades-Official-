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
  isLevelComplete,
  isQuizPassed,
  isTradeChallengePassed,
  isLevelMastered,
  isLevelUnlocked,
} from '../lib/curriculum';

function LevelStrip({ profile }: { profile: Parameters<typeof isLevelMastered>[0] }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
      {SKILL_LEVELS.map(lvl => {
        const unlocked = isLevelUnlocked(profile, lvl);
        const mastered = isLevelMastered(profile, lvl);
        const lvlColor = SKILL_LEVEL_COLOR[lvl];
        return (
          <View
            key={lvl}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 6,
              borderWidth: 1.5,
              borderColor: mastered ? colors.green : unlocked ? lvlColor : colors.border,
              backgroundColor: mastered ? `${colors.green}14` : 'transparent',
              opacity: unlocked ? 1 : 0.4,
            }}
          >
            <BodyText size={13}>{mastered ? '✅' : unlocked ? SKILL_LEVEL_ICON[lvl] : '🔒'}</BodyText>
            <BodyText color={mastered ? colors.green : colors.muted} size={8} weight="semibold" style={{ marginTop: 2 }}>
              {SKILL_LEVEL_LABEL[lvl]}
            </BodyText>
          </View>
        );
      })}
    </View>
  );
}

export default function SkillPathCard() {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();

  if (!user || !profile) return null;

  const level = profile.skill_level;

  if (!level) {
    return (
      <Card borderColor={colors.purple} style={{ padding: 18 }}>
        <PixelText color={colors.purple} size={13} glow style={{ marginBottom: 6 }}>
          🎓 SKILL PATH
        </PixelText>
        <BodyText color={colors.muted} size={12} style={{ marginBottom: 12 }}>
          Pick your trading level and get a step-by-step, interactive lesson path built for you — master each level's lessons, quiz, and live Trade With AI challenge to unlock the next.
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
  const lessonsDone = isLevelComplete(profile, level);
  const quizDone = isQuizPassed(profile, level);
  const tradeDone = isTradeChallengePassed(profile, level);

  let ctaLabel = '▶ CONTINUE LEARNING';
  if (lessonsDone && !quizDone) ctaLabel = '▶ TAKE THE QUIZ';
  else if (quizDone && !tradeDone) ctaLabel = '▶ TRADE WITH AI';
  else if (tradeDone) ctaLabel = '▶ REVIEW / NEXT LEVEL';

  return (
    <Pressable onPress={() => router.push('/(tabs)/curriculum' as never)}>
      <Card borderColor={color} style={{ padding: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <PixelText color={color} size={13} glow>
            {SKILL_LEVEL_ICON[level]} SKILL PATH
          </PixelText>
          <BodyText color={colors.muted} size={11}>{SKILL_LEVEL_LABEL[level]}</BodyText>
        </View>

        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
          <BodyText color={lessonsDone ? colors.green : colors.muted} size={10} weight="semibold">
            {lessonsDone ? '✓' : '○'} LESSONS {completed}/{lessons.length}
          </BodyText>
          <BodyText color={quizDone ? colors.green : colors.muted} size={10} weight="semibold">
            {quizDone ? '✓' : '○'} QUIZ
          </BodyText>
          <BodyText color={tradeDone ? colors.green : colors.muted} size={10} weight="semibold">
            {tradeDone ? '✓' : '○'} TRADE W/ AI
          </BodyText>
        </View>
        <View style={{ height: 8, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, marginBottom: 10 }}>
          <View
            style={{
              height: '100%',
              width: `${((Number(lessonsDone) + Number(quizDone) + Number(tradeDone)) / 3) * 100}%`,
              backgroundColor: color,
            }}
          />
        </View>
        <BodyText color={color} size={13} weight="medium">{ctaLabel}</BodyText>

        <LevelStrip profile={profile} />
      </Card>
    </Pressable>
  );
}
