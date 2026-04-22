/** Plain-language SPIN + Scenario A copy for in-session coaching (no jargon walls). */

export const SPIN_LEGEND = [
  { letter: 'S', title: 'Situation', plain: 'Learn how their world works today — facts, setup, volume.', hint: '“Walk me through how claims move through your team today.”' },
  { letter: 'P', title: 'Problem', plain: 'Surface pain, delays, or worry — without jumping to your fix.', hint: '“Where does it hurt most — speed, accuracy, or cost?”' },
  { letter: 'I', title: 'Implication', plain: 'Help them feel why it matters — impact, risk, or missed targets.', hint: '“If that continues, what does it do to board confidence or payouts?”' },
  { letter: 'N', title: 'Need-payoff', plain: 'Let them describe value of fixing it — in their words.', hint: '“If you solved that, what would improve first for you?”' },
] as const;

export function explainSpinLetter(letter: string): { title: string; plain: string } | null {
  const row = SPIN_LEGEND.find(s => s.letter === letter);
  return row ? { title: row.title, plain: row.plain } : null;
}

export const SCENARIO_A_CONTEXT = {
  headline: 'Why this simulation feels “easy”',
  body: 'Marcus already trusts EXL. Your job is not to pitch — it is to earn the real operational story (especially what he is not advertising) and land a concrete next step.',
  watchFor: [
    'Friendly chat that never reaches a real problem',
    'Jumping to solutions before he names pain',
    'Ending with “let’s stay in touch” instead of a dated action',
  ],
};

export const MISSION_COACH_LINES: { title: string; tip: string; spinFocus: string }[] = [
  { title: 'Open the call', tip: 'Say who you are, why you asked for time, and what success looks like for him — in one breath.', spinFocus: 'Situation' },
  { title: 'Find the friction', tip: 'Ask how work really flows. Marcus will not hand you problems; curiosity unlocks them.', spinFocus: 'Problem' },
  { title: 'Make it costly to ignore', tip: 'Ask what breaks if nothing changes — time, money, reputation, team morale.', spinFocus: 'Implication' },
  { title: 'Let him sell the fix', tip: 'Ask what “good” looks like after a fix so he states value, not you.', spinFocus: 'Need-payoff' },
  { title: 'Lock the advance', tip: 'Propose a specific next step — who, what, when — not a vague follow-up.', spinFocus: 'Commitment' },
];

/** Next mission index 0..4 from completed step indices */
export function nextMissionIndex(completed: number[]): number {
  for (let i = 0; i < MISSION_COACH_LINES.length; i++) {
    if (!completed.includes(i)) return i;
  }
  return MISSION_COACH_LINES.length - 1;
}

export function trainerTipForProgress(completed: number[]): string {
  const i = nextMissionIndex(completed);
  const line = MISSION_COACH_LINES[i];
  return `${line.title}: ${line.tip}`;
}
