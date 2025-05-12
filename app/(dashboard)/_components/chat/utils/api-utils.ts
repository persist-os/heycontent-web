import { auth } from '@/app/lib/firebase';
import { ChatResponseData } from '../types';

import dotenv from 'dotenv';

dotenv.config();

import { getApiKey } from '@/app/lib/api-helpers';

/**
 * Send a chat message to the API
 */
export async function sendChatMessage(
  content: string, 
  isFirstMessage: boolean, 
  sessionId: string | null
): Promise<ChatResponseData> {
  // Get API key - make sure we have one before proceeding
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const requestBody: any = {
    query: content,
    is_first_message: isFirstMessage
  };

  // Only include session_id for subsequent messages
  if (!isFirstMessage && sessionId) {
    requestBody.session_id = sessionId;
  }

  // Do NOT include user_id in the request body; backend extracts it from API key

  console.log('Sending chat message:', requestBody);
  console.log('Sending Authorization header:', apiKey);

  const response = await fetch('/api/chat/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return await response.json();
}

/**
 * Load conversation by ID
 */
export async function loadConversation(id: string) {
  try {
    const response = await fetch(`/api/chat/conversation/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to load conversation: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to load conversation:', error);
    throw error;
  }
}

/**
 * Generate a fallback session ID when the backend doesn't provide one
 */
export function generateLocalSessionId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}
