/**
 * Discovery Service - Clean API for project fingerprint discovery
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
