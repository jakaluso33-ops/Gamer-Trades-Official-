import { useState } from 'react';
import { Modal, View, Pressable, TextInput } from 'react-native';
import { Card, PixelText, BodyText, PixelButton } from './ui';
import { colors } from '../lib/theme';
import { useAuth } from '../lib/AuthContext';
import { submitFeedback, FeedbackCategory, FEEDBACK_CATEGORIES } from '../lib/feedback';

export default function FeedbackModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [category, setCategory] = useState<FeedbackCategory>('general');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const reset = () => {
    setCategory('general');
    setMessage('');
    setError(null);
    setSent(false);
  };

  const close = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const handleSubmit = async () => {
    if (!user || message.trim().length < 3) {
      setError('Give us a bit more detail first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await submitFeedback(user.id, category, message.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send feedback');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        onPress={close}
      >
        <Pressable onPress={e => e.stopPropagation()} style={{ width: '100%' }}>
          <Card borderColor={colors.cyan} style={{ padding: 20 }}>
            {sent ? (
              <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                <PixelText size={28} style={{ marginBottom: 10 }}>✓</PixelText>
                <PixelText color={colors.green} size={12} glow style={{ textAlign: 'center', marginBottom: 8 }}>
                  THANKS FOR THE FEEDBACK
                </PixelText>
                <BodyText color={colors.muted} size={12} style={{ textAlign: 'center', marginBottom: 16 }}>
                  We read every message — this genuinely helps shape what we build next.
                </BodyText>
                <PixelButton color={colors.cyan} onPress={close} style={{ alignSelf: 'stretch' }}>
                  DONE
                </PixelButton>
              </View>
            ) : (
              <>
                <PixelText color={colors.cyan} size={12} glow style={{ textAlign: 'center', marginBottom: 14 }}>
                  💬 SEND FEEDBACK
                </PixelText>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {FEEDBACK_CATEGORIES.map(c => {
                    const active = category === c.value;
                    return (
                      <Pressable
                        key={c.value}
                        onPress={() => setCategory(c.value)}
                        style={{
                          flexDirection: 'row', alignItems: 'center', gap: 6,
                          paddingHorizontal: 10, paddingVertical: 8,
                          borderWidth: 2, borderColor: active ? colors.cyan : colors.border,
                          backgroundColor: active ? `${colors.cyan}18` : 'transparent',
                        }}
                      >
                        <BodyText size={12}>{c.icon}</BodyText>
                        <BodyText color={active ? colors.cyan : colors.muted} size={11.5} weight="semibold">{c.label}</BodyText>
                      </Pressable>
                    );
                  })}
                </View>

                <TextInput
                  multiline
                  numberOfLines={5}
                  placeholder="What's on your mind? Bug reports, feature ideas, anything at all..."
                  placeholderTextColor={colors.muted}
                  value={message}
                  onChangeText={t => { setMessage(t); setError(null); }}
                  style={{
                    fontSize: 14, padding: 12, minHeight: 110, textAlignVertical: 'top',
                    backgroundColor: colors.bg, color: colors.text,
                    borderWidth: 2, borderColor: colors.border, marginBottom: 10,
                  }}
                />

                {error && (
                  <BodyText color={colors.red} size={11} style={{ textAlign: 'center', marginBottom: 10 }}>⚠ {error}</BodyText>
                )}

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <PixelButton color={colors.muted} disabled={busy} onPress={close} style={{ flex: 1 }}>
                    CANCEL
                  </PixelButton>
                  <PixelButton color={colors.cyan} disabled={busy} onPress={handleSubmit} style={{ flex: 1 }}>
                    {busy ? '...' : 'SEND'}
                  </PixelButton>
                </View>
              </>
            )}
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
