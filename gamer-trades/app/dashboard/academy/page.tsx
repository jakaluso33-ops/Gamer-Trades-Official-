'use client';

import { useState } from 'react';
import { STRATEGIES } from '@/lib/strategyContent';
import StrategyDiagram from '@/components/trading/StrategyDiagram';

const DIFF_COLOR = { BEGINNER: '#00ff88', INTERMEDIATE: '#ffd700', ADVANCED: '#ff3355' } as const;

export default function AcademyPage() {
  const [selected, setSelected] = useState(STRATEGIES[0]);

  return (
    <div className="grid-bg" style={{ minHeight: '100%' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '6px' }}>🧠 AI STRATEGY ACADEMY</div>
        <h1 className="font-pixel" style={{ fontSize: '12px', color: '#00ffff', textShadow: '0 0 12px #00ffff', margin: 0 }}>LEARN &amp; DETECT</h1>
        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '8px', maxWidth: '640px', lineHeight: 1.8 }}>
          Learn proven trading strategies here, then head to the Trade screen — the live scanner watches the chart
          and flags these exact setups the moment they form.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px' }}>
        {/* Strategy list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {STRATEGIES.map(s => (
            <div
              key={s.id}
              onClick={() => setSelected(s)}
              style={{
                padding: '12px',
                background: selected.id === s.id ? `${s.color}11` : '#0f1629',
                border: `2px solid ${selected.id === s.id ? s.color : '#1e3a5f'}`,
                boxShadow: selected.id === s.id ? `4px 4px 0 #000, 0 0 10px ${s.color}33` : '4px 4px 0 #000',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px' }}>{s.icon}</span>
                <span style={{ fontSize: '9px', color: DIFF_COLOR[s.difficulty], border: `1px solid ${DIFF_COLOR[s.difficulty]}`, padding: '2px 4px' }}>
                  {s.difficulty}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: selected.id === s.id ? s.color : '#e2e8f0', marginTop: '8px', lineHeight: 1.6 }}>
                {s.name}
              </div>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div className="retro-card" style={{ padding: '20px', borderColor: selected.color, boxShadow: `4px 4px 0 #000, 0 0 16px ${selected.color}33` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <span style={{ fontSize: '28px' }}>{selected.icon}</span>
            <div>
              <div style={{ fontSize: '9px', color: selected.color, textShadow: `0 0 8px ${selected.color}` }}>{selected.name}</div>
              <div style={{ fontSize: '9px', color: DIFF_COLOR[selected.difficulty], marginTop: '4px' }}>{selected.difficulty}</div>
            </div>
          </div>

          <div style={{ fontSize: '11px', color: '#e2e8f0', lineHeight: 1.8, marginBottom: '16px' }}>{selected.summary}</div>

          <div style={{ background: '#0a0e1a', border: '2px solid #1e3a5f', marginBottom: '16px', padding: '8px' }}>
            <StrategyDiagram strategyId={selected.id} color={selected.color} />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '8px' }}>◆ HOW IT WORKS</div>
            {selected.howItWorks.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '10px', color: '#e2e8f0', lineHeight: 1.9, marginBottom: '6px' }}>
                <span style={{ color: selected.color }}>{i + 1}.</span>
                <span>{step}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ padding: '10px', background: '#0a0e1a', border: '1px solid #1e3a5f' }}>
              <div style={{ fontSize: '9px', color: '#00aaff', marginBottom: '6px' }}>WHEN TO USE</div>
              <div style={{ fontSize: '10px', color: '#64748b', lineHeight: 1.8 }}>{selected.whenToUse}</div>
            </div>
            <div style={{ padding: '10px', background: '#0a0e1a', border: '1px solid #1e3a5f' }}>
              <div style={{ fontSize: '9px', color: '#ff3355', marginBottom: '6px' }}>RISK NOTE</div>
              <div style={{ fontSize: '10px', color: '#64748b', lineHeight: 1.8 }}>{selected.riskNote}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
