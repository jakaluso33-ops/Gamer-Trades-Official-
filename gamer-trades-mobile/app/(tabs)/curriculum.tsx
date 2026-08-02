import { useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, PixelText, BodyText, PixelButton } from '../../components/ui';
import { colors } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';
import {
  SkillLevel,
  SKILL_LEVELS,
  SKILL_LEVEL_LABEL,
  SKILL_LEVEL_ICON,
  SKILL_LEVEL_COLOR,
  lessonsForLevel,
  setSkillLevel,
  completeLesson,
  Lesson,
} from '../../lib/curriculum';

function LessonDetail({ lesson, color, onComplete, done }: { lesson: Lesson; color: string; onComplete: () => void; done: boolean }) {
  const [answered, setAnswered] = useState<number | null>(null);

  const correct = answered === lesson.quiz.correctIndex;

  return (
    <Card borderColor={color}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <PixelText size={24}>{lesson.icon}</PixelText>
        <BodyText color={color} size={15} weight="semibold" glow style={{ flex: 1 }}>{lesson.title}</BodyText>
        {done && <BodyText color={colors.green} size={12}>✓ DONE</BodyText>}
      </View>

      {lesson.body.map((p, i) => (
        <BodyText key={i} color={colors.text} size={13} style={{ marginBottom: 10 }}>{p}</BodyText>
      ))}

      <View style={{ marginTop: 8, padding: 10, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}>
        <BodyText color={colors.gold} size={11} weight="medium" style={{ marginBottom: 8 }}>◆ QUICK CHECK</BodyText>
        <BodyText color={colors.text} size={13} style={{ marginBottom: 10 }}>{lesson.quiz.question}</BodyText>
        <View style={{ gap: 6 }}>
          {lesson.quiz.options.map((opt, i) => {
            const isCorrect = i === lesson.quiz.correctIndex;
            const isPicked = answered === i;
            const showState = answered !== null;
            const optColor = showState && isCorrect ? colors.green : showState && isPicked ? colors.red : colors.border;
            return (
              <Pressable
                key={i}
                disabled={answered !== null}
                onPress={() => setAnswered(i)}
                style={{ padding: 10, borderWidth: 2, borderColor: optColor, backgroundColor: showState && isCorrect ? `${colors.green}14` : 'transparent' }}
              >
                <BodyText color={showState && isCorrect ? colors.green : colors.text} size={12}>{opt}</BodyText>
              </Pressable>
            );
          })}
        </View>
        {answered !== null && (
          <BodyText color={correct ? colors.green : colors.gold} size={12} weight="medium" style={{ marginTop: 10 }}>
            {correct ? '✓ Correct!' : `Not quite — the right answer is highlighted above.`}
          </BodyText>
        )}
      </View>

      {!done && (
        <PixelButton
          color={color}
          disabled={answered === null}
          onPress={onComplete}
          style={{ marginTop: 12, paddingVertical: 14 }}
        >
          ▶ MARK COMPLETE (+25 XP)
        </PixelButton>
      )}
    </Card>
  );
}

export default function CurriculumScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const [level, setLevel] = useState<SkillLevel>(profile?.skill_level ?? 'beginner');
  const [openLessonId, setOpenLessonId] = useState<string | null>(null);

  if (!user || !profile) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }}>
        <BodyText color={colors.muted} size={13}>Loading...</BodyText>
      </ScrollView>
    );
  }

  const lessons = lessonsForLevel(level);
  const completedIds = profile.completed_lessons;
  const completedCount = lessons.filter(l => completedIds.includes(l.id)).length;
  const color = SKILL_LEVEL_COLOR[level];
  const openLesson = lessons.find(l => l.id === openLessonId) ?? null;

  const changeLevel = async (lvl: SkillLevel) => {
    setLevel(lvl);
    setOpenLessonId(null);
    if (profile.skill_level !== lvl) {
      await setSkillLevel(user.id, lvl);
      await refreshProfile();
    }
  };

  const markComplete = async (lessonId: string) => {
    await completeLesson(user.id, lessonId, profile.completed_lessons);
    await refreshProfile();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <PixelText color={colors.blue} size={13} glow>🎓 SKILL PATH</PixelText>
        <BodyText color={colors.muted} size={11} onPress={() => router.back()}>◀ BACK</BodyText>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {SKILL_LEVELS.map(lvl => (
          <Pressable
            key={lvl}
            onPress={() => changeLevel(lvl)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 9,
              paddingVertical: 7,
              borderWidth: 2,
              borderColor: level === lvl ? SKILL_LEVEL_COLOR[lvl] : colors.border,
              backgroundColor: level === lvl ? `${SKILL_LEVEL_COLOR[lvl]}18` : 'transparent',
            }}
          >
            <BodyText size={12}>{SKILL_LEVEL_ICON[lvl]}</BodyText>
            <BodyText color={level === lvl ? SKILL_LEVEL_COLOR[lvl] : colors.text} size={11} weight="semibold">
              {SKILL_LEVEL_LABEL[lvl]}
            </BodyText>
          </Pressable>
        ))}
      </View>

      <Card borderColor={color}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <BodyText color={color} size={12} weight="semibold" glow>{SKILL_LEVEL_LABEL[level]} PROGRESS</BodyText>
          <BodyText color={colors.muted} size={11}>{completedCount}/{lessons.length}</BodyText>
        </View>
        <View style={{ height: 8, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ height: '100%', width: `${lessons.length ? (completedCount / lessons.length) * 100 : 0}%`, backgroundColor: color }} />
        </View>
      </Card>

      {openLesson ? (
        <LessonDetail
          lesson={openLesson}
          color={color}
          done={completedIds.includes(openLesson.id)}
          onComplete={() => markComplete(openLesson.id)}
        />
      ) : (
        <Card>
          {lessons.map((lesson, i) => {
            const done = completedIds.includes(lesson.id);
            return (
              <Pressable
                key={lesson.id}
                onPress={() => setOpenLessonId(lesson.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 12,
                  borderBottomWidth: i === lessons.length - 1 ? 0 : 1,
                  borderBottomColor: colors.border,
                }}
              >
                <PixelText size={18}>{lesson.icon}</PixelText>
                <BodyText color={colors.text} size={13} weight="medium" style={{ flex: 1 }}>{lesson.title}</BodyText>
                <BodyText color={done ? colors.green : colors.border} size={13}>{done ? '✓' : '▶'}</BodyText>
              </Pressable>
            );
          })}
        </Card>
      )}
    </ScrollView>
  );
}
