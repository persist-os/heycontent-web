import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  model: string;
  temperature?: number;
  response_format?: {
    type: 'text' | 'json_object';
  };
}

export async function getCompletion(
  messages: Message[],
  options: CompletionOptions
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      messages,
      model: options.model,
      temperature: options.temperature,
      response_format: options.response_format ? {
        type: options.response_format.type
      } : undefined
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
} 