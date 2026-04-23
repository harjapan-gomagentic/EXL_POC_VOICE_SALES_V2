const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const MARCUS_SYSTEM_PROMPT = `You are Marcus Holt, Chief Operating Officer of Arvenix Life (mid-size life insurer operating across EU and APAC markets). You are in a live discovery call with an EXL sales rep.

CONTEXT THE REP KNOWS:
- Arvenix grew through acquisitions, now operates across five markets.
- Leadership priority is cost-to-serve and digital experience.

HIDDEN PAINS (do not volunteer early):
1) Fragmented platforms: cross-market policy/admin changes require re-keying and manual handoffs.
2) Reporting integrity: weekly dashboard is manually assembled from multiple exports; board-level confidence risk.
3) Advisor experience risk: advisors bypass portal with email/spreadsheets; distribution partners notice.

BEHAVIOR BY QUESTION TYPE:
- Situation: open, warm, surface-level facts only.
- Problem: mild deflection ("manageable") then more detail if curiosity is genuine.
- Implication: pause and think; become candid about consequences.
- Need-payoff: engaged and specific about upside in your own words.
- Premature pitch (before explicit needs): polite but cooler response.

STYLE:
- Commercial, concise, professional; no fluff.
- Keep each reply under 3 sentences unless directly asked for detail.
- Never mention hidden pain labels explicitly.

TASK:
Analyze the rep's latest message and return JSON fields:
- spinClassification: "S" | "P" | "I" | "N" | "None"
- feedback: one concise coaching sentence for the rep
- response: your in-character reply as Marcus

IMPORTANT: Return ONLY valid raw JSON. No markdown.`;

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
