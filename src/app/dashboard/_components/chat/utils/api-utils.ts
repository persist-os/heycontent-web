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
  contentContext?: ContentContext | null,
  hasContextInjection?: boolean
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

  // Add context injection flag to help backend understand the message type
  if (hasContextInjection) {
    requestBody.has_context_injection = true;
    requestBody.context_enhanced = true;
  }

  // Handle session ID based on whether this is a first message or continuing conversation
  if (isFirstMessageBool) {
    // For new conversations, explicitly set session_id to null
    requestBody.session_id = null;
    console.log('Sending first message - session_id set to null for new conversation');
  } else if (sessionId) {
    // For continuing conversations, use the conversation ID as session_id
    requestBody.session_id = sessionId;
    console.log('Continuing existing conversation - session_id set to:', sessionId);
  } else {
    // This shouldn't happen, but handle gracefully
    console.warn('Non-first message without session ID - this may cause issues');
    requestBody.session_id = null;
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

  // Add this right before the fetch call
  console.log('📤 SENDING MESSAGE TO BACKEND:', {
    is_first_message: requestBody.is_first_message,
    session_id: requestBody.session_id,
    current_session_id: sessionId,
    expected_behavior: isFirstMessageBool ? 'CREATE_NEW_CONVERSATION' : 'CONTINUE_EXISTING_CONVERSATION',
    conversation_to_continue: isFirstMessageBool ? 'N/A' : sessionId,
    endpoint: '/api/chat/message',
    has_content_context: !!contentContext,
    content_context: contentContext ? {
      platform: contentContext.platform,
      contentId: contentContext.contentId,
      title: contentContext.title,
      hasAnalysis: !!contentContext.analysis
    } : null
  });

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

  const data = await response.json();

  // Add this right after receiving the response
  console.log('📥 RECEIVED RESPONSE FROM BACKEND:', {
    session_id_returned: data.session_id,
    session_id_expected: sessionId,
    response_length: data.chat_response?.length,
    conversation_context: isFirstMessageBool ? 'NEW' : 'EXISTING',
    session_id_changed: sessionId !== data.session_id,
    response_preview: data.chat_response?.substring(0, 100) + '...',
    full_response_structure: Object.keys(data)
  });

  return data;
}

/**
 * Load conversation by ID
 */
export async function loadConversation(id: string) {
  try {
    // Get API key for authentication - same pattern as sendChatMessage
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error('You are not authenticated. Please log in again.');
    }

    const response = await fetch(`/api/chat/conversation/${id}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

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
