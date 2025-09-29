/**
 * Message Transmission Service (Simplified)
 *
 * Streamlined service for thinking lab message exchange.
 * Calls the Next.js API route which forwards to backend.
 */

import { fetchWithApiKey, getCurrentUserId, waitForAuthReady } from '@/app/lib/api-helpers';
import { AuthenticationError } from '@/app/lib/errors';
import {
  LabResponseData
} from '@/app/dashboard/thinking_lab/types';

// Import centralized types
import type {
  MessageTransmissionRequest
} from '@/app/dashboard/thinking_lab/types';


// =============================================================================
// ENHANCED MESSAGE TRANSMISSION WITH CONTEXT INTELLIGENCE
// =============================================================================

/**
 * Main message transmission using the Next.js API route
 * This calls /api/chat/message which forwards to the backend.
 */
export async function transmitMessageWithContext(params: MessageTransmissionRequest): Promise<LabResponseData> {
  const { content, useContextSearch = true, onStatusUpdate } = params;
  
  // Auth readiness and userId resolution with retry
  onStatusUpdate?.('Preparing secure session...');
  let userId: string | null = null;
  const ready = await waitForAuthReady(5, 150);
  if (ready) {
    try {
      userId = await getCurrentUserId();
    } catch (_) {
      // Will retry below
    }
  }
  if (!userId) {
    // Retry flow specific to auth timing issues
    onStatusUpdate?.('Waiting for authentication…');
    const readyAgain = await waitForAuthReady(3, 250);
    if (!readyAgain) {
      throw new AuthenticationError('Authentication state not ready. Please wait a moment and try again.');
    }
    userId = await getCurrentUserId();
  }

  try {
    // Status updates
    onStatusUpdate?.('Processing your request...');
    onStatusUpdate?.('Searching for relevant context...');

    // Call the Next.js API route
    const response = await fetchWithApiKey('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        query: content,
        content_types: ["note", "crystal", "conversation"],
        include_context: useContextSearch,
        max_results: 10,
        similarity_threshold: 0.7,
        generate_embeddings: false,
        store_conversation: true
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    onStatusUpdate?.('Generating response...');
    
    // Transform backend response to expected format
    if (data.success && data.data) {
      return {
        response_content: data.data.response || generateResponseFromContext(data.data),
        session_identifier: data.data.session_id || `session-${Date.now()}`,
        user_input: content, // Use the original user input
        suggestions: data.data.suggestions || [],
        metadata: data.data.metadata || {}
      };
    }
    
    // Handle error case
    return {
      response_content: data.error || 'No response received',
      session_identifier: `session-${Date.now()}`,
      user_input: content,
      suggestions: [],
      metadata: { error: data.error }
    };

  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new Error(error instanceof Error ? error.message : 'Failed to send message');
  }
}

/**
 * Generate a helpful response from context data
 */
function generateResponseFromContext(responseData: any): string {
  const context = responseData.context || {};
  const relevantContent = context.relevant_content || [];
  const hasContext = context.has_context || false;
  
  if (!hasContext || relevantContent.length === 0) {
    return "I've processed your request, but I didn't find any directly relevant context from your existing content. Feel free to ask questions about your notes, crystals, or conversations!";
  }
  
  let response = "Based on your existing content, here's what I found:\n\n";
  
  relevantContent.slice(0, 3).forEach((item: any, index: number) => {
    response += `**${item.title || 'Untitled'}**\n`;
    response += `${item.content?.substring(0, 200)}${item.content?.length > 200 ? '...' : ''}\n\n`;
  });
  
  if (relevantContent.length > 3) {
    response += `Found ${relevantContent.length - 3} more relevant items in your content.\n\n`;
  }
  
  response += "Would you like me to explore any of these connections further?";
  
  return response;
}
