/**
 * Discovery Service - Clean API for project fingerprint discovery and quick fill operations
 * 
 * This service provides two main functions:
 * 1. Discovery API: Interactive project discovery through chat messages
 * 2. Quick Fill Helper: One-shot fingerprint extraction from natural language text
 */

import { fetchWithApiKey, getCurrentUserId } from '@/app/lib/api-helpers';
import { AuthenticationError } from '@/app/lib/errors';

export interface DiscoveryRequest {
  query: string;
  projectName?: string;
  projectDescription?: string;
  projectId?: string;
  isFirstMessage?: boolean;
  sessionId?: string;
}

export interface DiscoveryResponse {
  response: string;
  status: string;
  session_id: string;
  user_message: string;
  suggestions: string[];
  metadata: Record<string, any>;
}

export interface QuickFillRequest {
  projectId: string;
  userId: string;
  text: string;
}

export interface QuickFillResponse {
  updates: Record<string, any>;
  confidence?: number;
  metadata?: Record<string, any>;
}

export async function sendDiscoveryMessage(params: DiscoveryRequest): Promise<DiscoveryResponse> {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new AuthenticationError('User identification required. Please sign in again!');
  }

  // Match the exact backend model structure
  const requestBody = {
    user_id: userId,
    query: params.query,
    project_name: params.projectName,
    project_description: params.projectDescription,
    is_first_message: params.isFirstMessage || false,
    session_id: params.sessionId,
    content_context: params.projectId ? { project_id: params.projectId } : undefined
  };

  const response = await fetchWithApiKey('/api/project-discovery', {
    method: 'POST',
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Quick Fill Fingerprint - Extract project field updates from natural language text
 * 
 * This helper function calls the quick-fill API route to get suggested field updates
 * from natural language input. The updates are returned but not applied - the caller
 * decides what to do with the suggestions.
 * 
 * @param params - QuickFillRequest containing projectId, userId, and text
 * @returns Promise<QuickFillResponse> with suggested updates, confidence, and metadata
 */
export async function quickFillFingerprint(params: QuickFillRequest): Promise<QuickFillResponse> {
  const { projectId, userId, text } = params;

  // Validate required parameters
  if (!projectId?.trim() || !userId?.trim() || !text?.trim()) {
    throw new Error('projectId, userId, and text are required');
  }

  const response = await fetchWithApiKey('/api/fingerprint/quick-fill', {
    method: 'POST',
    body: JSON.stringify({
      projectId: projectId.trim(),
      userId: userId.trim(),
      text: text.trim()
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorMessage;
    } catch {
      // Use default error message if response isn't valid JSON
    }
    
    throw new Error(errorMessage);
  }

  return await response.json();
}
