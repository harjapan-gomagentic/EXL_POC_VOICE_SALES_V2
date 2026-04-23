import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

const SPIN_BLOCKS = [
  { letter: 'S', title: 'Situation', line: 'Ask about their world. Understand before you assess.' },
  { letter: 'P', title: 'Problem', line: "Find what's not working. Let them say it, not you." },
  { letter: 'I', title: 'Implication', line: "Ask what it's costing them. Make the problem feel real." },
  { letter: 'N', title: 'Need-Payoff', line: 'Ask what better looks like. Let them sell themselves.' },
] as const;

const SPIN_TAG_COLORS: Record<(typeof SPIN_BLOCKS)[number]['letter'], { bg: string; text: string }> = {
  S: { bg: '#E6F1FB', text: '#0C447C' },
  P: { bg: '#FAEEDA', text: '#633806' },
  I: { bg: '#FAECE7', text: '#712B13' },
  N: { bg: '#E1F5EE', text: '#085041' },
};

export default function HowItWorks() {
  const { dispatch } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        overflow: 'auto',
        background: 'var(--bg)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
      }}
    >
      <div
        className="slide-up-card"
        style={{
          width: '100%',
          maxWidth: 860,
          background: 'var(--surface)',
          borderRadius: 24,
          padding: '48px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(90deg, #FF5500, #FF3300)' }} />

        <div style={{ opacity: mounted ? 1 : 0, transition: 'all 0.6s' }}>
          <div className="mono" style={{ fontSize: 12, color: 'var(--orange)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 8 }}>
            SPIN PLAYBOOK
          </div>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 30 }}>How this works.</h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 14,
            opacity: mounted ? 1 : 0,
            transition: 'all 0.6s 0.2s',
          }}
        >
          {SPIN_BLOCKS.map((block, idx) => (
            <div
              key={block.letter}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(170px, 200px) 1fr',
                alignItems: 'center',
                gap: 16,
                border: '1px solid var(--border)',
                borderRadius: 14,
                background: idx % 2 === 0 ? 'rgba(255, 78, 0, 0.03)' : 'var(--surface)',
                padding: '16px 18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/** Keep these SPIN tag colors reusable for annotated replay later */}
                <span
                  className="mono"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: SPIN_TAG_COLORS[block.letter].bg,
                    color: SPIN_TAG_COLORS[block.letter].text,
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  {block.letter}
                </span>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)' }}>{block.title}</span>
              </div>
              <p style={{ margin: 0, fontSize: 15, color: 'var(--text-2)', lineHeight: 1.6 }}>{block.line}</p>
            </div>
          ))}
        </div>

        <p
          style={{
            marginTop: 22,
            marginBottom: 0,
            color: 'var(--text-1)',
            fontSize: 16,
            fontWeight: 700,
            opacity: mounted ? 1 : 0,
            transition: 'all 0.6s 0.25s',
          }}
        >
          Don&apos;t pitch until they feel the problem.
        </p>

        <div style={{ marginTop: 34, paddingTop: 24, display: 'flex', justifyContent: 'flex-end', opacity: mounted ? 1 : 0, transition: 'all 0.6s 0.3s' }}>
          <button
            onClick={() => dispatch({ type: 'START_DISCOVERY' })}
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
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              e.currentTarget.style.background = '#000';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              e.currentTarget.style.background = 'var(--text-1)';
            }}
          >
            I&apos;m ready — show me my prospect
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
