const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

/**
 * Lightweight OpenAI SDK shim using fetch.
 * This allows hooks to use the standard openai.chat.completions.create() syntax
 * without needing the full openai npm package.
 */
export const openai = {
  chat: {
    completions: {
      create: async ({ model, messages, response_format, max_tokens }: any) => {
        if (!API_KEY) throw new Error('VITE_OPENAI_API_KEY not set');
        
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify({
            model: model || 'gpt-4o',
            messages,
            response_format,
            max_tokens: max_tokens || 1000
          })
        });

        if (!res.ok) {
          const errorData = await res.text();
          throw new Error(`OpenAI Error ${res.status}: ${errorData}`);
        }

        const data = await res.json();
        return data;
      }
    }
  }
};

/**
 * Legacy helper for direct calls
 */
export async function callOpenAI(
  messages: { role: string; content: string }[],
  systemPrompt: string,
  maxTokens = 1000
): Promise<string> {
  const data = await openai.chat.completions.create({
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    max_tokens: maxTokens
  });
  return data.choices[0].message.content;
}
