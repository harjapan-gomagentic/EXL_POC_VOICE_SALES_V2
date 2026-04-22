import { useState } from 'react';
import { useCallContext } from '../context/CallContext';

export default function BriefingRoom() {
  const { dispatch } = useCallContext();
  const [starting, setStarting] = useState(false);

  const go = () => { 
    setStarting(true); 
    setTimeout(() => { 
      dispatch({ type: 'SET_TRANSITIONING', value: true }); 
      setTimeout(() => { 
        dispatch({ type: 'SET_SCREEN', screen: 'tutorial' }); 
        dispatch({ type: 'SET_TRANSITIONING', value: false }); 
      }, 500); 
    }, 400); 
  };

  const knowledgePoints = [
    'Hartwell has been an EXL analytics client for 4 years. The relationship is strong and the current engagement is performing well.',
    "Marcus is commercially sharp and protective of his team's time. He agreed to this call personally — which is unusual.",
    "David Chen's referral note: 'Marcus mentioned something about a Q3 board pressure point. Worth exploring.'"
  ];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--navy)' }}>
      {/* Top bar */}
      <div style={{ height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 32px', background: 'rgba(8,13,26,0.97)', borderBottom: '1px solid var(--border)' }}>
        <span className="mono" style={{ fontSize: 11, color: 'var(--teal)', letterSpacing: '0.15em', fontWeight: 600 }}>SCENARIO A</span>
        <span style={{ color: 'var(--text-3)', margin: '0 8px', fontSize: 11 }}>·</span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--text-2)', letterSpacing: '0.15em' }}>EXISTING CLIENT, NEW SCOPE</span>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT — Profile */}
        <div style={{ width: '52%', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'linear-gradient(rgba(0,212,170,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,170,0.025) 1px,transparent 1px)', backgroundSize: '64px 64px' }}>
          <div style={{ textAlign: 'center', maxWidth: 500 }}>
            <div style={{ position: 'relative', width: 220, height: 220, margin: '0 auto 32px' }}>
              {[0, 1, 2].map(i => <div key={i} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid rgba(0,212,170,0.35)', animation: `radar-ping 3s ease-out infinite`, animationDelay: `${i}s` }} />)}
              <div style={{ position: 'absolute', inset: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#0F6E56,#1A9E7A)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(0,212,170,0.5)', boxShadow: '0 0 60px rgba(0,212,170,0.25),0 24px 60px rgba(0,0,0,0.6)' }}>
                <span style={{ fontSize: 56, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>MH</span>
              </div>
            </div>
            <div style={{ fontSize: 38, fontWeight: 800, color: '#fff', letterSpacing: '-0.025em', marginBottom: 8 }}>Marcus Holloway</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-2)', marginBottom: 4 }}>Chief Operating Officer</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Hartwell Insurance Group</div>
            <div style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 24 }}>London, UK &nbsp;·&nbsp; Financial Services</div>
            
            <div style={{ width: 240, height: 1, background: 'linear-gradient(90deg,transparent,rgba(0,212,170,0.3),transparent)', margin: '0 auto 24px' }} />
            
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 32 }}>
              {['EXL client — 4 years', 'Analytics & Actuarial'].map(t => <span key={t} className="mono" style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.25)', borderRadius: 6, padding: '6px 14px', fontSize: 12, color: 'var(--teal)', fontWeight: 500 }}>{t}</span>)}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 10px rgba(34,197,94,0.5)', animation: 'glow-pulse 2s infinite' }} />
              <span className="mono" style={{ fontSize: 13, color: '#22C55E', letterSpacing: '0.08em', fontWeight: 600 }}>CONNECTED · READY</span>
            </div>
          </div>
        </div>

        {/* RIGHT — Briefing */}
        <div style={{ width: '48%', display: 'flex', flexDirection: 'column', background: 'var(--surface)', borderLeft: '1px solid var(--border)', padding: '40px 48px', overflow: 'hidden' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.2em', marginBottom: 28, fontWeight: 600 }}>MISSION BRIEF</div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)' }} />
              <span className="mono" style={{ fontSize: 10, color: 'var(--teal)', letterSpacing: '0.15em', fontWeight: 500 }}>SITUATIONAL CONTEXT</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {knowledgePoints.map((t, i) => (
                <div key={i} style={{ 
                  background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderLeft: '3px solid var(--teal)', borderRadius: 8, padding: '16px 20px', 
                  fontSize: 14, color: 'var(--text-1)', lineHeight: 1.6, animation: `card-enter 0.5s ease-out ${i * 0.1}s both`
                }}>
                  {t}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
              <span className="mono" style={{ fontSize: 10, color: 'var(--amber)', letterSpacing: '0.12em', fontWeight: 600 }}>HIDDEN DRIVERS (REVEAL DURING CALL)</span>
            </div>

            <div style={{ flex: 1, overflow: 'hidden' }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ position: 'relative', filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 8, padding: '16px 20px', marginBottom: 10 }}>
                   <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.08)', width: `${90 - i * 5}%`, marginBottom: 8 }} />
                   <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.06)', width: `${75 + i * 4}%` }} />
                </div>
              ))}
              <div style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic', textAlign: 'center', marginTop: 12 }}>Surface these through high-impact SPIN discovery.</div>
            </div>
          </div>

          <div style={{ paddingTop: 32 }}>
            <button onClick={go} disabled={starting} style={{ 
              width: '100%', height: 64, border: 'none', borderRadius: 12, 
              fontSize: 18, fontWeight: 700, fontFamily: "'Inter',sans-serif", cursor: 'pointer',
              background: 'linear-gradient(135deg,#00D4AA,#00B899)', color: '#080D1A',
              boxShadow: '0 4px 24px rgba(0,212,170,0.45)', transition: 'all 200ms',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(0,212,170,0.65)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,212,170,0.45)'; }}
            >
              {starting ? 'Initializing...' : 'Join Marcus →'}
            </button>
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginTop: 12, opacity: 0.6 }}>Voice Link Enabled &nbsp;·&nbsp; Ready for Handshake</div>
          </div>
        </div>
      </div>
    </div>
  );
}
