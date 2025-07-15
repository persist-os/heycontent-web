import { PlatformContentData } from '@/types/content';

// Error types for infinite scroll
export enum InfiniteScrollErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Error details
export interface InfiniteScrollError {
  type: InfiniteScrollErrorType;
  message: string;
  platform: keyof PlatformContentData;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  isRetryable: boolean;
  cause?: Error;
  context?: Record<string, any>;
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // Base delay in milliseconds
  maxDelay: number; // Maximum delay in milliseconds
  backoffFactor: number; // Exponential backoff factor
  jitter: boolean; // Add random jitter to delays
  retryableErrors: InfiniteScrollErrorType[];
}

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  jitter: true,
  retryableErrors: [
    InfiniteScrollErrorType.NETWORK_ERROR,
    InfiniteScrollErrorType.TIMEOUT,
    InfiniteScrollErrorType.SERVER_ERROR,
  ],
};

// Circuit breaker states
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

// Circuit breaker configuration
export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  resetTimeout: number; // Time to wait before attempting reset
  successThreshold: number; // Number of successes to close from half-open
  monitoringPeriod: number; // Time window for monitoring failures
}

// Default circuit breaker configuration
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  successThreshold: 2,
  monitoringPeriod: 60000, // 1 minute
};

// Circuit breaker class
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private failures: number[] = []; // Timestamps of failures
  private config: CircuitBreakerConfig;
  private platform: keyof PlatformContentData;

  constructor(platform: keyof PlatformContentData, config: Partial<CircuitBreakerConfig> = {}) {
    this.platform = platform;
    this.config = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...config };
  }

  // Execute a function with circuit breaker protection
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new Error(`Circuit breaker is OPEN for ${this.platform}`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  // Check if circuit breaker allows execution
  isExecutionAllowed(): boolean {
    return this.state === CircuitBreakerState.CLOSED || this.state === CircuitBreakerState.HALF_OPEN;
  }

  // Get circuit breaker state
  getState(): CircuitBreakerState {
    return this.state;
  }

  // Get failure statistics
  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      recentFailures: this.failures.length,
    };
  }

  // Reset circuit breaker
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.failures = [];
  }

  // Handle successful execution
  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitBreakerState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  // Handle failed execution
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.failures.push(this.lastFailureTime);
    
    // Clean up old failures outside monitoring period
    const cutoffTime = this.lastFailureTime - this.config.monitoringPeriod;
    this.failures = this.failures.filter(time => time > cutoffTime);
    
    if (this.failures.length >= this.config.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
    }
  }

  // Check if we should attempt to reset the circuit breaker
  private shouldAttemptReset(): boolean {
    return Date.now() - this.lastFailureTime >= this.config.resetTimeout;
  }
}

// Error handler class
export class InfiniteScrollErrorHandler {
  private retryConfig: RetryConfig;
  private circuitBreakers: Map<keyof PlatformContentData, CircuitBreaker> = new Map();
  private errorHistory: InfiniteScrollError[] = [];
  private maxHistorySize: number = 100;

  constructor(retryConfig: Partial<RetryConfig> = {}) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  // Handle error with retry logic
  async handleError<T>(
    error: Error,
    platform: keyof PlatformContentData,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const circuitBreaker = this.getCircuitBreaker(platform);
    const infiniteScrollError = this.createInfiniteScrollError(error, platform, 0, context);
    
    // Check if circuit breaker allows execution
    if (!circuitBreaker.isExecutionAllowed()) {
      throw new Error(`Circuit breaker is OPEN for ${platform}`);
    }

    return this.retryWithBackoff(infiniteScrollError, fn, circuitBreaker);
  }

  // Retry with exponential backoff
  private async retryWithBackoff<T>(
    error: InfiniteScrollError,
    fn: () => Promise<T>,
    circuitBreaker: CircuitBreaker
  ): Promise<T> {
    let lastError = error;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.calculateDelay(attempt);
          await this.sleep(delay);
        }
        
        const result = await circuitBreaker.execute(fn);
        
        // Success - log recovery if this was a retry
        if (attempt > 0) {
          console.log(`[ERROR_HANDLER] Recovered from error on ${error.platform} after ${attempt} retries`);
        }
        
        return result;
      } catch (err) {
        lastError = this.createInfiniteScrollError(
          err as Error,
          error.platform,
          attempt,
          error.context
        );
        
        // Check if error is retryable
        if (!this.isRetryableError(lastError) || attempt === this.retryConfig.maxRetries) {
          break;
        }
        
        console.warn(`[ERROR_HANDLER] Attempt ${attempt + 1} failed for ${error.platform}:`, err);
      }
    }
    
    // Record final error
    this.recordError(lastError);
    throw lastError;
  }

  // Create infinite scroll error from regular error
  private createInfiniteScrollError(
    error: Error,
    platform: keyof PlatformContentData,
    retryCount: number,
    context?: Record<string, any>
  ): InfiniteScrollError {
    const errorType = this.categorizeError(error);
    
    return {
      type: errorType,
      message: error.message,
      platform,
      timestamp: Date.now(),
      retryCount,
      maxRetries: this.retryConfig.maxRetries,
      isRetryable: this.retryConfig.retryableErrors.includes(errorType),
      cause: error,
      context,
    };
  }

  // Categorize error by type
  private categorizeError(error: Error): InfiniteScrollErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return InfiniteScrollErrorType.NETWORK_ERROR;
    }
    
    if (message.includes('timeout')) {
      return InfiniteScrollErrorType.TIMEOUT;
    }
    
    if (message.includes('rate limit') || message.includes('429')) {
      return InfiniteScrollErrorType.RATE_LIMIT;
    }
    
    if (message.includes('500') || message.includes('502') || message.includes('503')) {
      return InfiniteScrollErrorType.SERVER_ERROR;
    }
    
    if (message.includes('invalid') || message.includes('malformed')) {
      return InfiniteScrollErrorType.INVALID_RESPONSE;
    }
    
    return InfiniteScrollErrorType.UNKNOWN_ERROR;
  }

  // Check if error is retryable
  private isRetryableError(error: InfiniteScrollError): boolean {
    return error.isRetryable;
  }

  // Calculate delay with exponential backoff and jitter
  private calculateDelay(attempt: number): number {
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt - 1),
      this.retryConfig.maxDelay
    );
    
    if (this.retryConfig.jitter) {
      // Add random jitter (±25% of delay)
      const jitter = delay * 0.25 * (Math.random() - 0.5);
      return Math.max(0, delay + jitter);
    }
    
    return delay;
  }

  // Sleep for specified milliseconds
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get or create circuit breaker for platform
  private getCircuitBreaker(platform: keyof PlatformContentData): CircuitBreaker {
    if (!this.circuitBreakers.has(platform)) {
      this.circuitBreakers.set(platform, new CircuitBreaker(platform));
    }
    return this.circuitBreakers.get(platform)!;
  }

  // Record error in history
  private recordError(error: InfiniteScrollError): void {
    this.errorHistory.push(error);
    
    // Keep history size under limit
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
    }
  }

  // Get error history
  getErrorHistory(platform?: keyof PlatformContentData): InfiniteScrollError[] {
    if (platform) {
      return this.errorHistory.filter(error => error.platform === platform);
    }
    return [...this.errorHistory];
  }

  // Get circuit breaker stats
  getCircuitBreakerStats(platform: keyof PlatformContentData) {
    const circuitBreaker = this.circuitBreakers.get(platform);
    return circuitBreaker ? circuitBreaker.getStats() : null;
  }

  // Reset circuit breaker
  resetCircuitBreaker(platform: keyof PlatformContentData): void {
    const circuitBreaker = this.circuitBreakers.get(platform);
    if (circuitBreaker) {
      circuitBreaker.reset();
    }
  }

  // Get error statistics
  getErrorStats(platform?: keyof PlatformContentData) {
    const errors = this.getErrorHistory(platform);
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    
    const recentErrors = errors.filter(error => error.timestamp > oneHourAgo);
    
    const errorsByType = errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<InfiniteScrollErrorType, number>);
    
    return {
      totalErrors: errors.length,
      recentErrors: recentErrors.length,
      errorsByType,
      lastError: errors[errors.length - 1],
      averageRetryCount: errors.reduce((acc, error) => acc + error.retryCount, 0) / errors.length || 0,
    };
  }

  // Clear error history
  clearErrorHistory(): void {
    this.errorHistory = [];
  }
}

// Global error handler instance
export const infiniteScrollErrorHandler = new InfiniteScrollErrorHandler();

// Error boundary component props
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  platform?: keyof PlatformContentData;
}

// Error recovery utilities
export const ErrorRecoveryUtils = {
  // Create a safe wrapper for async functions
  createSafeAsyncFunction: <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    platform: keyof PlatformContentData,
    context?: Record<string, any>
  ): T => {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args);
      } catch (error) {
        return infiniteScrollErrorHandler.handleError(
          error as Error,
          platform,
          () => fn(...args),
          context
        );
      }
    }) as T;
  },

  // Create a fallback function for failed operations
  createFallbackFunction: <T>(
    primaryFn: () => Promise<T>,
    fallbackFn: () => Promise<T>,
    platform: keyof PlatformContentData
  ): (() => Promise<T>) => {
    return async () => {
      try {
        return await primaryFn();
      } catch (error) {
        console.warn(`[ERROR_RECOVERY] Primary function failed for ${platform}, using fallback`);
        return await fallbackFn();
      }
    };
  },

  // Create a graceful degradation function
  createGracefulDegradation: <T>(
    fn: () => Promise<T>,
    defaultValue: T,
    platform: keyof PlatformContentData
  ): (() => Promise<T>) => {
    return async () => {
      try {
        return await fn();
      } catch (error) {
        console.warn(`[ERROR_RECOVERY] Function failed for ${platform}, returning default value`);
        return defaultValue;
      }
    };
  },

  // Debounce error-prone functions
  debounceErrorProne: <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    delay: number,
    platform: keyof PlatformContentData
  ): T => {
    let timeoutId: NodeJS.Timeout;
    let lastCallTime = 0;
    
    return (async (...args: Parameters<T>) => {
      const now = Date.now();
      
      // Clear existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // If called too frequently, wait before executing
      if (now - lastCallTime < delay) {
        return new Promise((resolve, reject) => {
          timeoutId = setTimeout(async () => {
            try {
              lastCallTime = Date.now();
              const result = await fn(...args);
              resolve(result);
            } catch (error) {
              reject(error);
            }
          }, delay - (now - lastCallTime));
        });
      }
      
      lastCallTime = now;
      return await fn(...args);
    }) as T;
  },

  // Rate limit function calls
  rateLimitFunction: <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    maxCalls: number,
    timeWindow: number,
    platform: keyof PlatformContentData
  ): T => {
    const callHistory: number[] = [];
    
    return (async (...args: Parameters<T>) => {
      const now = Date.now();
      
      // Remove old calls outside the time window
      const cutoffTime = now - timeWindow;
      while (callHistory.length > 0 && callHistory[0] < cutoffTime) {
        callHistory.shift();
      }
      
      // Check if we've exceeded the rate limit
      if (callHistory.length >= maxCalls) {
        throw new Error(`Rate limit exceeded for ${platform}: ${maxCalls} calls per ${timeWindow}ms`);
      }
      
      // Record this call
      callHistory.push(now);
      
      return await fn(...args);
    }) as T;
  },
};

// Hook for error handling
export function useInfiniteScrollErrorHandler(platform: keyof PlatformContentData) {
  const handleError = async <T>(
    error: Error,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> => {
    return infiniteScrollErrorHandler.handleError(error, platform, fn, context);
  };

  const getErrorStats = () => {
    return infiniteScrollErrorHandler.getErrorStats(platform);
  };

  const getCircuitBreakerStats = () => {
    return infiniteScrollErrorHandler.getCircuitBreakerStats(platform);
  };

  const resetCircuitBreaker = () => {
    infiniteScrollErrorHandler.resetCircuitBreaker(platform);
  };

  const createSafeFunction = <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context?: Record<string, any>
  ): T => {
    return ErrorRecoveryUtils.createSafeAsyncFunction(fn, platform, context);
  };

  return {
    handleError,
    getErrorStats,
    getCircuitBreakerStats,
    resetCircuitBreaker,
    createSafeFunction,
  };
} 