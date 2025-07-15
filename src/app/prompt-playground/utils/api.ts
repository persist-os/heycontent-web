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

export interface PlaygroundFeedbackRequest {
  name: string;
  prompt_title: string;
  feedback: string;
  model_output: string;
  rating: string;
}

export interface PlaygroundFeedbackResponse {
  ok: boolean;
  result?: any;
  error?: string;
}

export async function submitPlaygroundFeedback(feedbackReq: PlaygroundFeedbackRequest): Promise<PlaygroundFeedbackResponse> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const response = await fetch('/api/playground/submit_feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(feedbackReq)
  });

  const data = await response.json();
  if (!response.ok) {
    let errorMsg = 'Failed to submit feedback';
    try {
      errorMsg = data.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  return data;
}

export interface PlaygroundEditRequest {
  name: string;
  request_title: string;
  prompt_title: string;
  justification: string;
  old_description: string;
  new_description: string;
  old_instructions: string;
  new_instructions: string;
  status: string;
  synced: boolean;
}

export interface PlaygroundEditResponse {
  ok: boolean;
  result?: any;
  error?: string;
}

export async function submitPlaygroundEditRequest(editRequest: PlaygroundEditRequest): Promise<PlaygroundEditResponse> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const response = await fetch('/api/playground/submit_edit_request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(editRequest)
  });

  const data = await response.json();
  if (!response.ok) {
    let errorMsg = 'Failed to submit edit request';
    try {
      errorMsg = data.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  return data;
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

export interface AgentProposalRequest {
  title: string; 
  justification?: string;
  name?: string;
  target_users?: string[];
  use_cases?: string;
  description?: string;
  status?: string; 
  instructions?: string;
  submission_date?: string; 
}

export interface AgentProposalResponse {
  ok: boolean;
  result?: any;
  error?: string;
}

export async function proposeAgent(agentProposal: AgentProposalRequest): Promise<AgentProposalResponse> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const response = await fetch('/api/playground/propose_agent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(agentProposal)
  });

  const data = await response.json();
  if (!response.ok) {
    let errorMsg = 'Failed to propose agent';
    try {
      errorMsg = data.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  return data;
}
