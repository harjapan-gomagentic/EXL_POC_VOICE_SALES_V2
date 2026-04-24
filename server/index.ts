/**
 * Minimal Bun + Hono API — mirrors exl-latest's Vapi config surface for the React app.
 * Run: npm run dev:server (or npm run dev:full with Vite).
 * Default PORT=8788 (exl-latest uses 8787).
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use(
  '/*',
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
  }),
);

function getAssistantIdFromEnv(): string | null {
  return (
    process.env.VAPI_ASSISTANT_ID ??
    process.env.VAPI_ASSISSTANT_ID ??
    null
  );
}

/** Optional: create assistant if ID not set (same shape as exl-latest). */
let cachedAssistantId: string | null = getAssistantIdFromEnv();

async function getOrCreateAssistant(): Promise<string> {
  if (cachedAssistantId) return cachedAssistantId;

  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) throw new Error('VAPI_API_KEY not set — cannot create assistant');

  const llmProvider = process.env.VAPI_LLM_PROVIDER ?? 'openai';
  const llmModel = process.env.VAPI_LLM_MODEL ?? 'gpt-4o-mini';

  console.log(`[vapi] creating assistant (provider: ${llmProvider}, model: ${llmModel})…`);

  const res = await fetch('https://api.vapi.ai/assistant', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Marcus Holt — COO (EXL Sales Practice)',
      firstMessage: '',
      transcriber: { provider: 'deepgram', model: 'nova-2', language: 'en-US' },
      model: {
        provider: llmProvider,
        model: llmModel,
        messages: [
          {
            role: 'system',
            content:
              'You are a silent stub. The client drives all dialogue via live call control. Reply with a single period if forced to respond.',
          },
        ],
        maxTokens: 8,
        temperature: 0,
      },
      voice: { provider: 'azure', voiceId: 'en-US-DavisNeural' },
      endCallFunctionEnabled: false,
      recordingEnabled: false,
      maxDurationSeconds: 1800,
      silenceTimeoutSeconds: 60,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vapi assistant creation failed ${res.status}: ${body}`);
  }

  const assistant = (await res.json()) as { id: string };
  cachedAssistantId = assistant.id;
  console.log(`[vapi] assistant created → ${cachedAssistantId}`);
  return cachedAssistantId;
}

app.get('/api/vapi/config', async c => {
  const publicKey = process.env.VAPI_PUBLIC_KEY ?? '';
  if (!publicKey) {
    return c.json({ publicKey: '', assistantId: null });
  }

  try {
    const assistantId = await getOrCreateAssistant();
    return c.json({ publicKey, assistantId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[vapi] config error:', message);
    // 200 so the SPA can fall back to browser TTS without treating this as a hard failure.
    return c.json({ publicKey, assistantId: null, error: message });
  }
});

app.post('/api/vapi/webhook', async c => {
  const body = await c.req.json<{
    message: { type: string; role?: string; transcript?: string; call?: { id: string; status: string } };
  }>();
  const { message } = body;

  switch (message.type) {
    case 'status-update':
      console.log(`[vapi webhook] call ${message.call?.id}: ${message.call?.status}`);
      break;
    case 'transcript':
      console.log(`[vapi webhook] ${message.role}: ${message.transcript}`);
      break;
    default:
      break;
  }

  return c.json({ received: true });
});

app.get('/api/tts/config', c => {
  const enabled = Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID);
  c.header('Cache-Control', 'no-store, max-age=0');
  c.header('Pragma', 'no-cache');
  return c.json({
    enabled,
    voiceId: process.env.ELEVENLABS_VOICE_ID ?? null,
    modelId: process.env.ELEVENLABS_MODEL_ID ?? 'eleven_turbo_v2_5',
  });
});

app.post('/api/tts', async c => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const modelId = process.env.ELEVENLABS_MODEL_ID ?? 'eleven_turbo_v2_5';

  if (!apiKey || !voiceId) {
    return c.json(
      {
        error: 'ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID are required for /api/tts',
      },
      503,
    );
  }

  const body = await c.req.json<{ text?: string }>();
  const text = body.text?.trim();
  if (!text) {
    return c.json({ error: 'text is required' }, 400);
  }

  const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.75,
        style: 0.25,
        use_speaker_boost: true,
      },
      output_format: 'mp3_44100_128',
    }),
  });

  if (!ttsRes.ok) {
    const err = await ttsRes.text();
    console.error('[elevenlabs] tts error:', ttsRes.status, err);
    return c.json({ error: `ElevenLabs error ${ttsRes.status}` }, 502);
  }

  const audio = await ttsRes.arrayBuffer();
  return new Response(audio, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-store',
    },
  });
});

app.get('/health', c =>
  c.json({ status: 'ok', service: 'exl-voice-sales-v2-vapi', ts: new Date().toISOString() }),
);

export default {
  port: Number(process.env.PORT) || 8788,
  fetch: app.fetch,
};
