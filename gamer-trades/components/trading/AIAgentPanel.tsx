'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  runMarketAgent,
  MarketAgentResult,
  VERDICT_COLOR,
  VERDICT_LABEL,
  SENTIMENT_COLOR,
} from '@/lib/marketAgent';
import { useAuth } from '@/lib/AuthContext';
import { aiAnalystDailyLimit, getAiAnalystRunsToday, incrementAiAnalystRunsToday } from '@/lib/plans';

export default function AIAgentPanel({ symbol, technicalContext }: { symbol: string; technicalContext?: string }) {
  const { user, profile } = useAuth();
  const [result, setResult] = useState<MarketAgentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runsToday, setRunsToday] = useState(0);

  const plan = (profile?.plan ?? 'free') as 'free' | 'pro' | 'legend';
  const dailyLimit = aiAnalystDailyLimit(plan);
  const limitReached = dailyLimit != null && runsToday >= dailyLimit;

  useEffect(() => {
    if (user) setRunsToday(getAiAnalystRunsToday(user.id));
  }, [user]);

  const run = useCallback(() => {
    if (limitReached) return;
    setLoading(true);
    setError(null);
    runMarketAgent(symbol, technicalContext)
      .then(res => {
        setResult(res);
        if (user) setRunsToday(incrementAiAnalystRunsToday(user.id));
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Analysis failed'))
      .finally(() => setLoading(false));
  }, [symbol, technicalContext, limitReached, user]);

  useEffect(() => {
    setResult(null);
    setError(null);
  }, [symbol]);

  const verdict = result?.recommendation.verdict;
  const color = verdict ? VERDICT_COLOR[verdict] : '#8b5cf6';

  return (
    <div className="retro-card" style={{ overflow: 'hidden', borderColor: color, boxShadow: `4px 4px 0 #000, 0 0 14px ${color}33` }}>
      <div style={{ padding: '10px 12px', borderBottom: '2px solid #1e3a5f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color, textShadow: `0 0 8px ${color}` }}>🤖 AI MARKET ANALYST</span>
        <button
          onClick={run}
          disabled={loading || limitReached}
          className="pixel-btn pixel-btn-blue"
          style={{ fontSize: '10px', padding: '5px 10px', opacity: loading || limitReached ? 0.6 : 1 }}
        >
          {loading ? 'ANALYZING...' : limitReached ? '🔒 DAILY LIMIT HIT' : result ? '↻ RE-RUN' : '▶ RUN ANALYSIS'}
        </button>
      </div>

      <div style={{ padding: '12px' }}>
        {dailyLimit != null && (
          <div style={{ fontSize: '9px', color: limitReached ? '#ffd700' : '#64748b', marginBottom: '10px' }}>
            {limitReached
              ? `Free plan: ${dailyLimit}/${dailyLimit} analyses used today. Upgrade to Pro for unlimited AI analysis.`
              : `Free plan: ${runsToday}/${dailyLimit} analyses used today.`}
          </div>
        )}
        {!result && !loading && !error && !limitReached && (
          <div style={{ fontSize: '10px', color: '#64748b', lineHeight: 1.8 }}>
            Get a real-time research synthesis for {symbol} — live news pulled from NewsAPI, analyzed by Claude,
            with a verdict on whether to press this trade, sit it out, or wait for confirmation.
          </div>
        )}

        {loading && (
          <div style={{ fontSize: '10px', color: '#8b5cf6' }}>Pulling live news and running research synthesis...</div>
        )}

        {error && (
          <div style={{ fontSize: '10px', color: '#ff3355', lineHeight: 1.8 }}>
            ⚠ {error}
          </div>
        )}

        {result && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Verdict banner */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: `${color}0a`, border: `2px solid ${color}55` }}>
              <div>
                <div style={{ fontSize: '9px', color, textShadow: `0 0 8px ${color}` }}>
                  {verdict && VERDICT_LABEL[verdict]}
                </div>
                <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px' }}>
                  CONFIDENCE: {result.recommendation.confidence}%
                  {result.cached && ' · CACHED (< 5 MIN OLD)'}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '3px 6px',
                    color: SENTIMENT_COLOR[result.analysis.sentiment],
                    border: `1px solid ${SENTIMENT_COLOR[result.analysis.sentiment]}55`,
                  }}
                >
                  {result.analysis.sentiment.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Summary */}
            <div style={{ fontSize: '10px', color: '#e2e8f0', lineHeight: 1.9 }}>{result.analysis.summary}</div>

            {/* Key factors */}
            {result.analysis.key_factors?.length > 0 && (
              <div>
                <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '6px' }}>KEY FACTORS</div>
                {result.analysis.key_factors.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: '6px', fontSize: '10px', color: '#e2e8f0', marginBottom: '4px' }}>
                    <span style={{ color }}>▸</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Levels */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              {[
                { k: 'ENTRY', v: result.recommendation.entry_price, c: '#00aaff' },
                { k: 'STOP', v: result.recommendation.stop_loss, c: '#ff3355' },
                { k: 'TARGET', v: result.recommendation.take_profit, c: '#00ff88' },
              ].map(({ k, v, c }) => (
                <div key={k} style={{ padding: '8px', background: '#0a0e1a', border: '1px solid #1e3a5f', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '4px' }}>{k}</div>
                  <div style={{ fontSize: '11px', color: v != null ? c : '#1e3a5f' }}>{v != null ? `$${v.toLocaleString()}` : '—'}</div>
                </div>
              ))}
            </div>

            {/* Reasoning */}
            <div style={{ padding: '8px', background: '#0a0e1a', border: '1px solid #1e3a5f' }}>
              <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '4px' }}>WHY</div>
              <div style={{ fontSize: '10px', color: '#64748b', lineHeight: 1.8 }}>{result.recommendation.reasoning}</div>
            </div>

            <div style={{ fontSize: '9px', color: '#1e3a5f', textAlign: 'center' }}>
              Educational paper-trading analysis, not financial advice.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
