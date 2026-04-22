import { openai } from './openaiClient';

export type CoachOutcome = 'advance' | 'continuation' | 'no_sale';

export interface ScenarioACoachDebrief {
  overall: string;
  comfortable_trap: string;
  spin_diagnosis: string;
  needs_development: string;
  demonstration_timing: string;
  commitment_smart: string;
  hidden_pain_and_next_step: string;
  did_well: string;
  improve: string;
  next_call_focus: string;
  outcome_label: CoachOutcome;
}

export type CoachMessage = {
  role: 'user' | 'assistant';
  content: string;
  spinType?: string;
  feedback?: string;
};

function countSpinFromTranscript(messages: CoachMessage[]) {
  const counts = { S: 0, P: 0, I: 0, N: 0, None: 0 };
  for (let i = 0; i < messages.length - 1; i++) {
    const u = messages[i];
    const a = messages[i + 1];
    if (u.role !== 'user' || a.role !== 'assistant') continue;
    const t = (a.spinType || 'None').toUpperCase();
    if (t === 'S') counts.S++;
    else if (t === 'P') counts.P++;
    else if (t === 'I') counts.I++;
    else if (t === 'N') counts.N++;
    else counts.None++;
  }
  return counts;
}

const SPIN_FRAMEWORK_BLOCK = `
SPIN (Korn Ferry / investigative selling) — apply this lens:
- Situation & Problem questions uncover and develop Implied Needs (dissatisfaction, difficulties).
- Implication questions expand consequences so the buyer feels urgency to act (moves toward Explicit Need).
- Need-payoff questions help the buyer see worth/utility of solving the problem (vision once fixed).
- Strong sellers keep investigating after hearing a problem; they broaden/deepen until the need is Explicit enough to act.
- Demonstrating capability (Feature → Advantage → Benefit) should wait until the buyer is ready to hear it AND an Explicit Need is in play; pitching too early erodes trust.
- Commitment: prefer a true advance (SMART, specific action that moves the opportunity) over a vague "let's stay in touch" continuation.
- Communication principle: buyers weight what they say and conclude more than what they are told; use their words when summarizing value.
`.trim();

const SCENARIO_A_BLOCK = `
Scenario A (only scenario in scope): Existing EXL client (Hartwell), strong relationship, new scope / discovery on operations.
The rep must surface a hidden operational pain (claims leakage / payout speed) without the meeting feeling like a generic "sales visit."
Marcus is warm but will not volunteer problems; rapport can become a "comfortable trap" — reward navigation toward real discovery and a concrete next step.
`.trim();

export async function generateScenarioACoachDebrief(params: {
  repName: string;
  repRole: string;
  messages: CoachMessage[];
}): Promise<ScenarioACoachDebrief> {
  const { repName, repRole, messages } = params;
  const spinCounts = countSpinFromTranscript(messages);

  const lines: string[] = [];
  for (const m of messages) {
    if (m.role === 'user') lines.push(`REP: ${m.content}`);
    else {
      const meta = [m.spinType ? `SPIN tag for prior rep turn: ${m.spinType}` : null, m.feedback ? `Coach note: ${m.feedback}` : null]
        .filter(Boolean)
        .join(' | ');
      lines.push(`MARCUS: ${m.content}${meta ? ` (${meta})` : ''}`);
    }
  }
  const transcript = lines.join('\n');

  const schemaHint = `Return ONLY valid JSON with keys:
  "overall" (2-3 sentences),
  "comfortable_trap" (1-2 sentences: did they stay in friendly chat vs steer to discovery in a trusted-client context),
  "spin_diagnosis" (2-4 sentences: balance of S/P/I/N, sequence, missed SPIN types — tie to the counts),
  "needs_development" (2-3 sentences: implied vs explicit needs; did they deepen past first problem signal),
  "demonstration_timing" (1-3 sentences: premature solutioning vs well-timed capability tied to buyer language),
  "commitment_smart" (2-3 sentences: true advance vs continuation; reference SMART specificity if useful),
  "hidden_pain_and_next_step" (2-3 sentences: leakage/speed themes from brief — did the rep earn them; what concrete next step was secured or missed),
  "did_well" (one specific strength with example from transcript),
  "improve" (one specific improvement tied to SPIN),
  "next_call_focus" (single priority for next practice),
  "outcome_label" (exactly one of: "advance", "continuation", "no_sale" based on the rep's close and Marcus's response)`;

  const prompt = `
You are an expert sales coach certified in Korn Ferry SPIN / SPIN 3.0 investigative selling.

${SPIN_FRAMEWORK_BLOCK}

${SCENARIO_A_BLOCK}

REP: ${repName} (${repRole})
SPIN COUNTS (from live tagging of rep turns): ${JSON.stringify(spinCounts)}

FULL TRANSCRIPT:
${transcript || '(empty — say they ended before a real conversation)'}

${schemaHint}
`.trim();

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are a concise, specific sales coach for EXL Service. Never invent quotes; ground feedback in the transcript. Output valid JSON only.',
      },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1200,
  });

  const raw = res.choices[0]?.message?.content;
  if (!raw) throw new Error('Empty coach debrief response');

  const parsed = JSON.parse(raw) as Partial<ScenarioACoachDebrief>;
  const outcome = parsed.outcome_label;
  const outcome_label: CoachOutcome =
    outcome === 'advance' || outcome === 'continuation' || outcome === 'no_sale' ? outcome : 'no_sale';

  return {
    overall: String(parsed.overall ?? ''),
    comfortable_trap: String(parsed.comfortable_trap ?? ''),
    spin_diagnosis: String(parsed.spin_diagnosis ?? ''),
    needs_development: String(parsed.needs_development ?? ''),
    demonstration_timing: String(parsed.demonstration_timing ?? ''),
    commitment_smart: String(parsed.commitment_smart ?? ''),
    hidden_pain_and_next_step: String(parsed.hidden_pain_and_next_step ?? ''),
    did_well: String(parsed.did_well ?? ''),
    improve: String(parsed.improve ?? ''),
    next_call_focus: String(parsed.next_call_focus ?? ''),
    outcome_label,
  };
}

export function spinCountsFromMessages(messages: CoachMessage[]) {
  const c = countSpinFromTranscript(messages);
  return { S: c.S, P: c.P, I: c.I, N: c.N };
}
