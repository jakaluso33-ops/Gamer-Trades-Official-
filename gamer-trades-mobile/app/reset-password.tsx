import { useState, useEffect, useCallback } from 'react';
import { View, TextInput, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Card, PixelText, BodyText, PixelButton } from '../components/ui';
import { colors } from '../lib/theme';
import { supabase } from '../lib/supabase';

/** Pulls access_token/refresh_token out of a Supabase recovery deep link, which
 * puts them in the URL fragment (#...) rather than the query string — so
 * expo-router's own param parsing never sees them and we have to do it by hand. */
function parseTokensFromUrl(url: string): { access_token: string; refresh_token: string } | null {
  const fragment = url.split('#')[1] ?? url.split('?')[1];
  if (!fragment) return null;
  const params = new URLSearchParams(fragment);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token };
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handleUrl = useCallback(async (url: string | null) => {
    if (!url) return;
    const tokens = parseTokensFromUrl(url);
    if (!tokens) return;
    const { error } = await supabase.auth.setSession(tokens);
    if (error) setInvalid(true);
    else setReady(true);
  }, []);

  useEffect(() => {
    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    const timeout = setTimeout(() => {
      setReady(current => {
        if (!current) setInvalid(true);
        return current;
      });
    }, 4000);
    return () => {
      sub.remove();
      clearTimeout(timeout);
    };
  }, [handleUrl]);

  const submit = async () => {
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => router.replace('/(tabs)/dashboard' as never), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Card style={{ width: '100%', maxWidth: 380, padding: 24 }} borderColor={colors.cyan}>
        <PixelText color={colors.cyan} size={11} glow style={{ marginBottom: 20, textAlign: 'center' }}>
          🔑 SET NEW PASSWORD
        </PixelText>

        {done ? (
          <BodyText color={colors.green} size={13} style={{ textAlign: 'center' }}>
            Password updated! Taking you to your dashboard...
          </BodyText>
        ) : invalid ? (
          <BodyText color={colors.red} size={13} style={{ textAlign: 'center' }}>
            This reset link is invalid or has expired. Go back to the login screen and request a new one.
          </BodyText>
        ) : !ready ? (
          <BodyText color={colors.muted} size={13} style={{ textAlign: 'center' }}>
            Verifying your reset link...
          </BodyText>
        ) : (
          <>
            <View style={{ marginBottom: 12 }}>
              <BodyText color={colors.muted} size={11} style={{ marginBottom: 4 }}>NEW PASSWORD</BodyText>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.muted}
                secureTextEntry
                style={styles.input}
              />
            </View>
            <View style={{ marginBottom: 16 }}>
              <BodyText color={colors.muted} size={11} style={{ marginBottom: 4 }}>CONFIRM PASSWORD</BodyText>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
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
              {busy ? '...' : '▶ UPDATE PASSWORD'}
            </PixelButton>
          </>
        )}
      </Card>
    </Screen>
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
