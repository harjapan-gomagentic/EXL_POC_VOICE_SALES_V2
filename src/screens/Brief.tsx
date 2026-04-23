import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Brief() {
  const { dispatch } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ display: 'flex', width: '100%', flex: 1, minHeight: 0, minWidth: 0, overflow: 'auto', background: 'var(--bg)', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div
        className="slide-up-card"
        style={{ width: '100%', maxWidth: 760, background: 'var(--surface)', borderRadius: 24, padding: '48px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(90deg, #FF5500, #FF3300)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, opacity: mounted ? 1 : 0, transition: 'all 0.6s' }}>
          <div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--orange)', letterSpacing: '0.15em', fontWeight: 600, marginBottom: 8 }}>DISCOVERY SIMULATION</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: 4 }}>Meet your prospect</h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: 40, opacity: mounted ? 1 : 0, transition: 'all 0.6s 0.2s' }}>
          <div>
            <div style={{ padding: '24px', borderRadius: 16, background: 'var(--bg)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #1A1A1A, #3A3A3A)', color: '#fff', fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: 'var(--shadow-md)' }}>MH</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>Marcus Holt</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>Chief Operating Officer</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginTop: 12 }}>New Port Insurance</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.65, margin: 0 }}>
                Existing relationship. Marcus&apos;s team has worked with EXL on a process improvement engagement two years ago. He liked the solutions provided by EXL.
              </p>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>About The Company: New Port Insurance</div>
              <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.65 }}>
                A mid-size life insurer operating across EU and APAC markets. Grown significantly over the past four years through two acquisitions. The business is stable — but leadership has flagged cost-to-serve and digital experience as priorities for the year ahead.
              </p>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>The challenge</div>
              <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.65 }}>
                Because he trusts you, the conversation will feel easy. That&apos;s the trap. Easy does not mean productive. Your job is to use the SPIN learnings to move this from a friendly catch-up to a conversation he walks away thinking about.
              </p>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 40, paddingTop: 32, display: 'flex', justifyContent: 'flex-end', opacity: mounted ? 1 : 0, transition: 'all 0.6s 0.3s' }}>
          <button
            onClick={() => dispatch({ type: 'START_CALL' })}
            style={{
              padding: '0 32px',
              height: 52,
              borderRadius: 12,
              background: 'var(--text-1)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: 'var(--shadow-md)',
              transition: 'all 200ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.background = '#000'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.background = 'var(--text-1)'; }}
          >
            Enter the meeting
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
