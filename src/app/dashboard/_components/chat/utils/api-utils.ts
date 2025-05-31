import { ChatResponseData } from '../types';
import { ContentContext } from '../types';

import dotenv from 'dotenv';

dotenv.config();

import { getApiKey } from '@/app/lib/api-helpers';

/**
 * Send a chat message to the API
 */
export async function sendChatMessage(
  content: string, 
  isFirstMessage: boolean, 
  sessionId: string | null,
  contentContext?: ContentContext | null
): Promise<ChatResponseData> {
  // Get API key - make sure we have one before proceeding
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  // Always set is_first_message to true when isFirstMessage is true
  // This ensures the first message is ALWAYS properly flagged
  const isFirstMessageBool = isFirstMessage;
  
  const requestBody: any = {
    query: content,
    is_first_message: isFirstMessageBool
  };

  // If this is the first message, explicitly set session_id to null in the request
  if (isFirstMessageBool) {
    requestBody.session_id = null;
  } else if (sessionId) {
    requestBody.session_id = sessionId;
  }

  // Include content context if available
  if (contentContext) {
    requestBody.content_context = {
      platform: contentContext.platform,
      content_id: contentContext.contentId,
      title: contentContext.title,
      analysis: contentContext.analysis,
      thumbnail_url: contentContext.thumbnailUrl,
      published_at: contentContext.publishedAt,
      metrics: contentContext.metrics,
      content: contentContext.content
    };
  }

  // Do NOT include user_id in the request body; backend extracts it from API key

  console.log('Sending chat message with details:', {
    query_length: content.length,
    is_first_message_original: isFirstMessage,
    is_first_message_sent: isFirstMessageBool,
    session_id: requestBody.session_id,
    has_session_id: !!requestBody.session_id,
    has_content_context: !!contentContext,
    content_context_platform: contentContext?.platform
  });
  console.log('Full request body:', JSON.stringify(requestBody));
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

// We no longer generate local session IDs
// All session IDs should come from the backend
