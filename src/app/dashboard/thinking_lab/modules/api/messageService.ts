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

// Import progressive thinking utilities
import { startProgressiveThinking, sleep, POST_THINK_DELAY_MS } from '@/app/dashboard/thinking_lab/hooks/useProgressiveThinking';

// =============================================================================
// ENHANCED MESSAGE TRANSMISSION WITH CONTEXT INTELLIGENCE
// =============================================================================

/**
 * Main message transmission using the Next.js API route
 * This calls /api/chat/message which forwards to the backend.
 */
export async function transmitMessageWithContext(params: MessageTransmissionRequest): Promise<LabResponseData> {
  const {
    content,
    fileAttachments,
    notepadContext,
    workspaceContext,
    isFirstMessage,
    sessionIdentifier,
    onStatusUpdate,
    projectId,
    widgetId,
    widgetOutputId,
    conversationType
  } = params;
  
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
    // Retry flow specific to auth timing issues with longer timeout
    onStatusUpdate?.('Waiting for authentication…');
    const readyAgain = await waitForAuthReady(8, 300);
    if (!readyAgain) {
      throw new AuthenticationError('Authentication state not ready. Please wait a moment and try again.');
    }
    userId = await getCurrentUserId();
  }

  let thinkingControl: { stop: () => void; completion: Promise<void> } | null = null;
  try {
    // Start staggered thinking sequence
    thinkingControl = startProgressiveThinking(onStatusUpdate); // MAB controls context strategy
    
    // Prepare request body for thinking lab endpoint
    const requestBody: any = {
      user_id: userId,
      query: content,
      is_first_message: isFirstMessage,
      session_identifier: sessionIdentifier,
      notepad_context: notepadContext,
      workspace_context: workspaceContext
    };

    // Add file attachments if present
    if (fileAttachments && fileAttachments.length > 0) {
      requestBody.file_attachments = fileAttachments;
    }

    // Add project/widget context if present
    if (projectId) {
      requestBody.project_id = projectId;
    }
    if (widgetId) {
      requestBody.widget_id = widgetId;
    }
    if (widgetOutputId) {
      requestBody.widget_output_id = widgetOutputId;
    }
    if (conversationType) {
      requestBody.conversation_type = conversationType;
    }

    // Sending to lab endpoint

    // Call the thinking lab API endpoint (not the generic chat endpoint)
    // Run backend call and thinking sequence in parallel, wait for both
    const [response] = await Promise.all([
      fetchWithApiKey('/api/lab/message', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      }),
      thinkingControl.completion // Wait for all thinking steps to complete
    ]);

    if (!response.ok) {
      console.error('[MessageService] Response not OK:', response.status, response.statusText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    // Received response from API
    
    // Thinking steps already completed, show final status
    onStatusUpdate?.('Messages updated via subscription');
    await sleep(POST_THINK_DELAY_MS);
    
    // Backend writes to Convex immediately, returns minimal response
    // Component subscription will automatically update messages from Convex
    const result = {
      session_identifier: data.session_identifier || data.conversationId || null,
      conversationId: data.conversationId || data.session_identifier || null,
      suggestions: data.suggestions || [],
      metadata: data.metadata || {},
      user_input: content
    };
    
    // Returning result
    
    return result;

  } catch (error) {
    // Ensure we always stop the thinking sequence on error
    thinkingControl?.stop();
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new Error(error instanceof Error ? error.message : 'Failed to send message');
  } finally {
    // Defensive: ensure the thinking sequence does not continue
    thinkingControl?.stop();
  }
}

/**
 * StreamBuffer batches rapid chunks for smooth 60fps rendering
 * Prevents jank from hundreds of tiny updates per second
 */
class StreamBuffer {
  private buffer: string = ''
  private rafId: number | null = null
  private lastFlushTime: number = 0
  private readonly MIN_INTERVAL_MS = 50 // ~20fps max for smoother experience
  
  constructor(private onFlush: (content: string) => void) {}

  accumulate(chunk: string) {
    this.buffer += chunk
    
    const now = performance.now()
    const timeSinceLastFlush = now - this.lastFlushTime
    
    // Only schedule flush if enough time has passed or buffer is large
    if (!this.rafId && (timeSinceLastFlush >= this.MIN_INTERVAL_MS || this.buffer.length > 100)) {
      this.rafId = requestAnimationFrame(() => {
        // Only flush if we have content to avoid empty updates
        if (this.buffer) {
          this.onFlush(this.buffer)
          this.buffer = ''
          this.lastFlushTime = performance.now()
        }
        this.rafId = null
      })
    }
  }
  
  flush() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    if (this.buffer) {
      this.onFlush(this.buffer)
      this.buffer = ''
      this.lastFlushTime = performance.now()
    }
  }
}

/**
 * Stream message transmission with real-time chunk updates
 * Uses Server-Sent Events (SSE) to stream response chunks as they arrive.
 * Suggestions are generated asynchronously and updated via Convex subscription.
 */
export async function transmitMessageWithStreaming(
  params: MessageTransmissionRequest,
  onChunk: (chunk: string) => void
): Promise<LabResponseData> {
  const {
    content,
    fileAttachments,
    notepadContext,
    workspaceContext,
    isFirstMessage,
    sessionIdentifier,
    onStatusUpdate,
    projectId,
    widgetId,
    widgetOutputId,
    conversationType
  } = params;
  
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
    onStatusUpdate?.('Waiting for authentication…');
    const readyAgain = await waitForAuthReady(8, 300);
    if (!readyAgain) {
      throw new AuthenticationError('Authentication state not ready. Please wait a moment and try again.');
    }
    userId = await getCurrentUserId();
  }

  try {
    onStatusUpdate?.('Connecting to AI...');
    
    // Prepare request body for streaming lab endpoint
    const requestBody: any = {
      user_id: userId,
      query: content,
      is_first_message: isFirstMessage,
      session_identifier: sessionIdentifier,
      notepad_context: notepadContext,
      workspace_context: workspaceContext
    };

    // Add file attachments if present
    if (fileAttachments && fileAttachments.length > 0) {
      requestBody.file_attachments = fileAttachments;
    }

    // Add project/widget context if present
    if (projectId) {
      requestBody.project_id = projectId;
    }
    if (widgetId) {
      requestBody.widget_id = widgetId;
    }
    if (widgetOutputId) {
      requestBody.widget_output_id = widgetOutputId;
    }
    if (conversationType) {
      requestBody.conversation_type = conversationType;
    }

    // Sending to streaming lab endpoint

    // Call the streaming endpoint
    const response = await fetchWithApiKey('/api/lab/stream', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.error('[MessageService] Streaming response not OK:', response.status, response.statusText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Read the stream
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let fullResponse = '';
    let metadata: any = {};
    let isStreaming = true;

    // Create StreamBuffer for smooth rendering
    const streamBuffer = new StreamBuffer(onChunk);

    onStatusUpdate?.('Receiving response...');

    while (isStreaming) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'content') {
              // Accumulate chunk in buffer for smooth rendering
              fullResponse += data.data;
              streamBuffer.accumulate(data.data);
            } else if (data.type === 'complete') {
              // Flush any remaining buffered content
              streamBuffer.flush();
              
              // Final metadata chunk
              metadata = data.data;
              isStreaming = false;
              
              // Suggestions will be updated via Convex subscription
              onStatusUpdate?.('Messages updated via subscription');
            } else if (data.type === 'error') {
              streamBuffer.flush();
              console.error('[MessageService:Streaming] Error:', data.data);
              throw new Error(data.data);
            }
          } catch (parseError) {
            console.warn('[MessageService] Failed to parse SSE chunk:', line);
          }
        }
      }
    }


    // Return final result
    const result = {
      session_identifier: metadata.session_id || metadata.conversationId || null,
      conversationId: metadata.conversationId || metadata.session_id || null,
      suggestions: metadata.suggestions || [],
      metadata: metadata.metadata || {},
      user_input: content
    };
    
    return result;

  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new Error(error instanceof Error ? error.message : 'Failed to stream message');
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
