import { useState } from 'react';
import { View, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Card, PixelText, BodyText, PixelButton } from '../components/ui';
import { colors } from '../lib/theme';
import { supabase } from '../lib/supabase';
import { DISCLAIMER_TEXT } from '../lib/legalContent';

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: username.trim() || undefined } },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <Screen style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Card style={{ width: '100%', maxWidth: 380, padding: 24 }} borderColor={colors.cyan}>
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <PixelText size={32}>🎮</PixelText>
              <PixelText color={colors.cyan} size={11} glow style={{ marginTop: 8 }}>GAMER TRADES</PixelText>
            </View>

            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 20 }}>
              <PixelButton color={mode === 'signin' ? colors.cyan : colors.muted} onPress={() => { setMode('signin'); setError(''); }} style={{ flex: 1 }}>
                SIGN IN
              </PixelButton>
              <PixelButton color={mode === 'signup' ? colors.green : colors.muted} onPress={() => { setMode('signup'); setError(''); }} style={{ flex: 1 }}>
                SIGN UP
              </PixelButton>
            </View>

            {mode === 'signup' && (
              <View style={{ marginBottom: 12 }}>
                <BodyText color={colors.muted} size={11} style={{ marginBottom: 4 }}>USERNAME</BodyText>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="PLAYER_01"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
            )}

            <View style={{ marginBottom: 12 }}>
              <BodyText color={colors.muted} size={11} style={{ marginBottom: 4 }}>EMAIL</BodyText>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <BodyText color={colors.muted} size={11} style={{ marginBottom: 4 }}>PASSWORD</BodyText>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.muted}
                secureTextEntry
                style={styles.input}
              />
            </View>

            {error ? (
              <View style={{ padding: 8, backgroundColor: '#ff335511', borderWidth: 1, borderColor: '#ff335544', marginBottom: 12 }}>
                <BodyText color={colors.red} size={12}>{error}</BodyText>
              </View>
            ) : null}

            <PixelButton color={colors.green} onPress={submit} disabled={busy}>
              {busy ? '...' : mode === 'signup' ? '▶ CREATE ACCOUNT' : '▶ ENTER'}
            </PixelButton>

            <BodyText color={colors.border} size={11} style={{ marginTop: 14, textAlign: 'center' }}>
              {DISCLAIMER_TEXT}
            </BodyText>

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 12 }}>
              <BodyText color={colors.muted} size={12} onPress={() => router.push('/privacy')}>PRIVACY POLICY</BodyText>
              <BodyText color={colors.muted} size={12} onPress={() => router.push('/terms')}>TERMS OF SERVICE</BodyText>
            </View>
          </Card>
        </Screen>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 13,
    padding: 10,
  },
});
