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
  overall_score?: number;
  demo_timing_bucket?: 'early' | 'timely' | 'late' | 'unknown';
  hidden_pain_1_status?: 'surfaced' | 'partially_surfaced' | 'missed';
  hidden_pain_2_status?: 'surfaced' | 'partially_surfaced' | 'missed';
  hidden_pain_3_status?: 'surfaced' | 'partially_surfaced' | 'missed';
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
Scenario context: Marcus Holt (COO) at Arvenix Life, a mid-size insurer across EU and APAC.
Hidden pain 1: fragmented policy/admin platforms slow cycle time across markets.
Hidden pain 2: no single source of truth for operations reporting (manual dashboard assembly, inconsistent numbers).
Hidden pain 3: advisor portal experience is weak, forcing email/spreadsheet workarounds and distribution risk.
Marcus is polished and friendly; he may describe operations as "manageable" until implication questions surface true cost.
`.trim();

export async function generateScenarioACoachDebrief(params: {
  repName: string;
  repRole: string;
  messages: CoachMessage[];
  commitmentOutcome?: CoachOutcome;
}): Promise<ScenarioACoachDebrief> {
  const { repName, repRole, messages, commitmentOutcome } = params;
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
  "outcome_label" (exactly one of: "advance", "continuation", "no_sale" based on the rep's close and Marcus's response),
  "overall_score" (integer 0..100),
  "demo_timing_bucket" (exactly one of: "early", "timely", "late", "unknown"),
  "hidden_pain_1_status" (exactly one of: "surfaced", "partially_surfaced", "missed"),
  "hidden_pain_2_status" (exactly one of: "surfaced", "partially_surfaced", "missed"),
  "hidden_pain_3_status" (exactly one of: "surfaced", "partially_surfaced", "missed")`;

  const prompt = `
You are an expert sales coach certified in Korn Ferry SPIN / SPIN 3.0 investigative selling.

${SPIN_FRAMEWORK_BLOCK}

${SCENARIO_A_BLOCK}

REP: ${repName} (${repRole})
SPIN COUNTS (from live tagging of rep turns): ${JSON.stringify(spinCounts)}
HEURISTIC COMMITMENT OUTCOME (from app logic): ${commitmentOutcome ?? 'unknown'}

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
    overall_score: Number.isFinite(parsed.overall_score) ? Number(parsed.overall_score) : 0,
    demo_timing_bucket:
      parsed.demo_timing_bucket === 'early' ||
      parsed.demo_timing_bucket === 'timely' ||
      parsed.demo_timing_bucket === 'late' ||
      parsed.demo_timing_bucket === 'unknown'
        ? parsed.demo_timing_bucket
        : 'unknown',
    hidden_pain_1_status:
      parsed.hidden_pain_1_status === 'surfaced' || parsed.hidden_pain_1_status === 'partially_surfaced' || parsed.hidden_pain_1_status === 'missed'
        ? parsed.hidden_pain_1_status
        : 'missed',
    hidden_pain_2_status:
      parsed.hidden_pain_2_status === 'surfaced' || parsed.hidden_pain_2_status === 'partially_surfaced' || parsed.hidden_pain_2_status === 'missed'
        ? parsed.hidden_pain_2_status
        : 'missed',
    hidden_pain_3_status:
      parsed.hidden_pain_3_status === 'surfaced' || parsed.hidden_pain_3_status === 'partially_surfaced' || parsed.hidden_pain_3_status === 'missed'
        ? parsed.hidden_pain_3_status
        : 'missed',
  };
}

export function spinCountsFromMessages(messages: CoachMessage[]) {
  const c = countSpinFromTranscript(messages);
  return { S: c.S, P: c.P, I: c.I, N: c.N };
}
