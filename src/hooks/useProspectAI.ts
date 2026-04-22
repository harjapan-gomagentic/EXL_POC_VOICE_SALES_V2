import { useCallback } from 'react';
import { callOpenAI } from '../lib/openaiClient';
import { MARCUS_PERSONA } from '../lib/marcusPersona';
import type { Message } from '../context/CallContext';

/**
 * Hook to handle Prospect (Marcus) AI responses.
 * Now handles both full message history and single text snippets for flexibility.
 */
export function useProspectAI() {
  const getResponse = useCallback(async (input: Message[] | string): Promise<string> => {
    let msgs: { role: string; content: string }[];

    if (typeof input === 'string') {
      // If a single string is passed, treat it as the latest user turn
      msgs = [{ role: 'user', content: input }];
    } else {
      // Map the history for the OpenAI API
      msgs = input.map(msg => ({ role: msg.role, content: msg.content }));
    }

    try {
      return await callOpenAI(msgs, MARCUS_PERSONA, 300);
    } catch (err) {
      console.error('Prospect AI error:', err);
      return "I'm sorry, I missed that. Could you repeat what you just said?";
    }
  }, []);

  return { getResponse };
}
