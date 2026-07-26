import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PixelText } from '../components/ui';
import { colors } from '../lib/theme';
import { TERMS_OF_SERVICE, LEGAL_UPDATED } from '../lib/legalContent';

export default function TermsScreen() {
  const router = useRouter();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      <PixelText color={colors.muted} size={6} onPress={() => router.back()}>◀ BACK</PixelText>
      <PixelText color={colors.cyan} size={12} glow>TERMS OF SERVICE</PixelText>
      <PixelText color={colors.muted} size={5}>Last updated: {LEGAL_UPDATED}</PixelText>
      {TERMS_OF_SERVICE.map(section => (
        <View key={section.heading}>
          <PixelText color={colors.blue} size={7} glow style={{ marginBottom: 6 }}>{section.heading}</PixelText>
          <PixelText color={colors.text} size={6} style={{ lineHeight: 11 }}>{section.body}</PixelText>
        </View>
      ))}
    </ScrollView>
  );
}
