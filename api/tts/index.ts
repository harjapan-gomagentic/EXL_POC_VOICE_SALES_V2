/// <reference types="node" />

type ReqBody = { text?: string };

type ReqLike = {
  method?: string;
  body?: ReqBody;
};

type ResLike = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => {
    json: (body: unknown) => void;
    send: (body: ArrayBuffer | Uint8Array) => void;
    end: () => void;
  };
};

export default async function handler(req: ReqLike, res: ResLike) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST,OPTIONS');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST,OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const modelId = process.env.ELEVENLABS_MODEL_ID ?? 'eleven_turbo_v2_5';

  if (!apiKey || !voiceId) {
    return res.status(503).json({
      error: 'ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID are required for /api/tts',
    });
  }

  const text = req.body?.text?.trim();
  if (!text) {
    return res.status(400).json({ error: 'text is required' });
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
    console.error('[elevenlabs][vercel] tts error:', ttsRes.status, err);
    return res.status(502).json({ error: `ElevenLabs error ${ttsRes.status}` });
  }

  const audio = new Uint8Array(await ttsRes.arrayBuffer());
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(audio);
}
