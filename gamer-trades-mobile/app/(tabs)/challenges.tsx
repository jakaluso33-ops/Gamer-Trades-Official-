import { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { Card, PixelText, BodyText, PixelButton } from '../../components/ui';
import { colors } from '../../lib/theme';
import { useRouter } from 'expo-router';
import { supabase, TradingGoal, Task } from '../../lib/supabase';
import { GOAL_TEMPLATES, syncTasks, TaskPeriod } from '../../lib/goals';
import { useAuth } from '../../lib/AuthContext';
import { maxActiveGoals, Plan, PLANS } from '../../lib/plans';

const PERIODS: TaskPeriod[] = ['daily', 'weekly', 'monthly'];

export default function ChallengesScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const plan = (profile?.plan ?? 'free') as Plan;
  const goalCap = maxActiveGoals(plan);
  const proPlan = PLANS.find(p => p.name === 'pro');
  const [goals, setGoals] = useState<TradingGoal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [period, setPeriod] = useState<TaskPeriod>('daily');
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data: g }, { data: t }] = await Promise.all([
      supabase.from('trading_goals').select('*').eq('user_id', user.id).eq('status', 'active'),
      supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    setGoals((g ?? []) as TradingGoal[]);
    setTasks((t ?? []) as Task[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setSyncing(true);
      await syncTasks(user.id);
      await load();
      await refreshProfile();
      setSyncing(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const addGoal = async (templateId: string, defaultTarget: number) => {
    if (!user) return;
    await supabase.from('trading_goals').insert({ user_id: user.id, template_id: templateId, target_value: defaultTarget });
    setShowPicker(false);
    setSyncing(true);
    await syncTasks(user.id);
    await load();
    setSyncing(false);
  };

  const removeGoal = async (goalId: string) => {
    await supabase.from('trading_goals').update({ status: 'archived' }).eq('id', goalId);
    await load();
  };

  const activeTemplateIds = new Set(goals.map(g => g.template_id));
  const availableTemplates = GOAL_TEMPLATES.filter(t => !activeTemplateIds.has(t.id));
  const visibleTasks = tasks.filter(t => t.period === period);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <PixelText color={colors.cyan} size={8}>LOADING...</PixelText>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <PixelText color={colors.green} size={13} glow>◆ GOALS &amp; TASKS</PixelText>
        {syncing && <BodyText color={colors.muted} size={11}>syncing...</BodyText>}
      </View>

      <Card borderColor={colors.purple}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <BodyText color={colors.purple} size={13} weight="semibold" glow>★ YOUR GOALS</BodyText>
          {goals.length < goalCap && availableTemplates.length > 0 && (
            <PixelButton color={colors.blue} onPress={() => setShowPicker(v => !v)} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
              {showPicker ? '✕ CLOSE' : '+ ADD'}
            </PixelButton>
          )}
        </View>

        {goals.length === 0 && !showPicker && (
          <BodyText color={colors.muted} size={13} style={{ textAlign: 'center', padding: 12 }}>
            Pick a goal below to get tasks tailored to it.
          </BodyText>
        )}

        {goals.length >= goalCap && plan === 'free' && (
          <Pressable onPress={() => router.push('/(tabs)/profile' as never)} style={{ marginTop: goals.length > 0 ? 10 : 0 }}>
            <View style={{ padding: 10, backgroundColor: `${colors.gold}0a`, borderWidth: 2, borderColor: `${colors.gold}55` }}>
              <BodyText color={colors.gold} size={12} weight="semibold">
                🔒 Free plan: 1 active goal at a time
              </BodyText>
              <BodyText color={colors.muted} size={11} style={{ marginTop: 2 }}>
                Upgrade to Pro for 3 goals running at once — {proPlan?.price ?? ''}
              </BodyText>
            </View>
          </Pressable>
        )}

        <View style={{ gap: 8 }}>
          {goals.map(g => {
            const t = GOAL_TEMPLATES.find(x => x.id === g.template_id);
            if (!t) return null;
            return (
              <View key={g.id} style={{ padding: 10, backgroundColor: `${t.color}0a`, borderWidth: 2, borderColor: t.color }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <PixelText size={16}>{t.icon}</PixelText>
                  <Pressable onPress={() => removeGoal(g.id)}>
                    <BodyText color={colors.muted} size={14}>✕</BodyText>
                  </Pressable>
                </View>
                <BodyText color={t.color} size={13} weight="semibold" glow style={{ marginTop: 6 }}>{t.label}</BodyText>
                <BodyText color={colors.muted} size={12} style={{ marginTop: 6 }}>{t.description}</BodyText>
              </View>
            );
          })}
        </View>

        {showPicker && (
          <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, gap: 8 }}>
            {availableTemplates.map(t => (
              <Pressable key={t.id} onPress={() => addGoal(t.id, t.defaultTarget)} style={{ padding: 10, backgroundColor: colors.card, borderWidth: 2, borderColor: `${t.color}66` }}>
                <PixelText size={16}>{t.icon}</PixelText>
                <BodyText color={t.color} size={13} weight="medium" style={{ marginTop: 6 }}>{t.label}</BodyText>
                <BodyText color={colors.muted} size={12} style={{ marginTop: 6 }}>{t.description}</BodyText>
              </Pressable>
            ))}
          </View>
        )}
      </Card>

      <View style={{ flexDirection: 'row', gap: 6 }}>
        {PERIODS.map(p => (
          <PixelButton key={p} color={period === p ? colors.green : colors.muted} onPress={() => setPeriod(p)} style={{ flex: 1 }}>
            {p.toUpperCase()}
          </PixelButton>
        ))}
      </View>

      {visibleTasks.length === 0 ? (
        <Card style={{ alignItems: 'center', padding: 24 }}>
          <BodyText color={colors.muted} size={13}>
            {goals.length === 0 ? 'Add a goal above to generate your tasks.' : 'No tasks for this period yet.'}
          </BodyText>
        </Card>
      ) : (
        <View style={{ gap: 10 }}>
          {visibleTasks.map(task => {
            const template = GOAL_TEMPLATES.find(t => t.id === goals.find(g => g.id === task.goal_id)?.template_id);
            const accent = template?.color ?? colors.blue;
            const pct = Math.min((task.progress / task.target) * 100, 100);
            const done = task.status === 'completed';
            const expired = task.status === 'expired';
            return (
              <Card key={task.id} borderColor={done ? accent : colors.border} style={{ opacity: expired ? 0.5 : 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <BodyText color={done ? accent : colors.text} size={13} weight="medium" glow={done}>{done ? '✓ ' : ''}{task.title}</BodyText>
                  <BodyText color={colors.gold} size={11}>+{task.xp_reward} XP</BodyText>
                </View>
                <BodyText color={colors.muted} size={12} style={{ marginBottom: 8 }}>{task.description}</BodyText>
                <View style={{ height: 6, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}>
                  <View style={{ width: `${pct}%`, height: '100%', backgroundColor: done ? accent : colors.blue }} />
                </View>
                <BodyText color={colors.muted} size={11} style={{ marginTop: 4, textAlign: 'right' }}>
                  {Math.min(task.progress, task.target)}/{task.target}{expired ? ' · EXPIRED' : ''}
                </BodyText>
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
