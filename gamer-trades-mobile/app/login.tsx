import { useState, useEffect, useCallback } from 'react';
import { View, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Card, PixelText, BodyText, PixelButton } from '../components/ui';
import { colors } from '../lib/theme';
import { supabase } from '../lib/supabase';
import { DISCLAIMER_TEXT } from '../lib/legalContent';

// A real https:// page was here before, but nothing was ever deployed at that URL — every
// confirmation link 303'd users to a dead GitHub Pages 404. Confirmation now opens the app
// itself (same gamertrades:// deep-link pattern reset-password.tsx already uses) and signs
// the user straight in, instead of stranding them in a browser.
const EMAIL_REDIRECT_TO = 'gamertrades://login';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Pulls access_token/refresh_token out of a Supabase confirmation deep link, which
 * puts them in the URL fragment (#...) rather than the query string. */
function parseTokensFromUrl(url: string): { access_token: string; refresh_token: string } | null {
  const fragment = url.split('#')[1] ?? url.split('?')[1];
  if (!fragment) return null;
  const params = new URLSearchParams(fragment);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token };
}

/** Turns raw Supabase/Postgres error text into copy a tester can actually act on. */
function friendlyAuthError(raw: string, mode: 'signup' | 'signin' | 'forgot'): string {
  const msg = raw.toLowerCase();
  if (msg.includes('profiles_username_key') || (msg.includes('username') && msg.includes('duplicate'))) {
    return 'That username is already taken — try a different one.';
  }
  if (msg.includes('user already registered') || msg.includes('already registered')) {
    return 'An account with this email already exists — try signing in instead.';
  }
  if (msg.includes('email not confirmed')) {
    return "Almost there — confirm your email first. Check your inbox (and spam folder) for the link, or resend it below.";
  }
  if (msg.includes('invalid login credentials')) {
    return mode === 'signin' ? "Incorrect email or password." : raw;
  }
  if (msg.includes('for security purposes') || msg.includes('rate limit')) {
    return 'Too many attempts — please wait a few seconds and try again.';
  }
  if (msg.includes('password') && msg.includes('at least')) {
    return 'Password must be at least 6 characters.';
  }
  return raw;
}

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resending, setResending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // If this screen was opened via a confirmation-email deep link, pick up the session it
  // carries directly instead of making the user re-enter their password.
  const handleIncomingUrl = useCallback(async (url: string | null) => {
    if (!url) return;
    const tokens = parseTokensFromUrl(url);
    if (!tokens) return;
    setConfirming(true);
    const { error } = await supabase.auth.setSession(tokens);
    if (error) {
      setConfirming(false);
      setError(friendlyAuthError(error.message, 'signin'));
    }
    // On success, AuthContext's session updates and the root layout redirects away —
    // nothing else to do here.
  }, []);

  useEffect(() => {
    Linking.getInitialURL().then(handleIncomingUrl);
    const sub = Linking.addEventListener('url', ({ url }) => handleIncomingUrl(url));
    return () => sub.remove();
  }, [handleIncomingUrl]);

  const resetMessages = () => {
    setError('');
    setInfo('');
    setNeedsConfirmation(false);
  };

  const switchMode = (next: 'signin' | 'signup' | 'forgot') => {
    setMode(next);
    resetMessages();
  };

  const resendConfirmation = async () => {
    if (!email.trim()) {
      setError('Enter your email above first, then tap resend.');
      return;
    }
    setResending(true);
    setError('');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: { emailRedirectTo: EMAIL_REDIRECT_TO },
      });
      if (error) throw error;
      setInfo(`Confirmation email resent to ${email.trim()} — check your inbox (and spam folder).`);
      setNeedsConfirmation(false);
    } catch (err) {
      setError(friendlyAuthError(err instanceof Error ? err.message : 'Could not resend the email', 'signin'));
    } finally {
      setResending(false);
    }
  };

  const submit = async () => {
    resetMessages();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !EMAIL_RE.test(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (mode !== 'forgot' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'signup' && username.trim() && !/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) {
      setError('Username must be 3-20 characters — letters, numbers, and underscores only.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: { username: username.trim() || undefined },
            emailRedirectTo: EMAIL_REDIRECT_TO,
          },
        });
        if (error) throw error;

        if (data.session) {
          // Email confirmation is off for this project — the session is already active
          // and the root layout will redirect automatically. Nothing else to do here.
        } else {
          setInfo(`Account created! We sent a confirmation link to ${trimmedEmail} — check your inbox (and spam folder) and tap it to finish signing in.`);
          setMode('signin');
          setPassword('');
        }
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo: 'gamertrades://reset-password',
        });
        if (error) throw error;
        setInfo(`If an account exists for ${trimmedEmail}, a password reset link has been sent.`);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
        if (error) throw error;
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Something went wrong';
      setError(friendlyAuthError(raw, mode));
      if (mode === 'signin' && raw.toLowerCase().includes('email not confirmed')) {
        setNeedsConfirmation(true);
      }
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
              <BodyText color={colors.gold} size={12} weight="semibold" style={{ marginTop: 8 }}>GAME ON, TRADE ON</BodyText>
            </View>

            {confirming && (
              <BodyText color={colors.green} size={13} style={{ textAlign: 'center', marginBottom: 16 }}>
                Confirming your email...
              </BodyText>
            )}

            {!confirming && mode !== 'forgot' && (
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 20 }}>
                <PixelButton color={mode === 'signin' ? colors.cyan : colors.muted} onPress={() => switchMode('signin')} style={{ flex: 1 }}>
                  SIGN IN
                </PixelButton>
                <PixelButton color={mode === 'signup' ? colors.green : colors.muted} onPress={() => switchMode('signup')} style={{ flex: 1 }}>
                  SIGN UP
                </PixelButton>
              </View>
            )}

            {mode === 'forgot' && (
              <PixelText color={colors.gold} size={10} glow style={{ marginBottom: 16 }}>✉ RESET PASSWORD</PixelText>
            )}

            {!confirming && mode === 'signup' && (
              <View style={{ marginBottom: 12 }}>
                <BodyText color={colors.muted} size={11} style={{ marginBottom: 4 }}>USERNAME (OPTIONAL)</BodyText>
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

            {!confirming && (
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
            )}

            {!confirming && mode !== 'forgot' && (
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
            )}

            {!confirming && mode === 'signin' && (
              <BodyText
                color={colors.muted}
                size={11}
                style={{ textAlign: 'right', marginBottom: 12 }}
                onPress={() => switchMode('forgot')}
              >
                Forgot password?
              </BodyText>
            )}

            {info ? (
              <View style={{ padding: 8, backgroundColor: '#00ff8811', borderWidth: 1, borderColor: '#00ff8844', marginBottom: 12 }}>
                <BodyText color={colors.green} size={12}>{info}</BodyText>
              </View>
            ) : null}

            {error ? (
              <View style={{ padding: 8, backgroundColor: '#ff335511', borderWidth: 1, borderColor: '#ff335544', marginBottom: 12 }}>
                <BodyText color={colors.red} size={12}>{error}</BodyText>
              </View>
            ) : null}

            {!confirming && needsConfirmation && (
              <PixelButton color={colors.gold} onPress={resendConfirmation} disabled={resending} style={{ marginBottom: 12 }}>
                {resending ? '...' : '✉ RESEND CONFIRMATION EMAIL'}
              </PixelButton>
            )}

            {!confirming && (
              <PixelButton color={colors.green} onPress={submit} disabled={busy}>
                {busy ? '...' : mode === 'signup' ? '▶ CREATE ACCOUNT' : mode === 'forgot' ? '▶ SEND RESET LINK' : '▶ ENTER'}
              </PixelButton>
            )}

            {!confirming && mode === 'forgot' && (
              <BodyText
                color={colors.muted}
                size={11}
                style={{ textAlign: 'center', marginTop: 12 }}
                onPress={() => switchMode('signin')}
              >
                ◀ BACK TO SIGN IN
              </BodyText>
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
