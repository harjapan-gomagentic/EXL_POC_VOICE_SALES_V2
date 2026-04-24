import { useCallback, useEffect, useRef, useState } from 'react';
import type Vapi from '@vapi-ai/web';
import { useTTS } from './useVoice';

type VapiCtor = new (
  apiToken: string,
  apiBaseUrl?: string,
  dailyCallConfig?: { alwaysIncludeMicInPermissionPrompt?: boolean },
  dailyCallObject?: { startAudioOff?: boolean },
) => Vapi;

/**
 * Vite's `import()` of the CJS `@vapi-ai/web` build often yields `default` as a module namespace
 * object, so the real class is at `default.default`. Without this, `new Vapi()` throws "not a constructor".
 */
function getVapiConstructor(mod: { default?: unknown }): VapiCtor {
  const top = mod?.default;
  if (typeof top === 'function') {
    return top as VapiCtor;
  }
  if (top && typeof top === 'object' && 'default' in top && typeof (top as { default: unknown }).default === 'function') {
    return (top as { default: VapiCtor }).default;
  }
  throw new TypeError('Vapi is not a constructor — unexpected @vapi-ai/web module shape');
}

/** Walk nested Vapi SDK error (same idea as exl-latest) for actionable console hints. */
function formatVapiUserHint(e: unknown): string {
  const rec = e as Record<string, unknown> | null;
  const inner = (rec?.error as Record<string, unknown> | undefined)?.error ?? rec?.error;
  const innerRec = inner as Record<string, unknown> | undefined;
  const status =
    (innerRec?.status as number | undefined) ??
    (innerRec?.statusCode as number | undefined) ??
    ((rec?.error as Record<string, unknown> | undefined)?.statusCode as number | undefined) ??
    0;
  const msgObj = innerRec?.message ?? (rec?.error as Record<string, unknown> | undefined)?.message ?? rec?.message ?? '';
  const rawMsg =
    typeof msgObj === 'string' ? msgObj : (msgObj as { message?: string })?.message ?? JSON.stringify(msgObj);

  if (status === 403 || rawMsg.toLowerCase().includes('forbidden')) {
    return '403: Check Vapi dashboard → Provider Keys (LLM key for this assistant). Also confirm the Public Key matches Account → Public Key.';
  }
  if (status === 401 || rawMsg.toLowerCase().includes('unauthorized')) {
    return '401: Browser must use Vapi Public Key from Account (never the private API key). Re-copy into VAPI_PUBLIC_KEY.';
  }
  if (status === 422 || rawMsg.toLowerCase().includes('validation')) {
    return '422: Assistant config rejected — open the assistant in Vapi and fix model/voice/transcriber settings.';
  }
  return `${status ? `${status} — ` : ''}${rawMsg || 'Unknown Vapi error'}`;
}

/**
 * Neural TTS via Vapi (same stack as exl-latest: Web SDK + assistant voice config).
 * Falls back to browser speechSynthesis if /api/vapi/config is missing or Vapi fails.
 *
 * Flow: start a WebRTC session muted on the customer side, then drive Marcus lines with `say()`.
 */
export function useVapiTts() {
  const fallback = useTTS();
  const vapiRef = useRef<Vapi | null>(null);
  /** Ref copy of mode so `speak()` always picks the live backend after async gaps (e.g. await askMarcus). */
  const modeRef = useRef<'pending' | 'vapi' | 'fallback'>('pending');
  const [mode, setMode] = useState<'pending' | 'vapi' | 'fallback'>('pending');
  const [audioReady, setAudioReady] = useState(false);
  const [vapiSpeaking, setVapiSpeaking] = useState(false);
  const pendingEndRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    let cancelled = false;
    let stuckTimer: ReturnType<typeof setTimeout> | null = null;

    async function boot() {
      try {
        const res = await fetch('/api/vapi/config');
        const cfg = (await res.json()) as {
          publicKey?: string;
          assistantId?: string | null;
          error?: string;
        };

        if (cancelled) return;

        if (!cfg.publicKey || !cfg.assistantId) {
          if (import.meta.env.DEV) {
            console.warn(
              '[useVapiTts] Using browser TTS — missing publicKey or assistantId in /api/vapi/config',
              cfg.error ?? cfg,
            );
          }
          setMode('fallback');
          setAudioReady(true);
          return;
        }

        const VapiClass = getVapiConstructor(await import('@vapi-ai/web'));
        const vapi = new VapiClass(
          cfg.publicKey,
          undefined,
          { alwaysIncludeMicInPermissionPrompt: true },
          { startAudioOff: true },
        );

        vapi.on('call-start', () => {
          if (stuckTimer) {
            clearTimeout(stuckTimer);
            stuckTimer = null;
          }
          vapi.setMuted(true);
          setMode('vapi');
          setAudioReady(true);
          if (import.meta.env.DEV) {
            console.info('[useVapiTts] Vapi session ready — Marcus audio will use neural TTS (say).');
          }
        });

        vapi.on('call-end', () => {
          setVapiSpeaking(false);
        });

        vapi.on('speech-start', () => setVapiSpeaking(true));
        vapi.on('speech-end', () => {
          setVapiSpeaking(false);
          const cb = pendingEndRef.current;
          pendingEndRef.current = undefined;
          cb?.();
        });

        vapi.on('error', e => {
          console.error('Vapi error (full):', e);
          if (import.meta.env.DEV) {
            console.warn(`[useVapiTts] ${formatVapiUserHint(e)} — switching to browser TTS.`);
          }
          setMode('fallback');
          setAudioReady(true);
        });

        vapiRef.current = vapi;

        await vapi.start(cfg.assistantId, {
          firstMessageMode: 'assistant-waits-for-user',
          firstMessage: '',
        });

        if (cancelled) {
          void vapi.stop();
          vapiRef.current = null;
          return;
        }
      } catch (e) {
        console.error('Vapi init failed:', e);
        if (!cancelled) {
          if (import.meta.env.DEV) {
            console.warn('[useVapiTts] Vapi init failed — using browser TTS.');
          }
          setMode('fallback');
          setAudioReady(true);
        }
      }
    }

    stuckTimer = window.setTimeout(() => {
      if (cancelled) return;
      setMode(m => {
        if (m !== 'pending') return m;
        if (import.meta.env.DEV) {
          console.warn('[useVapiTts] No call-start within 15s — using browser TTS.');
        }
        return 'fallback';
      });
      setAudioReady(true);
    }, 15000);

    void boot();

    return () => {
      if (stuckTimer) clearTimeout(stuckTimer);
      cancelled = true;
      pendingEndRef.current = undefined;
      void vapiRef.current?.stop();
      vapiRef.current = null;
    };
  }, []);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      const trimmed = text.trim();
      if (!trimmed) {
        onEnd?.();
        return;
      }

      if (modeRef.current === 'vapi' && vapiRef.current) {
        if (import.meta.env.DEV) {
          console.debug('[useVapiTts] speak → Vapi say()', trimmed.slice(0, 80) + (trimmed.length > 80 ? '…' : ''));
        }
        pendingEndRef.current = onEnd;
        vapiRef.current.say(trimmed, false, false, false);
        return;
      }

      if (import.meta.env.DEV) {
        console.debug('[useVapiTts] speak → browser speechSynthesis', trimmed.slice(0, 80));
      }
      fallback.speak(trimmed, onEnd);
    },
    [fallback],
  );

  const cancel = useCallback(() => {
    pendingEndRef.current = undefined;

    if (modeRef.current === 'vapi' && vapiRef.current) {
      try {
        vapiRef.current.say('', false, false, true);
      } catch {
        /* ignore */
      }
      setVapiSpeaking(false);
      return;
    }

    fallback.cancel();
  }, [fallback]);

  const isSpeaking = (mode === 'vapi' && vapiSpeaking) || (mode === 'fallback' && fallback.isSpeaking);

  const voiceBackend: 'vapi' | 'browser' | 'connecting' =
    mode === 'vapi' ? 'vapi' : mode === 'fallback' ? 'browser' : 'connecting';

  return {
    speak,
    cancel,
    isSpeaking,
    audioReady,
    mode,
    voiceBackend,
  };
}
