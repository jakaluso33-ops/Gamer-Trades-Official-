import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../lib/AuthContext';
import { colors } from '../lib/theme';
import DisclaimerGate from '../components/DisclaimerGate';

function RootNavigation() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(tabs)';
    const isPublicRoute = segments[0] === 'privacy' || segments[0] === 'terms';
    if (isPublicRoute) return;
    if (!session && inAuthGroup) {
      router.replace('/login');
    } else if (session && !inAuthGroup && segments[0] !== undefined) {
      router.replace('/(tabs)/dashboard');
    }
  }, [session, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.cyan} />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="terms" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <DisclaimerGate />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ PressStart2P_400Regular });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.cyan} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}
