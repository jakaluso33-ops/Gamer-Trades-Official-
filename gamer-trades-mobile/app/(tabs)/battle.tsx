import { useState, useEffect, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Card, PixelText, BodyText, PixelButton, Avatar } from '../../components/ui';
import { colors } from '../../lib/theme';
import PvpBattle from '../../components/PvpBattle';
import { useAuth } from '../../lib/AuthContext';
import { logEvent } from '../../lib/activity';
import { recordAiBattle, AiOpponentId, AiDifficulty } from '../../lib/aiBattles';
import { canPlayAiBattle, canPlayPvp } from '../../lib/plans';
import UpgradeGate from '../../components/UpgradeGate';

const AI_OPPONENTS: { id: AiOpponentId; name: string; icon: string; difficulty: AiDifficulty; color: string }[] = [
  { id: 'algoace', name: 'ALGO ACE', icon: '🤖', difficulty: 'VETERAN', color: colors.blue },
  { id: 'trendtina', name: 'TREND TINA', icon: '⚡', difficulty: 'LEGEND', color: colors.purple },
  { id: 'gridgareth', name: 'GRID GARETH', icon: '🧙', difficulty: 'ROOKIE', color: colors.gold },
];

const BATTLE_DURATION_SECONDS = 300;

function AiBattle() {
  const { user } = useAuth();
  const [selectedAI, setSelectedAI] = useState(AI_OPPONENTS[0]);
  const [phase, setPhase] = useState<'select' | 'battle' | 'result'>('select');
  const [playerPnL, setPlayerPnL] = useState(0);
  const [aiPnL, setAiPnL] = useState(0);
  const [playerTrades, setPlayerTrades] = useState(0);
  const [aiTrades, setAiTrades] = useState(0);
  const [timeLeft, setTimeLeft] = useState(BATTLE_DURATION_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordedRef = useRef(false);

  const startBattle = () => {
    setPlayerPnL(0);
    setAiPnL(0);
    setPlayerTrades(0);
    setAiTrades(0);
    recordedRef.current = false;
    setTimeLeft(BATTLE_DURATION_SECONDS);
    setPhase('battle');
  };

  useEffect(() => {
    if (phase !== 'battle') return;
    aiRef.current = setInterval(() => {
      const delta = (Math.random() - 0.42) * 120;
      setAiPnL(p => parseFloat((p + delta).toFixed(2)));
      setAiTrades(t => t + 1);
    }, 4000);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (aiRef.current) clearInterval(aiRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
          setPhase('result');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (aiRef.current) clearInterval(aiRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const trade = (side: 'buy' | 'sell') => {
    const delta = (Math.random() - 0.45) * 100;
    setPlayerPnL(p => parseFloat((p + delta).toFixed(2)));
    setPlayerTrades(t => t + 1);
    if (user) logEvent(user.id, 'trade_closed', { context: 'ai_battle' });
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

  if (phase === 'select') {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
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
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
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
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <PixelText color={colors.red} size={7} glow>⚔ BATTLE IN PROGRESS</PixelText>
        <PixelText color={timeLeft < 30 ? colors.red : colors.gold} size={12} glow>{formatTime(timeLeft)}</PixelText>
      </View>
      <Card borderColor={colors.purple}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
          <View style={{ alignItems: 'center' }}>
            <Avatar size={40} />
            <BodyText color={colors.cyan} size={12} weight="medium" style={{ marginTop: 6 }}>YOU</BodyText>
            <PixelText color={playerPnL >= 0 ? colors.green : colors.red} size={12} glow style={{ marginTop: 4 }}>
              {playerPnL >= 0 ? '+' : ''}${playerPnL.toFixed(2)}
            </PixelText>
          </View>
          <PixelText color={colors.red} size={12} glow>VS</PixelText>
          <View style={{ alignItems: 'center' }}>
            <Avatar size={40} emoji={selectedAI.icon} borderColor={selectedAI.color} />
            <BodyText color={selectedAI.color} size={12} weight="medium" style={{ marginTop: 6 }}>{selectedAI.name}</BodyText>
            <PixelText color={aiPnL >= 0 ? colors.green : colors.red} size={12} glow style={{ marginTop: 4 }}>
              {aiPnL >= 0 ? '+' : ''}${aiPnL.toFixed(2)}
            </PixelText>
          </View>
        </View>
      </Card>
      <Card>
        <BodyText color={colors.cyan} size={12} weight="semibold" glow style={{ marginBottom: 10 }}>YOUR MOVES</BodyText>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <PixelButton color={colors.green} onPress={() => trade('buy')} style={{ flex: 1, paddingVertical: 16 }}>▲ BUY</PixelButton>
          <PixelButton color={colors.red} onPress={() => trade('sell')} style={{ flex: 1, paddingVertical: 16 }}>▼ SELL</PixelButton>
        </View>
      </Card>
    </ScrollView>
  );
}

export default function BattleScreen() {
  const params = useLocalSearchParams<{ challenge?: string }>();
  const [mode, setMode] = useState<'ai' | 'friend'>(params.challenge ? 'friend' : 'ai');
  const { profile } = useAuth();
  const plan = (profile?.plan ?? 'free') as 'free' | 'pro' | 'legend';
  const locked = mode === 'ai' ? !canPlayAiBattle(plan) : !canPlayPvp(plan);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 0 }}>
        <PixelButton color={mode === 'ai' ? colors.purple : colors.muted} onPress={() => setMode('ai')} style={{ flex: 1 }}>★ VS AI</PixelButton>
        <PixelButton color={mode === 'friend' ? colors.cyan : colors.muted} onPress={() => setMode('friend')} style={{ flex: 1 }}>⚔ VS FRIEND</PixelButton>
      </View>
      {locked ? (
        <View style={{ padding: 16 }}>
          <UpgradeGate
            title={mode === 'ai' ? '★ AI BATTLES ARE A PRO FEATURE' : '⚔ PVP BATTLES ARE A PRO FEATURE'}
            description={
              mode === 'ai'
                ? 'Free accounts get the full 6-market trading experience, but battling AI opponents is reserved for Pro and Legend traders.'
                : 'Free accounts get the full 6-market trading experience, but live PvP battles against friends are reserved for Pro and Legend traders.'
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
