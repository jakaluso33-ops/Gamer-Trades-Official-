import { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, PixelText, BodyText, PixelButton } from '../../components/ui';
import { colors } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';
import UpgradeGate from '../../components/UpgradeGate';
import {
  TradingBot,
  BotCondition,
  BotDirection,
  BotLogic,
  BOT_SYMBOLS,
  CONDITION_OPTIONS,
  listBots,
  createBot,
  setBotStatus,
  deleteBot,
  getBotTrades,
  summarizeBotTrades,
  BotPerformance,
} from '../../lib/tradingBots';

function timeAgo(iso: string | null): string {
  if (!iso) return 'never';
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function BotRow({ bot, onChanged }: { bot: TradingBot; onChanged: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [perf, setPerf] = useState<BotPerformance | null>(null);
  const [busy, setBusy] = useState(false);

  const loadPerf = useCallback(() => {
    getBotTrades(bot.id).then(trades => setPerf(summarizeBotTrades(trades))).catch(console.error);
  }, [bot.id]);

  useEffect(() => { if (expanded) loadPerf(); }, [expanded, loadPerf]);

  const toggleStatus = async () => {
    setBusy(true);
    try {
      await setBotStatus(bot.id, bot.status === 'active' ? 'paused' : 'active');
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteBot(bot.id);
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const active = bot.status === 'active';
  return (
    <Card borderColor={active ? colors.gold : colors.muted} style={{ marginBottom: 10 }}>
      <Pressable onPress={() => setExpanded(e => !e)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <PixelText size={16}>{active ? '🟢' : '⏸️'}</PixelText>
        <View style={{ flex: 1 }}>
          <BodyText color={colors.text} size={13} weight="semibold">{bot.name}</BodyText>
          <BodyText color={colors.muted} size={11} style={{ marginTop: 2 }}>
            {bot.symbol} · {bot.direction.toUpperCase()} · {bot.conditions.length} condition{bot.conditions.length === 1 ? '' : 's'} ({bot.logic})
          </BodyText>
        </View>
        <BodyText color={colors.muted} size={12}>{expanded ? '▲' : '▼'}</BodyText>
      </Pressable>

      {expanded && (
        <View style={{ marginTop: 12 }}>
          <BodyText color={colors.muted} size={11} style={{ marginBottom: 8 }}>
            Last checked: {timeAgo(bot.last_evaluated_at)} · Last trade opened: {timeAgo(bot.last_signal_at)}
          </BodyText>

          {perf && (
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              <View style={{ flex: 1, alignItems: 'center', padding: 8, borderWidth: 1, borderColor: colors.border }}>
                <BodyText color={colors.muted} size={10}>TRADES</BodyText>
                <PixelText color={colors.text} size={12} style={{ marginTop: 4 }}>{perf.totalTrades}</PixelText>
              </View>
              <View style={{ flex: 1, alignItems: 'center', padding: 8, borderWidth: 1, borderColor: colors.border }}>
                <BodyText color={colors.muted} size={10}>WIN RATE</BodyText>
                <PixelText color={perf.winRate >= 50 ? colors.green : colors.red} size={12} style={{ marginTop: 4 }}>
                  {perf.closedTrades > 0 ? `${perf.winRate.toFixed(0)}%` : '—'}
                </PixelText>
              </View>
              <View style={{ flex: 1, alignItems: 'center', padding: 8, borderWidth: 1, borderColor: colors.border }}>
                <BodyText color={colors.muted} size={10}>P&amp;L</BodyText>
                <PixelText color={perf.totalPnl >= 0 ? colors.green : colors.red} size={12} style={{ marginTop: 4 }}>
                  {perf.totalPnl >= 0 ? '+' : ''}${perf.totalPnl.toFixed(2)}
                </PixelText>
              </View>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <PixelButton color={active ? colors.muted : colors.green} disabled={busy} onPress={toggleStatus}>
                {busy ? '...' : active ? 'PAUSE' : 'RESUME'}
              </PixelButton>
            </View>
            <View style={{ flex: 1 }}>
              <PixelButton color={colors.red} disabled={busy} onPress={remove}>DELETE</PixelButton>
            </View>
          </View>
        </View>
      )}
    </Card>
  );
}

function NewBotForm({ portfolioId, onCreated }: { portfolioId: string; onCreated: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState(BOT_SYMBOLS[0]);
  const [direction, setDirection] = useState<BotDirection>('bullish');
  const [logic, setLogic] = useState<BotLogic>('AND');
  const [selected, setSelected] = useState<BotCondition[]>([]);
  const [risk, setRisk] = useState('2');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCondition = (c: BotCondition) => {
    setSelected(prev =>
      prev.some(p => p.detector === c.detector)
        ? prev.filter(p => p.detector !== c.detector)
        : prev.length >= 3 ? prev : [...prev, c]
    );
  };

  const deploy = async () => {
    if (!user) return;
    setError(null);
    if (!name.trim()) { setError('Give your bot a name.'); return; }
    if (selected.length === 0) { setError('Pick at least one condition.'); return; }
    const riskNum = parseFloat(risk);
    if (!Number.isFinite(riskNum) || riskNum <= 0 || riskNum > 25) { setError('Risk per trade must be between 0 and 25%.'); return; }

    setBusy(true);
    try {
      await createBot({
        userId: user.id,
        portfolioId,
        name: name.trim(),
        symbol,
        direction,
        conditions: selected,
        logic,
        riskPerTradePct: riskNum,
      });
      setName('');
      setSelected([]);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create bot');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card borderColor={colors.purple}>
      <BodyText color={colors.purple} size={12} weight="semibold" glow style={{ marginBottom: 12 }}>+ NEW BOT</BodyText>

      <BodyText color={colors.muted} size={11} style={{ marginBottom: 6 }}>NAME</BodyText>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. BTC Momentum Hunter"
        placeholderTextColor={colors.muted}
        style={{ fontSize: 13, padding: 10, backgroundColor: colors.bg, color: colors.text, borderWidth: 2, borderColor: colors.border, marginBottom: 14 }}
      />

      <BodyText color={colors.muted} size={11} style={{ marginBottom: 6 }}>MARKET</BodyText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {BOT_SYMBOLS.map(s => (
          <Pressable
            key={s}
            onPress={() => setSymbol(s)}
            style={{ paddingHorizontal: 10, paddingVertical: 7, borderWidth: 2, borderColor: symbol === s ? colors.purple : colors.border, backgroundColor: symbol === s ? `${colors.purple}22` : 'transparent' }}
          >
            <BodyText color={symbol === s ? colors.purple : colors.muted} size={12}>{s}</BodyText>
          </Pressable>
        ))}
      </View>

      <BodyText color={colors.muted} size={11} style={{ marginBottom: 6 }}>DIRECTION</BodyText>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        {(['bullish', 'bearish'] as BotDirection[]).map(d => (
          <Pressable
            key={d}
            onPress={() => setDirection(d)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderWidth: 2, borderColor: direction === d ? (d === 'bullish' ? colors.green : colors.red) : colors.border, backgroundColor: direction === d ? `${d === 'bullish' ? colors.green : colors.red}18` : 'transparent' }}
          >
            <BodyText color={direction === d ? (d === 'bullish' ? colors.green : colors.red) : colors.muted} size={12} weight="semibold">
              {d === 'bullish' ? '▲ BULLISH (LONG)' : '▼ BEARISH (SHORT)'}
            </BodyText>
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <BodyText color={colors.muted} size={11}>CONDITIONS (pick up to 3)</BodyText>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {(['AND', 'OR'] as BotLogic[]).map(l => (
            <Pressable
              key={l}
              onPress={() => setLogic(l)}
              style={{ paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1.5, borderColor: logic === l ? colors.purple : colors.border }}
            >
              <BodyText color={logic === l ? colors.purple : colors.muted} size={10} weight="semibold">{l}</BodyText>
            </Pressable>
          ))}
        </View>
      </View>
      <BodyText color={colors.muted} size={10} style={{ marginBottom: 8 }}>
        {logic === 'AND' ? 'ALL selected conditions must fire together to trigger a trade.' : 'ANY ONE selected condition firing is enough to trigger a trade.'}
      </BodyText>
      <View style={{ gap: 6, marginBottom: 14 }}>
        {CONDITION_OPTIONS.map(opt => {
          const on = selected.some(s => s.detector === opt.detector);
          return (
            <Pressable
              key={opt.detector}
              onPress={() => toggleCondition({ kind: opt.kind, detector: opt.detector })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 9, borderWidth: 2, borderColor: on ? colors.purple : colors.border, backgroundColor: on ? `${colors.purple}18` : 'transparent' }}
            >
              <BodyText size={12}>{opt.kind === 'candle' ? '🕯️' : '📐'}</BodyText>
              <BodyText color={on ? colors.purple : colors.text} size={12} style={{ flex: 1 }}>{opt.label}</BodyText>
              {on && <BodyText color={colors.purple} size={12}>✓</BodyText>}
            </Pressable>
          );
        })}
      </View>

      <BodyText color={colors.muted} size={11} style={{ marginBottom: 6 }}>RISK PER TRADE (% of cash)</BodyText>
      <TextInput
        value={risk}
        onChangeText={setRisk}
        keyboardType="decimal-pad"
        placeholderTextColor={colors.muted}
        style={{ fontSize: 13, padding: 10, backgroundColor: colors.bg, color: colors.text, borderWidth: 2, borderColor: colors.border, marginBottom: 14 }}
      />

      {error && <BodyText color={colors.red} size={12} style={{ marginBottom: 10 }}>⚠ {error}</BodyText>}

      <PixelButton color={colors.gold} disabled={busy} onPress={deploy} style={{ paddingVertical: 14 }}>
        {busy ? '...' : '🚀 DEPLOY BOT'}
      </PixelButton>
    </Card>
  );
}

export default function BotBuilderScreen() {
  const { user, profile, activePortfolio } = useAuth();
  const router = useRouter();
  const [bots, setBots] = useState<TradingBot[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!user) return;
    listBots(user.id).then(setBots).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const isLegend = profile?.plan === 'legend';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <BodyText color={colors.muted} size={12}>👑 LEGEND</BodyText>
          <PixelText color={colors.gold} size={13} glow style={{ marginTop: 6 }}>BUILD YOUR BOT</PixelText>
        </View>
        <BodyText color={colors.muted} size={11} onPress={() => router.back()}>◀ BACK</BodyText>
      </View>

      <BodyText color={colors.muted} size={12}>
        Combine real technical setups and candlestick patterns into your own no-code strategy, then deploy it to trade
        a live market autonomously — real quote-driven detection, running 24/7 even while the app is closed. Paper
        trading only for now (broker integration is planned).
      </BodyText>

      {!isLegend ? (
        <UpgradeGate
          plan="legend"
          title="🔒 BUILD YOUR BOT — LEGEND ONLY"
          description="Deploy an AI that trades a live market for you, around the clock, based on a strategy you build."
        />
      ) : (
        <>
          {loading ? (
            <BodyText color={colors.muted} size={13}>Loading your bots...</BodyText>
          ) : bots.length > 0 ? (
            <View>
              <BodyText color={colors.gold} size={12} weight="semibold" style={{ marginBottom: 8 }}>YOUR BOTS</BodyText>
              {bots.map(b => <BotRow key={b.id} bot={b} onChanged={refresh} />)}
            </View>
          ) : null}

          {activePortfolio ? (
            <NewBotForm portfolioId={activePortfolio.id} onCreated={refresh} />
          ) : (
            <Card borderColor={colors.muted}>
              <BodyText color={colors.muted} size={13} style={{ textAlign: 'center' }}>Create a portfolio first to deploy a bot.</BodyText>
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}
