'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { computeInsights, Insight, InsightTone } from '@/lib/insights';
import { useAuth } from '@/lib/AuthContext';

const TONE_COLOR: Record<InsightTone, string> = {
  warning: '#ff3355',
  tip: '#00aaff',
  positive: '#00ff88',
};

const ACTION_HREF: Record<Insight['actionKey'], string> = {
  trade: '/dashboard/trade',
  battle: '/dashboard/battle',
  friends: '/dashboard/friends',
  challenges: '/dashboard/challenges',
  dashboard: '/dashboard',
};

export default function InsightsCard() {
  const { user, profile } = useAuth();
  const [insights, setInsights] = useState<Insight[] | null>(null);

  useEffect(() => {
    if (!user) return;
    computeInsights(user.id, profile).then(setInsights);
  }, [user, profile]);

  if (!user) return null;

  return (
    <div
      className="retro-card"
      style={{ padding: '16px', marginBottom: '16px', borderColor: '#8b5cf6', boxShadow: '4px 4px 0 #000, 0 0 14px #8b5cf633' }}
    >
      <div style={{ fontSize: '11px', color: '#8b5cf6', textShadow: '0 0 8px #8b5cf6', marginBottom: '12px' }}>
        🧠 COACH INSIGHTS
      </div>

      {insights === null && (
        <div style={{ fontSize: '10px', color: '#64748b' }}>Analyzing your recent activity...</div>
      )}

      {insights !== null && insights.length === 0 && (
        <div style={{ fontSize: '10px', color: '#64748b' }}>Nothing urgent — keep trading and check back soon.</div>
      )}

      {insights && insights.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
          {insights.map(insight => {
            const color = TONE_COLOR[insight.tone];
            return (
              <div
                key={insight.id}
                style={{ padding: '12px', background: `${color}0a`, border: `2px solid ${color}55` }}
              >
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <span style={{ fontSize: '16px' }}>{insight.icon}</span>
                  <span style={{ fontSize: '11px', color, textShadow: `0 0 6px ${color}` }}>{insight.title}</span>
                </div>
                <div style={{ fontSize: '9px', color: '#64748b', lineHeight: 1.7, marginBottom: '8px' }}>
                  {insight.message}
                </div>
                <Link
                  href={ACTION_HREF[insight.actionKey]}
                  style={{ fontSize: '9px', color, textDecoration: 'none', textShadow: `0 0 6px ${color}` }}
                >
                  ▶ {insight.actionLabel}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
