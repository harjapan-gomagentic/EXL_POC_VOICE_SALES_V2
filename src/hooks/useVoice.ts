import { useCallback, useRef, useState, useEffect } from 'react';

/** Minimal typing for Chromium `SpeechRecognition` (prefix + standard). */
interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((this: BrowserSpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: BrowserSpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  start: () => void;
  stop: () => void;
}

function getSpeechRecognitionCtor(): (new () => BrowserSpeechRecognition) | null {
  const w = window as typeof window & {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && getSpeechRecognitionCtor() !== null;
}

function mapSpeechError(code: string): string {
  switch (code) {
    case 'not-allowed':
      return 'Microphone blocked. Allow mic access for this site in your browser settings, then try again.';
    case 'no-speech':
      return "Didn't pick up speech. Check your mic input level, speak closer, then try again.";
    case 'audio-capture':
      return 'No microphone found or it is in use by another app. Check Windows sound settings.';
    case 'network':
      return 'Speech recognition needs an internet connection (Chrome sends audio to Google). Check your network.';
    case 'aborted':
      return 'Listening was interrupted. Tap the mic and try again.';
    case 'service-not-allowed':
      return 'Speech recognition is disabled for this browser or policy. Try Chrome or Edge, or use typing.';
    default:
      return `Voice input error (${code}). Try again or type your message.`;
  }
}

export type VoiceOptions = {
  /** After this many ms without new speech results, stop and invoke `onAutoSend` (conversation mode). */
  autoSendAfterSilenceMs?: number;
  onAutoSend?: (text: string) => void;
  /** If true, microphone auto-resumes after each auto-sent turn. */
  continuousAutoSend?: boolean;
};

const DEFAULT_SILENCE_MS = 700;

/**
 * Browser Web Speech API (Chrome / Edge). Continuous + interim for reliability on Windows.
 * Optional silence-based auto-send for hands-free conversation turns.
 */
export function useVoice(onResult: (text: string) => void, options?: VoiceOptions) {
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const recRef = useRef<BrowserSpeechRecognition | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wantListenRef = useRef(false);
  const finalsRef = useRef('');
  const lastCombinedRef = useRef('');
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAutoSendRef = useRef(false);

  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const onAutoSendRef = useRef(options?.onAutoSend);
  onAutoSendRef.current = options?.onAutoSend;
  const continuousAutoSendRef = useRef(Boolean(options?.continuousAutoSend));
  continuousAutoSendRef.current = Boolean(options?.continuousAutoSend);

  const autoSilenceMs = options?.autoSendAfterSilenceMs ?? (options?.onAutoSend ? DEFAULT_SILENCE_MS : undefined);

  const clearVoiceError = useCallback(() => setVoiceError(null), []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const pushTranscriptToUI = useCallback((finals: string, interim: string) => {
    const gap = finals && interim ? ' ' : '';
    const combined = `${finals}${gap}${interim}`.replace(/\s+/g, ' ').trim();
    lastCombinedRef.current = combined;
    onResultRef.current(combined);
  }, []);

  const scheduleSilenceAutoSend = useCallback(
    (rec: BrowserSpeechRecognition) => {
      if (!autoSilenceMs || !onAutoSendRef.current) return;
      clearSilenceTimer();
      silenceTimerRef.current = setTimeout(() => {
        silenceTimerRef.current = null;
        if (!wantListenRef.current) return;
        const text = lastCombinedRef.current.trim();
        if (!text) return;
        pendingAutoSendRef.current = true;
        wantListenRef.current = false;
        try {
          rec.stop();
        } catch {
          /* ignore */
        }
      }, autoSilenceMs);
    },
    [autoSilenceMs, clearSilenceTimer],
  );

  const stop = useCallback(() => {
    clearSilenceTimer();
    pendingAutoSendRef.current = false;
    wantListenRef.current = false;
    finalsRef.current = '';
    lastCombinedRef.current = '';
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    recRef.current = null;
    cleanupStream();
    setIsListening(false);
  }, [cleanupStream, clearSilenceTimer]);

  const start = useCallback(async () => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setVoiceError('Voice typing needs Chrome or Edge (this browser does not support speech recognition).');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceError('Microphone API not available. Use https:// or localhost, or type your message.');
      return;
    }

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setVoiceError('Open this app at http://localhost/… or https:// so the browser can use your microphone.');
      return;
    }

    setVoiceError(null);
    finalsRef.current = '';
    lastCombinedRef.current = '';
    pendingAutoSendRef.current = false;
    clearSilenceTimer();
    wantListenRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
    } catch {
      /* SpeechRecognition may still work */
    }

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.maxAlternatives = 1;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0]?.transcript ?? '';
        if (event.results[i].isFinal) {
          const t = piece.trim();
          if (t) {
            const f = finalsRef.current;
            finalsRef.current = f ? `${f} ${t}` : t;
          }
        } else interim += piece;
      }
      pushTranscriptToUI(finalsRef.current, interim);
      scheduleSilenceAutoSend(rec);
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'aborted' && !wantListenRef.current) return;
      setVoiceError(mapSpeechError(event.error));
      const stopTrying =
        event.error === 'not-allowed' ||
        event.error === 'service-not-allowed' ||
        event.error === 'audio-capture' ||
        event.error === 'network' ||
        event.error === 'no-speech';
      if (stopTrying) {
        clearSilenceTimer();
        pendingAutoSendRef.current = false;
        wantListenRef.current = false;
        try {
          rec.stop();
        } catch {
          /* ignore */
        }
        cleanupStream();
        setIsListening(false);
      }
    };

    rec.onend = () => {
      clearSilenceTimer();

      if (pendingAutoSendRef.current) {
        pendingAutoSendRef.current = false;
        const text = lastCombinedRef.current.trim();
        lastCombinedRef.current = '';
        finalsRef.current = '';
        if (text) onAutoSendRef.current?.(text);

        if (continuousAutoSendRef.current) {
          wantListenRef.current = true;
          try {
            rec.start();
            setIsListening(true);
            return;
          } catch {
            wantListenRef.current = false;
          }
        }

        cleanupStream();
        setIsListening(false);
        return;
      }

      if (!wantListenRef.current) {
        cleanupStream();
        setIsListening(false);
        return;
      }

      try {
        rec.start();
      } catch {
        wantListenRef.current = false;
        cleanupStream();
        setIsListening(false);
      }
    };

    recRef.current = rec;

    try {
      rec.start();
      setIsListening(true);
    } catch (e) {
      console.error('SpeechRecognition.start failed:', e);
      setVoiceError('Could not start listening. Close other tabs using the mic and try again.');
      wantListenRef.current = false;
      cleanupStream();
      setIsListening(false);
    }
  }, [cleanupStream, clearSilenceTimer, pushTranscriptToUI, scheduleSilenceAutoSend]);

  useEffect(() => () => stop(), [stop]);

  return { isListening, voiceError, clearVoiceError, start, stop };
}

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const load = () => window.speechSynthesis.getVoices();
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    u.pitch = 1;
    u.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    u.voice = voices.find(v => v.lang.startsWith('en-GB')) ?? voices.find(v => v.lang.startsWith('en-US')) ?? null;
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };
    u.onerror = () => {
      setIsSpeaking(false);
      onEnd?.();
    };
    window.speechSynthesis.speak(u);
  }, []);

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, speak, cancel };
}
