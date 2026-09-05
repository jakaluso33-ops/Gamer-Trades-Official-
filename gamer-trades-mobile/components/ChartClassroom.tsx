import { useEffect, useRef, useState } from 'react';
import { View, Pressable } from 'react-native';
import { BodyText, PixelButton } from './ui';
import { colors } from '../lib/theme';
import { SkillLevel, CURRICULUM, TopicStats, topicsForLevel, awardChartClassroomXp, recordQuizTopicResult } from '../lib/curriculum';
import { runQuizAgent, AiQuizQuestion } from '../lib/quizAgent';
import { Candle, DetectorId, scanStrategies } from '../lib/strategyEngine';
import { getStrategy } from '../lib/strategyContent';
import CandlestickChart from './CandlestickChart';

interface Props {
  userId: string;
  level: SkillLevel;
  color: string;
  topicStats: TopicStats;
  onTopicStatsChange: (next: TopicStats) => void;
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
const PRACTICE_SYMBOL = 'BTC/USD (practice)';

export default function ChartClassroom({ userId, level, color, topicStats, onTopicStatsChange }: Props) {
  const lessons = CURRICULUM[level];
  const topics = topicsForLevel(level);
  const chartConcepts: (DetectorId | undefined)[] = lessons.map(l => l.chartConcept);
  const detectorIds: DetectorId[] = Array.from(new Set(chartConcepts.filter((d): d is DetectorId => d != null)));
  const candlesRef = useRef<Candle[]>(generateCandles(60, BASE_PRICE));
  const [livePrice, setLivePrice] = useState(BASE_PRICE);
  const [, forceTick] = useState(0);
  const [activeSignal, setActiveSignal] = useState(() => scanStrategies(candlesRef.current, detectorIds)[0] ?? null);
  const [question, setQuestion] = useState<AiQuizQuestion | null>(null);
  const [questionContext, setQuestionContext] = useState('');
  const [fetching, setFetching] = useState(false);
  const [answered, setAnswered] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [askedCount, setAskedCount] = useState(0);
  const lastSignalKeyRef = useRef<string | null>(null);
  const lastPromptAtRef = useRef(0);
  const fetchingRef = useRef(false);
  const askedTextsRef = useRef<string[]>([]);
  const topicStatsRef = useRef<TopicStats>(topicStats);
  const questionRef = useRef<AiQuizQuestion | null>(null);

  useEffect(() => { topicStatsRef.current = topicStats; }, [topicStats]);
  useEffect(() => { questionRef.current = question; }, [question]);

  const requestQuestion = async (signal: ReturnType<typeof scanStrategies>[number] | null, price: number) => {
    if (fetchingRef.current || questionRef.current) return;
    fetchingRef.current = true;
    setFetching(true);
    try {
      const strat = signal ? getStrategy(signal.strategyId) : null;
      const q = await runQuizAgent({
        level,
        topics,
        topicStats: topicStatsRef.current,
        recentQuestions: askedTextsRef.current,
        market: { symbol: PRACTICE_SYMBOL, price, signal: signal ? { strategyId: signal.strategyId, label: signal.label, direction: signal.direction, detail: signal.detail } : null },
      });
      askedTextsRef.current = [...askedTextsRef.current, q.question].slice(-8);
      setQuestion(q);
      setQuestionContext(signal ? `🔎 Live on the chart right now: ${strat?.icon ?? ''} ${strat?.name ?? signal.strategyId}` : '🧠 Concept check');
    } catch (err) {
      console.error('quiz-agent failed', err);
    } finally {
      fetchingRef.current = false;
      setFetching(false);
    }
  };

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
      if (!questionRef.current && !fetchingRef.current && now - lastPromptAtRef.current >= PROMPT_COOLDOWN_MS) {
        if (signal) {
          const key = `${signal.strategyId}:${signal.label}`;
          if (key !== lastSignalKeyRef.current) {
            lastSignalKeyRef.current = key;
            lastPromptAtRef.current = now;
            requestQuestion(signal, close);
          }
        } else {
          lastPromptAtRef.current = now;
          requestQuestion(null, close);
        }
      }
    }, 3000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const answer = async (i: number) => {
    if (answered !== null || !question) return;
    setAnswered(i);
    setAskedCount(c => c + 1);
    const isCorrect = i === question.correctIndex;
    if (isCorrect) {
      setCorrectCount(c => c + 1);
      awardChartClassroomXp(userId).catch(console.error);
    }
    try {
      const next = await recordQuizTopicResult(userId, question.topicId, isCorrect, topicStatsRef.current);
      topicStatsRef.current = next;
      onTopicStatsChange(next);
    } catch (err) {
      console.error('recordQuizTopicResult failed', err);
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
            {fetching
              ? '🤖 Writing you a fresh question...'
              : activeSignal
                ? `Watching a ${getStrategy(activeSignal.strategyId)?.name ?? activeSignal.strategyId} setup form — a question's coming...`
                : 'Watching the live chart for a setup to quiz you on...'}
          </BodyText>
        </View>
      )}

      {question && (
        <View style={{ marginTop: 12, padding: 12, backgroundColor: colors.bg, borderWidth: 2, borderColor: color }}>
          <BodyText color={color} size={11} weight="medium" style={{ marginBottom: 8 }}>{questionContext}</BodyText>
          <BodyText color={colors.text} size={13} style={{ marginBottom: 10 }}>{question.question}</BodyText>
          <View style={{ gap: 6 }}>
            {question.options.map((opt, i) => {
              const isCorrect = i === question.correctIndex;
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
              <BodyText color={answered === question.correctIndex ? colors.green : colors.gold} size={12} weight="medium" style={{ marginTop: 10 }}>
                {answered === question.correctIndex ? `✓ Correct! +8 XP — ${question.explanation}` : `Not quite — ${question.explanation}`}
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
