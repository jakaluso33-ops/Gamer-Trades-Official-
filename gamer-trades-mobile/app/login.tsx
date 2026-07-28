import { useState, useEffect, useRef } from 'react';
import { View, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Card, PixelText, BodyText, PixelButton } from '../components/ui';
import { colors } from '../lib/theme';
import { supabase } from '../lib/supabase';
import { DISCLAIMER_TEXT } from '../lib/legalContent';

const RESEND_COOLDOWN = 30;

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup' | 'verify'>('signin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown(c => {
        if (c <= 1 && cooldownRef.current) clearInterval(cooldownRef.current);
        return c - 1;
      });
    }, 1000);
  };

  const submit = async () => {
    setError('');
    setInfo('');
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: username.trim() || undefined } },
        });
        if (error) throw error;
        setMode('verify');
        setInfo(`We sent a 6-digit code to ${email}. Enter it below to confirm your account.`);
        startCooldown();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes('email not confirmed')) {
            setMode('verify');
            setInfo(`Your email isn't confirmed yet. Enter the code we sent to ${email}, or resend it below.`);
            setBusy(false);
            return;
          }
          throw error;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    setError('');
    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'signup' });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code');
    } finally {
      setBusy(false);
    }
  };

  const resendCode = async () => {
    if (cooldown > 0) return;
    setError('');
    setInfo('');
    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      setInfo(`New code sent to ${email}.`);
      startCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend code');
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

            {mode !== 'verify' && (
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 20 }}>
                <PixelButton color={mode === 'signin' ? colors.cyan : colors.muted} onPress={() => { setMode('signin'); setError(''); setInfo(''); }} style={{ flex: 1 }}>
                  SIGN IN
                </PixelButton>
                <PixelButton color={mode === 'signup' ? colors.green : colors.muted} onPress={() => { setMode('signup'); setError(''); setInfo(''); }} style={{ flex: 1 }}>
                  SIGN UP
                </PixelButton>
              </View>
            )}

            {mode === 'verify' ? (
              <>
                <BodyText color={colors.gold} size={13} weight="semibold" glow style={{ marginBottom: 10 }}>✉ CONFIRM YOUR EMAIL</BodyText>
                {info ? <BodyText color={colors.muted} size={12} style={{ marginBottom: 12 }}>{info}</BodyText> : null}

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
                  <BodyText color={colors.muted} size={11} style={{ marginBottom: 4 }}>6-DIGIT CODE</BodyText>
                  <TextInput
                    value={code}
                    onChangeText={t => setCode(t.replace(/\D/g, ''))}
                    placeholder="123456"
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={[styles.input, { letterSpacing: 6, textAlign: 'center', fontSize: 18 }]}
                  />
                </View>

                {error ? (
                  <View style={{ padding: 8, backgroundColor: '#ff335511', borderWidth: 1, borderColor: '#ff335544', marginBottom: 12 }}>
                    <BodyText color={colors.red} size={12}>{error}</BodyText>
                  </View>
                ) : null}

                <PixelButton color={colors.green} onPress={verifyCode} disabled={busy || code.length !== 6} style={{ marginBottom: 10 }}>
                  {busy ? '...' : '▶ VERIFY'}
                </PixelButton>

                <PixelButton color={colors.muted} onPress={resendCode} disabled={busy || cooldown > 0} style={{ marginBottom: 10 }}>
                  {cooldown > 0 ? `RESEND CODE (${cooldown}s)` : 'RESEND CODE'}
                </PixelButton>

                <BodyText color={colors.muted} size={12} style={{ textAlign: 'center' }} onPress={() => { setMode('signin'); setError(''); setInfo(''); setCode(''); }}>
                  ◀ BACK TO SIGN IN
                </BodyText>
              </>
            ) : (
              <>
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

                {mode === 'signin' && (
                  <BodyText
                    color={colors.muted}
                    size={11}
                    style={{ textAlign: 'center', marginTop: 12 }}
                    onPress={() => { setMode('verify'); setError(''); setInfo('Enter the code from your confirmation email, or resend a new one.'); }}
                  >
                    Already signed up but need to confirm your email?
                  </BodyText>
                )}
              </>
            )}

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
