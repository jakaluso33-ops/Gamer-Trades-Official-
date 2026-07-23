import { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, PixelText, PixelButton, Avatar } from '../../components/ui';
import { colors } from '../../lib/theme';
import { supabase, Profile, Friendship } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

interface EnrichedFriendship extends Friendship {
  otherProfile: Profile;
}

const TABS = ['friends', 'incoming', 'outgoing', 'find'] as const;
type Tab = typeof TABS[number];

export default function FriendsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<EnrichedFriendship[]>([]);
  const [incoming, setIncoming] = useState<EnrichedFriendship[]>([]);
  const [outgoing, setOutgoing] = useState<EnrichedFriendship[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadRelationships = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    if (!data) return;

    const otherIds = data.map(f => (f.requester_id === user.id ? f.addressee_id : f.requester_id));
    const uniqueIds = Array.from(new Set(otherIds));
    if (uniqueIds.length === 0) { setFriends([]); setIncoming([]); setOutgoing([]); return; }
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', uniqueIds);
    const profileMap = new Map((profiles ?? []).map(p => [p.id, p as Profile]));

    const enriched: EnrichedFriendship[] = data
      .map(f => {
        const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
        const otherProfile = profileMap.get(otherId);
        return otherProfile ? { ...(f as Friendship), otherProfile } : null;
      })
      .filter((f): f is EnrichedFriendship => f !== null);

    setFriends(enriched.filter(f => f.status === 'accepted'));
    setIncoming(enriched.filter(f => f.status === 'pending' && f.addressee_id === user.id));
    setOutgoing(enriched.filter(f => f.status === 'pending' && f.requester_id === user.id));
  }, [user]);

  useEffect(() => { loadRelationships(); }, [loadRelationships]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('friendships-changes-mobile')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `addressee_id=eq.${user.id}` }, loadRelationships)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `requester_id=eq.${user.id}` }, loadRelationships)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, loadRelationships]);

  const runSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim() || !user) { setResults([]); return; }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${q.trim()}%`)
      .neq('id', user.id)
      .limit(15);
    setResults((data ?? []) as Profile[]);
  };

  const knownIds = new Set([...friends, ...incoming, ...outgoing].map(f => f.otherProfile.id));

  const sendRequest = async (targetId: string) => {
    if (!user) return;
    setBusyId(targetId);
    await supabase.from('friendships').insert({ requester_id: user.id, addressee_id: targetId });
    setBusyId(null);
    loadRelationships();
  };

  const respond = async (id: string, status: 'accepted' | 'declined') => {
    setBusyId(id);
    await supabase.from('friendships').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    setBusyId(null);
    loadRelationships();
  };

  const removeFriend = async (id: string) => {
    setBusyId(id);
    await supabase.from('friendships').delete().eq('id', id);
    setBusyId(null);
    loadRelationships();
  };

  const challengeFriend = (friendId: string) => {
    router.push({ pathname: '/(tabs)/battle', params: { challenge: friendId } });
  };

  const counts: Record<Tab, number> = { friends: friends.length, incoming: incoming.length, outgoing: outgoing.length, find: 0 };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      <PixelText color={colors.green} size={13} glow>♥ FRIENDS</PixelText>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {TABS.map(t => (
          <PixelButton key={t} color={tab === t ? colors.green : colors.muted} onPress={() => setTab(t)} style={{ paddingHorizontal: 10, paddingVertical: 8 }}>
            {t.toUpperCase()}{counts[t] > 0 ? ` (${counts[t]})` : ''}
          </PixelButton>
        ))}
      </View>

      {tab === 'find' && (
        <Card>
          <TextInput
            value={query}
            onChangeText={runSearch}
            placeholder="SEARCH BY USERNAME..."
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            style={styles.input}
          />
        </Card>
      )}

      <View style={{ gap: 10 }}>
        {tab === 'friends' && (
          friends.length === 0 ? <Empty text="No friends yet. Head to FIND to add someone." /> :
            friends.map(f => (
              <PersonRow key={f.id} profile={f.otherProfile} busy={busyId === f.id}>
                <PixelButton color={colors.green} onPress={() => challengeFriend(f.otherProfile.id)} style={{ paddingHorizontal: 10, paddingVertical: 7 }}>⚔ CHALLENGE</PixelButton>
                <PixelButton color={colors.red} onPress={() => removeFriend(f.id)} style={{ paddingHorizontal: 10, paddingVertical: 7 }}>✕</PixelButton>
              </PersonRow>
            ))
        )}
        {tab === 'incoming' && (
          incoming.length === 0 ? <Empty text="No incoming requests." /> :
            incoming.map(f => (
              <PersonRow key={f.id} profile={f.otherProfile} busy={busyId === f.id}>
                <PixelButton color={colors.green} onPress={() => respond(f.id, 'accepted')} style={{ paddingHorizontal: 10, paddingVertical: 7 }}>✓</PixelButton>
                <PixelButton color={colors.red} onPress={() => respond(f.id, 'declined')} style={{ paddingHorizontal: 10, paddingVertical: 7 }}>✕</PixelButton>
              </PersonRow>
            ))
        )}
        {tab === 'outgoing' && (
          outgoing.length === 0 ? <Empty text="No pending outgoing requests." /> :
            outgoing.map(f => (
              <PersonRow key={f.id} profile={f.otherProfile} busy={busyId === f.id}>
                <PixelText color={colors.gold} size={6}>PENDING</PixelText>
                <PixelButton color={colors.red} onPress={() => removeFriend(f.id)} style={{ paddingHorizontal: 10, paddingVertical: 7 }}>✕</PixelButton>
              </PersonRow>
            ))
        )}
        {tab === 'find' && (
          results.length === 0 ? <Empty text={query ? 'No players found.' : 'Type a username to search.'} /> :
            results.map(p => (
              <PersonRow key={p.id} profile={p} busy={busyId === p.id}>
                {knownIds.has(p.id)
                  ? <PixelText color={colors.muted} size={6}>CONNECTED</PixelText>
                  : <PixelButton color={colors.blue} onPress={() => sendRequest(p.id)} style={{ paddingHorizontal: 10, paddingVertical: 7 }}>+ ADD</PixelButton>}
              </PersonRow>
            ))
        )}
      </View>
    </ScrollView>
  );
}

function PersonRow({ profile, busy, children }: { profile: Profile; busy: boolean; children: React.ReactNode }) {
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: busy ? 0.5 : 1 }}>
      <Avatar />
      <View style={{ flex: 1 }}>
        <PixelText color={colors.cyan} size={7}>{profile.username}</PixelText>
        <PixelText color={colors.muted} size={5} style={{ marginTop: 3 }}>LVL {profile.level} · {profile.total_wins}W-{profile.total_losses}L</PixelText>
      </View>
      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>{children}</View>
    </Card>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <Card style={{ alignItems: 'center', padding: 24 }}>
      <PixelText color={colors.muted} size={6}>{text}</PixelText>
    </Card>
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
