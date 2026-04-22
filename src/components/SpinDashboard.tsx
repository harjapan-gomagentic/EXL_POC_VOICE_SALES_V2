import { useEffect, useRef, useState } from 'react';
import { useCallContext } from '../context/CallContext';
import type { Phase } from '../context/CallContext';

const PHASES: Phase[] = ['opening', 'investigating', 'demonstrating', 'commitment'];
const PHASE_LABELS: Record<Phase, string> = { opening: 'OPENING', investigating: 'INVEST.', demonstrating: 'DEMO', commitment: 'COMMIT' };

export default function SpinDashboard() {
  const { state, dispatch } = useCallContext();
  const { spinCounts, phase, impliedNeeds, explicitNeeds, coachingTip, pitchRiskVisible, missionSteps, meetingButtonUnlocked, trustScore } = state;
  const max = Math.max(spinCounts.S, spinCounts.P, spinCounts.I, spinCounts.N, 1);
  const [tipKey, setTipKey] = useState(0);
  const prevTip = useRef(coachingTip);

  useEffect(() => { if (coachingTip !== prevTip.current) { setTipKey(k => k + 1); prevTip.current = coachingTip; } }, [coachingTip]);
  useEffect(() => { if (pitchRiskVisible) { const t = setTimeout(() => dispatch({ type: 'SET_PITCH_RISK', visible: false }), 8000); return () => clearTimeout(t); } }, [pitchRiskVisible, dispatch]);

  const handleAdvance = () => {
    if (!meetingButtonUnlocked) return;
    const text = "Based on everything we've discussed, would it make sense to schedule a focused half-day diagnostic with your ops lead and CIO to map the cost-to-serve data challenge? We could aim for end of this month.";
    dispatch({ type: 'ADD_USER_MESSAGE', content: text });
  };

  return (
    <div data-tour="spin-intel" style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span className="mono" style={{ fontSize: 11, color: 'var(--text-2)', letterSpacing: '0.2em', fontWeight: 700 }}>SPIN INTELLIGENCE</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', animation: 'glow-pulse 2s infinite' }} />
        <span className="mono" style={{ fontSize: 10, color: '#22C55E', letterSpacing: '0.15em', fontWeight: 500 }}>LIVE</span>
      </div>

      {/* Pitch Risk */}
      {pitchRiskVisible && (
        <div style={{ background: 'rgba(255,77,77,0.08)', border: '1px solid var(--red)', borderLeft: '4px solid var(--red)', borderRadius: '0 10px 10px 0', padding: '12px 14px', marginBottom: 16, animation: 'card-enter 300ms' }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--red)', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 6 }}>⚠ PITCH RISK</div>
          <div style={{ fontSize: 12, color: 'rgba(255,77,77,0.8)', lineHeight: 1.5 }}>No explicit needs confirmed. Pitching now creates objections, not agreement.</div>
        </div>
      )}

      {/* Phase Tracker */}
      <div style={{ marginBottom: 24 }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.15em', fontWeight: 500, marginBottom: 10 }}>CALL PHASE</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {PHASES.map((p, i) => {
            const cur = p === phase, done = PHASES.indexOf(p) < PHASES.indexOf(phase);
            return (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                <div className="mono" style={{ flex: 1, height: 30, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, letterSpacing: '0.1em', fontWeight: 500, transition: 'all 300ms',
                  ...(cur ? { background: 'rgba(0,212,170,0.15)', border: '1px solid rgba(0,212,170,0.4)', color: 'var(--teal)', boxShadow: '0 0 12px rgba(0,212,170,0.15)' } :
                    done ? { background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.15)', color: 'rgba(0,212,170,0.5)' } :
                    { background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text-3)' }),
                }}>{done ? '✓ ' : ''}{PHASE_LABELS[p]}</div>
                {i < 3 && <span style={{ fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>→</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* SPIN Ratio */}
      <div style={{ marginBottom: 24 }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.15em', fontWeight: 500, marginBottom: 14 }}>SPIN RATIO</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {(['S', 'P', 'I', 'N'] as const).map(type => {
            const count = spinCounts[type];
            const colors: Record<string, string> = { S: '#94A3B8', P: '#F59E0B', I: '#F97316', N: '#00D4AA' };
            const bgs: Record<string, string> = { S: 'rgba(148,163,184,0.6)', P: 'rgba(245,158,11,0.7)', I: 'rgba(249,115,22,0.7)', N: 'rgba(0,212,170,0.7)' };
            const h = count > 0 ? Math.max((count / max) * 100, 5) : 0;
            return (
              <div key={type} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: 24, fontWeight: 700, color: colors[type] }}>{count}</span>
                <div style={{ height: 72, width: '100%', background: 'rgba(255,255,255,0.04)', borderRadius: 6, position: 'relative', overflow: 'hidden', margin: '6px 0' }}>
                  <div style={{ position: 'absolute', bottom: 0, width: '100%', height: `${h}%`, background: bgs[type], borderRadius: 6, transition: 'height 400ms ease-out' }} />
                  <div style={{ position: 'absolute', bottom: '65%', width: '100%', height: 1, background: 'repeating-linear-gradient(90deg,rgba(255,255,255,0.15) 0,rgba(255,255,255,0.15) 4px,transparent 4px,transparent 8px)' }} />
                </div>
                <span className="mono" style={{ fontSize: 12, color: colors[type], fontWeight: 600 }}>{type}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Needs */}
      <div style={{ marginBottom: 24 }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.15em', fontWeight: 500, marginBottom: 12 }}>NEEDS DISCOVERED</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--amber)', letterSpacing: '0.12em', fontWeight: 500, marginBottom: 8 }}>IMPLIED</div>
            {impliedNeeds.length === 0 ? <div style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>None yet</div> : impliedNeeds.map(n => <div key={n} style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 500, color: 'var(--amber)', display: 'inline-block', marginBottom: 6, marginRight: 4, animation: 'pill-pop 300ms' }}>{n}</div>)}
          </div>
          <div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--teal)', letterSpacing: '0.12em', fontWeight: 500, marginBottom: 8 }}>EXPLICIT</div>
            {explicitNeeds.length === 0 ? <div style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>None yet</div> : explicitNeeds.map(n => <div key={n} style={{ background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.35)', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 500, color: 'var(--teal)', display: 'inline-block', marginBottom: 6, marginRight: 4, animation: 'pill-pop 300ms' }}>✓ {n}</div>)}
          </div>
        </div>
      </div>

      {/* Mission */}
      <div data-tour="mission-advance" style={{ marginBottom: 24 }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.15em', fontWeight: 500, marginBottom: 12 }}>YOUR MISSION</div>
        {missionSteps.map(m => (
          <div key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: m.completed ? 'var(--teal)' : 'var(--text-3)', minWidth: 20 }}>{String(m.id).padStart(2, '0')}</span>
            {m.completed ? (
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 10, color: '#080D1A', fontWeight: 700 }}>✓</span>
              </div>
            ) : (
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
            )}
            {/* FIX: Avoiding textDecoration shorthand conflict */}
            <span style={{ 
              fontSize: 12, 
              color: m.completed ? 'var(--teal)' : 'var(--text-2)', 
              lineHeight: 1.5,
              textDecorationLine: m.completed ? 'line-through' : 'none',
              textDecorationColor: 'rgba(0,212,170,0.4)'
            }}>{m.text}</span>
          </div>
        ))}
      </div>

      {/* Coaching Tip */}
      <div key={tipKey} style={{ marginBottom: 24, background: 'rgba(22,30,46,0.8)', border: '1px solid var(--border)', borderLeft: '3px solid var(--teal)', borderRadius: '0 10px 10px 0', padding: '14px 16px', animation: 'tip-flash 1.5s ease' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 14 }}>💡</span>
          <span className="mono" style={{ fontSize: 10, color: 'var(--teal)', letterSpacing: '0.12em', fontWeight: 500 }}>COACHING TIP</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{coachingTip}</div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 16 }}>
        {meetingButtonUnlocked ? (
          <button onClick={handleAdvance} style={{ width: '100%', height: 48, background: 'linear-gradient(135deg,#00D4AA,#00B899)', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 700, color: '#080D1A', cursor: 'pointer', fontFamily: "'Inter',sans-serif", boxShadow: '0 4px 20px rgba(0,212,170,0.45)', animation: 'pulse-ring 2s infinite' }}>→ Request Advance</button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button disabled style={{ width: '100%', height: 48, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)', fontFamily: "'Inter',sans-serif" }}>Request Advance</span>
            </button>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--teal)', transition: 'width 400ms ease', width: `${Math.max(0, Math.min(100, (trustScore / 50) * 100))}%` }} />
            </div>
            <div className="mono" style={{ fontSize: 9, color: 'var(--text-3)', textAlign: 'right' }}>{trustScore}/50 TRUST REQUIRED</div>
          </div>
        )}
      </div>
    </div>
  );
}
