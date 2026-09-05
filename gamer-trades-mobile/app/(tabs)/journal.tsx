import { useEffect, useState } from 'react';
import { ScrollView, View, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, PixelText, BodyText, PixelButton } from '../../components/ui';
import { colors } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';
import { listClosedTrades, DbTrade } from '../../lib/trading';
import { getJournalEntry, saveJournalEntry, runJournalAnalysis, EMOTION_TAGS, JournalEntry, JournalAnalysis } from '../../lib/journal';
import UpgradeGate from '../../components/UpgradeGate';

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

const ALIGNMENT_COLOR: Record<JournalAnalysis['reasoningAlignment'], string> = {
  strong: colors.green,
  mixed: colors.gold,
  weak: colors.red,
};

function JournalRow({ trade, skillLevel }: { trade: DbTrade; skillLevel: string | null }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [emotions, setEmotions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const up = (trade.pnl ?? 0) >= 0;

  const toggle = async () => {
    setExpanded(e => !e);
    if (!user || entry) return;
    setLoading(true);
    try {
      const existing = await getJournalEntry(user.id, trade.id);
      setEntry(existing);
      setReasoning(existing?.reasoning ?? '');
      setEmotions(existing?.emotions ?? []);
    } catch (err) {
      console.error('getJournalEntry failed', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleEmotion = (tag: string) => {
    setEmotions(prev => (prev.includes(tag) ? prev.filter(e => e !== tag) : [...prev, tag]));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await saveJournalEntry(user.id, trade.id, reasoning, emotions);
      setEntry(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save journal entry');
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = async () => {
    if (!user) return;
    setAnalyzing(true);
    setError(null);
    try {
      const saved = await saveJournalEntry(user.id, trade.id, reasoning, emotions);
      const analysis = await runJournalAnalysis(user.id, trade, saved, skillLevel as any);
      setEntry({ ...saved, ai_analysis: analysis, ai_analyzed_at: new Date().toISOString() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not analyze this trade');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card borderColor={expanded ? colors.gold : colors.border} style={{ marginBottom: 10 }}>
      <Pressable onPress={toggle}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <BodyText color={colors.blue} size={13} weight="medium">{trade.symbol}</BodyText>
          <BodyText color={up ? colors.green : colors.red} size={13} weight="medium">
            {up ? '+' : ''}${(trade.pnl ?? 0).toFixed(2)}
          </BodyText>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
          <BodyText color={colors.muted} size={11}>
            {trade.direction === 'long' ? 'BUY' : 'SELL'} {trade.quantity}x @ ${trade.entry_price.toFixed(2)}
            {trade.exit_price != null ? ` → $${trade.exit_price.toFixed(2)}` : ''}
          </BodyText>
          <BodyText color={colors.border} size={11}>{formatDate(trade.closed_at)}</BodyText>
        </View>
        <BodyText color={colors.gold} size={10} weight="medium" style={{ marginTop: 6 }}>
          {expanded ? '▲ HIDE JOURNAL' : '📓 OPEN JOURNAL ENTRY ▶'}
        </BodyText>
      </Pressable>

      {expanded && (
        <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
          {loading ? (
            <BodyText color={colors.muted} size={12}>Loading journal entry...</BodyText>
          ) : (
            <>
              <BodyText color={colors.muted} size={11} weight="medium" style={{ marginBottom: 6 }}>
                WHY DID YOU TAKE THIS TRADE?
              </BodyText>
              <TextInput
                multiline
                numberOfLines={4}
                placeholder="What was your setup, your plan, your thinking going in?"
                placeholderTextColor={colors.muted}
                value={reasoning}
                onChangeText={setReasoning}
                style={{
                  fontSize: 13, padding: 10, minHeight: 80, textAlignVertical: 'top',
                  backgroundColor: colors.bg, color: colors.text,
                  borderWidth: 2, borderColor: colors.border, marginBottom: 12,
                }}
              />

              <BodyText color={colors.muted} size={11} weight="medium" style={{ marginBottom: 6 }}>
                HOW WERE YOU FEELING?
              </BodyText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {EMOTION_TAGS.map(tag => {
                  const active = emotions.includes(tag);
                  return (
                    <Pressable
                      key={tag}
                      onPress={() => toggleEmotion(tag)}
                      style={{
                        paddingHorizontal: 9, paddingVertical: 6,
                        borderWidth: 1.5, borderColor: active ? colors.purple : colors.border,
                        backgroundColor: active ? `${colors.purple}22` : 'transparent',
                      }}
                    >
                      <BodyText color={active ? colors.purple : colors.muted} size={11} weight="semibold">{tag}</BodyText>
                    </Pressable>
                  );
                })}
              </View>

              {error && <BodyText color={colors.red} size={11} style={{ marginBottom: 10 }}>⚠ {error}</BodyText>}

              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <PixelButton color={colors.blue} onPress={handleSave} disabled={saving} style={{ flex: 1 }}>
                  {saving ? '...' : '💾 SAVE'}
                </PixelButton>
                <PixelButton color={colors.gold} onPress={handleAnalyze} disabled={analyzing} style={{ flex: 1 }}>
                  {analyzing ? '...' : '🤖 AI BACKTEST'}
                </PixelButton>
              </View>

              {entry?.ai_analysis && (
                <View style={{ padding: 10, backgroundColor: `${colors.gold}0a`, borderWidth: 2, borderColor: `${colors.gold}55` }}>
                  <BodyText color={ALIGNMENT_COLOR[entry.ai_analysis.reasoningAlignment]} size={13} weight="semibold" style={{ marginBottom: 8 }}>
                    🤖 {entry.ai_analysis.headline}
                  </BodyText>
                  <BodyText color={colors.muted} size={10} weight="semibold" style={{ marginBottom: 3 }}>WHY IT HIT TP/SL</BodyText>
                  <BodyText color={colors.text} size={12} style={{ marginBottom: 8 }}>{entry.ai_analysis.outcomeExplanation}</BodyText>
                  <BodyText color={colors.muted} size={10} weight="semibold" style={{ marginBottom: 3 }}>
                    REASONING: <BodyText color={ALIGNMENT_COLOR[entry.ai_analysis.reasoningAlignment]} size={10} weight="semibold">{entry.ai_analysis.reasoningAlignment.toUpperCase()}</BodyText>
                  </BodyText>
                  <BodyText color={colors.muted} size={10} weight="semibold" style={{ marginTop: 6, marginBottom: 3 }}>EMOTIONAL INFLUENCE</BodyText>
                  <BodyText color={colors.text} size={12} style={{ marginBottom: 8 }}>{entry.ai_analysis.emotionalInfluence}</BodyText>
                  <BodyText color={colors.gold} size={11} weight="medium">💡 {entry.ai_analysis.lesson}</BodyText>
                </View>
              )}
            </>
          )}
        </View>
      )}
    </Card>
  );
}

export default function JournalScreen() {
  const { user, profile, activePortfolio } = useAuth();
  const router = useRouter();
  const [trades, setTrades] = useState<DbTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const isLegend = (profile?.plan ?? 'free') === 'legend';

  useEffect(() => {
    if (!user || !activePortfolio || !isLegend) { setLoading(false); return; }
    listClosedTrades(user.id, activePortfolio.id, 100)
      .then(setTrades)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, activePortfolio, isLegend]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <PixelText color={colors.gold} size={13} glow>📓 TRADING JOURNAL</PixelText>
        <BodyText color={colors.muted} size={11} onPress={() => router.back()}>◀ BACK</BodyText>
      </View>

      {!isLegend ? (
        <UpgradeGate
          plan="legend"
          title="📓 TRADING JOURNAL IS A LEGEND FEATURE"
          description="Document the reasoning and emotions behind every trade, then get an AI backtest explaining exactly why it hit your take-profit or stop-loss — and how your mindset played into it."
        />
      ) : (
        <>
          <BodyText color={colors.muted} size={12}>
            Every closed trade below is ready to journal — log why you took it, how you felt, then run an AI backtest for a deeper read.
          </BodyText>

          {loading ? (
            <BodyText color={colors.muted} size={13}>Loading your trade history...</BodyText>
          ) : trades.length === 0 ? (
            <Card style={{ alignItems: 'center', padding: 24 }}>
              <BodyText color={colors.muted} size={13} style={{ textAlign: 'center' }}>
                No closed trades yet — once you close a trade, it'll show up here to journal.
              </BodyText>
            </Card>
          ) : (
            trades.map(t => <JournalRow key={t.id} trade={t} skillLevel={profile?.skill_level ?? null} />)
          )}
        </>
      )}
    </ScrollView>
  );
}
