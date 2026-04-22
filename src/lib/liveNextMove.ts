import { openai } from './openaiClient';
import { trainerTipForProgress } from './trainingInsights';

export type LiveNextMove = {
  title: string;
  tip: string;
  spinFocus: string;
};

const SYSTEM = `You are a sales coach for EXL Service voice simulations (Scenario A: discovery with Marcus Holloway, COO at Hartwell Insurance).

After each exchange, Marcus has just spoken. Your job is to recommend ONE concrete next move for the sales rep's very next utterance.

Rules:
- Be specific to what Marcus last said; quote or paraphrase him when helpful.
- Follow SPIN / consultative selling: prefer Situation → Problem → Implication → Need-payoff before pushing solutions.
- Avoid generic advice ("build rapport", "listen actively"). Say what to ask or state, in plain English.
- spinFocus must be exactly one of: Situation, Problem, Implication, Need-payoff, Commitment.

Return only valid JSON matching the schema. No markdown.`;

function parseLiveNextMove(raw: string): LiveNextMove {
  const data = JSON.parse(raw) as Record<string, unknown>;
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const tip = typeof data.tip === 'string' ? data.tip.trim() : '';
  const spinFocus = typeof data.spinFocus === 'string' ? data.spinFocus.trim() : '';
  if (!title || !tip || !spinFocus) {
    throw new Error('Invalid next-move shape');
  }
  return { title, tip, spinFocus };
}

export async function generateLiveNextMove(params: {
  repName: string;
  repRole: string;
  messages: { role: string; content: string }[];
  completedMissionStepIndices: number[];
}): Promise<LiveNextMove> {
  const { repName, repRole, messages, completedMissionStepIndices } = params;
  const recent = messages.slice(-18);
  const transcript = recent
    .map(m => `${m.role === 'user' ? 'REP' : 'MARCUS'}: ${m.content}`)
    .join('\n');

  const playbookCue = trainerTipForProgress(completedMissionStepIndices);

  const userBlock = `Rep name: ${repName || 'Rep'}
Rep role: ${repRole || 'Sales'}
Playbook cue (optional): ${playbookCue}

Transcript (most recent last):
${transcript}

Respond with JSON: {"title":"...","tip":"...","spinFocus":"Situation|Problem|Implication|Need-payoff|Commitment"}`;

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 280,
    temperature: 0.45,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: userBlock },
    ],
  });

  const content = res.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error('Empty coach response');
  }
  return parseLiveNextMove(content);
}
