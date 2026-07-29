import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, PixelText, BodyText, PixelButton } from './ui';
import { colors } from '../lib/theme';

export default function UpgradeGate({ title, description }: { title: string; description: string }) {
  const router = useRouter();
  return (
    <Card borderColor={colors.gold} style={{ padding: 28, alignItems: 'center' }}>
      <PixelText size={28} style={{ marginBottom: 10 }}>🔒</PixelText>
      <PixelText color={colors.gold} size={11} glow style={{ marginBottom: 10, textAlign: 'center' }}>{title}</PixelText>
      <BodyText color={colors.muted} size={12} style={{ textAlign: 'center', marginBottom: 18 }}>{description}</BodyText>
      <View style={{ width: '100%' }}>
        <PixelButton color={colors.green} onPress={() => router.push('/(tabs)/profile?tab=upgrade' as never)}>
          ★ UPGRADE TO PRO
        </PixelButton>
      </View>
    </Card>
  );
}
