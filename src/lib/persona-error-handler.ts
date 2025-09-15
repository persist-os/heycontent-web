/**
 * Enhanced error handling system for persona crystallization
 */

export interface PersonaError {
  id: string;
  type: 'extraction' | 'crystallization' | 'storage' | 'network' | 'validation';
  message: string;
  details?: string;
  timestamp: number;
  userId?: string;
  conversationId?: string;
  retryable: boolean;
  retryCount?: number;
}

export interface ErrorContext {
  userId?: string;
  conversationId?: string;
  operation: string;
  duration?: number;
  metadata?: Record<string, any>;
}

class PersonaErrorHandler {
  private errors: PersonaError[] = [];
  private maxErrors = 50; // Keep only the last 50 errors
  private retryAttempts: Map<string, number> = new Map();

  /**
   * Log an error with proper categorization and context
   */
  logError(
    type: PersonaError['type'],
    message: string,
    context: ErrorContext,
    originalError?: Error
  ): PersonaError {
    const errorId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const personaError: PersonaError = {
      id: errorId,
      type,
      message,
      details: originalError?.stack || originalError?.message,
      timestamp: Date.now(),
      userId: context.userId,
      conversationId: context.conversationId,
      retryable: this.isRetryable(type, originalError),
      retryCount: this.retryAttempts.get(`${type}_${context.operation}`) || 0
    };

    // Add to errors list
    this.errors.unshift(personaError);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console with proper formatting
    this.logToConsole(personaError, context, originalError);

    // Track retry attempts
    if (personaError.retryable) {
      const retryKey = `${type}_${context.operation}`;
      this.retryAttempts.set(retryKey, (this.retryAttempts.get(retryKey) || 0) + 1);
    }

    return personaError;
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(error: PersonaError): string {
    switch (error.type) {
      case 'extraction':
        return 'Failed to extract insights from conversation. This may be due to a temporary issue with our analysis service.';
      case 'crystallization':
        return 'Failed to crystallize insights. Your data is safe, but the analysis could not be completed.';
      case 'storage':
        return 'Failed to save insights. Please try again in a moment.';
      case 'network':
        return 'Connection issue detected. Please check your internet connection and try again.';
      case 'validation':
        return 'Invalid data detected. Please refresh the page and try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Get retry suggestion for user
   */
  getRetryMessage(error: PersonaError): string | null {
    if (!error.retryable) return null;
    
    const retryCount = error.retryCount || 0;
    if (retryCount >= 3) {
      return 'Multiple retry attempts failed. Please try again later or contact support.';
    }
    
    const waitTime = Math.min(5 * Math.pow(2, retryCount), 60); // Exponential backoff, max 1 minute
    return `You can retry in ${waitTime} seconds.`;
  }

  /**
   * Check if an error type is retryable
   */
  private isRetryable(type: PersonaError['type'], error?: Error): boolean {
    switch (type) {
      case 'network':
        return true;
      case 'extraction':
      case 'crystallization':
        // Retry if it's a network/timeout error, but not if it's a validation error
        return !error?.message.toLowerCase().includes('validation');
      case 'storage':
        return true;
      case 'validation':
        return false;
      default:
        return false;
    }
  }

  /**
   * Log error to console with proper formatting
   */
  private logToConsole(error: PersonaError, context: ErrorContext, originalError?: Error) {
    const logLevel = error.retryable ? 'warn' : 'error';
    const emoji = error.retryable ? '⚠️' : '❌';
    
    console[logLevel](`${emoji} [PERSONA ERROR] ${error.type.toUpperCase()}: ${error.message}`, {
      errorId: error.id,
      type: error.type,
      retryable: error.retryable,
      retryCount: error.retryCount,
      context: {
        operation: context.operation,
        userId: context.userId,
        conversationId: context.conversationId,
        duration: context.duration,
        ...context.metadata
      },
      originalError: originalError?.message,
      timestamp: new Date(error.timestamp).toISOString()
    });
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit = 10): PersonaError[] {
    return this.errors.slice(0, limit);
  }

  /**
   * Clear errors (useful for cleanup)
   */
  clearErrors(): void {
    this.errors = [];
    this.retryAttempts.clear();
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byType: Record<PersonaError['type'], number>;
    retryableCount: number;
  } {
    const stats = {
      total: this.errors.length,
      byType: {} as Record<PersonaError['type'], number>,
      retryableCount: 0
    };

    this.errors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      if (error.retryable) stats.retryableCount++;
    });

    return stats;
  }
}

// Export singleton instance
export const personaErrorHandler = new PersonaErrorHandler();

/**
 * Helper function to categorize errors based on their characteristics
 */
export function categorizeError(error: Error, operation: string): PersonaError['type'] {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return 'network';
  }
  
  if (message.includes('validation') || message.includes('invalid')) {
    return 'validation';
  }
  
  if (operation.includes('extract') || operation.includes('trace')) {
    return 'extraction';
  }
  
  if (operation.includes('crystalliz') || operation.includes('insight')) {
    return 'crystallization';
  }
  
  if (operation.includes('store') || operation.includes('save')) {
    return 'storage';
  }
  
  return 'network'; // Default fallback
}
