'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, TradingGoal, Task } from '@/lib/supabase';
import { GOAL_TEMPLATES, syncTasks, TaskPeriod } from '@/lib/goals';
import { useAuth } from '@/lib/AuthContext';

export default function ChallengesPage() {
  const { user, refreshProfile } = useAuth();
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
    return <div className="grid-bg" style={{ minHeight: '100%', padding: '20px' }}><PixelLoading /></div>;
  }

  return (
    <div className="grid-bg" style={{ minHeight: '100%' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '6px', color: '#64748b', marginBottom: '6px' }}>◆ TAILORED TO YOU</div>
          <h1 style={{ fontSize: '14px', color: '#00ff88', textShadow: '0 0 12px #00ff88', margin: 0 }}>GOALS &amp; TASKS</h1>
        </div>
        {syncing && <div style={{ fontSize: '6px', color: '#64748b' }}>syncing...</div>}
      </div>

      {/* Goals */}
      <div className="retro-card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '7px', color: '#8b5cf6', textShadow: '0 0 8px #8b5cf6' }}>★ YOUR GOALS</span>
          {goals.length < 3 && availableTemplates.length > 0 && (
            <button onClick={() => setShowPicker(v => !v)} className="pixel-btn pixel-btn-blue" style={{ fontSize: '6px', padding: '6px 10px' }}>
              {showPicker ? '✕ CLOSE' : '+ ADD GOAL'}
            </button>
          )}
        </div>

        {goals.length === 0 && !showPicker && (
          <div style={{ fontSize: '6px', color: '#64748b', textAlign: 'center', padding: '16px' }}>
            Pick a goal below to get daily, weekly, and monthly tasks tailored to it.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
          {goals.map(g => {
            const t = GOAL_TEMPLATES.find(x => x.id === g.template_id);
            if (!t) return null;
            return (
              <div key={g.id} style={{ padding: '12px', background: `${t.color}0a`, border: `2px solid ${t.color}`, boxShadow: `3px 3px 0 #000, 0 0 8px ${t.color}33` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '18px' }}>{t.icon}</span>
                  <button onClick={() => removeGoal(g.id)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '9px' }}>✕</button>
                </div>
                <div style={{ fontSize: '7px', color: t.color, textShadow: `0 0 6px ${t.color}`, marginTop: '6px' }}>{t.label}</div>
                <div style={{ fontSize: '5px', color: '#64748b', marginTop: '6px', lineHeight: 1.6 }}>{t.description}</div>
              </div>
            );
          })}
        </div>

        {showPicker && (
          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #1e3a5f', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
            {availableTemplates.map(t => (
              <div
                key={t.id}
                onClick={() => addGoal(t.id, t.defaultTarget)}
                style={{ padding: '12px', background: '#0f1629', border: `2px solid ${t.color}66`, cursor: 'pointer' }}
              >
                <span style={{ fontSize: '18px' }}>{t.icon}</span>
                <div style={{ fontSize: '7px', color: t.color, marginTop: '6px' }}>{t.label}</div>
                <div style={{ fontSize: '5px', color: '#64748b', marginTop: '6px', lineHeight: 1.6 }}>{t.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task period tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {(['daily', 'weekly', 'monthly'] as TaskPeriod[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="pixel-btn"
            style={{
              fontSize: '7px', padding: '9px 16px',
              background: period === p ? '#00ff8822' : '#0a0e1a',
              color: period === p ? '#00ff88' : '#64748b',
              borderColor: period === p ? '#00ff88' : '#1e3a5f',
            }}
          >
            {p.toUpperCase()}
          </button>
        ))}
      </div>

      {visibleTasks.length === 0 ? (
        <div className="retro-card" style={{ padding: '32px', textAlign: 'center', fontSize: '7px', color: '#64748b' }}>
          {goals.length === 0 ? 'Add a goal above to generate your tasks.' : 'No tasks for this period yet.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
          {visibleTasks.map(task => {
            const template = GOAL_TEMPLATES.find(t => t.id === goals.find(g => g.id === task.goal_id)?.template_id);
            const accent = template?.color ?? '#00aaff';
            const pct = Math.min((task.progress / task.target) * 100, 100);
            const done = task.status === 'completed';
            const expired = task.status === 'expired';
            return (
              <div
                key={task.id}
                className="retro-card"
                style={{
                  padding: '14px',
                  borderColor: done ? accent : expired ? '#1e3a5f' : '#1e3a5f',
                  opacity: expired ? 0.5 : 1,
                  boxShadow: done ? `4px 4px 0 #000, 0 0 10px ${accent}33` : '4px 4px 0 #000',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '7px', color: done ? accent : '#e2e8f0', textShadow: done ? `0 0 6px ${accent}` : 'none' }}>
                    {done ? '✓ ' : ''}{task.title}
                  </span>
                  <span style={{ fontSize: '5px', color: '#ffd700', textShadow: '0 0 6px #ffd700' }}>+{task.xp_reward} XP</span>
                </div>
                <div style={{ fontSize: '5px', color: '#64748b', marginBottom: '8px' }}>{task.description}</div>
                <div style={{ height: '6px', background: '#0a0e1a', border: '1px solid #1e3a5f' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: done ? accent : '#00aaff', boxShadow: `0 0 6px ${done ? accent : '#00aaff'}` }} />
                </div>
                <div style={{ fontSize: '5px', color: '#64748b', marginTop: '4px', textAlign: 'right' }}>
                  {Math.min(task.progress, task.target)}/{task.target}{expired ? ' · EXPIRED' : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PixelLoading() {
  return <div style={{ fontSize: '8px', color: '#00ffff', textShadow: '0 0 8px #00ffff' }}>LOADING...</div>;
}
