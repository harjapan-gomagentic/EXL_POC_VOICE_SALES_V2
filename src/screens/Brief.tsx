import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Brief() {
  const { dispatch } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: 'var(--bg)', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      
      <div 
        className="slide-up-card" 
        style={{ width: '100%', maxWidth: 760, background: 'var(--surface)', borderRadius: 24, padding: '48px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', position: 'relative', overflow: 'hidden' }}
      >
        {/* Accents */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(90deg, #FF5500, #FF3300)' }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, opacity: mounted ? 1 : 0, transition: 'all 0.6s' }}>
          <div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--orange)', letterSpacing: '0.15em', fontWeight: 600, marginBottom: 8 }}>DISCOVERY SIMULATION</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: 4 }}>Scenario A</h2>
            <p style={{ fontSize: 15, color: 'var(--text-3)' }}>Existing client. Hidden pain. Board pressure.</p>
          </div>
        </div>

        {/* Two column breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: 40, opacity: mounted ? 1 : 0, transition: 'all 0.6s 0.2s' }}>
          
          {/* Left: Prospect Info */}
          <div>
            <div style={{ padding: '24px', borderRadius: 16, background: 'var(--bg)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #1A1A1A, #3A3A3A)', color: '#fff', fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: 'var(--shadow-md)' }}>MH</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>Marcus Holloway</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>COO</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginTop: 12 }}>Hartwell Insurance</div>
            </div>
          </div>

          {/* Right: Briefing */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>The Situation</div>
              <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.6 }}>Hartwell has been an EXL analytics client for 4 years. The relationship is strong, but Marcus is under major board pressure to reduce operational costs this quarter.</p>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>The Catch</div>
              <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.6 }}>There's a hidden problem: a 14% rise in claims processing leakage, causing 22% slower payout cycles. He won't volunteer this info unless you ask the right <strong style={{ color: 'var(--orange)' }}>SPIN</strong> questions.</p>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>Your Goal</div>
              <ul style={{ paddingLeft: 18, fontSize: 15, color: 'var(--text-2)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>Uncover the claims leakage (Problem)</li>
                <li>Make him realise the cost of doing nothing (Implication)</li>
                <li>Secure a follow-up meeting with the Head of CS (Next Step)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action bounds */}
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
            Start Conversation
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
