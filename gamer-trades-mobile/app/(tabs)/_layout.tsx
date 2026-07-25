import { Tabs } from 'expo-router';
import { Text, ColorValue } from 'react-native';
import { colors } from '../../lib/theme';

function TabIcon({ icon, color }: { icon: string; color: ColorValue }) {
  return <Text style={{ fontSize: 16, color }}>{icon}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.cyan,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, borderTopWidth: 2 },
        tabBarLabelStyle: { fontSize: 8, fontFamily: 'PressStart2P_400Regular' },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'HOME', tabBarIcon: ({ color }) => <TabIcon icon="⊞" color={color} /> }} />
      <Tabs.Screen name="trade" options={{ title: 'TRADE', tabBarIcon: ({ color }) => <TabIcon icon="◈" color={color} /> }} />
      <Tabs.Screen name="battle" options={{ title: 'BATTLE', tabBarIcon: ({ color }) => <TabIcon icon="⚔" color={color} /> }} />
      <Tabs.Screen name="friends" options={{ title: 'FRIENDS', tabBarIcon: ({ color }) => <TabIcon icon="♥" color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'PROFILE', tabBarIcon: ({ color }) => <TabIcon icon="◎" color={color} /> }} />
      <Tabs.Screen name="portfolio" options={{ href: null }} />
      <Tabs.Screen name="leaderboard" options={{ href: null }} />
      <Tabs.Screen name="challenges" options={{ href: null }} />
      <Tabs.Screen name="academy" options={{ href: null }} />
    </Tabs>
  );
}
