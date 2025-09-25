/**
 * Project Discovery Type Definitions
 * 
 * Central type definitions for the modular project discovery system.
 * Provides TypeScript interfaces for state management, API responses,
 * progress tracking, and component props.
 * 
 * Used by: All project discovery components, services, and hooks
 */

/**
 * Core discovery state tracking field completion and confidence metrics
 */
export interface DiscoveryState {
  /** Overall confidence score (0.0 - 1.0) */
  confidence: number;
  /** Field-based confidence calculation */
  field_based_confidence: number;
  /** Number of fully completed fields */
  completed_fields: number;
  /** Number of partially completed fields */
  partial_fields: number;
  /** Number of empty/incomplete fields */
  empty_fields: number;
  /** Total number of fields in the discovery schema */
  total_fields: number;
  /** Completion percentage (0.0 - 100.0) */
  completion_percentage: number;
  /** Next field to prioritize for completion */
  next_priority_field: string | null;
  /** List of missing required fields */
  missing_fields: string[];
  /** Whether discovery is complete */
  is_complete: boolean;
  /** Whether fingerprint can be generated */
  can_generate_fingerprint: boolean;
}

/**
 * Progress tracking data for field completion metrics
 */
export interface ProgressData {
  /** Number of completed fields */
  completed: number;
  /** Number of partial fields */
  partial: number;
  /** Number of empty fields */
  empty: number;
  /** Total fields count */
  total: number;
  /** Completion percentage */
  percentage: number;
}

/**
 * Chat message structure for project discovery conversations
 */
export interface MessageData {
  /** Unique message identifier */
  id: string;
  /** Message content */
  content: string;
  /** Message role (user, assistant, system) */
  role: 'user' | 'assistant' | 'system';
  /** Message timestamp */
  timestamp: string;
  /** Message status */
  status?: 'sending' | 'sent' | 'error' | 'typing';
  /** Additional message metadata */
  metadata?: {
    suggestions?: Array<{
      type: 'explore' | 'clarify' | 'action' | 'strategic';
      description: string;
      context?: string;
      confidence: number;
    }>;
    [key: string]: any;
  };
}

/**
 * API response structure for backend communication
 */
export interface ApiResponse<T = any> {
  /** Response success status */
  success: boolean;
  /** Response data payload */
  data?: T;
  /** Error message if unsuccessful */
  error?: string;
  /** Response metadata */
  metadata?: {
    confidence?: number;
    suggestions?: string[];
    [key: string]: any;
  };
}

/**
 * Options for sending messages to the discovery API
 */
export interface SendMessageOptions {
  /** Message content */
  message: string;
  /** User context information */
  user_context: {
    user_id: string;
    project_id: string;
  };
  /** Additional context data */
  context?: any;
  /** Whether to use context search */
  use_context_search?: boolean;
}

/**
 * Fingerprint state tracking completion and confidence
 */
export interface FingerprintState {
  /** Current fingerprint data */
  current_fingerprint: any;
  /** Whether fingerprint is complete */
  is_complete: boolean;
  /** Confidence score (0.0 - 1.0) */
  confidence_score: number;
  /** List of missing areas */
  missing_areas: string[];
}

/**
 * Conversation state management
 */
export interface ConversationState {
  /** Unique conversation identifier */
  conversation_id: string | null;
  /** Whether fingerprint is complete */
  fingerprint_complete: boolean;
  /** Last update timestamp */
  last_updated: string | null;
  /** Whether an error occurred */
  error_occurred: boolean;
}

/**
 * Embedding information for context search
 */
export interface EmbeddingInfo {
  /** Whether embeddings exist */
  hasEmbeddings: boolean;
  /** Number of embeddings */
  count: number;
}

/**
 * Context consumption tracking
 */
export interface ContextConsumption {
  /** Whether context has been consumed */
  hasConsumed: boolean;
  /** Whether context is currently displayed */
  isDisplayed: boolean;
}

/**
 * Project discovery chat component props
 */
export interface ProjectDiscoveryChatProps {
  /** Optional project identifier */
  projectId?: string;
  /** Optional fingerprint identifier */
  fingerprintId?: string;
}
