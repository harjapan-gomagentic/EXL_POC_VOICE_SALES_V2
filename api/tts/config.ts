/// <reference types="node" />

export default function handler(_req: unknown, res: { status: (code: number) => { json: (body: unknown) => void } }) {
  const enabled = Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID);
  res.status(200).json({
    enabled,
    voiceId: process.env.ELEVENLABS_VOICE_ID ?? null,
    modelId: process.env.ELEVENLABS_MODEL_ID ?? 'eleven_turbo_v2_5',
  });
}
