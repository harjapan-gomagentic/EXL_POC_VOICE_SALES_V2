import { useCallback, useEffect, useRef, useState } from 'react';
import { useTTS } from './useVoice';

type TtsBackend = 'connecting' | 'elevenlabs' | 'browser';

export function useElevenLabsTts() {
  const fallback = useTTS();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [backend, setBackend] = useState<TtsBackend>('connecting');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioReady, setAudioReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const res = await fetch('/api/tts/config', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (!res.ok) throw new Error(`TTS config failed ${res.status}`);
        const cfg = (await res.json()) as { enabled?: boolean };
        if (cancelled) return;
        setBackend(cfg.enabled ? 'elevenlabs' : 'browser');
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('[useElevenLabsTts] Could not load /api/tts/config, using browser fallback.', err);
        }
        if (!cancelled) setBackend('browser');
      } finally {
        if (!cancelled) setAudioReady(true);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const cleanupAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      // Prevent cleanup itself from firing stale error/end handlers.
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  useEffect(() => () => cleanupAudio(), [cleanupAudio]);

  const speak = useCallback(
    async (text: string, onEnd?: () => void) => {
      const trimmed = text.trim();
      if (!trimmed) {
        onEnd?.();
        return;
      }

      if (backend !== 'elevenlabs') {
        fallback.speak(trimmed, onEnd);
        return;
      }

      try {
        cleanupAudio();
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: trimmed }),
        });
        if (!res.ok) throw new Error(`ElevenLabs TTS failed ${res.status}`);

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          cleanupAudio();
          onEnd?.();
        };
        audio.onerror = () => {
          // Ignore stale events after cleanup or replacement.
          if (audioRef.current !== audio) return;
          cleanupAudio();
          fallback.speak(trimmed, onEnd);
        };

        setIsSpeaking(true);
        await audio.play();
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('[useElevenLabsTts] ElevenLabs failed; using browser fallback.', err);
        }
        cleanupAudio();
        fallback.speak(trimmed, onEnd);
      }
    },
    [backend, cleanupAudio, fallback],
  );

  const cancel = useCallback(() => {
    cleanupAudio();
    fallback.cancel();
  }, [cleanupAudio, fallback]);

  return {
    speak,
    cancel,
    isSpeaking: isSpeaking || (backend === 'browser' && fallback.isSpeaking),
    audioReady,
    voiceBackend: backend,
  };
}
