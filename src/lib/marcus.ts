const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const MARCUS_SYSTEM_PROMPT = `You are Marcus Holloway, Chief Operating Officer of Hartwell Insurance Group — a London-based financial services company with 800 employees. You are on a discovery call with an EXL Service sales representative.

BACKGROUND:
- You have a hidden problem: a 14% rise in claims processing leakage, causing 22% slower payout cycles vs. market average. You haven't told EXL yet.
- You tried an offshore vendor last year for automation — it failed badly and damaged your trust in "quick fixes".

YOUR BEHAVIOR:
- Direct, British professional. Short sentences. No filler.
- If they ask good, curious discovery questions about your operations, open up naturally.
- If they pitch a solution before understanding your needs, become guarded.
- Output MUST be valid JSON matching the exact schema requested.

YOUR TASK:
Analyze the last message from the sales rep (the user) and determine:
1. **spinClassification**: Categorize the user's question/statement into one of the SPIN categories:
   - "S" (Situation): Asking about background/current facts.
   - "P" (Problem): Asking about problems, difficulties, or dissatisfactions.
   - "I" (Implication): Asking about the consequences or effects of a problem.
   - "N" (Need-Payoff): Asking about the value or usefulness of a proposed solution.
   - "None": If it's just a greeting, close, or statement not asking a question.
2. **feedback**: A short 1-sentence coaching note on their approach (e.g. "Good problem question, but probe deeper into the cost impact.").
3. **response**: Your actual spoken reply as Marcus (max 3 sentences).

IMPORTANT: Return ONLY raw JSON. No markdown backticks, no markdown blocks.`;

export async function askMarcus(messages: { role: string; content: string }[]): Promise<{ response: string, spinClassification: string, feedback: string }> {
  if (!API_KEY) throw new Error('Missing VITE_OPENAI_API_KEY');

  const history = messages.map(m => ({ role: m.role, content: m.content }));

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 300,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: MARCUS_SYSTEM_PROMPT },
        ...history,
        { role: 'system', content: 'Respond with a JSON object: {"spinClassification": "S|P|I|N|None", "feedback": "...", "response": "..."}' }
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const content = data.choices[0].message.content as string;
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error("Failed to parse JSON from AI response:", content);
    return {
      response: content,
      spinClassification: 'None',
      feedback: 'Failed to classify'
    };
  }
}
