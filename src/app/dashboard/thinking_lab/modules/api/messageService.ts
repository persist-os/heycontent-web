/**
 * Message Transmission Service (Simplified)
 *
 * Streamlined service for thinking lab message exchange.
 * Single API call with backend handling all intelligence.
 */

import { fetchWithApiKey, getCurrentUserId } from '@/app/lib/api-helpers';
import { AuthenticationError } from '@/app/lib/errors';
import {
  LabResponseData,
  WorkspaceContext,
  NotepadContext
} from '@/app/dashboard/thinking_lab/types';

// Import centralized types
import type {
  MessageTransmissionRequest
} from '@/app/dashboard/thinking_lab/types';

// Endpoint configuration
const ENDPOINTS = {
  message: '/api/lab/message'
} as const;

type TransmissionType = keyof typeof ENDPOINTS;

// Public API parameter interfaces are now centralized in types/api/labApi.ts

// Internal transmission types (use centralized types)
interface MessageTransmission extends MessageTransmissionRequest {
  type: 'message';
}

type AnyTransmission = MessageTransmission;

/**
 * Recursively convert camelCase keys to snake_case
 */
function toSnakeCase(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = toSnakeCase(value);
  }
  return result;
}

/**
 * Transform WorkspaceContext to consistent backend format
 */
function transformContext(context: WorkspaceContext): Record<string, any> {
  // Convert all keys to snake_case for consistent backend API
  return toSnakeCase({
    resourceId: context.resourceId,
    contentId: context.contentId,
    title: context.title,
    analysis: context.analysis,
    publishedAt: context.publishedAt,
    metrics: context.metrics,
    content: context.content,
    convexData: context.convexData,
    deepInsight: context.deepInsight,
    fullInsight: context.fullInsight,
    actionStep: context.actionStep,
    additionalContext: context.additionalContext
  });
}

/**
 * Build payload based on transmission type
 */
function buildPayload(params: AnyTransmission, userId: string): Record<string, any> {
  // Validate sessionIdentifier for non-first messages
  if (!params.isFirstMessage && !params.sessionIdentifier) {
    throw new Error('sessionIdentifier is required for continuing conversations');
  }

  const basePayload = {
    user_id: userId,
    query: params.content,
    is_first_message: params.isFirstMessage,
    session_identifier: params.isFirstMessage ? null : params.sessionIdentifier,
    notepad_context: params.notepadContext,
    workspace_context: params.workspaceContext ? transformContext(params.workspaceContext) : null
  };

  switch (params.type) {
    case 'message':
      return {
        ...basePayload,
        ...params.additionalData
      };
  }
}

/**
 * Transform API response to consistent format
 * HACK: Handle inconsistent backend responses from /message (uses 'response') and /project-discovery (uses 'response_content')
 * TODO: File ticket to unify backend API response format
 */
function transformResponse(data: any): LabResponseData {
  return {
    response_content: data.response || data.response_content,
    session_identifier: data.session_identifier || data.session_id,
    user_input: data.user_message || data.user_input,
    suggestions: data.suggestions || [],
    metadata: data.metadata || {}
  };
}

/**
 * Core transmission engine with built-in validation
 */
async function transmit(params: AnyTransmission): Promise<LabResponseData> {
  // Built-in user validation
  const userId = getCurrentUserId();
  if (!userId) {
    throw new AuthenticationError('User identification required. Please sign in again!');
  }

  // Build payload and transmit
  const payload = buildPayload(params, userId);
  const response = await fetchWithApiKey(ENDPOINTS[params.type], {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  return transformResponse(data);
}

/**
 * Transmit a standard thinking lab message
 */
export async function transmitMessage(params: MessageTransmissionRequest): Promise<LabResponseData> {
  return transmit({
    type: 'message',
    ...params
  });
}


// =============================================================================
// ENHANCED MESSAGE TRANSMISSION WITH CONTEXT INTELLIGENCE
// =============================================================================

/**
 * Simplified message transmission - single backend call
 * Backend handles all intelligence (intent analysis, vector search, context grading)
 */
export async function transmitMessageWithContext(params: MessageTransmissionRequest): Promise<LabResponseData> {
  const { content, useContextSearch = false, onStatusUpdate } = params;
  
  // Get user ID
  const userId = getCurrentUserId();
  if (!userId) {
    throw new AuthenticationError('User identification required. Please sign in again!');
  }

  // Simple status update
  onStatusUpdate?.('Thinking...');

  // Single API call to backend - let backend handle all intelligence
  const payload = buildPayload({
    type: 'message',
    ...params
  }, userId);

  // Add context search preference
  payload.use_context_search = useContextSearch;

  const response = await fetchWithApiKey(ENDPOINTS.message, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  return transformResponse(data);
}
