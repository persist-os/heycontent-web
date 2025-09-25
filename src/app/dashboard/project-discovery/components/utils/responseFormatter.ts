/**
 * Response Formatting Utilities
 * 
 * Utility functions for formatting API responses, transforming backend data,
 * and normalizing responses in the project discovery system.
 * Centralizes response formatting logic for consistency.
 * 
 * Used by: API services, state hooks, response processing components
 */

// Type definitions for formatted responses
export interface FormattedResponse {
  success: boolean;
  data?: any;
  metadata?: any;
  suggestions?: string[];
  error?: string;
}

export interface TransformedData {
  fingerprint_state?: {
    current_fingerprint: any;
    is_complete: boolean;
    confidence_score: number;
    missing_areas: string[];
  };
  conversation_state?: {
    conversation_id: string | null;
    fingerprint_complete: boolean;
    last_updated: string | null;
    error_occurred: boolean;
  };
  metadata?: {
    field_based_confidence: number;
    completed_fields: number;
    partial_fields: number;
    empty_fields: number;
    total_fields: number;
    completion_percentage: number;
    next_priority_field: string | null;
    missing_fields: string[];
    is_complete: boolean;
    can_generate_fingerprint: boolean;
  };
}

export interface ErrorInfo {
  message: string;
  status?: number;
  type: 'authentication' | 'rate_limit' | 'server' | 'client' | 'unknown';
}

/**
 * Formats API responses from the orchestrator service
 */
export function formatApiResponse(response: any): FormattedResponse {
  return {
    success: response?.success || false,
    data: response?.data || null,
    metadata: response?.metadata || null,
    suggestions: response?.suggestions || [],
    error: response?.error || null
  };
}

/**
 * Transforms backend data into standardized format
 */
export function transformBackendData(data: any): TransformedData {
  return {
    fingerprint_state: data?.fingerprint_state ? {
      current_fingerprint: data.fingerprint_state.current_fingerprint,
      is_complete: data.fingerprint_state.is_complete || false,
      confidence_score: data.fingerprint_state.confidence_score || 0.0,
      missing_areas: data.fingerprint_state.missing_areas || []
    } : undefined,
    conversation_state: data?.conversation_state ? {
      conversation_id: data.conversation_state.conversation_id,
      fingerprint_complete: data.conversation_state.fingerprint_complete || false,
      last_updated: data.conversation_state.last_updated,
      error_occurred: data.conversation_state.error_occurred || false
    } : undefined,
    metadata: data?.metadata ? {
      field_based_confidence: data.metadata.field_based_confidence || 0.0,
      completed_fields: data.metadata.completed_fields || 0,
      partial_fields: data.metadata.partial_fields || 0,
      empty_fields: data.metadata.empty_fields || 0,
      total_fields: data.metadata.total_fields || 132,
      completion_percentage: data.metadata.completion_percentage || 0.0,
      next_priority_field: data.metadata.next_priority_field || null,
      missing_fields: data.metadata.missing_fields || [],
      is_complete: data.metadata.is_complete || false,
      can_generate_fingerprint: data.metadata.can_generate_fingerprint || true
    } : undefined
  };
}

/**
 * Normalizes suggestions array to ensure consistent string format
 */
export function normalizeSuggestions(suggestions: any[]): string[] {
  if (!Array.isArray(suggestions)) return [];
  
  return suggestions
    .filter(suggestion => suggestion && typeof suggestion === 'string')
    .map(suggestion => suggestion.trim())
    .filter(suggestion => suggestion.length > 0);
}

/**
 * Handles and categorizes errors with user-friendly messages
 */
export function handleErrors(error: any): ErrorInfo {
  const status = error?.status || error?.response?.status;
  
  if (status === 401) {
    return {
      message: 'Authentication failed. Please refresh the page and try again.',
      status: 401,
      type: 'authentication'
    };
  }
  
  if (status === 429) {
    return {
      message: 'Too many requests. Please wait a moment and try again.',
      status: 429,
      type: 'rate_limit'
    };
  }
  
  if (status >= 500) {
    return {
      message: 'Server error. Please try again in a moment.',
      status,
      type: 'server'
    };
  }
  
  if (status >= 400) {
    return {
      message: error?.message || 'Request failed. Please check your input and try again.',
      status,
      type: 'client'
    };
  }
  
  return {
    message: error?.message || 'An unexpected error occurred. Please try again.',
    type: 'unknown'
  };
}
