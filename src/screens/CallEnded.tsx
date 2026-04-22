import { useEffect } from 'react';
import { useCallContext } from '../context/CallContext';
import { generateDebrief } from '../lib/debrief';
import SpinBadge from '../components/SpinBadge';

export default function CallEnded() {
  const { state, dispatch } = useCallContext();
  const { trustScore, spinCounts, timer, conversationHistory, debrief, debriefLoading } = state;
  
  const mins = String(Math.floor(timer / 60)).padStart(2, '0');
  const secs = String(timer % 60).padStart(2, '0');
  const exchanges = Math.ceil(conversationHistory.length / 2);

  const outcomeColors = {
    advance: { label: '✓ ADVANCE SECURED', c: 'var(--teal)', bg: 'rgba(0,212,170,0.15)', border: 'rgba(0,212,170,0.3)' },
    continuation: { label: 'CONTINUATION', c: 'var(--amber)', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' },
    no_sale: { label: 'NO SALE', c: 'var(--red)', bg: 'rgba(255,77,77,0.15)', border: 'rgba(255,77,77,0.3)' }
  };
  
  const outcome = state.outcome || 'no_sale';
  const oc = outcomeColors[outcome];

  useEffect(() => {
    if (!debrief && !debriefLoading) {
      dispatch({ type: 'SET_DEBRIEF_LOADING', loading: true });
      generateDebrief(state).then(d => dispatch({ type: 'SET_DEBRIEF', data: d }));
    }
  }, [debrief, debriefLoading, dispatch, state]);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1000, background: 'rgba(8,13,26,0.98)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto', padding: '40px 0' }}>
      <div style={{ maxWidth: 640, width: '90%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 24, padding: '48px', boxShadow: '0 40px 100px rgba(0,0,0,0.8)', animation: 'modal-enter 500ms cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="mono" style={{ fontSize: 12, color: 'var(--text-3)', letterSpacing: '0.2em', marginBottom: 12 }}>TRANSCRIPT ANALYZED</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 20 }}>Simulation Complete</div>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', height: 36, padding: '0 24px', borderRadius: 18, background: oc.bg, color: oc.c, border: `1px solid ${oc.border}`, fontSize: 13, fontWeight: 700, letterSpacing: '0.1em' }}>
            {oc.label}
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'DURATION', val: `${mins}:${secs}` },
            { label: 'EXCHANGES', val: exchanges },
            { label: 'TRUST SCORE', val: `${trustScore >= 0 ? '+' : ''}${trustScore}` }
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
               <div className="mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--teal)' }}>{s.val}</div>
               <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4, letterSpacing: '0.1em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* SPIN Breakdown */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32 }}>
          {(['S', 'P', 'I', 'N'] as const).map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <SpinBadge type={t} />
              <span className="mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>{spinCounts[t]}</span>
            </div>
          ))}
        </div>

        {/* AI Debrief */}
        <div style={{ background: 'rgba(0,212,170,0.03)', border: '1px solid rgba(0,212,170,0.15)', borderRadius: 16, padding: '24px', marginBottom: 32 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🤖</span> AI Coach Feedback
          </div>
          
          {debriefLoading || !debrief ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3].map(i => <div key={i} style={{ height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.05)', width: `${90 - i * 10}%`, animation: 'glow-pulse 2s infinite' }} />)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.15em', marginBottom: 6 }}>OVERALL</div>
                <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>{debrief.overall}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--green)', letterSpacing: '0.15em', marginBottom: 6 }}>WHAT YOU DID WELL</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{debrief.did_well}</div>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--amber)', letterSpacing: '0.15em', marginBottom: 6 }}>TO IMPROVE</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{debrief.improve}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <button onClick={() => dispatch({ type: 'RESET_CALL' })} style={{ flex: 1, height: 52, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#00D4AA,#00B899)', color: '#080D1A', fontSize: 16, fontWeight: 700, fontFamily: "'Inter',sans-serif", cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,212,170,0.4)' }}>Try Again →</button>
          <button onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'login' })} style={{ flex: 1, height: 52, borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 16, fontWeight: 600, fontFamily: "'Inter',sans-serif", cursor: 'pointer' }}>Exit Simulator</button>
        </div>
      </div>
    </div>
  );
}
