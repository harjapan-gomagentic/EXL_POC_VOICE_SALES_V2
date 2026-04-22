import { openai } from './openaiClient';
import type { AppState } from '../context/CallContext';

export async function generateDebrief(state: AppState) {
  const history = state.conversationHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
  
  const prompt = `
    Analyze the following SPIN sales call simulation between a sales rep and Marcus Holloway (COO).
    
    REP NAME: ${state.repName}
    REP ROLE: ${state.repRole}
    TRUST SCORE: ${state.trustScore}
    SPIN COUNTS: ${JSON.stringify(state.spinCounts)}
    OUTCOME: ${state.outcome}
    
    CONVERSATION HISTORY:
    ${history}
    
    Generate a debrief in valid JSON format:
    {
      "overall": "A summary of the performance in 2-3 sentences.",
      "did_well": "One specific thing the rep excelled at.",
      "improve": "One specific area for improvement based on SPIN methodology.",
      "takeaway": "The single most important lesson for the next call."
    }
  `;

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: 'You are an expert sales coach specialists in Korn Ferry SPIN selling.' }, { role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });
    
    return JSON.parse(res.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Debrief error:', error);
    throw error;
  }
}
