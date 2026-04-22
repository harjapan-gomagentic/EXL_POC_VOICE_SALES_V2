import { useCallContext } from '../context/CallContext';
import { useState, useEffect, useRef } from 'react';

/* ─── Tour Steps ─── 
   Each step highlights a specific region of the 3-column Live Call layout.
   Layout: TopBar=48px, Left=22%, Center=42%, Right=36%
   spotRect: { left, top, width, height } in CSS units (px or %)
   tipPos:   { left, top } for tooltip card position
*/
const STEPS = [
  {
    title: 'Your Trust Score',
    desc: "This is your chess engine. Every message you send is a move — strong SPIN questions push it up, premature pitches crash it down. Reach +50 to unlock the Advance button. The bar shows your progress from center.",
    // Left panel, top area (Trust Score section)
    spotSelector: 'trust-score',
    tipSide: 'right' as const,
  },
  {
    title: 'Move Log',
    desc: "Every turn you take is graded in real time: STRONG, GOOD, WEAK, or BLUNDER. Each entry shows the trust delta and a reason. Use this to self-correct mid-call — like a coach whispering in your ear.",
    spotSelector: 'move-log',
    tipSide: 'right' as const,
  },
  {
    title: 'The Conversation',
    desc: "Hold the mic button and speak naturally. Your message appears as a bubble, gets classified by AI, and Marcus responds. If your mic isn't available, a text fallback appears automatically.",
    spotSelector: 'conversation',
    tipSide: 'left' as const,
  },
  {
    title: 'SPIN Intelligence',
    desc: "Your real-time command center. The phase tracker shows where you are in the call. The SPIN ratio bars track your question mix — aim for more P, I, and N than S. Needs pills pop in as you discover them.",
    spotSelector: 'spin-intel',
    tipSide: 'left' as const,
  },
  {
    title: 'Hidden Insights',
    desc: "Marcus has 5 pain points he won't volunteer. Ask the right Problem and Implication questions to unlock them. Each one gives you richer context and lights up in teal when revealed.",
    spotSelector: 'hidden-insights',
    tipSide: 'right' as const,
  },
  {
    title: 'Mission & Advance',
    desc: "Complete all 5 mission objectives during the call. Once your Trust Score hits +50, the Request Advance button unlocks — click it to close the deal with a SMART commitment. Good luck!",
    spotSelector: 'mission-advance',
    tipSide: 'left' as const,
  },
];

/* ─── Static Live Call Preview ─── */
function LiveCallPreview() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--navy)' }}>
      {/* TOP BAR */}
      <div style={{ height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: 'rgba(8,13,26,0.97)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>EXL</span>
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>SPIN Simulator</span>
        </div>
        <div className="mono" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: 'var(--text-2)', letterSpacing: '0.1em' }}>
          <span style={{ color: 'var(--teal)' }}>SCENARIO A</span> · HARTWELL INSURANCE GROUP · MARCUS HOLLOWAY
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--teal)', letterSpacing: '0.1em' }}>00:00</span>
          <div style={{ height: 32, padding: '0 14px', background: 'transparent', border: '1.5px solid var(--red)', borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'var(--red)', display: 'flex', alignItems: 'center' }}>End Call</div>
        </div>
      </div>
      {/* 3 COLUMNS */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT */}
        <div style={{ width: '22%', background: '#0A1020', borderRight: '1px solid var(--border)', padding: '20px 18px', overflowY: 'auto' }}>
          {/* Trust Score */}
          <div data-tour="trust-score">
            <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.15em', fontWeight: 500, marginBottom: 12 }}>TRUST SCORE</div>
            <div className="mono" style={{ fontSize: 52, fontWeight: 800, color: 'var(--text-2)' }}>0</div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>/ ±100</div>
            <div style={{ position: 'relative', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginTop: 12, marginBottom: 8 }}>
              <div style={{ position: 'absolute', left: '75%', top: -14, transform: 'translateX(-50%)' }}><div className="mono" style={{ fontSize: 9, color: 'var(--amber)', textAlign: 'center' }}>UNLOCK</div></div>
              <div style={{ position: 'absolute', left: '75%', top: -2, width: 1, height: 10, background: 'var(--amber)', opacity: 0.6 }} />
            </div>
          </div>
          <div style={{ height: 1, background: 'var(--border)', margin: '12px 0 16px' }} />
          {/* Move Log */}
          <div data-tour="move-log">
            <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.15em', fontWeight: 500, marginBottom: 12 }}>MOVE LOG</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic', marginBottom: 8 }}>Your moves will appear here.</div>
            {/* Sample entries */}
            <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="mono" style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 4, background: 'rgba(0,212,170,0.15)', color: 'var(--teal)', border: '1px solid rgba(0,212,170,0.3)' }}>STRONG</span>
                <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal)' }}>+8</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Example: "What impact does that..."</div>
            </div>
            <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="mono" style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 4, background: 'rgba(255,77,77,0.15)', color: 'var(--red)', border: '1px solid rgba(255,77,77,0.3)' }}>BLUNDER</span>
                <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>−8</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Example: "We have a great plat..."</div>
            </div>
          </div>
          <div style={{ height: 1, background: 'var(--border)', margin: '12px 0 16px' }} />
          {/* Hidden Insights */}
          <div data-tour="hidden-insights">
            <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.15em', fontWeight: 500, marginBottom: 12 }}>HIDDEN INSIGHTS</div>
            {['Current Challenge', 'Where It Hurts', 'The Deadline', "What They've Tried", 'EXL Scope Gap'].map((ins, i) => (
              <div key={ins} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', ...(i === 0 ? { background: 'rgba(0,212,170,0.06)', borderRadius: 6, padding: '6px 8px' } : {}) }}>
                {i === 0 ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)', boxShadow: '0 0 6px rgba(0,212,170,0.5)', flexShrink: 0 }} /> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(245,158,11,0.4)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>}
                <span style={{ fontSize: 12, color: i === 0 ? 'var(--teal)' : 'var(--text-3)', fontWeight: i === 0 ? 500 : 400 }}>{ins}</span>
              </div>
            ))}
          </div>
        </div>
        {/* CENTER */}
        <div data-tour="conversation" style={{ width: '42%', background: 'var(--navy)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 68, flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#0F6E56,#1A9E7A)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(0,212,170,0.4)' }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>MH</span>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: '#fff' }}>Marcus Holloway</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Chief Operating Officer</div>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(0,212,170,0.2)" strokeWidth="1.5"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            <div style={{ fontSize: 15, color: 'var(--text-3)' }}>Hold the speak button to begin</div>
          </div>
          <div style={{ height: 110, flexShrink: 0, background: 'var(--surface)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(0,212,170,0.08)', border: '2px solid rgba(0,212,170,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              </div>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>Hold to speak</span>
            </div>
          </div>
        </div>
        {/* RIGHT */}
        <div style={{ width: '36%', background: '#090E1C', padding: '20px 20px', overflowY: 'auto' }}>
          <div data-tour="spin-intel">
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-2)', letterSpacing: '0.2em', fontWeight: 700, marginBottom: 4 }}>SPIN INTELLIGENCE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', animation: 'glow-pulse 2s infinite' }} />
              <span className="mono" style={{ fontSize: 10, color: '#22C55E', letterSpacing: '0.15em' }}>LIVE</span>
            </div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.15em', fontWeight: 500, marginBottom: 10 }}>CALL PHASE</div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
              {['OPENING', 'INVEST.', 'DEMO', 'COMMIT'].map((p, i) => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                  <div className="mono" style={{ flex: 1, height: 30, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, letterSpacing: '0.1em',
                    ...(i === 0 ? { background: 'rgba(0,212,170,0.15)', border: '1px solid rgba(0,212,170,0.4)', color: 'var(--teal)', boxShadow: '0 0 12px rgba(0,212,170,0.15)' } : { background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text-3)' })
                  }}>{p}</div>
                  {i < 3 && <span style={{ fontSize: 10, color: 'var(--text-3)' }}>→</span>}
                </div>
              ))}
            </div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.15em', fontWeight: 500, marginBottom: 14 }}>SPIN RATIO</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 24 }}>
              {[{ l: 'S', c: '#94A3B8' }, { l: 'P', c: '#F59E0B' }, { l: 'I', c: '#F97316' }, { l: 'N', c: '#00D4AA' }].map(s => (
                <div key={s.l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span className="mono" style={{ fontSize: 24, fontWeight: 700, color: s.c }}>0</span>
                  <div style={{ height: 72, width: '100%', background: 'rgba(255,255,255,0.04)', borderRadius: 6, margin: '6px 0', position: 'relative' }}>
                    <div style={{ position: 'absolute', bottom: '65%', width: '100%', height: 1, background: 'repeating-linear-gradient(90deg,rgba(255,255,255,0.15) 0,rgba(255,255,255,0.15) 4px,transparent 4px,transparent 8px)' }} />
                  </div>
                  <span className="mono" style={{ fontSize: 12, color: s.c, fontWeight: 600 }}>{s.l}</span>
                </div>
              ))}
            </div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.15em', fontWeight: 500, marginBottom: 12 }}>NEEDS DISCOVERED</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              <div><div className="mono" style={{ fontSize: 10, color: 'var(--amber)', letterSpacing: '0.12em', fontWeight: 500, marginBottom: 8 }}>IMPLIED</div><div style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>None yet</div></div>
              <div><div className="mono" style={{ fontSize: 10, color: 'var(--teal)', letterSpacing: '0.12em', fontWeight: 500, marginBottom: 8 }}>EXPLICIT</div><div style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>None yet</div></div>
            </div>
          </div>
          <div data-tour="mission-advance">
            <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.15em', fontWeight: 500, marginBottom: 12 }}>YOUR MISSION</div>
            {['Open strong — say who you are and why this matters', 'Surface a real operational challenge', 'Deepen with an Implication question', 'Make Marcus articulate the value of solving it', 'Secure a specific next step'].map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', minWidth: 20 }}>{String(i + 1).padStart(2, '0')}</span>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{t}</span>
              </div>
            ))}
            <div style={{ marginTop: 16, background: 'rgba(22,30,46,0.8)', border: '1px solid var(--border)', borderLeft: '3px solid rgba(0,212,170,0.3)', borderRadius: '0 10px 10px 0', padding: '14px 16px' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}><span style={{ fontSize: 14 }}>💡</span><span className="mono" style={{ fontSize: 10, color: 'var(--teal)', letterSpacing: '0.12em', fontWeight: 500 }}>COACHING TIP</span></div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>Begin with rapport — a brief, genuine opener before diving into questions.</div>
            </div>
            <div style={{ marginTop: 16 }}>
              <button disabled style={{ width: '100%', height: 48, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)', fontFamily: "'Inter',sans-serif" }}>Request Advance</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>· Trust 50 required</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Tutorial Guided Tour ─── */
export default function Tutorial() {
  const { dispatch } = useCallContext();
  const [step, setStep] = useState(0);
  const [spotRect, setSpotRect] = useState<DOMRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find the target element by data-tour attribute
  useEffect(() => {
    const sel = STEPS[step].spotSelector;
    const el = containerRef.current?.querySelector(`[data-tour="${sel}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      setSpotRect(rect);
    }
  }, [step]);

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else dispatch({ type: 'COMPLETE_TUTORIAL' });
  };

  const s = STEPS[step];

  // Calculate tooltip position
  const tipStyle: React.CSSProperties = {};
  if (spotRect) {
    if (s.tipSide === 'right') {
      tipStyle.left = spotRect.right + 20;
      tipStyle.top = Math.max(60, Math.min(spotRect.top, window.innerHeight - 340));
    } else {
      tipStyle.left = spotRect.left - 400;
      tipStyle.top = Math.max(60, Math.min(spotRect.top, window.innerHeight - 340));
    }
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Live Call Preview behind */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <LiveCallPreview />
      </div>

      {/* Overlay + Spotlight */}
      {spotRect && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'none' }}>
          {/* Dark overlay with cutout hole using clip-path */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(8,13,26,0.82)',
            clipPath: `polygon(
              0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
              ${spotRect.left - 8}px ${spotRect.top - 8}px,
              ${spotRect.left - 8}px ${spotRect.bottom + 8}px,
              ${spotRect.right + 8}px ${spotRect.bottom + 8}px,
              ${spotRect.right + 8}px ${spotRect.top - 8}px,
              ${spotRect.left - 8}px ${spotRect.top - 8}px
            )`,
          }} />

          {/* Spotlight border glow */}
          <div style={{
            position: 'absolute',
            left: spotRect.left - 8, top: spotRect.top - 8,
            width: spotRect.width + 16, height: spotRect.height + 16,
            border: '2px solid rgba(0,212,170,0.5)',
            borderRadius: 12,
            boxShadow: '0 0 30px rgba(0,212,170,0.2), 0 0 60px rgba(0,212,170,0.08)',
            transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'none',
          }} />
        </div>
      )}

      {/* Tooltip Card */}
      <div key={step} style={{
        position: 'absolute', zIndex: 60,
        ...tipStyle,
        width: 380,
        background: 'var(--surface-2)',
        border: '1px solid rgba(0,212,170,0.25)',
        borderRadius: 16,
        padding: '24px 24px 20px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 40px rgba(0,212,170,0.08)',
        animation: 'modal-enter 400ms cubic-bezier(0.34,1.56,0.64,1)',
        pointerEvents: 'auto',
      }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%', transition: 'all 300ms',
              background: i === step ? 'var(--teal)' : i < step ? 'rgba(0,212,170,0.4)' : 'rgba(255,255,255,0.1)',
              boxShadow: i === step ? '0 0 8px rgba(0,212,170,0.6)' : 'none',
            }} />
          ))}
        </div>

        <div className="mono" style={{ fontSize: 11, color: 'var(--teal)', letterSpacing: '0.2em', fontWeight: 600, marginBottom: 10 }}>
          STEP {step + 1} OF {STEPS.length}
        </div>

        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 10 }}>
          {s.title}
        </div>

        <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.65, marginBottom: 20 }}>
          {s.desc}
        </div>

        {/* Skip + Next */}
        <div style={{ display: 'flex', gap: 10 }}>
          {step < STEPS.length - 1 && (
            <button onClick={() => dispatch({ type: 'COMPLETE_TUTORIAL' })} style={{
              flex: 0, padding: '0 16px', height: 44, border: '1px solid var(--border)', borderRadius: 10,
              background: 'transparent', fontSize: 13, fontWeight: 500, color: 'var(--text-3)',
              cursor: 'pointer', fontFamily: "'Inter',sans-serif", transition: 'all 200ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-t)'; e.currentTarget.style.color = 'var(--text-2)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; }}
            >Skip tour</button>
          )}
          <button onClick={next} style={{
            flex: 1, height: 44, border: 'none', borderRadius: 10,
            fontSize: 15, fontWeight: 700, fontFamily: "'Inter',sans-serif",
            cursor: 'pointer',
            background: 'linear-gradient(135deg,#00D4AA,#00B899)',
            color: '#080D1A',
            boxShadow: '0 4px 20px rgba(0,212,170,0.4)',
            transition: 'all 200ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,212,170,0.6)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,212,170,0.4)'; }}
          >
            {step < STEPS.length - 1 ? 'Got it →' : "Start Call →"}
          </button>
        </div>
      </div>
    </div>
  );
}
