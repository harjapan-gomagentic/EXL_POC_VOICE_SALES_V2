import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useApp, type Message } from '../context/AppContext';
import { askMarcus } from '../lib/marcus';
import { generateScenarioACoachDebrief, spinCountsFromMessages } from '../lib/coachDebrief';
import {
  SPIN_LEGEND,
  SCENARIO_A_CONTEXT,
  MISSION_COACH_LINES,
  nextMissionIndex,
  trainerTipForProgress,
  explainSpinLetter,
} from '../lib/trainingInsights';
import { useVoice, useTTS, isSpeechRecognitionSupported } from '../hooks/useVoice';

const MISSION_STEPS = [
  'Open with your name and why this call matters',
  'Ask about their current operations or challenges',
  'Dig deeper — what does this problem cost them?',
  'Help Marcus articulate the value of solving it',
  'Propose a clear, specific next step',
];

const OPENING_MESSAGE: Message = {
  id: 'intro',
  role: 'assistant',
  content: "Marcus Holloway. Go ahead — I've got fifteen minutes.",
  timestamp: Date.now(),
};

function getBadgeColor(type?: string) {
  switch (type) {
    case 'S': return { bg: 'rgba(56,189,248,0.15)', color: '#0284c7' }; // Blue
    case 'P': return { bg: 'rgba(234,179,8,0.15)', color: '#ca8a04' };  // Yellow
    case 'I': return { bg: 'rgba(249,115,22,0.15)', color: '#c2410c' }; // Orange
    case 'N': return { bg: 'rgba(34,197,94,0.15)', color: '#15803d' };  // Green
    default: return null;
  }
}

const SPIN_RAIL_GRADIENT: Record<string, string> = {
  S: 'linear-gradient(135deg, #0ea5e9, #0369a1)',
  P: 'linear-gradient(135deg, #eab308, #a16207)',
  I: 'linear-gradient(135deg, #ea580c, #9a3412)',
  N: 'linear-gradient(135deg, #22c55e, #15803d)',
};

function getLastTurnCoaching(messages: Message[]): { spin?: string; feedback?: string; userPreview: string } | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role !== 'user') continue;
    const next = messages[i + 1];
    if (next?.role === 'assistant' && (next.feedback || (next.spinType && next.spinType !== 'None'))) {
      const c = messages[i].content;
      return {
        userPreview: c.length > 72 ? `${c.slice(0, 72)}…` : c,
        spin: next.spinType,
        feedback: next.feedback ?? undefined,
      };
    }
  }
  return null;
}

export default function Call() {
  const { state, dispatch } = useApp();
  const [input, setInput] = useState('');
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const coachDebriefStarted = useRef(false);
  const voiceTranscriptRef = useRef('');
  const sendMessageRef = useRef<(text: string) => void>(() => {});

  const handleResult = useCallback((text: string) => {
    voiceTranscriptRef.current = text;
    setInput(text);
  }, []);

  const { isSpeaking, speak, cancel: cancelTTS } = useTTS();
  const voiceSupported = isSpeechRecognitionSupported();
  const didInit = useRef(false);

  // Initialize conversation with Marcus greeting
  useEffect(() => {
    if (!didInit.current && state.messages.length === 0) {
      didInit.current = true;
      dispatch({ type: 'ADD_MESSAGE', message: { ...OPENING_MESSAGE, id: `intro-${Date.now()}` } });
      speak(OPENING_MESSAGE.content);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || state.isLoading) return;

    setInput('');
    voiceTranscriptRef.current = '';
    // Store message ID to modify it later with SPIN feedback
    const msgId = `u-${Date.now()}`;
    const userMsg: Message = {
      id: msgId,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_MESSAGE', message: userMsg });
    dispatch({ type: 'SET_LOADING', value: true });

    // Track mission step completion heuristically
    const lower = trimmed.toLowerCase();
    if (lower.includes('name') || lower.includes('exl') || lower.includes('service')) maybeComplete(0);
    if (lower.includes('challenge') || lower.includes('problem') || lower.includes('operation') || lower.includes('claim')) maybeComplete(1);
    if (lower.includes('cost') || lower.includes('impact') || lower.includes('affect') || lower.includes('leak')) maybeComplete(2);
    if (lower.includes('value') || lower.includes('worth') || lower.includes('mean') || lower.includes('benefit')) maybeComplete(3);
    if (lower.includes('next') || lower.includes('meeting') || lower.includes('follow') || lower.includes('schedule') || lower.includes('tuesday')) maybeComplete(4);

    try {
      const history = [...state.messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { response, spinClassification, feedback } = await askMarcus(history);

      // Now we update the user's message with the SPIN classification & feedback we just received
      // Note: In Redux/useReducer we'd technically need a new action type like UPDATE_MESSAGE. 
      // But we can just dispatch a replacement if we add a new action, or we can just append an assistant message 
      // with the metadata attached to it for the UI to pair.
      // Quickest way for AppContext without modifying action types: attach it to the assistant's message, 
      // or we can add UPDATE_MESSAGE to context. Since Context is simple, I'll add the spin info to the Assistant message, 
      // but UI wise it will render below the User's bubble.

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
        // We temporarily store the feedback intended for the user's previous message here
        spinType: spinClassification, 
        feedback: feedback,
      };
      dispatch({ type: 'ADD_MESSAGE', message: assistantMsg });
      speak(response);
    } catch (err) {
      console.error('Marcus error:', err);
      dispatch({
        type: 'ADD_MESSAGE',
        message: {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: "Bear with me — I lost you for a second. Can you repeat that?",
          timestamp: Date.now(),
        },
      });
    } finally {
      dispatch({ type: 'SET_LOADING', value: false });
      inputRef.current?.focus();
    }
  };

  sendMessageRef.current = (t: string) => {
    void sendMessage(t);
  };

  const { isListening, voiceError, clearVoiceError, start: startMic, stop: stopMic } = useVoice(handleResult, {
    autoSendAfterSilenceMs: 1200,
    onAutoSend: text => sendMessageRef.current(text),
  });

  const maybeComplete = (step: number) => {
    setCompletedSteps(prev => prev.includes(step) ? prev : [...prev, step]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopMic();
      voiceTranscriptRef.current = '';
      setInput('');
    } else {
      cancelTTS();
      clearVoiceError();
      void startMic();
    }
  };

  const timer = useTimer();
  const mins = String(Math.floor(timer / 60)).padStart(2, '0');
  const secs = String(timer % 60).padStart(2, '0');

  const userExchangeCount = useMemo(() => state.messages.filter(m => m.role === 'user').length, [state.messages]);
  const spinTally = useMemo(
    () =>
      spinCountsFromMessages(
        state.messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
          spinType: m.spinType,
          feedback: m.feedback,
        })),
      ),
    [state.messages],
  );
  const lastCoaching = useMemo(() => getLastTurnCoaching(state.messages), [state.messages]);
  const missionIdx = useMemo(() => nextMissionIndex(completedSteps), [completedSteps]);
  const missionProgressPct = useMemo(() => (completedSteps.length / MISSION_COACH_LINES.length) * 100, [completedSteps]);
  const showWelcomeHero = state.messages.length <= 1 && !state.isLoading;

  useEffect(() => {
    if (!state.callEnded) coachDebriefStarted.current = false;
  }, [state.callEnded]);

  useEffect(() => {
    if (!state.callEnded || state.coachDebrief || coachDebriefStarted.current) return;
    coachDebriefStarted.current = true;
    dispatch({ type: 'SET_COACH_DEBRIEF_LOADING', loading: true });
    const payload = state.messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
      spinType: m.spinType,
      feedback: m.feedback,
    }));
    generateScenarioACoachDebrief({
      repName: state.repName,
      repRole: state.repRole,
      messages: payload,
    })
      .then(data => dispatch({ type: 'SET_COACH_DEBRIEF', data }))
      .catch(err => {
        console.error('Coach debrief error:', err);
        dispatch({ type: 'SET_COACH_DEBRIEF_LOADING', loading: false });
        dispatch({
          type: 'SET_COACH_DEBRIEF',
          data: {
            overall: 'We could not generate AI coaching (check your connection and API key). Review the transcript and try again.',
            comfortable_trap: '—',
            spin_diagnosis: '—',
            needs_development: '—',
            demonstration_timing: '—',
            commitment_smart: '—',
            hidden_pain_and_next_step: '—',
            did_well: 'You completed a practice session — that repetition builds skill.',
            improve: 'Re-run the simulation with the same Scenario A brief and focus on one SPIN layer per exchange.',
            next_call_focus: 'Try one more Implication question before offering any capability.',
            outcome_label: 'no_sale',
          },
        });
      });
  }, [state.callEnded, state.coachDebrief, state.messages, state.repName, state.repRole, dispatch]);

  const outcomeStyles = {
    advance: { label: 'Advance secured', c: 'var(--green)', bg: 'var(--green-bg)', border: 'rgba(34,197,94,0.35)' },
    continuation: { label: 'Continuation only', c: 'var(--orange)', bg: 'var(--orange-glow)', border: 'rgba(255,85,0,0.35)' },
    no_sale: { label: 'No commitment', c: 'var(--red)', bg: 'var(--red-bg)', border: 'rgba(220,38,38,0.35)' },
  } as const;

  // End Call Overlay
  if (state.callEnded) {
    const coach = state.coachDebrief;
    const loading = state.coachDebriefLoading;
    const outcomeKey = coach?.outcome_label ?? 'no_sale';
    const oc = outcomeStyles[outcomeKey];
    const spin = spinCountsFromMessages(
      state.messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        spinType: m.spinType,
        feedback: m.feedback,
      })),
    );
    const exchanges = Math.ceil(state.messages.length / 2);

    const coachSections: { k: string; title: string; body?: string }[] = coach
      ? [
          { k: 'overall', title: 'Overall', body: coach.overall },
          { k: 'trap', title: 'Scenario A — comfortable trap', body: coach.comfortable_trap },
          { k: 'spin', title: 'SPIN investigation', body: coach.spin_diagnosis },
          { k: 'needs', title: 'Needs development (implied → explicit)', body: coach.needs_development },
          { k: 'demo', title: 'Demonstrating capability', body: coach.demonstration_timing },
          { k: 'commit', title: 'Commitment (advance vs continuation)', body: coach.commitment_smart },
          { k: 'hidden', title: 'Hidden pain & next step', body: coach.hidden_pain_and_next_step },
        ]
      : [];

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(248,250,252,0.97)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          overflowY: 'auto',
          padding: '40px 24px',
        }}
      >
        <div
          className="fade-up"
          style={{
            maxWidth: 720,
            width: '100%',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 24,
            padding: '40px 44px',
            boxShadow: 'var(--shadow-lg)',
            marginBottom: 48,
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>
              Scenario A · SPIN debrief
            </div>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: 14 }}>Simulation complete</h2>
            <p style={{ fontSize: 15, color: 'var(--text-3)', marginBottom: 18, lineHeight: 1.5 }}>
              Good work, {state.repName}. Here is your AI coach feedback aligned with SPIN / Korn Ferry discovery principles.
            </p>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 36,
                padding: '0 20px',
                borderRadius: 999,
                background: oc.bg,
                color: oc.c,
                border: `1px solid ${oc.border}`,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {oc.label}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'Duration', val: `${mins}:${secs}` },
              { label: 'Exchanges', val: exchanges },
              { label: 'Objectives hit', val: `${completedSteps.length}/${MISSION_STEPS.length}` },
            ].map(s => (
              <div
                key={s.label}
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '14px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--orange)' }}>{s.val}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', marginTop: 6, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 26 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              SPIN question mix (rep turns tagged)
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {(
                [
                  ['S', spin.S],
                  ['P', spin.P],
                  ['I', spin.I],
                  ['N', spin.N],
                ] as const
              ).map(([letter, n]) => (
                <div
                  key={letter}
                  style={{
                    minWidth: 56,
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-1)' }}>{n}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)' }}>{letter}</div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: '24px 22px',
              marginBottom: 28,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-1)', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span aria-hidden>🎯</span> AI coach feedback
            </div>

            {loading || !coach ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    style={{
                      height: 12,
                      borderRadius: 6,
                      background: 'var(--surface)',
                      width: `${92 - i * 6}%`,
                      animation: 'pulse-ring 1.8s ease-in-out infinite',
                    }}
                  />
                ))}
                <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8 }}>Analyzing your transcript against SPIN and Scenario A goals…</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                {coachSections.map(sec => (
                  <div key={sec.k}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>{sec.title}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.65 }}>{sec.body}</div>
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--green)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>What you did well</div>
                    <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>{coach.did_well}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--orange)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>To improve</div>
                    <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>{coach.improve}</div>
                  </div>
                </div>
                <div style={{ paddingTop: 4, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Next call focus</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', lineHeight: 1.55 }}>{coach.next_call_focus}</div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <button
              onClick={() => dispatch({ type: 'RESET' })}
              style={{
                flex: 1,
                minWidth: 160,
                padding: '16px',
                borderRadius: 12,
                border: 'none',
                background: 'var(--orange)',
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(255,78,0,0.3)',
              }}
            >
              New session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: 'var(--bg)' }}>
      <aside className="call-sidebar-premium">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #ff5c14, #e04400)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(255,78,0,0.35)' }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>EXL</span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Sales Trainer</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.12em', marginTop: 2 }}>SCENARIO A</div>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.9), #F7F5F0)', borderRadius: 18, padding: '18px', marginBottom: 28, border: '1px solid rgba(26,26,26,0.07)', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <div className="call-avatar-premium call-avatar-premium--ai" style={{ width: 48, height: 48, fontSize: 15 }}>
              MH
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Marcus Holloway</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3, fontWeight: 500 }}>COO · Hartwell Insurance</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'rgba(255,255,255,0.85)', borderRadius: 12, border: '1px solid rgba(26,26,26,0.06)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', animation: 'pulse-green 2s infinite' }} />
            <span style={{ fontSize: 12, color: 'var(--text-1)', fontWeight: 700 }}>Live session</span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 'auto', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{mins}:{secs}</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            Your playbook
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.45, marginBottom: 14 }}>
            Check items off as you go. Each step maps to part of the SPIN discovery flow.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MISSION_STEPS.map((step, i) => {
              const done = completedSteps.includes(i);
              const coach = MISSION_COACH_LINES[i];
              return (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', opacity: done ? 0.92 : 1 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                    background: done ? 'var(--green)' : 'var(--bg)',
                    border: done ? 'none' : '1.5px solid var(--border-dark)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 300ms',
                  }}>
                    {done && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span className="mono" style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--orange)', background: 'rgba(255,78,0,0.1)', padding: '2px 8px', borderRadius: 99 }}>
                        {coach.spinFocus}
                      </span>
                    </div>
                    <span style={{ fontSize: 13, lineHeight: 1.45, color: done ? 'var(--text-3)' : 'var(--text-1)', fontWeight: done ? 500 : 600, textDecoration: done ? 'line-through' : 'none', display: 'block' }}>
                      {step}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* End call button at bottom */}
        <div style={{ marginTop: 'auto', paddingTop: 32 }}>
          <button
            onClick={() => dispatch({ type: 'END_CALL' })}
            style={{
              width: '100%', height: 44, borderRadius: 10, border: '1.5px solid var(--border-dark)',
              background: 'transparent', color: 'var(--text-2)', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', transition: 'all 200ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'var(--red-bg)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-dark)'; e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.background = 'transparent'; }}
          >
            End Conversation
          </button>
        </div>
      </aside>

      <div className="call-center-wrap">
      <div className="call-main-chat">
        <header className="call-topbar-premium">
          <div>
            <div className="mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--orange)', letterSpacing: '0.2em', marginBottom: 4 }}>LIVE TRAINING SIMULATION</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em' }}>Scenario A — Discovery with Marcus</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500, marginTop: 4, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <span>
                <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>{state.repName || 'You'}</span>
                <span style={{ margin: '0 8px', opacity: 0.45 }}>·</span>
                <span style={{ color: 'var(--text-2)' }}>{state.repRole || 'Sales rep'}</span>
              </span>
              <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', background: 'rgba(26,26,26,0.06)', padding: '4px 10px', borderRadius: 99 }}>
                Your turns · {userExchangeCount}
              </span>
            </div>
          </div>
          {isSpeaking && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg, rgba(255,78,0,0.12), rgba(255,78,0,0.06))', padding: '10px 18px', borderRadius: 100, border: '1px solid rgba(255,78,0,0.2)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--orange)', animation: 'pulse-ring 1s infinite' }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--orange-deep)', letterSpacing: '0.06em' }}>MARCUS SPEAKING</span>
            </div>
          )}
        </header>

        <div className="call-chat-scroll">
          <div className="call-chat-inner">
            {showWelcomeHero && (
              <div className="call-welcome-hero">
                <h3>You are in a live role-play</h3>
                <p>
                  Marcus is a real buyer profile: warm toward EXL, busy, and holding back one operational pain until you earn it with solid questions.
                  Use the <strong>Live coaching</strong> panel on the right for SPIN reminders and instant feedback after each reply you make.
                </p>
                <div className="call-welcome-steps">
                  <div className="call-welcome-step">
                    <span className="call-welcome-step-num">1</span>
                    <div><strong>Respond in your own words</strong> — type or tap the mic (it sends after a short pause).</div>
                  </div>
                  <div className="call-welcome-step">
                    <span className="call-welcome-step-num">2</span>
                    <div><strong>Watch the coach line</strong> under your messages — it labels your move (Situation, Problem, and so on).</div>
                  </div>
                  <div className="call-welcome-step">
                    <span className="call-welcome-step-num">3</span>
                    <div><strong>Follow the playbook</strong> on the left; it tracks the same flow a facilitator would use in a workshop.</div>
                  </div>
                </div>
              </div>
            )}
            {state.messages.map((m, i) => {
              const nextMsg = state.messages[i + 1];
              const hasFeedback = m.role === 'user' && nextMsg && nextMsg.role === 'assistant' && nextMsg.spinType && nextMsg.spinType !== 'None';
              const badge = hasFeedback ? getBadgeColor(nextMsg.spinType) : null;
              const spinExplain = nextMsg?.spinType && nextMsg.spinType !== 'None' ? explainSpinLetter(nextMsg.spinType) : null;
              const isUser = m.role === 'user';

              return (
                <div key={m.id} className={`call-msg-row ${isUser ? 'call-msg-row--user' : 'call-msg-row--ai'}`}>
                  <span className="mono call-msg-label">{isUser ? 'You · Trainee' : 'Marcus Holloway · AI prospect'}</span>
                  <div className={`call-msg-wrap ${isUser ? 'call-msg-wrap--user' : ''}`}>
                    <div className={`call-avatar-premium ${isUser ? 'call-avatar-premium--user' : 'call-avatar-premium--ai'}`}>
                      {isUser ? (state.repName?.charAt(0) || 'Y').toUpperCase() : 'MH'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', minWidth: 0 }}>
                      <div className={isUser ? 'call-bubble-user' : 'call-bubble-ai'}>{m.content}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                        <span className="mono" style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {badge && nextMsg && (
                          <span
                            className="call-spin-chip mono"
                            style={{ background: badge.bg, color: badge.color }}
                            title={spinExplain?.plain ?? 'SPIN classification for your last line'}
                          >
                            {nextMsg.spinType}
                            {spinExplain ? ` · ${spinExplain.title}` : ''}
                          </span>
                        )}
                      </div>
                      {hasFeedback && nextMsg?.feedback && (
                        <div className="call-coach-card" style={{ borderLeftColor: badge?.color ?? 'var(--orange)', maxWidth: 440 }}>
                          <div className="mono" style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--text-3)', marginBottom: 6 }}>INSTANT FEEDBACK</div>
                          <span style={{ fontWeight: 800, color: 'var(--text-1)' }}>Why this line matters · </span>
                          {nextMsg.feedback}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {state.isLoading && (
              <div className="call-msg-row call-msg-row--ai" style={{ animation: 'fade-in 0.3s ease' }}>
                <span className="mono call-msg-label">Marcus Holloway · Prospect</span>
                <div className="call-msg-wrap">
                  <div className="call-avatar-premium call-avatar-premium--ai">MH</div>
                  <div className="call-typing-bubble">
                    {[0, 1, 2].map(j => (
                      <div key={j} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-3)', animation: `dot-bounce 0.9s ease-in-out ${j * 0.16}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} style={{ height: 1 }} />
          </div>
        </div>

        <div className="call-composer-outer">
          <div className="call-composer-tip">
            <div className="call-composer-tip-icon" aria-hidden>💡</div>
            <div>
              <div style={{ fontWeight: 800, color: 'var(--text-1)', marginBottom: 4, fontSize: 12 }}>Trainer tip — what to do next</div>
              <div style={{ color: 'var(--text-2)' }}>{trainerTipForProgress(completedSteps)}</div>
            </div>
          </div>
          <div className="call-coach-fallback-hint">
            <span aria-hidden style={{ fontSize: 14 }}>📌</span>
            <span>
              <strong style={{ color: 'var(--text-1)' }}>Widen your window</strong> to pin the full <strong>Live insights</strong> panel (SPIN guide, session counts, and scenario brief). The tip above stays on all screen sizes.
            </span>
          </div>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            {!voiceSupported && (
              <div style={{ marginBottom: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.7)', borderRadius: 14, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>
                Voice works in <strong style={{ color: 'var(--text-1)' }}>Chrome</strong> or <strong style={{ color: 'var(--text-1)' }}>Edge</strong>. Type your message below anytime.
              </div>
            )}
            {voiceError && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12, padding: '12px 16px', background: 'var(--red-bg)', borderRadius: 14, border: '1px solid rgba(220,38,38,0.25)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, flex: 1 }}>{voiceError}</span>
                <button type="button" onClick={clearVoiceError} style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  Dismiss
                </button>
              </div>
            )}
            {isListening && (
              <div className="call-voice-hint">
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green)', flexShrink: 0, animation: 'pulse-ring 1.5s infinite' }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--green)' }}>Listening for your reply</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2, lineHeight: 1.45 }}>
                    Pause when you are done — your message sends automatically. Tap the mic to cancel.
                  </div>
                </div>
              </div>
            )}
            <div className="call-composer-pill">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? 'Speaking…' : 'Type a message, or use the mic for hands‑free'}
                disabled={state.isLoading || isListening}
                style={{ color: state.isLoading ? 'var(--text-3)' : 'var(--text-1)' }}
              />
              <button
                type="button"
                onClick={handleMicToggle}
                disabled={state.isLoading || !voiceSupported}
                title={
                  !voiceSupported
                    ? 'Voice not supported in this browser'
                    : isListening
                      ? 'Cancel listening'
                      : 'Speak — auto-sends after you pause'
                }
                className={`call-mic-btn ${isListening ? 'call-mic-btn--live' : ''}`}
                style={{
                  background: isListening ? undefined : 'linear-gradient(180deg, #fafafa, #f0f0f0)',
                  color: isListening ? undefined : 'var(--text-2)',
                  border: isListening ? undefined : '1px solid rgba(26,26,26,0.08)',
                  cursor: state.isLoading || !voiceSupported ? 'not-allowed' : 'pointer',
                  opacity: !voiceSupported ? 0.45 : 1,
                }}
              >
                {isListening ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                    <path d="M19 10v2a7 7 0 01-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || state.isLoading}
                className="call-send-btn"
                style={{
                  background: input.trim() && !state.isLoading ? 'linear-gradient(135deg, #ff5c14, #e04400)' : 'var(--border)',
                  color: input.trim() && !state.isLoading ? '#fff' : 'var(--text-3)',
                  cursor: input.trim() && !state.isLoading ? 'pointer' : 'not-allowed',
                  boxShadow: input.trim() && !state.isLoading ? '0 8px 28px rgba(255,78,0,0.35)' : 'none',
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      <aside className="call-insights-rail" aria-label="Live coaching and SPIN reference">
        <div>
          <div className="call-insights-title">COACHING</div>
          <div className="call-insights-heading">Live insights</div>
          <div className="call-progress-track">
            <div className="call-progress-fill" style={{ width: `${Math.min(100, missionProgressPct)}%` }} />
          </div>
          <p className="mono" style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 8, fontWeight: 600 }}>
            Playbook {completedSteps.length}/{MISSION_COACH_LINES.length} · Exchange {userExchangeCount}
          </p>
        </div>

        <div className="call-insight-card call-insight-card--accent">
          <div className="mono" style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--orange-deep)', marginBottom: 8 }}>YOUR NEXT MOVE</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)', marginBottom: 6 }}>{MISSION_COACH_LINES[missionIdx].title}</div>
          <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>{MISSION_COACH_LINES[missionIdx].tip}</p>
          <p className="mono" style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 10, marginBottom: 0 }}>
            SPIN lens · {MISSION_COACH_LINES[missionIdx].spinFocus}
          </p>
        </div>

        {lastCoaching?.feedback && (
          <div className="call-insight-card">
            <div className="mono" style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--text-3)', marginBottom: 8 }}>LAST EXCHANGE</div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.45, margin: '0 0 8px', fontStyle: 'italic' }}>&ldquo;{lastCoaching.userPreview}&rdquo;</p>
            {lastCoaching.spin && lastCoaching.spin !== 'None' && (
              <p className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 8px' }}>
                Tagged · {lastCoaching.spin}{explainSpinLetter(lastCoaching.spin) ? ` (${explainSpinLetter(lastCoaching.spin)!.title})` : ''}
              </p>
            )}
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>{lastCoaching.feedback}</p>
          </div>
        )}

        <div className="call-insight-card">
          <div className="mono" style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--text-3)', marginBottom: 10 }}>SESSION COUNTS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(['S', 'P', 'I', 'N'] as const).map(letter => (
              <span key={letter} className="mono" style={{ fontSize: 12, fontWeight: 800, padding: '6px 12px', borderRadius: 10, background: 'rgba(26,26,26,0.05)', color: 'var(--text-1)' }}>
                {letter} {spinTally[letter]}
              </span>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.45, marginTop: 10, marginBottom: 0 }}>
            Counts show how many of your lines were classified as each SPIN type. Aim for balance — lots of Problem and Implication before big pitches.
          </p>
        </div>

        <div className="call-insight-card">
          <div className="mono" style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--text-3)', marginBottom: 10 }}>SPIN — PLAIN ENGLISH</div>
          {SPIN_LEGEND.map(row => (
            <div key={row.letter} className="call-spin-mini">
              <div className="call-spin-mini__badge mono" style={{ background: SPIN_RAIL_GRADIENT[row.letter] ?? '#64748b' }}>
                {row.letter}
              </div>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--text-1)', fontSize: 12 }}>{row.title}</div>
                <div style={{ color: 'var(--text-2)', marginTop: 2 }}>{row.plain}</div>
                <div style={{ color: 'var(--text-3)', fontSize: 11, marginTop: 6, fontStyle: 'italic' }}>e.g. {row.hint}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="call-insight-card">
          <div className="mono" style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--text-3)', marginBottom: 8 }}>SIMULATION BRIEF</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>{SCENARIO_A_CONTEXT.headline}</div>
          <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, margin: '0 0 12px' }}>{SCENARIO_A_CONTEXT.body}</p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55 }}>
            {SCENARIO_A_CONTEXT.watchFor.map(w => (
              <li key={w} style={{ marginBottom: 6 }}>{w}</li>
            ))}
          </ul>
        </div>
      </aside>
      </div>
    </div>
  );
}

function useTimer() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT(x => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}
