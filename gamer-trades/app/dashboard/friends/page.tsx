'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Profile, Friendship } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { logEvent } from '@/lib/activity';

interface EnrichedFriendship extends Friendship {
  otherProfile: Profile;
}

export default function FriendsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'friends' | 'incoming' | 'outgoing' | 'find'>('friends');
  const [friends, setFriends] = useState<EnrichedFriendship[]>([]);
  const [incoming, setIncoming] = useState<EnrichedFriendship[]>([]);
  const [outgoing, setOutgoing] = useState<EnrichedFriendship[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const loadRelationships = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    if (!data) return;

    const otherIds = data.map(f => (f.requester_id === user.id ? f.addressee_id : f.requester_id));
    const uniqueIds = Array.from(new Set(otherIds));
    if (uniqueIds.length === 0) {
      setFriends([]); setIncoming([]); setOutgoing([]);
      return;
    }
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
      .channel('friendships-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `addressee_id=eq.${user.id}` }, loadRelationships)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `requester_id=eq.${user.id}` }, loadRelationships)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, loadRelationships]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const runSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim() || !user) { setResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${q.trim()}%`)
      .neq('id', user.id)
      .limit(15);
    setResults((data ?? []) as Profile[]);
    setSearching(false);
  };

  const knownIds = new Set([...friends, ...incoming, ...outgoing].map(f => f.otherProfile.id));

  const sendRequest = async (targetId: string) => {
    if (!user) return;
    setBusyId(targetId);
    const { error } = await supabase.from('friendships').insert({ requester_id: user.id, addressee_id: targetId });
    setBusyId(null);
    if (error) { showToast('Could not send request'); return; }
    logEvent(user.id, 'friend_request_sent', { targetId });
    showToast('Friend request sent!');
    loadRelationships();
  };

  const respond = async (id: string, status: 'accepted' | 'declined') => {
    setBusyId(id);
    const { error } = await supabase.from('friendships').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    setBusyId(null);
    if (error) { showToast('Action failed'); return; }
    if (status === 'accepted' && user) logEvent(user.id, 'friend_added', { friendshipId: id });
    showToast(status === 'accepted' ? 'Friend added!' : 'Request declined');
    loadRelationships();
  };

  const removeFriend = async (id: string) => {
    setBusyId(id);
    await supabase.from('friendships').delete().eq('id', id);
    setBusyId(null);
    loadRelationships();
  };

  const challengeFriend = (friendId: string) => {
    router.push(`/dashboard/battle?challenge=${friendId}`);
  };

  const tabCounts = { friends: friends.length, incoming: incoming.length, outgoing: outgoing.length, find: 0 };

  return (
    <div className="grid-bg" style={{ minHeight: '100%' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>♥ SOCIAL</div>
        <h1 className="font-pixel" style={{ fontSize: '14px', color: '#00ff88', textShadow: '0 0 12px #00ff88', margin: 0 }}>FRIENDS</h1>
      </div>

      {toast && (
        <div style={{ position: 'fixed', top: '60px', right: '20px', zIndex: 200, padding: '10px 16px', background: '#0f1629', border: '2px solid #00ff88', boxShadow: '4px 4px 0 #000, 0 0 12px #00ff8844', fontSize: '13px', color: '#00ff88' }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {(['friends', 'incoming', 'outgoing', 'find'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="pixel-btn"
            style={{
              fontSize: '13px', padding: '9px 14px',
              background: tab === t ? '#00ff8822' : '#0a0e1a',
              color: tab === t ? '#00ff88' : '#64748b',
              borderColor: tab === t ? '#00ff88' : '#1e3a5f',
            }}
          >
            {t.toUpperCase()}{tabCounts[t] > 0 ? ` (${tabCounts[t]})` : ''}
          </button>
        ))}
      </div>

      {tab === 'find' && (
        <div className="retro-card" style={{ padding: '16px', marginBottom: '16px' }}>
          <input
            value={query}
            onChange={e => runSearch(e.target.value)}
            placeholder="SEARCH BY USERNAME..."
            style={{
              width: '100%', background: '#0a0e1a', border: '2px solid #1e3a5f', color: '#e2e8f0',
              fontSize: '14px', padding: '10px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {tab === 'friends' && (
          friends.length === 0
            ? <EmptyState text="No friends yet. Head to FIND to add someone." />
            : friends.map(f => (
              <PersonRow key={f.id} profile={f.otherProfile} busy={busyId === f.id}>
                <button onClick={() => challengeFriend(f.otherProfile.id)} className="pixel-btn pixel-btn-green" style={{ fontSize: '12px', padding: '7px 10px' }}>⚔ CHALLENGE</button>
                <button onClick={() => removeFriend(f.id)} className="pixel-btn pixel-btn-red" style={{ fontSize: '12px', padding: '7px 10px' }}>✕ REMOVE</button>
              </PersonRow>
            ))
        )}

        {tab === 'incoming' && (
          incoming.length === 0
            ? <EmptyState text="No incoming requests." />
            : incoming.map(f => (
              <PersonRow key={f.id} profile={f.otherProfile} busy={busyId === f.id}>
                <button onClick={() => respond(f.id, 'accepted')} className="pixel-btn pixel-btn-green" style={{ fontSize: '12px', padding: '7px 10px' }}>✓ ACCEPT</button>
                <button onClick={() => respond(f.id, 'declined')} className="pixel-btn pixel-btn-red" style={{ fontSize: '12px', padding: '7px 10px' }}>✕ DECLINE</button>
              </PersonRow>
            ))
        )}

        {tab === 'outgoing' && (
          outgoing.length === 0
            ? <EmptyState text="No pending outgoing requests." />
            : outgoing.map(f => (
              <PersonRow key={f.id} profile={f.otherProfile} busy={busyId === f.id}>
                <span style={{ fontSize: '12px', color: '#ffd700' }}>PENDING...</span>
                <button onClick={() => removeFriend(f.id)} className="pixel-btn pixel-btn-red" style={{ fontSize: '12px', padding: '7px 10px' }}>✕ CANCEL</button>
              </PersonRow>
            ))
        )}

        {tab === 'find' && (
          searching
            ? <EmptyState text="Searching..." />
            : results.length === 0
              ? <EmptyState text={query ? 'No players found.' : 'Type a username to search.'} />
              : results.map(p => (
                <PersonRow key={p.id} profile={p} busy={busyId === p.id}>
                  {knownIds.has(p.id)
                    ? <span style={{ fontSize: '12px', color: '#64748b' }}>ALREADY CONNECTED</span>
                    : <button onClick={() => sendRequest(p.id)} className="pixel-btn pixel-btn-blue" style={{ fontSize: '12px', padding: '7px 10px' }}>+ ADD FRIEND</button>}
                </PersonRow>
              ))
        )}
      </div>
    </div>
  );
}

function PersonRow({ profile, busy, children }: { profile: Profile; busy: boolean; children: React.ReactNode }) {
  return (
    <div className="retro-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '14px', opacity: busy ? 0.5 : 1 }}>
      <div style={{
        width: '36px', height: '36px', background: '#001133', border: '2px solid #00aaff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0,
      }}>
        🎮
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', color: '#00ffff', textShadow: '0 0 6px #00ffff' }}>{profile.username}</div>
        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
          LVL {profile.level} · {profile.total_wins}W-{profile.total_losses}L
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>{children}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="retro-card" style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
      {text}
    </div>
  );
}
