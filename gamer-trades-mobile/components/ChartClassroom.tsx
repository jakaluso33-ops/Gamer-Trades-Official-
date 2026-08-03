import { useEffect, useRef, useState } from 'react';
import { View, Pressable } from 'react-native';
import { BodyText, PixelButton } from './ui';
import { colors } from '../lib/theme';
import { SkillLevel, CURRICULUM, QuizQuestion, awardChartClassroomXp } from '../lib/curriculum';
import { Candle, DetectorId, scanStrategies } from '../lib/strategyEngine';
import { getStrategy } from '../lib/strategyContent';
import CandlestickChart from './CandlestickChart';

interface Props {
  userId: string;
  level: SkillLevel;
  color: string;
}

interface ActiveQuestion {
  quiz: QuizQuestion;
  context: string;
}

function generateCandles(count: number, basePrice: number): Candle[] {
  const candles: Candle[] = [];
  let price = basePrice;
  const now = Date.now();
  for (let i = count; i >= 0; i--) {
    const open = price;
    const change = (Math.random() - 0.48) * price * 0.012;
    const close = Math.max(1, open + change);
    const high = Math.max(open, close) + Math.random() * price * 0.005;
    const low = Math.min(open, close) - Math.random() * price * 0.005;
    candles.push({ time: now - i * 60000, open, high, low, close, volume: Math.floor(Math.random() * 500000 + 50000) });
    price = close;
  }
  return candles;
}

const BASE_PRICE = 24000;
const PROMPT_COOLDOWN_MS = 6000;

export default function ChartClassroom({ userId, level, color }: Props) {
  const lessons = CURRICULUM[level];
  const detectorIds = Array.from(new Set(lessons.map(l => l.chartConcept).filter((d): d is DetectorId => !!d)));
  const candlesRef = useRef<Candle[]>(generateCandles(60, BASE_PRICE));
  const [livePrice, setLivePrice] = useState(BASE_PRICE);
  const [, forceTick] = useState(0);
  const [activeSignal, setActiveSignal] = useState(() => scanStrategies(candlesRef.current, detectorIds)[0] ?? null);
  const [question, setQuestion] = useState<ActiveQuestion | null>(null);
  const [answered, setAnswered] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [askedCount, setAskedCount] = useState(0);
  const lastSignalKeyRef = useRef<string | null>(null);
  const lastPromptAtRef = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      const prev = candlesRef.current;
      const last = prev[prev.length - 1];
      const open = last.close;
      const close = Math.max(1, open + (Math.random() - 0.48) * open * 0.008);
      const high = Math.max(open, close) + Math.random() * open * 0.003;
      const low = Math.min(open, close) - Math.random() * open * 0.003;
      const newCandle: Candle = { time: Date.now(), open, high, low, close, volume: Math.floor(Math.random() * 500000 + 50000) };
      candlesRef.current = [...prev.slice(-59), newCandle];
      setLivePrice(close);
      forceTick(t => t + 1);

      const signals = scanStrategies(candlesRef.current, detectorIds);
      const signal = signals[0] ?? null;
      setActiveSignal(signal);

      const now = Date.now();
      if (!question && now - lastPromptAtRef.current >= PROMPT_COOLDOWN_MS) {
        if (signal) {
          const key = `${signal.strategyId}:${signal.label}`;
          const lesson = lessons.find(l => l.chartConcept === signal.strategyId);
          if (lesson && key !== lastSignalKeyRef.current) {
            lastSignalKeyRef.current = key;
            lastPromptAtRef.current = now;
            const strat = getStrategy(signal.strategyId);
            setQuestion({ quiz: lesson.quiz, context: `🔎 Live on the chart right now: ${strat?.icon ?? ''} ${strat?.name ?? lesson.title}` });
          }
        } else {
          lastPromptAtRef.current = now;
          const lesson = lessons[Math.floor(Math.random() * lessons.length)];
          setQuestion({ quiz: lesson.quiz, context: '🧠 Concept check' });
        }
      }
    }, 3000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const answer = (i: number) => {
    if (answered !== null || !question) return;
    setAnswered(i);
    setAskedCount(c => c + 1);
    if (i === question.quiz.correctIndex) {
      setCorrectCount(c => c + 1);
      awardChartClassroomXp(userId).catch(console.error);
    }
  };

  const next = () => {
    setQuestion(null);
    setAnswered(null);
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <BodyText color={color} size={12} weight="semibold">SESSION: {correctCount}/{askedCount} correct</BodyText>
        <BodyText color={colors.muted} size={11}>+8 XP per correct</BodyText>
      </View>

      <CandlestickChart symbol="Practice Chart" basePrice={BASE_PRICE} livePrice={livePrice} height={180} signal={activeSignal} />

      {!question && (
        <View style={{ marginTop: 12, padding: 12, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
          <BodyText color={colors.muted} size={12} style={{ textAlign: 'center' }}>
            {activeSignal
              ? `Watching a ${getStrategy(activeSignal.strategyId)?.name ?? activeSignal.strategyId} setup form — a question's coming...`
              : 'Watching the live chart for a setup to quiz you on...'}
          </BodyText>
        </View>
      )}

      {question && (
        <View style={{ marginTop: 12, padding: 12, backgroundColor: colors.bg, borderWidth: 2, borderColor: color }}>
          <BodyText color={color} size={11} weight="medium" style={{ marginBottom: 8 }}>{question.context}</BodyText>
          <BodyText color={colors.text} size={13} style={{ marginBottom: 10 }}>{question.quiz.question}</BodyText>
          <View style={{ gap: 6 }}>
            {question.quiz.options.map((opt, i) => {
              const isCorrect = i === question.quiz.correctIndex;
              const isPicked = answered === i;
              const showState = answered !== null;
              const optColor = showState && isCorrect ? colors.green : showState && isPicked ? colors.red : colors.border;
              return (
                <Pressable
                  key={i}
                  disabled={answered !== null}
                  onPress={() => answer(i)}
                  style={{ padding: 10, borderWidth: 2, borderColor: optColor, backgroundColor: showState && isCorrect ? `${colors.green}14` : 'transparent' }}
                >
                  <BodyText color={showState && isCorrect ? colors.green : colors.text} size={12}>{opt}</BodyText>
                </Pressable>
              );
            })}
          </View>

          {answered !== null && (
            <>
              <BodyText color={answered === question.quiz.correctIndex ? colors.green : colors.gold} size={12} weight="medium" style={{ marginTop: 10 }}>
                {answered === question.quiz.correctIndex ? '✓ Correct! +8 XP' : 'Not quite — the right answer is highlighted above.'}
              </BodyText>
              <PixelButton color={color} onPress={next} style={{ marginTop: 10, paddingVertical: 12 }}>
                ▶ KEEP WATCHING
              </PixelButton>
            </>
          )}
        </View>
      )}
    </View>
  );
}
