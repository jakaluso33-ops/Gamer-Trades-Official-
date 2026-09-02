import { useState, useEffect, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Card, PixelText, BodyText, PixelButton, Avatar } from '../../components/ui';
import { colors } from '../../lib/theme';
import PvpBattle from '../../components/PvpBattle';
import { useAuth } from '../../lib/AuthContext';
import { logEvent } from '../../lib/activity';
import { recordAiBattle, AiOpponentId, AiDifficulty } from '../../lib/aiBattles';
import { canPlayAiBattle, canPlayPvp, Plan } from '../../lib/plans';
import UpgradeGate from '../../components/UpgradeGate';
import CandlestickChart, { ChartPosition } from '../../components/CandlestickChart';
import { Candle, DetectorId, StrategySignal, scanStrategies } from '../../lib/strategyEngine';
import { getStrategy } from '../../lib/strategyContent';

const AI_OPPONENTS: { id: AiOpponentId; name: string; icon: string; difficulty: AiDifficulty; color: string; qty: number; holdTicks: number }[] = [
  { id: 'algoace', name: 'ALGO ACE', icon: '🤖', difficulty: 'VETERAN', color: colors.blue, qty: 3, holdTicks: 7 },
  { id: 'trendtina', name: 'TREND TINA', icon: '⚡', difficulty: 'LEGEND', color: colors.purple, qty: 5, holdTicks: 10 },
  { id: 'gridgareth', name: 'GRID GARETH', icon: '🧙', difficulty: 'ROOKIE', color: colors.gold, qty: 2, holdTicks: 4 },
];

const BATTLE_DURATION_SECONDS = 300;
const CANDLE_TICK_MS = 2000;
const PLAYER_QTY = 3;
const ALL_DETECTORS = Object.keys({ breakout: 0, orb: 0, fibonacci: 0, support_resistance: 0, ma_crossover: 0, rsi_reversal: 0 }) as DetectorId[];
const BASE_PRICE = 100;

function generateCandles(count: number, basePrice: number): Candle[] {
  const candles: Candle[] = [];
  let price = basePrice;
  const now = Date.now();
  for (let i = count; i >= 0; i--) {
    const open = price;
    const change = (Math.random() - 0.48) * price * 0.01;
    const close = Math.max(1, open + change);
    const high = Math.max(open, close) + Math.random() * price * 0.004;
    const low = Math.min(open, close) - Math.random() * price * 0.004;
    candles.push({ time: now - i * CANDLE_TICK_MS, open, high, low, close, volume: Math.floor(Math.random() * 500000 + 50000) });
    price = close;
  }
  return candles;
}

interface OpenPosition {
  direction: 'long' | 'short';
  entryPrice: number;
  quantity: number;
  ticksHeld: number;
}

function AiBattle() {
  const { user } = useAuth();
  const [selectedAI, setSelectedAI] = useState(AI_OPPONENTS[0]);
  const [phase, setPhase] = useState<'select' | 'battle' | 'result'>('select');
  const [playerPnL, setPlayerPnL] = useState(0);
  const [aiPnL, setAiPnL] = useState(0);
  const [playerTrades, setPlayerTrades] = useState(0);
  const [aiTrades, setAiTrades] = useState(0);
  const [playerPos, setPlayerPos] = useState<OpenPosition | null>(null);
  const [aiPos, setAiPos] = useState<OpenPosition | null>(null);
  const [livePrice, setLivePrice] = useState(BASE_PRICE);
  const [activeSignal, setActiveSignal] = useState<StrategySignal | null>(null);
  const [timeLeft, setTimeLeft] = useState(BATTLE_DURATION_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const marketRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordedRef = useRef(false);
  const candlesRef = useRef<Candle[]>(generateCandles(60, BASE_PRICE));
  const livePriceRef = useRef(BASE_PRICE);
  useEffect(() => { livePriceRef.current = livePrice; }, [livePrice]);

  const startBattle = () => {
    candlesRef.current = generateCandles(60, BASE_PRICE);
    livePriceRef.current = BASE_PRICE;
    setLivePrice(BASE_PRICE);
    setActiveSignal(null);
    setPlayerPnL(0);
    setAiPnL(0);
    setPlayerTrades(0);
    setAiTrades(0);
    setPlayerPos(null);
    setAiPos(null);
    recordedRef.current = false;
    setTimeLeft(BATTLE_DURATION_SECONDS);
    setPhase('battle');
  };

  const closePosition = (pos: OpenPosition, price: number): number => {
    return pos.direction === 'long' ? (price - pos.entryPrice) * pos.quantity : (pos.entryPrice - price) * pos.quantity;
  };

  useEffect(() => {
    if (phase !== 'battle') return;

    marketRef.current = setInterval(() => {
      const prev = candlesRef.current;
      const last = prev[prev.length - 1];
      const open = last.close;
      const change = (Math.random() - 0.48) * open * 0.01;
      const close = Math.max(1, open + change);
      const high = Math.max(open, close) + Math.random() * open * 0.004;
      const low = Math.min(open, close) - Math.random() * open * 0.004;
      const newCandle: Candle = { time: Date.now(), open, high, low, close, volume: Math.floor(Math.random() * 500000 + 50000) };
      candlesRef.current = [...prev.slice(-119), newCandle];
      setLivePrice(close);

      const signals = scanStrategies(candlesRef.current, ALL_DETECTORS);
      const signal = signals[0] ?? null;
      setActiveSignal(signal);

      // The AI opponent trades off the exact same live signal panel the player sees —
      // it opens on a fresh setup, flips on an opposing one, and force-closes if it
      // overstays its difficulty's hold window.
      setAiPos(prevPos => {
        if (prevPos) {
          const ticksHeld = prevPos.ticksHeld + 1;
          const opposing = !!signal && ((signal.direction === 'bullish' && prevPos.direction === 'short') || (signal.direction === 'bearish' && prevPos.direction === 'long'));
          if (opposing || ticksHeld >= selectedAI.holdTicks) {
            const pnl = closePosition(prevPos, close);
            setAiPnL(p => parseFloat((p + pnl).toFixed(2)));
            setAiTrades(t => t + 1);
            if (opposing && signal) {
              return { direction: signal.direction === 'bullish' ? 'long' : 'short', entryPrice: close, quantity: selectedAI.qty, ticksHeld: 0 };
            }
            return null;
          }
          return { ...prevPos, ticksHeld };
        }
        if (signal) {
          return { direction: signal.direction === 'bullish' ? 'long' : 'short', entryPrice: close, quantity: selectedAI.qty, ticksHeld: 0 };
        }
        return null;
      });
    }, CANDLE_TICK_MS);

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (marketRef.current) clearInterval(marketRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
          // Force-close any still-open positions at the final live price so both sides end fully realized.
          setPlayerPos(prev => {
            if (!prev) return null;
            const pnl = closePosition(prev, livePriceRef.current);
            setPlayerPnL(p => parseFloat((p + pnl).toFixed(2)));
            setPlayerTrades(c => c + 1);
            return null;
          });
          setAiPos(prev => {
            if (!prev) return null;
            const pnl = closePosition(prev, livePriceRef.current);
            setAiPnL(p => parseFloat((p + pnl).toFixed(2)));
            setAiTrades(c => c + 1);
            return null;
          });
          setPhase('result');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (marketRef.current) clearInterval(marketRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const trade = (side: 'buy' | 'sell') => {
    const dir: 'long' | 'short' = side === 'buy' ? 'long' : 'short';
    setPlayerPos(prev => {
      if (!prev) return { direction: dir, entryPrice: livePriceRef.current, quantity: PLAYER_QTY, ticksHeld: 0 };
      if (prev.direction === dir) return prev;
      const pnl = closePosition(prev, livePriceRef.current);
      setPlayerPnL(p => parseFloat((p + pnl).toFixed(2)));
      setPlayerTrades(t => t + 1);
      if (user) logEvent(user.id, 'trade_closed', { context: 'ai_battle' });
      return null;
    });
  };

  // Record battle completion once when the result phase is reached
  useEffect(() => {
    if (phase !== 'result' || !user || recordedRef.current) return;
    recordedRef.current = true;
    logEvent(user.id, 'ai_battle_played', { aiId: selectedAI.id });
    if (playerPnL > aiPnL) logEvent(user.id, 'ai_battle_won', { aiId: selectedAI.id });
    recordAiBattle(user.id, {
      opponentId: selectedAI.id,
      difficulty: selectedAI.difficulty,
      mode: 'scalp',
      durationSeconds: BATTLE_DURATION_SECONDS,
      playerPnl: playerPnL,
      aiPnl: aiPnL,
      playerTrades,
      aiTrades,
    }).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const playerWon = playerPnL > aiPnL;
  const playerUnrealized = playerPos ? closePosition(playerPos, livePrice) : 0;
  const aiUnrealized = aiPos ? closePosition(aiPos, livePrice) : 0;
  const playerDisplayPnL = playerPnL + playerUnrealized;
  const aiDisplayPnL = aiPnL + aiUnrealized;
  const chartPositions: ChartPosition[] = [
    ...(playerPos ? [{ entryPrice: playerPos.entryPrice, direction: playerPos.direction, quantity: playerPos.quantity }] : []),
    ...(aiPos ? [{ entryPrice: aiPos.entryPrice, direction: aiPos.direction, quantity: aiPos.quantity }] : []),
  ];

  if (phase === 'select') {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
        <PixelText color={colors.purple} size={7} glow>★ CHOOSE AI OPPONENT</PixelText>
        {AI_OPPONENTS.map(ai => (
          <Card key={ai.id} borderColor={selectedAI.id === ai.id ? ai.color : colors.border} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <PixelText size={28}>{ai.icon}</PixelText>
            <View style={{ flex: 1 }}>
              <BodyText color={ai.color} size={15} weight="semibold" glow>{ai.name}</BodyText>
              <BodyText color={colors.muted} size={11} style={{ marginTop: 4 }}>{ai.difficulty}</BodyText>
            </View>
            <PixelButton color={selectedAI.id === ai.id ? ai.color : colors.muted} onPress={() => setSelectedAI(ai)} style={{ paddingHorizontal: 10, paddingVertical: 7 }}>
              {selectedAI.id === ai.id ? 'SELECTED' : 'SELECT'}
            </PixelButton>
          </Card>
        ))}
        <PixelButton color={colors.green} onPress={startBattle} style={{ paddingVertical: 16 }}>▶ START BATTLE</PixelButton>
      </ScrollView>
    );
  }

  if (phase === 'result') {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100, alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
        <Card borderColor={playerWon ? colors.green : colors.red} style={{ width: '100%', padding: 24, alignItems: 'center' }}>
          <PixelText size={40}>{playerWon ? '🏆' : '😵'}</PixelText>
          <PixelText color={playerWon ? colors.green : colors.red} size={14} glow style={{ marginTop: 10 }}>
            {playerWon ? 'YOU WIN!' : 'AI WINS!'}
          </PixelText>
          <View style={{ flexDirection: 'row', gap: 10, width: '100%', marginVertical: 16 }}>
            <View style={{ flex: 1, padding: 10, backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.border }}>
              <BodyText color={colors.muted} size={11}>YOUR P&amp;L</BodyText>
              <PixelText color={playerPnL >= 0 ? colors.green : colors.red} size={10} style={{ marginTop: 4 }}>{playerPnL >= 0 ? '+' : ''}${playerPnL.toFixed(2)}</PixelText>
            </View>
            <View style={{ flex: 1, padding: 10, backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.border }}>
              <BodyText color={colors.muted} size={11}>{selectedAI.name}</BodyText>
              <PixelText color={aiPnL >= 0 ? colors.green : colors.red} size={10} style={{ marginTop: 4 }}>{aiPnL >= 0 ? '+' : ''}${aiPnL.toFixed(2)}</PixelText>
            </View>
          </View>
          <PixelButton color={colors.blue} onPress={() => setPhase('select')} style={{ width: '100%' }}>◀ NEW BATTLE</PixelButton>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <PixelText color={colors.red} size={7} glow>⚔ BATTLE IN PROGRESS</PixelText>
        <PixelText color={timeLeft < 30 ? colors.red : colors.gold} size={12} glow>{formatTime(timeLeft)}</PixelText>
      </View>
      <Card borderColor={colors.purple}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
          <View style={{ alignItems: 'center' }}>
            <Avatar size={40} />
            <BodyText color={colors.cyan} size={12} weight="medium" style={{ marginTop: 6 }}>YOU</BodyText>
            <PixelText color={playerDisplayPnL >= 0 ? colors.green : colors.red} size={12} glow style={{ marginTop: 4 }}>
              {playerDisplayPnL >= 0 ? '+' : ''}${playerDisplayPnL.toFixed(2)}
            </PixelText>
            {playerPos && <BodyText color={colors.muted} size={9} style={{ marginTop: 2 }}>{playerPos.direction.toUpperCase()} OPEN</BodyText>}
          </View>
          <PixelText color={colors.red} size={12} glow>VS</PixelText>
          <View style={{ alignItems: 'center' }}>
            <Avatar size={40} emoji={selectedAI.icon} borderColor={selectedAI.color} />
            <BodyText color={selectedAI.color} size={12} weight="medium" style={{ marginTop: 6 }}>{selectedAI.name}</BodyText>
            <PixelText color={aiDisplayPnL >= 0 ? colors.green : colors.red} size={12} glow style={{ marginTop: 4 }}>
              {aiDisplayPnL >= 0 ? '+' : ''}${aiDisplayPnL.toFixed(2)}
            </PixelText>
            {aiPos && <BodyText color={colors.muted} size={9} style={{ marginTop: 2 }}>{aiPos.direction.toUpperCase()} OPEN</BodyText>}
          </View>
        </View>
      </Card>

      <CandlestickChart
        symbol="AI Battle Arena"
        basePrice={BASE_PRICE}
        livePrice={livePrice}
        tickMs={CANDLE_TICK_MS}
        height={180}
        signal={activeSignal}
        positions={chartPositions}
      />

      <Card>
        <BodyText color={colors.cyan} size={12} weight="semibold" glow style={{ marginBottom: 6 }}>YOUR MOVES</BodyText>
        <BodyText color={colors.muted} size={10} style={{ marginBottom: 10 }}>
          {playerPos
            ? `Long/short is real — you're ${playerPos.direction.toUpperCase()} from $${playerPos.entryPrice.toFixed(2)}. Press the opposite side to close.`
            : 'Trade the same live signals the AI is watching — BUY opens a long, SELL opens a short.'}
        </BodyText>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <PixelButton color={colors.green} onPress={() => trade('buy')} style={{ flex: 1, paddingVertical: 16 }}>
            {playerPos?.direction === 'short' ? '✕ CLOSE SHORT' : '▲ BUY'}
          </PixelButton>
          <PixelButton color={colors.red} onPress={() => trade('sell')} style={{ flex: 1, paddingVertical: 16 }}>
            {playerPos?.direction === 'long' ? '✕ CLOSE LONG' : '▼ SELL'}
          </PixelButton>
        </View>
      </Card>
    </ScrollView>
  );
}

export default function BattleScreen() {
  const params = useLocalSearchParams<{ challenge?: string }>();
  const [mode, setMode] = useState<'ai' | 'friend'>(params.challenge ? 'friend' : 'ai');
  const { profile } = useAuth();
  const plan = (profile?.plan ?? 'free') as Plan;
  const locked = mode === 'ai' ? !canPlayAiBattle(plan) : !canPlayPvp(plan);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 60 }}>
        <PixelText color={colors.cyan} size={13} glow>⚔ BATTLE ARENA</PixelText>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 0 }}>
        <PixelButton color={mode === 'ai' ? colors.purple : colors.muted} onPress={() => setMode('ai')} style={{ flex: 1 }}>★ AI MODE</PixelButton>
        <PixelButton color={mode === 'friend' ? colors.cyan : colors.muted} onPress={() => setMode('friend')} style={{ flex: 1 }}>⚔ VS FRIEND</PixelButton>
      </View>
      {locked ? (
        <View style={{ padding: 16 }}>
          <UpgradeGate
            title={mode === 'ai' ? '★ AI BATTLES ARE A PRO FEATURE' : '⚔ PVP BATTLES ARE A PRO FEATURE'}
            description={
              mode === 'ai'
                ? 'Free accounts get the full 6-market trading experience, but battling AI opponents is reserved for Pro traders.'
                : 'Free accounts get the full 6-market trading experience, but live PvP battles against friends are reserved for Pro traders.'
            }
          />
        </View>
      ) : mode === 'ai' ? (
        <AiBattle />
      ) : (
        <PvpBattle presetChallengeId={params.challenge} />
      )}
    </View>
  );
}
