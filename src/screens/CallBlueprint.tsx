import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useApp, type Message } from '../context/AppContext';
import { askMarcus } from '../lib/marcus';
import type { CoachOutcome } from '../lib/coachDebrief';
import { useVoice, useTTS, isSpeechRecognitionSupported } from '../hooks/useVoice';

const OPENING_MESSAGE: Message = {
  id: 'intro',
  role: 'assistant',
  content:
    "Good to finally connect - I heard good things from our mutual contact. I wasn't entirely sure what to expect from today, but I'm glad we made the time. What did you want to explore?",
  timestamp: Date.now(),
};

const STRONG_ADVANCE_PATTERNS = [
  '90-minute',
  'diagnostic session',
  'solutions team',
  'brief agenda',
  'loop in',
  'specific date',
  'next tuesday',
  'next thursday',
  'book a session',
];

const WEAK_CONTINUATION_PATTERNS = ['send over', 'send information', 'stay in touch', 'reconnect', 'follow up', 'circle back'];

const MARCUS_AVATAR_VARIANTS = [
  { bg: 'linear-gradient(135deg, #ff6b35 0%, #ff5c00 100%)', ring: 'rgba(255, 92, 0, 0.24)' },
  { bg: 'linear-gradient(135deg, #ff7a45 0%, #ff5c00 100%)', ring: 'rgba(255, 122, 69, 0.22)' },
  { bg: 'linear-gradient(135deg, #ff8a5e 0%, #ff6b35 100%)', ring: 'rgba(255, 107, 53, 0.22)' },
] as const;

function inferOutcomeFromTranscript(messages: Message[]): CoachOutcome {
  const repTurns = messages
    .filter(m => m.role === 'user')
    .map(m => m.content.toLowerCase())
    .slice(-4)
    .join(' ');

  if (!repTurns.trim()) return 'no_sale';
  if (STRONG_ADVANCE_PATTERNS.some(p => repTurns.includes(p))) return 'advance';
  if (WEAK_CONTINUATION_PATTERNS.some(p => repTurns.includes(p))) return 'continuation';
  return 'no_sale';
}

function useTimer() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT(x => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

export default function CallBlueprint() {
  const { state, dispatch } = useApp();
  const [input, setInput] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const voiceTranscriptRef = useRef('');
  const sendMessageRef = useRef<(text: string) => void>(() => {});
  const didInit = useRef(false);
  const handsFreeModeRef = useRef(false);
  const isListeningRef = useRef(false);

  const timer = useTimer();
  const mins = String(Math.floor(timer / 60)).padStart(2, '0');
  const secs = String(timer % 60).padStart(2, '0');
  const avatarVariant = useMemo(
    () => MARCUS_AVATAR_VARIANTS[Math.floor(Math.random() * MARCUS_AVATAR_VARIANTS.length)],
    [],
  );
  const showCenterStage = state.messages.length <= 1;

  const handleResult = useCallback((text: string) => {
    voiceTranscriptRef.current = text;
    setInput(text);
  }, []);

  const { isSpeaking, speak, cancel: cancelTTS } = useTTS();
  const voiceSupported = isSpeechRecognitionSupported();

  useEffect(() => {
    if (!didInit.current && state.messages.length === 0) {
      didInit.current = true;
      dispatch({ type: 'ADD_MESSAGE', message: { ...OPENING_MESSAGE, id: `intro-${Date.now()}` } });
      speak(OPENING_MESSAGE.content);
    }
  }, [dispatch, speak, state.messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages, state.isLoading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || state.isLoading) return;

    setInput('');
    voiceTranscriptRef.current = '';
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_MESSAGE', message: userMsg });
    dispatch({ type: 'SET_LOADING', value: true });

    try {
      const history = [...state.messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const { response, spinClassification, feedback } = await askMarcus(history);
      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
        spinType: spinClassification,
        feedback,
      };
      dispatch({ type: 'ADD_MESSAGE', message: assistantMsg });
      speak(response, () => {
        if (!handsFreeModeRef.current || !voiceSupported || isListeningRef.current) return;
        clearVoiceError();
        void startMic();
      });
    } catch (err) {
      console.error('Marcus error:', err);
      dispatch({
        type: 'ADD_MESSAGE',
        message: {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'I lost that for a second. Could you repeat the question?',
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
  isListeningRef.current = isListening;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      handsFreeModeRef.current = false;
      stopMic();
      voiceTranscriptRef.current = '';
      setInput('');
    } else {
      cancelTTS();
      clearVoiceError();
      handsFreeModeRef.current = true;
      void startMic();
    }
  };

  const handleEndCall = () => {
    handsFreeModeRef.current = false;
    stopMic();
    const outcome = inferOutcomeFromTranscript(state.messages);
    dispatch({ type: 'END_CALL', outcome });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', flex: 1, minHeight: 0, background: '#ffffff' }}>
      <header
        style={{
          height: 68,
          borderBottom: '1px solid #ffe8dc',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #ff6b35, #ff5c00)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            MH
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a' }}>Marcus Holt</div>
            <div style={{ fontSize: 12, color: '#888' }}>COO · New Port Insurance</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="mono" style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>
            {mins}:{secs}
          </span>
          {isSpeaking && (
            <span className="mono" style={{ fontSize: 10, color: '#ff5c00', letterSpacing: '0.1em', fontWeight: 700, animation: 'pulse-ring 1.2s ease-in-out infinite' }}>
              AI SPEAKING
            </span>
          )}
          <button
            type="button"
            onClick={handleEndCall}
            style={{
              height: 36,
              padding: '0 14px',
              borderRadius: 10,
              border: 'none',
              background: '#ff5c00',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            End call
          </button>
        </div>
      </header>

      <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px 18px 16px', background: '#fff8f5' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {showCenterStage && (
              <div
                style={{
                  position: 'relative',
                  borderRadius: 18,
                  border: '1px solid #ffe8dc',
                  background: '#ffffff',
                  padding: '28px 24px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 30px rgba(255, 92, 0, 0.08)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    width: 360,
                    height: 360,
                    borderRadius: '50%',
                    left: '50%',
                    top: '52%',
                    transform: 'translate(-50%, -50%)',
                    background: 'radial-gradient(circle, rgba(255,92,0,0.10) 0%, rgba(255,92,0,0.04) 40%, rgba(255,92,0,0) 72%)',
                    pointerEvents: 'none',
                  }}
                />
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'end', gap: 4, height: 24 }}>
                    {[0, 1, 2, 3, 4].map(i => (
                      <span
                        key={i}
                        style={{
                          width: 5,
                          height: 8 + (i % 2) * 8,
                          borderRadius: 4,
                          background: '#ff6b35',
                          opacity: isSpeaking ? 1 : 0.5,
                          animation: `call-wave 1s ease-in-out ${i * 0.12}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                  <div
                    style={{
                      borderRadius: 14,
                      border: '1px solid #ffe8dc',
                      background: '#ffffff',
                      padding: '14px 16px',
                      minWidth: 300,
                      textAlign: 'center',
                    }}
                  >
                    <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: '#888', marginBottom: 6 }}>
                      MEETING STATUS
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>Live meeting</div>
                    <div className="mono" style={{ fontSize: 12, color: '#888', letterSpacing: '0.08em' }}>
                      {mins}:{secs}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {state.messages.map(m => {
              const isRep = m.role === 'user';
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: isRep ? 'flex-end' : 'flex-start', animation: 'fade-up 320ms ease both' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexDirection: isRep ? 'row-reverse' : 'row', maxWidth: '78%' }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: isRep ? 'linear-gradient(135deg, #ff915f, #ff6b35)' : avatarVariant.bg,
                        boxShadow: `0 0 0 3px ${isRep ? 'rgba(255,145,95,0.25)' : avatarVariant.ring}`,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {isRep ? 'You' : 'MH'}
                    </div>
                    <div
                      style={{
                        borderRadius: 14,
                        border: '1px solid #ffe8dc',
                        borderLeft: '3px solid #ff6b35',
                        background: '#ffffff',
                        padding: '12px 14px',
                        boxShadow: '0 6px 18px rgba(255, 92, 0, 0.08)',
                      }}
                    >
                      <div className="mono" style={{ fontSize: 10, color: '#ff5c00', letterSpacing: '0.08em', marginBottom: 5 }}>
                        {isRep ? 'YOU' : 'MARCUS'}
                      </div>
                      <p style={{ margin: 0, color: '#1a1a1a', fontSize: 14, lineHeight: 1.7 }}>{m.content}</p>
                      <div className="mono" style={{ marginTop: 8, fontSize: 10, color: '#888' }}>
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {state.isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    borderRadius: 14,
                    border: '1px solid #ffe8dc',
                    background: '#ffffff',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#ff6b35',
                        animation: `dot-bounce 0.9s ease-in-out ${i * 0.12}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      </main>

      <footer style={{ borderTop: '1px solid #ffe8dc', background: '#ffffff', padding: '14px 16px', flexShrink: 0 }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          {voiceError && (
            <div
              style={{
                marginBottom: 10,
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #ffe8dc',
                background: '#fff0e8',
                color: '#1a1a1a',
                fontSize: 12,
              }}
            >
              {voiceError}
            </div>
          )}
          {!voiceSupported && (
            <div
              style={{
                marginBottom: 10,
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #ffe8dc',
                background: '#fff0e8',
                color: '#1a1a1a',
                fontSize: 12,
              }}
            >
              Voice dictation is not supported in this browser. Use Chrome or Edge on Windows for the mic.
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={handleMicToggle}
              disabled={!voiceSupported || state.isLoading}
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                border: '1px solid #ffe8dc',
                background: '#ffffff',
                color: '#ff5c00',
                cursor: !voiceSupported || state.isLoading ? 'not-allowed' : 'pointer',
                fontSize: 18,
              }}
              title={isListening ? 'Stop microphone and clear draft' : 'Start microphone'}
            >
              🎤
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder={isListening ? 'Listening... tap mic to stop' : 'Ask your next question...'}
              disabled={state.isLoading}
              style={{
                flex: 1,
                height: 46,
                border: `1px solid ${inputFocused ? '#ff6b35' : '#ffe8dc'}`,
                borderRadius: 12,
                padding: '0 14px',
                fontSize: 14,
                outline: 'none',
                background: '#ffffff',
                color: '#1a1a1a',
              }}
            />
            <button
              type="button"
              onClick={() => void sendMessage(input)}
              disabled={!input.trim() || state.isLoading}
              style={{
                height: 46,
                borderRadius: 12,
                border: 'none',
                padding: '0 18px',
                fontSize: 14,
                fontWeight: 700,
                background: input.trim() && !state.isLoading ? '#ff5c00' : '#f0f0f0',
                color: input.trim() && !state.isLoading ? '#ffffff' : '#888',
                cursor: input.trim() && !state.isLoading ? 'pointer' : 'not-allowed',
              }}
            >
              Send
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

