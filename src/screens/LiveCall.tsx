import { useCallContext } from '../context/CallContext';

export default function LiveCall() {
  const { state, dispatch } = useCallContext();
  const mins = String(Math.floor(state.timer / 60)).padStart(2, '0');
  const secs = String(state.timer % 60).padStart(2, '0');
  const timerColor = state.timer >= 600 ? 'var(--amber)' : 'var(--teal)';

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--navy)' }}>
      {/* TOP BAR */}
      <div style={{ height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: 'rgba(8,13,26,0.97)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>EXL</span>
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>SPIN Simulator</span>
        </div>
        <div className="mono" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: 'var(--text-2)', letterSpacing: '0.1em' }}>
          <span style={{ color: 'var(--teal)' }}>SCENARIO A</span> · HARTWELL INSURANCE GROUP · MARCUS HOLLOWAY
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => dispatch({ type: 'SET_MUTED', value: !state.isMuted })} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: state.isMuted ? 'var(--red)' : 'var(--text-2)', transition: 'all 200ms', display: 'flex', alignItems: 'center' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-t)'; e.currentTarget.style.color = 'var(--teal)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = state.isMuted ? 'var(--red)' : 'var(--text-2)'; }}>
            {state.isMuted ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>
            )}
          </button>
          <span className="mono" style={{ fontSize: 18, fontWeight: 600, color: timerColor, letterSpacing: '0.1em' }}>{mins}:{secs}</span>
          <button onClick={() => { dispatch({ type: 'SET_OUTCOME', outcome: state.meetingButtonUnlocked && state.explicitNeeds.length >= 2 ? 'advance' : state.conversationHistory.length > 6 ? 'continuation' : 'no_sale' }); dispatch({ type: 'END_CALL' }); }} style={{ height: 32, padding: '0 14px', background: 'transparent', border: '1.5px solid var(--red)', borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'var(--red)', cursor: 'pointer', fontFamily: "'Inter',sans-serif", transition: 'all 200ms' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,77,77,0.1)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(255,77,77,0.3)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}>End Call</button>
        </div>
      </div>
      {/* 3 COLUMNS */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: '22%', background: '#0A1020', borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
          <TrustPanelLazy />
        </div>
        <div style={{ width: '42%', background: 'var(--navy)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <ConversationPanelLazy />
        </div>
        <div style={{ width: '36%', background: '#090E1C', overflowY: 'auto' }}>
          <SpinDashboardLazy />
        </div>
      </div>
    </div>
  );
}

/* Lazy imports to keep bundle clean */
import { lazy, Suspense } from 'react';
const TrustPanelInner = lazy(() => import('../components/TrustPanel'));
const ConversationPanelInner = lazy(() => import('../components/ConversationPanel'));
const SpinDashboardInner = lazy(() => import('../components/SpinDashboard'));
function TrustPanelLazy() { return <Suspense fallback={<div />}><TrustPanelInner /></Suspense>; }
function ConversationPanelLazy() { return <Suspense fallback={<div />}><ConversationPanelInner /></Suspense>; }
function SpinDashboardLazy() { return <Suspense fallback={<div />}><SpinDashboardInner /></Suspense>; }
