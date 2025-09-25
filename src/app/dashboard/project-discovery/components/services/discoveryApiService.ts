/**
 * Project Discovery API Service
 * 
 * Centralized API service for all project discovery operations.
 * Handles communication with the backend orchestrator, fingerprint
 * generation, and conversation status management.
 * 
 * Used by: Main container component, state hooks, action handlers
 */

import { AuthenticationError } from '@/app/lib/errors';

// Type definitions for API requests and responses
export interface SendMessageOptions {
  projectName?: string;
  projectDescription?: string;
  conversationHistory?: Array<{
    role: string;
    content: string;
    timestamp: number;
  }>;
  forceFingerprintGeneration?: boolean;
  isFirstMessage?: boolean;
  sessionId?: string | null;
  contentContext?: Record<string, any> | null;
}

export interface DiscoveryResponse {
  success: boolean;
  response?: string;
  session_id?: string;
  confidence?: number;
  field_based_confidence?: number;
  completed_fields?: number;
  total_fields?: number;
  suggestions?: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  fingerprint_state?: {
    is_complete: boolean;
    confidence_score: number;
    field_based_confidence: number;
    current_fingerprint?: any;
    next_priority_field?: string;
    missing_fields?: string[];
  };
  conversation_state?: any;
  metadata?: {
    confidence: number;
    field_based_confidence: number;
    completed_fields: number;
    partial_fields: number;
    empty_fields: number;
    total_fields: number;
    completion_percentage: number;
    next_priority_field?: string;
    missing_fields: string[];
    is_complete: boolean;
    can_generate_fingerprint: boolean;
  };
}

export interface FingerprintResponse {
  success: boolean;
  fingerprint_state?: {
    is_complete: boolean;
    confidence_score: number;
    field_based_confidence: number;
    current_fingerprint?: any;
    next_priority_field?: string;
    missing_fields?: string[];
  };
  conversation_state?: any;
  suggestions?: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export interface ConversationStatus {
  projectId: string;
  isActive: boolean;
  lastMessage?: string;
  messageCount: number;
  fingerprintComplete: boolean;
  confidenceScore: number;
}

/**
 * Centralized API service for project discovery operations
 */
export class DiscoveryApiService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = '/api/chat/project-discovery';
  }

  /**
   * Set authentication token for API requests
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Get authentication token from Firebase user
   */
  private async getAuthToken(): Promise<string> {
    if (this.authToken) {
      return this.authToken;
    }

    // Import Firebase auth dynamically to avoid circular dependencies
    const { getFirebaseAuth } = await import('@/app/lib/firebase');
    const { getValidToken } = await import('@/app/lib/firebase-token-manager');
    
    const auth = getFirebaseAuth();
    if (!auth.currentUser) {
      throw new AuthenticationError('Authentication required');
    }
    
    return await getValidToken(auth.currentUser);
  }

  /**
   * Send a message to the project discovery orchestrator
   * 
   * @param message - User message content
   * @param projectId - Project identifier
   * @param options - Additional options for the request
   * @returns Promise resolving to discovery response
   */
  async sendMessage(
    message: string, 
    projectId: string, 
    options: SendMessageOptions = {}
  ): Promise<DiscoveryResponse> {
    try {
      console.log('[DISCOVERY_API] Sending message:', {
        messagePreview: message.substring(0, 50) + '...',
        projectId,
        hasOptions: Object.keys(options).length > 0
      });

      const idToken = await this.getAuthToken();
      const userId = await this.getCurrentUserId();
      
      // CRITICAL: Ensure user_id is never null/undefined
      if (!userId) {
        throw new AuthenticationError('User authentication required. Please refresh the page and try again.');
      }
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          user_id: userId,
          project_id: projectId,
          query: message,
          is_first_message: options.isFirstMessage ?? true,
          session_id: options.sessionId ?? null,
          content_context: options.contentContext || null,
          project_name: options.projectName || 'Untitled Project',
          project_description: options.projectDescription || null,
          conversation_history: options.conversationHistory || []
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        let errJson: any = null;
        try { errJson = JSON.parse(errText) } catch {}
        
        console.error('[DISCOVERY_API] Response error:', {
          status: response.status,
          errorJson: errJson,
          errorText: errText
        });
        
        // Provide specific error messages based on status code
        let errorMessage = errJson?.error || errJson?.detail || `Failed to process message (${response.status})`;
        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please refresh the page and try again.';
        } else if (response.status === 429) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again in a moment.';
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('[DISCOVERY_API] Message sent successfully:', {
        success: result?.success,
        confidence: result?.confidence,
        suggestionsCount: result?.suggestions?.length || 0
      });

      return result;
    } catch (error) {
      console.error('[DISCOVERY_API] Error sending message:', error);
      throw error;
    }
  }

  /**
   * Generate fingerprint manually for a project
   * 
   * @param projectId - Project identifier
   * @param force - Whether to force generation even if incomplete
   * @returns Promise resolving to fingerprint response
   */
  async generateFingerprint(
    projectId: string, 
    force: boolean = false
  ): Promise<FingerprintResponse> {
    try {
      console.log('[DISCOVERY_API] Generating fingerprint:', { projectId, force });

      const idToken = await this.getAuthToken();
      const userId = await this.getCurrentUserId();
      
      // CRITICAL: Ensure user_id is never null/undefined
      if (!userId) {
        throw new AuthenticationError('User authentication required. Please refresh the page and try again.');
      }
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          user_id: userId,
          query: 'Generate complete fingerprint',
          is_first_message: false,
          session_id: options?.sessionId ?? null,
          content_context: null,
          project_name: 'Untitled Project',
          project_description: null
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate fingerprint (${response.status})`);
      }
      
      const result = await response.json();
      console.log('[DISCOVERY_API] Fingerprint generated:', {
        success: result.success,
        isComplete: result.fingerprint_state?.is_complete
      });

      return result;
    } catch (error) {
      console.error('[DISCOVERY_API] Error generating fingerprint:', error);
      throw error;
    }
  }

  /**
   * Get conversation status for a project
   * 
   * @param projectId - Project identifier
   * @returns Promise resolving to conversation status
   */
  async getConversationStatus(projectId: string): Promise<ConversationStatus> {
    try {
      console.log('[DISCOVERY_API] Getting conversation status:', { projectId });

      // For now, return a basic status structure
      // This could be enhanced to call a dedicated status endpoint
      return {
        projectId,
        isActive: true,
        messageCount: 0,
        fingerprintComplete: false,
        confidenceScore: 0.0
      };
    } catch (error) {
      console.error('[DISCOVERY_API] Error getting conversation status:', error);
      throw error;
    }
  }

  /**
   * Get current user ID from Firebase/cookies
   */
  private async getCurrentUserId(): Promise<string> {
    const { getCurrentUserId } = await import('@/app/lib/api-helpers');
    return await getCurrentUserId();
  }
}

// Export singleton instance
export const discoveryApiService = new DiscoveryApiService();
