import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  temperature?: number;
  max_tokens?: number;
  model?: string;
}

const defaultOptions: CompletionOptions = {
  temperature: 0.7,
  max_tokens: 1000,
  model: 'gpt-4'
};

export async function getCompletion(
  messages: Message[],
  options: CompletionOptions = {}
): Promise<string> {
  try {
    const mergedOptions = { ...defaultOptions, ...options };
    const completion = await openai.chat.completions.create({
      model: mergedOptions.model!,
      messages: messages,
      temperature: mergedOptions.temperature!,
      max_tokens: mergedOptions.max_tokens
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenAI completion error:', error);
    throw error;
  }
}

export async function analyzeContent(
  content: string,
  systemPrompt: string,
  options: CompletionOptions = {}
): Promise<string> {
  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content }
  ];
  return getCompletion(messages, options);
} 