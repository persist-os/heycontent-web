import { getApiKey } from '@/app/lib/api-helpers';

export interface PlaygroundRequest {
  description: string;
  instructions: string;
  message: string;
}

export interface PlaygroundResponse {
  output?: string;
  error?: string;
}

export interface GetPromptsResponse {
  prompts: Record<string, any>;
  error?: string;
}

export async function sendPlaygroundMessage({ description, instructions, message }: PlaygroundRequest): Promise<PlaygroundResponse> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const response = await fetch('/api/playground/send_message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ description, instructions, message })
  });

  if (!response.ok) {
    let errorMsg = 'Failed to send playground message';
    try {
      const err = await response.json();
      errorMsg = err.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  return await response.json();
}

export async function getPlaygroundPrompts(): Promise<GetPromptsResponse> {
  const apiKey = await getApiKey();
  const response = await fetch('/api/playground/get_prompts', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
    }
  });

  if (!response.ok) {
    let errorMsg = 'Failed to fetch prompts';
    try {
      const err = await response.json();
      errorMsg = err.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  return await response.json();
} 