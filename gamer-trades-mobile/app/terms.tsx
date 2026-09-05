import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PixelText, BodyText } from '../components/ui';
import { colors } from '../lib/theme';
import { TERMS_OF_SERVICE, LEGAL_UPDATED } from '../lib/legalContent';

export default function TermsScreen() {
  const router = useRouter();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      <BodyText color={colors.muted} size={12} onPress={() => router.back()}>◀ BACK</BodyText>
      <PixelText color={colors.cyan} size={12} glow>TERMS OF SERVICE</PixelText>
      <BodyText color={colors.muted} size={11}>Last updated: {LEGAL_UPDATED}</BodyText>
      {TERMS_OF_SERVICE.map(section => (
        <View key={section.heading}>
          <BodyText color={colors.blue} size={13} weight="semibold" glow style={{ marginBottom: 6 }}>{section.heading}</BodyText>
          <BodyText color={colors.text} size={13}>{section.body}</BodyText>
        </View>
      ))}
    </ScrollView>
  );
}
