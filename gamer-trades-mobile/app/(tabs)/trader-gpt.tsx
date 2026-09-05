import { useEffect, useRef, useState } from 'react';
import { ScrollView, View, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, PixelText, BodyText, PixelButton } from '../../components/ui';
import UpgradeGate from '../../components/UpgradeGate';
import { colors } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';
import { askTraderGpt, getTraderGptUsageToday, ChatMessage, TRADERGPT_FREE_DAILY_LIMIT } from '../../lib/traderGpt';

const STARTER_PROMPTS = [
  'What is risk:reward ratio?',
  'How do I size a position?',
  'Explain support and resistance',
  'What is FOMO trading and how do I avoid it?',
];

export default function TraderGptScreen() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const isFree = (profile?.plan ?? 'free') === 'free';
  const [usedToday, setUsedToday] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (user && isFree) {
      getTraderGptUsageToday(user.id).then(setUsedToday).catch(console.error);
    }
  }, [user, isFree]);

  const remaining = usedToday == null ? null : Math.max(0, TRADERGPT_FREE_DAILY_LIMIT - usedToday);
  const outOfQuestions = isFree && remaining === 0;

  const send = async (text: string) => {
    if (!text.trim() || busy || outOfQuestions) return;
    setError(null);
    const next: ChatMessage[] = [...messages, { role: 'user', content: text.trim() }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const res = await askTraderGpt(next, profile?.skill_level ?? null);
      setMessages([...next, { role: 'assistant', content: res.reply }]);
      if (res.remainingToday != null) setUsedToday(TRADERGPT_FREE_DAILY_LIMIT - res.remainingToday);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not reach TraderGPT';
      setError(msg);
      if (isFree) setUsedToday(TRADERGPT_FREE_DAILY_LIMIT); // limit_reached response -- lock input
      setMessages(next.slice(0, -1));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 }}>
        <PixelText color={colors.cyan} size={12} glow>🤖 TRADERGPT</PixelText>
        <BodyText color={colors.muted} size={11} onPress={() => router.back()}>◀ BACK</BodyText>
      </View>

      {isFree && (
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <BodyText color={remaining === 0 ? colors.red : colors.gold} size={11}>
            {remaining == null ? '...' : `${remaining} of ${TRADERGPT_FREE_DAILY_LIMIT} free questions left today`} — Pro/Legend get unlimited
          </BodyText>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 10, flexGrow: 1 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 && (
          <Card>
            <BodyText color={colors.text} size={13} style={{ marginBottom: 10 }}>
              Ask me anything about trading — technicals, fundamentals, risk management, psychology, or how a strategy works. This is paper-trading education, not financial advice, and I don't see live prices.
            </BodyText>
            <View style={{ gap: 6 }}>
              {STARTER_PROMPTS.map(p => (
                <BodyText key={p} color={colors.cyan} size={12} onPress={() => send(p)}>▸ {p}</BodyText>
              ))}
            </View>
          </Card>
        )}

        {messages.map((m, i) => (
          <View
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '88%',
              backgroundColor: m.role === 'user' ? `${colors.cyan}1a` : colors.card,
              borderWidth: 2, borderColor: m.role === 'user' ? colors.cyan : colors.border,
              borderRadius: 2, padding: 10,
            }}
          >
            <BodyText color={colors.text} size={13}>{m.content}</BodyText>
          </View>
        ))}

        {busy && (
          <View style={{ alignSelf: 'flex-start' }}>
            <BodyText color={colors.muted} size={12}>TraderGPT is typing...</BodyText>
          </View>
        )}

        {error && (
          <BodyText color={colors.red} size={11} style={{ textAlign: 'center' }}>⚠ {error}</BodyText>
        )}
      </ScrollView>

      {outOfQuestions ? (
        <View style={{ padding: 16 }}>
          <UpgradeGate
            plan="pro"
            title="OUT OF FREE QUESTIONS"
            description={`You've used your ${TRADERGPT_FREE_DAILY_LIMIT} free TraderGPT questions today. Upgrade to Pro for unlimited access.`}
          />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 8, padding: 16, paddingTop: 8 }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask TraderGPT..."
            placeholderTextColor={colors.muted}
            style={{
              flex: 1, fontSize: 14, padding: 12, color: colors.text,
              backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border,
            }}
            editable={!busy}
            onSubmitEditing={() => send(input)}
          />
          <PixelButton color={colors.cyan} onPress={() => send(input)} disabled={busy || !input.trim()}>
            SEND
          </PixelButton>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
