import { useApp } from '../context/AppContext';

export default function Ended() {
  const { state, dispatch } = useApp();
  const userMessages = state.messages.filter(m => m.role === 'user');
  const exchanges = Math.ceil(state.messages.length / 2);

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '40px',
    }}>
      <div className="fade-up" style={{
        background: 'var(--surface)',
        borderRadius: 24,
        padding: '56px',
        maxWidth: 640,
        width: '100%',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border)',
        textAlign: 'center',
      }}>
        {/* Icon */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--orange)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto',
            boxShadow: '0 8px 30px rgba(255,78,0,0.3)',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
            </svg>
          </div>
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
          Call Complete
        </div>
        <h2 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: 12 }}>
          Good work, {state.repName}.
        </h2>
        <p style={{ fontSize: 16, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 40 }}>
          You completed your discovery call with Marcus Holloway.
        </p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 40 }}>
          {[
            { label: 'Exchanges', value: exchanges },
            { label: 'Your turns', value: userMessages.length },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg)', borderRadius: 12, padding: '20px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--orange)' }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Conversation summary */}
        {userMessages.length > 0 && (
          <div style={{ textAlign: 'left', marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
              What you uncovered
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {userMessages.slice(-3).map((m, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--orange)', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>{idx + 1}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                    "{m.content.length > 100 ? m.content.slice(0, 100) + '...' : m.content}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 14 }}>
          <button
            onClick={() => dispatch({ type: 'RESET' })}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 12,
              border: 'none',
              background: 'var(--orange)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(255,78,0,0.35)',
              transition: 'all 200ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--orange-light)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--orange)'; }}
          >
            Try Again →
          </button>
          <button
            onClick={() => dispatch({ type: 'RESET' })}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 12,
              border: '1.5px solid var(--border-dark)',
              background: 'transparent',
              color: 'var(--text-2)',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 200ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
