import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../lib/AuthContext';
import { colors } from '../lib/theme';
import DisclaimerGate from '../components/DisclaimerGate';
import ErrorBoundary from '../components/ErrorBoundary';

function RootNavigation() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(tabs)';
    const isPublicRoute = segments[0] === 'privacy' || segments[0] === 'terms' || segments[0] === 'reset-password';
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
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <DisclaimerGate />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ PressStart2P_400Regular, Inter_400Regular, Inter_500Medium, Inter_600SemiBold });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.cyan} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <RootNavigation />
      </AuthProvider>
    </ErrorBoundary>
  );
}
