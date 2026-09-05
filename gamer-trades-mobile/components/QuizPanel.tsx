import { useEffect, useRef, useState } from 'react';
import { View, Pressable } from 'react-native';
import { PixelText, BodyText, PixelButton } from './ui';
import { colors } from '../lib/theme';
import { SkillLevel, TopicStats, topicsForLevel, quizPassThreshold, recordQuizTopicResult, QUIZ_SIZE } from '../lib/curriculum';
import { runQuizAgent, AiQuizQuestion } from '../lib/quizAgent';
import { fetchLiveQuotes } from '../lib/marketData';

interface Props {
  userId: string;
  level: SkillLevel;
  color: string;
  alreadyPassed: boolean;
  topicStats: TopicStats;
  onPass: () => void;
  onTopicStatsChange: (next: TopicStats) => void;
}

const GROUNDING_SYMBOL = 'BTC/USD';

export default function QuizPanel({ userId, level, color, alreadyPassed, topicStats, onPass, onTopicStatsChange }: Props) {
  const [question, setQuestion] = useState<AiQuizQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [askedCount, setAskedCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const askedRef = useRef<string[]>([]);
  const statsRef = useRef<TopicStats>(topicStats);
  const runIdRef = useRef(0);

  const threshold = quizPassThreshold(level);
  const topics = topicsForLevel(level);

  const fetchNext = async () => {
    const myRun = ++runIdRef.current;
    setLoading(true);
    setErrored(false);
    setPicked(null);
    try {
      let market = null;
      try {
        const quotes = await fetchLiveQuotes([GROUNDING_SYMBOL]);
        const q = quotes[GROUNDING_SYMBOL];
        if (q) market = { symbol: GROUNDING_SYMBOL, price: q.price, changePct: q.changePct };
      } catch {
        // live grounding is best-effort; fall back to a concept-only question
      }
      const q = await runQuizAgent({
        level,
        topics,
        topicStats: statsRef.current,
        recentQuestions: askedRef.current,
        market,
      });
      if (myRun !== runIdRef.current) return;
      askedRef.current = [...askedRef.current, q.question].slice(-8);
      setQuestion(q);
    } catch (err) {
      console.error('quiz-agent failed', err);
      if (myRun === runIdRef.current) setErrored(true);
    } finally {
      if (myRun === runIdRef.current) setLoading(false);
    }
  };

  const restart = () => {
    setIndex0();
  };

  function setIndex0() {
    setAskedCount(0);
    setCorrectCount(0);
    setFinished(false);
    askedRef.current = [];
    fetchNext();
  }

  useEffect(() => {
    fetchNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const choose = async (i: number) => {
    if (picked !== null || !question) return;
    setPicked(i);
    const isCorrect = i === question.correctIndex;
    const nextCorrect = correctCount + (isCorrect ? 1 : 0);
    setCorrectCount(nextCorrect);
    try {
      const next = await recordQuizTopicResult(userId, question.topicId, isCorrect, statsRef.current);
      statsRef.current = next;
      onTopicStatsChange(next);
    } catch (err) {
      console.error('recordQuizTopicResult failed', err);
    }
  };

  const next = () => {
    const nextAsked = askedCount + 1;
    setAskedCount(nextAsked);
    if (nextAsked >= QUIZ_SIZE) {
      setFinished(true);
      if (correctCount >= threshold) onPass();
      return;
    }
    fetchNext();
  };

  if (alreadyPassed && !finished) {
    return (
      <View style={{ alignItems: 'center', padding: 20 }}>
        <PixelText size={30}>✅</PixelText>
        <BodyText color={colors.green} size={14} weight="semibold" style={{ marginTop: 10 }}>QUIZ ALREADY PASSED</BodyText>
        <BodyText color={colors.muted} size={12} style={{ marginTop: 6, textAlign: 'center' }}>
          You can retake it anytime for practice — it won't affect your progress.
        </BodyText>
        <PixelButton color={color} onPress={restart} style={{ marginTop: 14, paddingHorizontal: 20 }}>▶ RETAKE FOR PRACTICE</PixelButton>
      </View>
    );
  }

  if (finished) {
    const passed = correctCount >= threshold;
    return (
      <View style={{ alignItems: 'center', padding: 20 }}>
        <PixelText size={30}>{passed ? '🎉' : '📚'}</PixelText>
        <BodyText color={passed ? colors.green : colors.gold} size={16} weight="semibold" style={{ marginTop: 10 }}>
          {correctCount}/{QUIZ_SIZE} CORRECT
        </BodyText>
        <BodyText color={colors.muted} size={12} style={{ marginTop: 6, textAlign: 'center' }}>
          {passed
            ? 'Quiz passed! This counts toward unlocking the next level.'
            : `Needed ${threshold}/${QUIZ_SIZE} to pass — review the lessons and try again.`}
        </BodyText>
        <PixelButton color={color} onPress={restart} style={{ marginTop: 14, paddingHorizontal: 20 }}>
          ▶ {passed ? 'RETAKE' : 'TRY AGAIN'}
        </PixelButton>
      </View>
    );
  }

  if (loading || !question) {
    return (
      <View style={{ alignItems: 'center', padding: 20 }}>
        <BodyText color={colors.muted} size={12}>🤖 Writing you a fresh question...</BodyText>
      </View>
    );
  }

  if (errored) {
    return (
      <View style={{ alignItems: 'center', padding: 20 }}>
        <BodyText color={colors.muted} size={12} style={{ textAlign: 'center', marginBottom: 12 }}>
          Couldn't reach the quiz agent just now.
        </BodyText>
        <PixelButton color={color} onPress={fetchNext} style={{ paddingHorizontal: 20 }}>↻ RETRY</PixelButton>
      </View>
    );
  }

  return (
    <View>
      <BodyText color={colors.muted} size={11} style={{ marginBottom: 10 }}>QUESTION {askedCount + 1} OF {QUIZ_SIZE}</BodyText>
      <BodyText color={colors.text} size={14} style={{ marginBottom: 14 }}>{question.question}</BodyText>
      <View style={{ gap: 8 }}>
        {question.options.map((opt, i) => {
          const isCorrect = i === question.correctIndex;
          const isPicked = picked === i;
          const show = picked !== null;
          const optColor = show && isCorrect ? colors.green : show && isPicked ? colors.red : colors.border;
          return (
            <Pressable
              key={i}
              disabled={picked !== null}
              onPress={() => choose(i)}
              style={{ padding: 12, borderWidth: 2, borderColor: optColor, backgroundColor: show && isCorrect ? `${colors.green}14` : 'transparent' }}
            >
              <BodyText color={show && isCorrect ? colors.green : colors.text} size={13}>{opt}</BodyText>
            </Pressable>
          );
        })}
      </View>
      {picked !== null && (
        <>
          <BodyText color={colors.gold} size={11} style={{ marginTop: 12 }}>{question.explanation}</BodyText>
          <PixelButton color={color} onPress={next} style={{ marginTop: 12, paddingVertical: 14 }}>
            {askedCount + 1 >= QUIZ_SIZE ? '▶ SEE RESULTS' : '▶ NEXT QUESTION'}
          </PixelButton>
        </>
      )}
    </View>
  );
}
