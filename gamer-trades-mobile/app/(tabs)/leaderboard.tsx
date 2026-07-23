import { ScrollView, View } from 'react-native';
import { Card, PixelText } from '../../components/ui';
import { colors } from '../../lib/theme';

const GLOBAL_BOARD = [
  { rank: 1, name: 'PIXEL_WOLF', avatar: '🐺', weekly: '+18.4%', badge: '👑' },
  { rank: 2, name: 'ALGO_ACE', avatar: '🤖', weekly: '+14.2%', badge: '🥈' },
  { rank: 3, name: 'TREND_TINA', avatar: '⚡', weekly: '+11.9%', badge: '🥉' },
  { rank: 4, name: 'MOON_CHASER', avatar: '🌙', weekly: '+9.7%', badge: null },
  { rank: 5, name: 'YOU', avatar: '🎮', weekly: '+8.3%', badge: null, isYou: true },
  { rank: 6, name: 'GRID_GARETH', avatar: '🧙', weekly: '+6.1%', badge: null },
];

export default function LeaderboardScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      <PixelText color={colors.gold} size={13} glow>♛ LEADERBOARD</PixelText>

      <Card>
        {GLOBAL_BOARD.map(e => (
          <View
            key={e.rank}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10,
              borderBottomWidth: 1, borderBottomColor: colors.border,
              backgroundColor: e.isYou ? 'rgba(0,255,136,0.06)' : 'transparent',
              borderLeftWidth: e.isYou ? 3 : 0, borderLeftColor: colors.green,
              paddingLeft: e.isYou ? 8 : 0,
            }}
          >
            <PixelText color={e.rank <= 3 ? colors.gold : colors.muted} size={7}>#{e.rank}</PixelText>
            <PixelText size={16}>{e.avatar}</PixelText>
            <PixelText color={e.isYou ? colors.green : colors.text} size={6} style={{ flex: 1 }}>{e.name}</PixelText>
            <PixelText color={colors.green} size={7}>{e.weekly}</PixelText>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}
