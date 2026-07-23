import { ScrollView, View } from 'react-native';
import { Card, PixelText, PixelButton, Avatar } from '../../components/ui';
import { colors } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';

export default function ProfileScreen() {
  const { profile, user, signOut } = useAuth();
  const xpForLevel = (level: number) => level * 250;
  const xpNeeded = xpForLevel(profile?.level ?? 1);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      <PixelText color={colors.cyan} size={13} glow>◎ PROFILE</PixelText>

      <Card style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
        <Avatar size={56} />
        <View style={{ flex: 1 }}>
          <PixelText color={colors.cyan} size={9} glow>{profile?.username ?? '...'}</PixelText>
          <PixelText color={colors.muted} size={5} style={{ marginTop: 6 }}>{user?.email}</PixelText>
          <PixelText color={colors.muted} size={5} style={{ marginTop: 3 }}>{(profile?.plan ?? 'free').toUpperCase()} TIER</PixelText>
        </View>
      </Card>

      <Card>
        <PixelText color={colors.purple} size={7} glow style={{ marginBottom: 8 }}>LEVEL {profile?.level ?? 1}</PixelText>
        <PixelText color={colors.muted} size={5} style={{ marginBottom: 6 }}>
          XP: {(profile?.xp ?? 0).toLocaleString()} / {xpNeeded.toLocaleString()}
        </PixelText>
        <View style={{ height: 8, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ width: `${Math.min(100, ((profile?.xp ?? 0) / xpNeeded) * 100)}%`, height: '100%', backgroundColor: colors.purple }} />
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Card style={{ flex: 1 }}>
          <PixelText color={colors.muted} size={5}>WINS</PixelText>
          <PixelText color={colors.green} size={12} glow style={{ marginTop: 6 }}>{profile?.total_wins ?? 0}</PixelText>
        </Card>
        <Card style={{ flex: 1 }}>
          <PixelText color={colors.muted} size={5}>LOSSES</PixelText>
          <PixelText color={colors.red} size={12} glow style={{ marginTop: 6 }}>{profile?.total_losses ?? 0}</PixelText>
        </Card>
      </View>

      <PixelButton color={colors.red} onPress={signOut}>✕ SIGN OUT</PixelButton>
    </ScrollView>
  );
}
