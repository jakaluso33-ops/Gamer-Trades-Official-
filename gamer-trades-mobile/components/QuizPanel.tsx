import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { PixelText, BodyText, PixelButton } from './ui';
import { colors } from '../lib/theme';
import { SkillLevel, QuizQuestion, drawQuiz, quizPassThreshold } from '../lib/curriculum';

interface Props {
  level: SkillLevel;
  color: string;
  alreadyPassed: boolean;
  onPass: () => void;
}

export default function QuizPanel({ level, color, alreadyPassed, onPass }: Props) {
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => drawQuiz(level));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const threshold = quizPassThreshold(level);
  const q = questions[index];

  const restart = () => {
    setQuestions(drawQuiz(level));
    setIndex(0);
    setPicked(null);
    setCorrectCount(0);
    setFinished(false);
  };

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const isCorrect = i === q.correctIndex;
    const nextCorrect = correctCount + (isCorrect ? 1 : 0);
    setCorrectCount(nextCorrect);
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
      if (correctCount >= threshold) onPass();
      return;
    }
    setIndex(index + 1);
    setPicked(null);
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
          {correctCount}/{questions.length} CORRECT
        </BodyText>
        <BodyText color={colors.muted} size={12} style={{ marginTop: 6, textAlign: 'center' }}>
          {passed
            ? 'Quiz passed! This counts toward unlocking the next level.'
            : `Needed ${threshold}/${questions.length} to pass — review the lessons and try again.`}
        </BodyText>
        <PixelButton color={color} onPress={restart} style={{ marginTop: 14, paddingHorizontal: 20 }}>
          ▶ {passed ? 'RETAKE' : 'TRY AGAIN'}
        </PixelButton>
      </View>
    );
  }

  return (
    <View>
      <BodyText color={colors.muted} size={11} style={{ marginBottom: 10 }}>QUESTION {index + 1} OF {questions.length}</BodyText>
      <BodyText color={colors.text} size={14} style={{ marginBottom: 14 }}>{q.question}</BodyText>
      <View style={{ gap: 8 }}>
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correctIndex;
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
        <PixelButton color={color} onPress={next} style={{ marginTop: 16, paddingVertical: 14 }}>
          {index + 1 >= questions.length ? '▶ SEE RESULTS' : '▶ NEXT QUESTION'}
        </PixelButton>
      )}
    </View>
  );
}
