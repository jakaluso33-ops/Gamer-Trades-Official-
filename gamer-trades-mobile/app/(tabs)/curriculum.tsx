import { useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, PixelText, BodyText, PixelButton } from '../../components/ui';
import { colors } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';
import ConceptDiagram from '../../components/ConceptDiagram';
import QuizPanel from '../../components/QuizPanel';
import TradeWithAiChallenge from '../../components/TradeWithAiChallenge';
import ChartClassroom from '../../components/ChartClassroom';
import {
  SkillLevel,
  SKILL_LEVELS,
  SKILL_LEVEL_LABEL,
  SKILL_LEVEL_ICON,
  SKILL_LEVEL_COLOR,
  lessonsForLevel,
  setSkillLevel,
  completeLesson,
  passQuiz,
  passTradeChallenge,
  isLevelComplete,
  isQuizPassed,
  isTradeChallengePassed,
  isLevelUnlocked,
  isLevelMastered,
  Lesson,
} from '../../lib/curriculum';

type SubTab = 'lessons' | 'quiz' | 'trade' | 'classroom';

function LessonDetail({ lesson, color, onComplete, done }: { lesson: Lesson; color: string; onComplete: () => void; done: boolean }) {
  const [answered, setAnswered] = useState<number | null>(null);
  const router = useRouter();

  const correct = answered === lesson.quiz.correctIndex;

  return (
    <Card borderColor={color}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <PixelText size={24}>{lesson.icon}</PixelText>
        <BodyText color={color} size={15} weight="semibold" glow style={{ flex: 1 }}>{lesson.title}</BodyText>
        {done && <BodyText color={colors.green} size={12}>✓ DONE</BodyText>}
      </View>

      <View style={{ alignItems: 'center', paddingVertical: 14, marginBottom: 14, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}>
        <ConceptDiagram lesson={lesson} height={160} />
        <BodyText color={colors.muted} size={10} style={{ marginTop: 8 }}>WHAT THIS LOOKS LIKE</BodyText>
      </View>

      {lesson.chartConcept && (
        <PixelButton
          color={color}
          onPress={() => router.push({ pathname: '/(tabs)/trade-desk', params: { focusStrategy: lesson.chartConcept } } as never)}
          style={{ marginBottom: 14, paddingVertical: 12 }}
        >
          📡 VIEW LIVE ON CHART
        </PixelButton>
      )}

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
  const [subTab, setSubTab] = useState<SubTab>('lessons');
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

  const lessonsDone = isLevelComplete(profile, level);
  const quizDone = isQuizPassed(profile, level);
  const tradeDone = isTradeChallengePassed(profile, level);
  const mastered = isLevelMastered(profile, level);

  const changeLevel = async (lvl: SkillLevel) => {
    if (!isLevelUnlocked(profile, lvl)) return;
    setLevel(lvl);
    setSubTab('lessons');
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

  const handleQuizPass = async () => {
    await passQuiz(user.id, level, profile.quiz_passed_levels);
    await refreshProfile();
  };

  const handleTradePass = async () => {
    await passTradeChallenge(user.id, level, profile.trade_passed_levels);
    await refreshProfile();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <PixelText color={colors.blue} size={13} glow>🎓 SKILL PATH</PixelText>
        <BodyText color={colors.muted} size={11} onPress={() => router.back()}>◀ BACK</BodyText>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {SKILL_LEVELS.map(lvl => {
          const unlocked = isLevelUnlocked(profile, lvl);
          const done = isLevelMastered(profile, lvl);
          const active = level === lvl;
          return (
            <Pressable
              key={lvl}
              onPress={() => changeLevel(lvl)}
              disabled={!unlocked}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: 9,
                paddingVertical: 7,
                borderWidth: 2,
                opacity: unlocked ? 1 : 0.45,
                borderColor: active ? SKILL_LEVEL_COLOR[lvl] : colors.border,
                backgroundColor: active ? `${SKILL_LEVEL_COLOR[lvl]}18` : 'transparent',
              }}
            >
              <BodyText size={12}>{unlocked ? SKILL_LEVEL_ICON[lvl] : '🔒'}</BodyText>
              <BodyText color={active ? SKILL_LEVEL_COLOR[lvl] : colors.text} size={11} weight="semibold">
                {SKILL_LEVEL_LABEL[lvl]}
              </BodyText>
              {done && <BodyText color={colors.green} size={11}>✓</BodyText>}
            </Pressable>
          );
        })}
      </View>

      {!isLevelUnlocked(profile, level) ? (
        <Card borderColor={colors.muted}>
          <BodyText color={colors.muted} size={13} style={{ textAlign: 'center' }}>
            🔒 Master the previous level's lessons, quiz, and live trade challenge to unlock {SKILL_LEVEL_LABEL[level]}.
          </BodyText>
        </Card>
      ) : (
        <>
          <Card borderColor={color}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <BodyText color={color} size={12} weight="semibold" glow>{SKILL_LEVEL_LABEL[level]} PROGRESS</BodyText>
              {mastered && <BodyText color={colors.green} size={11} weight="semibold">✓ MASTERED</BodyText>}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {[
                { key: 'lessons' as SubTab, label: 'LESSONS', sub: `${completedCount}/${lessons.length}`, done: lessonsDone },
                { key: 'quiz' as SubTab, label: 'QUIZ', sub: quizDone ? 'PASSED' : 'LOCKED', done: quizDone, locked: !lessonsDone },
                { key: 'trade' as SubTab, label: 'TRADE W/ AI', sub: tradeDone ? 'PASSED' : 'LOCKED', done: tradeDone, locked: !quizDone },
                { key: 'classroom' as SubTab, label: 'CLASSROOM', sub: 'LIVE + FREE', done: false, locked: false },
              ].map(t => (
                <Pressable
                  key={t.key}
                  disabled={t.locked}
                  onPress={() => { setSubTab(t.key); setOpenLessonId(null); }}
                  style={{
                    flexBasis: '47%',
                    flexGrow: 1,
                    alignItems: 'center',
                    paddingVertical: 8,
                    borderWidth: 2,
                    opacity: t.locked ? 0.4 : 1,
                    borderColor: subTab === t.key ? color : colors.border,
                    backgroundColor: subTab === t.key ? `${color}18` : 'transparent',
                  }}
                >
                  <BodyText color={t.done ? colors.green : subTab === t.key ? color : colors.text} size={10} weight="semibold">
                    {t.done ? '✓ ' : t.locked ? '🔒 ' : ''}{t.label}
                  </BodyText>
                  <BodyText color={colors.muted} size={9} style={{ marginTop: 2 }}>{t.sub}</BodyText>
                </Pressable>
              ))}
            </View>
          </Card>

          {subTab === 'lessons' && (
            openLesson ? (
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
            )
          )}

          {subTab === 'quiz' && (
            lessonsDone ? (
              <Card borderColor={color}>
                <QuizPanel level={level} color={color} alreadyPassed={quizDone} onPass={handleQuizPass} />
              </Card>
            ) : (
              <Card borderColor={colors.muted}>
                <BodyText color={colors.muted} size={13} style={{ textAlign: 'center' }}>
                  🔒 Finish all lessons in this level to unlock the quiz.
                </BodyText>
              </Card>
            )
          )}

          {subTab === 'trade' && (
            quizDone ? (
              <Card borderColor={color}>
                <TradeWithAiChallenge level={level} color={color} alreadyPassed={tradeDone} onPass={handleTradePass} />
              </Card>
            ) : (
              <Card borderColor={colors.muted}>
                <BodyText color={colors.muted} size={13} style={{ textAlign: 'center' }}>
                  🔒 Pass the quiz to unlock the live Trade With AI challenge.
                </BodyText>
              </Card>
            )
          )}

          {subTab === 'classroom' && (
            <Card borderColor={color}>
              <BodyText color={colors.muted} size={12} style={{ marginBottom: 10 }}>
                Watch a live practice chart form real setups for {SKILL_LEVEL_LABEL[level]} — quiz questions pop up as patterns appear. Purely for reps: no gating, no wrong-answer penalty, just XP.
              </BodyText>
              <ChartClassroom userId={user.id} level={level} color={color} />
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}
