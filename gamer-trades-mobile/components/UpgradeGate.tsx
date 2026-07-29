import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, PixelText, BodyText, PixelButton } from './ui';
import { colors } from '../lib/theme';
import { startCheckout } from '../lib/checkout';
import { PLANS } from '../lib/plans';

const PRO_PRICE_ID = PLANS.find(p => p.name === 'pro')?.priceId;

export default function UpgradeGate({ title, description }: { title: string; description: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    if (!PRO_PRICE_ID) return;
    setError(null);
    setBusy(true);
    try {
      await startCheckout(PRO_PRICE_ID);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card borderColor={colors.gold} style={{ padding: 28, alignItems: 'center' }}>
      <PixelText size={28} style={{ marginBottom: 10 }}>🔒</PixelText>
      <PixelText color={colors.gold} size={11} glow style={{ marginBottom: 10, textAlign: 'center' }}>{title}</PixelText>
      <BodyText color={colors.muted} size={12} style={{ textAlign: 'center', marginBottom: 18 }}>{description}</BodyText>
      <View style={{ width: '100%' }}>
        <PixelButton color={colors.green} onPress={handleUpgrade} disabled={busy}>
          {busy ? '...' : '★ UPGRADE TO PRO — $9.99/mo'}
        </PixelButton>
        {error ? (
          <BodyText color={colors.red} size={11} style={{ textAlign: 'center', marginTop: 8 }}>⚠ {error}</BodyText>
        ) : null}
        <BodyText
          color={colors.muted}
          size={11}
          style={{ textAlign: 'center', marginTop: 10 }}
          onPress={() => router.push('/(tabs)/profile' as never)}
        >
          See all plans (incl. Legend annual) ▶
        </BodyText>
      </View>
    </Card>
  );
}
