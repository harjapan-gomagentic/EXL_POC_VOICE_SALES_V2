import { useCallContext } from '../context/CallContext';

export default function TrustPanel() {
  const { state } = useCallContext();
  const { trustScore, moveLog, unlockedInsights } = state;

  const ALL_INSIGHTS = ['Current Challenge', 'Where It Hurts', 'The Deadline', "What They've Tried", 'EXL Scope Gap'];

  return (
    <div data-tour="trust-score" style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.15em', fontWeight: 500, marginBottom: 12 }}>TRUST SCORE</div>
      
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div className="mono" style={{ fontSize: 52, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>{trustScore}</div>
        <div className="mono" style={{ fontSize: 12, color: 'var(--text-3)' }}>/ ±100</div>
      </div>

      <div style={{ position: 'relative', height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginTop: 16, marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ 
          position: 'absolute', left: '50%', height: '100%', borderRadius: 4, transition: 'all 500ms cubic-bezier(0.34,1.56,0.64,1)',
          width: `${Math.abs(trustScore) / 2}%`,
          background: trustScore >= 0 ? 'var(--teal)' : 'var(--red)',
          transform: trustScore < 0 ? 'translateX(-100%)' : 'none',
          boxShadow: trustScore >= 0 ? '0 0 12px var(--teal-glow)' : '0 0 12px rgba(255,77,77,0.3)'
        }} />
        <div style={{ position: 'absolute', left: '75%', top: 0, width: 2, height: '100%', background: 'var(--amber)', opacity: 0.6 }} />
        <div className="mono" style={{ position: 'absolute', left: '75%', top: -16, transform: 'translateX(-50%)', fontSize: 9, color: 'var(--amber)' }}>+50 UNLOCK</div>
      </div>

      <div style={{ height: 1, background: 'var(--border)', marginBottom: 24 }} />

      <div data-tour="move-log" style={{ flex: 1 }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.15em', fontWeight: 500, marginBottom: 16 }}>MOVE LOG</div>
        {moveLog.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-3)', fontStyle: 'italic' }}>Your moves will appear here...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {moveLog.map((entry) => (
              <div key={entry.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 8, animation: 'card-enter 300ms' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="mono" style={{ 
                    fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
                    background: entry.label === 'STRONG' ? 'rgba(0,212,170,0.15)' : entry.label === 'BLUNDER' ? 'rgba(255,77,77,0.15)' : 'rgba(148,163,184,0.1)',
                    color: entry.label === 'STRONG' ? 'var(--teal)' : entry.label === 'BLUNDER' ? 'var(--red)' : 'var(--text-2)',
                    border: `1px solid ${entry.label === 'STRONG' ? 'var(--teal)' : entry.label === 'BLUNDER' ? 'var(--red)' : 'var(--border)'}44`
                  }}>{entry.label}</span>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: entry.delta >= 0 ? 'var(--teal)' : 'var(--red)' }}>
                    {entry.delta >= 0 ? '+' : ''}{entry.delta}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>"{entry.turnText}"</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4 }}>{entry.reason}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '24px 0' }} />

      <div data-tour="hidden-insights">
        <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.15em', fontWeight: 500, marginBottom: 16 }}>HIDDEN INSIGHTS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ALL_INSIGHTS.map((insight) => {
            const isUnlocked = unlockedInsights.includes(insight);
            return (
              <div key={insight} style={{ 
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, 
                background: isUnlocked ? 'rgba(0,212,170,0.06)' : 'rgba(245,158,11,0.03)',
                border: `1px solid ${isUnlocked ? 'rgba(0,212,170,0.2)' : 'rgba(255,255,255,0.04)'}`,
                transition: 'all 500ms'
              }}>
                {isUnlocked ? (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)', boxShadow: '0 0 8px var(--teal-glow)' }} />
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2.5" style={{ opacity: 0.4 }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                )}
                <span style={{ fontSize: 12, color: isUnlocked ? 'var(--teal)' : 'var(--text-3)', fontWeight: isUnlocked ? 600 : 400 }}>{insight}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
