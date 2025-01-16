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
  response_format?: {
    type: "json_object" | "text";
  };
  retries?: number;
  backoffMs?: number;
}

const defaultOptions: CompletionOptions = {
  temperature: 0.7,
  max_tokens: 1000,
  model: 'gpt-3.5-turbo',
  retries: 3,
  backoffMs: 1000
};

async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Add cost tracking constants
const MODEL_COSTS = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
  'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 }
};

interface UsageMetrics {
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  timestamp: string;
  endpoint: string;
}

// Add usage logging
async function logUsage(metrics: UsageMetrics) {
  try {
    console.log('OpenAI API Usage:', {
      ...metrics,
      date: new Date().toISOString().split('T')[0]
    });
    
    // Only try to use localStorage in browser environment
    if (typeof window !== 'undefined') {
      // Store in localStorage for tracking
      const usageKey = `openai_usage_${new Date().toISOString().split('T')[0]}`;
      const existingUsage = localStorage.getItem(usageKey);
      const usage = existingUsage ? JSON.parse(existingUsage) : [];
      usage.push(metrics);
      localStorage.setItem(usageKey, JSON.stringify(usage));
    }
  } catch (error) {
    console.warn('Failed to log API usage:', error);
  }
}

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const costs = MODEL_COSTS[model as keyof typeof MODEL_COSTS] || MODEL_COSTS['gpt-3.5-turbo'];
  return (inputTokens * costs.input / 1000) + (outputTokens * costs.output / 1000);
}

export async function getCompletion(
  messages: Message[],
  options: CompletionOptions = {}
): Promise<string> {
  const mergedOptions = { ...defaultOptions, ...options };
  let lastError: any;
  
  for (let attempt = 0; attempt <= mergedOptions.retries!; attempt++) {
    try {
      if (attempt > 0) {
        const backoffTime = mergedOptions.backoffMs! * Math.pow(2, attempt - 1);
        await wait(backoffTime);
      }

      const completion = await openai.chat.completions.create({
        model: mergedOptions.model!,
        messages: messages,
        temperature: mergedOptions.temperature!,
        max_tokens: mergedOptions.max_tokens,
        response_format: mergedOptions.response_format
      });

      // Log usage
      await logUsage({
        model: mergedOptions.model!,
        inputTokens: completion.usage?.prompt_tokens || 0,
        outputTokens: completion.usage?.completion_tokens || 0,
        estimatedCost: calculateCost(
          mergedOptions.model!,
          completion.usage?.prompt_tokens || 0,
          completion.usage?.completion_tokens || 0
        ),
        timestamp: new Date().toISOString(),
        endpoint: 'chat.completions'
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error: any) {
      lastError = error;
      
      if (!error.message?.toLowerCase().includes('rate limit') || 
          attempt === mergedOptions.retries) {
        throw error;
      }
      
      console.warn(`Rate limit hit, attempt ${attempt + 1}/${mergedOptions.retries}. Retrying...`);
    }
  }

  throw lastError;
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

// Add model selection helper
export function selectModel(complexity: 'low' | 'medium' | 'high' = 'low'): string {
  switch (complexity) {
    case 'high':
      // Use GPT-4 only for complex tasks like strategic analysis
      return 'gpt-4';
    case 'medium':
      // Use GPT-3.5-turbo-16k for medium complexity tasks
      return 'gpt-3.5-turbo-16k';
    default:
      // Use standard GPT-3.5-turbo for most operations
      return 'gpt-3.5-turbo';
  }
} 