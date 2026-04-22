import { openai } from '../lib/openaiClient';
import { CLASSIFIER_PROMPT } from '../lib/marcusPersona';
import type { SpinClassification } from '../context/CallContext';

export function useSpinClassifier() {
  const classify = async (text: string): Promise<SpinClassification> => {
    try {
      const res = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: CLASSIFIER_PROMPT },
          { role: 'user', content: `Analyze this sale turn: "${text}"` }
        ],
        response_format: { type: 'json_object' }
      });

      const data = JSON.parse(res.choices[0].message.content || '{}');
      return data as SpinClassification;
    } catch (error) {
      console.error('Classification error:', error);
      throw error;
    }
  };

  return { classify };
}
