/**
 * Frontend Async Resource Management
 * 
 * Provides utilities for managing async operations, timeouts, and memory in the browser
 */

export interface ResourceConfig {
  timeout: number;
  retries: number;
  retryDelay: number;
  memoryThreshold: number; // MB
}

export const DEFAULT_RESOURCE_CONFIG: ResourceConfig = {
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
  memoryThreshold: 100, // 100 MB
};

export class TimeoutManager {
  /**
   * Execute a promise with timeout and optional cleanup
   */
  static async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    operationName: string = 'operation',
    cleanupCallback?: () => void | Promise<void>
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      
      // Store timeout ID for potential cleanup
      (timeoutPromise as any).timeoutId = timeoutId;
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout((timeoutPromise as any).timeoutId);
      return result;
    } catch (error) {
      clearTimeout((timeoutPromise as any).timeoutId);
      
      if (cleanupCallback) {
        try {
          await cleanupCallback();
        } catch (cleanupError) {
          console.error(`Cleanup failed for ${operationName}:`, cleanupError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Create an AbortController that automatically aborts after timeout
   */
  static createTimeoutController(timeoutMs: number): AbortController {
    const controller = new AbortController();
    
    setTimeout(() => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    }, timeoutMs);
    
    return controller;
  }
}

export class RetryManager {
  /**
   * Execute a function with exponential backoff retry
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    config: Partial<ResourceConfig> = {}
  ): Promise<T> {
    const { retries, retryDelay, timeout } = { ...DEFAULT_RESOURCE_CONFIG, ...config };
    
    let lastError: Error;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (timeout > 0) {
          return await TimeoutManager.withTimeout(
            fn(),
            timeout,
            `retry_attempt_${attempt}`
          );
        } else {
          return await fn();
        }
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === retries) {
          break; // Last attempt failed
        }
        
        // Calculate exponential backoff delay
        const delay = retryDelay * Math.pow(2, attempt);
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
}

export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private observers: Array<(stats: MemoryStats) => void> = [];
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring = false;

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  /**
   * Get current memory usage if available
   */
  getMemoryUsage(): MemoryStats | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        usedMB: memory.usedJSHeapSize / (1024 * 1024),
        totalMB: memory.totalJSHeapSize / (1024 * 1024),
        limitMB: memory.jsHeapSizeLimit / (1024 * 1024),
        utilization: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }
    return null;
  }

  /**
   * Check if memory usage is above threshold
   */
  isMemoryPressure(thresholdMB: number = DEFAULT_RESOURCE_CONFIG.memoryThreshold): boolean {
    const stats = this.getMemoryUsage();
    return stats ? stats.usedMB > thresholdMB : false;
  }

  /**
   * Start monitoring memory usage
   */
  startMonitoring(intervalMs: number = 5000): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      const stats = this.getMemoryUsage();
      if (stats) {
        this.notifyObservers(stats);
        
        // Log warnings for high memory usage
        if (stats.utilization > 80) {
          console.warn(`High memory usage: ${stats.usedMB.toFixed(1)}MB (${stats.utilization.toFixed(1)}%)`);
        }
      }
    }, intervalMs);
  }

  /**
   * Stop monitoring memory usage
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
  }

  /**
   * Subscribe to memory usage updates
   */
  subscribe(observer: (stats: MemoryStats) => void): () => void {
    this.observers.push(observer);
    
    return () => {
      this.observers = this.observers.filter(obs => obs !== observer);
    };
  }

  private notifyObservers(stats: MemoryStats): void {
    this.observers.forEach(observer => {
      try {
        observer(stats);
      } catch (error) {
        console.error('Error in memory stats observer:', error);
      }
    });
  }

  /**
   * Force garbage collection if available
   */
  forceGC(): void {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      try {
        (window as any).gc();
        console.log('Forced garbage collection');
      } catch (error) {
        console.warn('Failed to force garbage collection:', error);
      }
    }
  }
}

export interface MemoryStats {
  used: number;
  total: number;
  limit: number;
  usedMB: number;
  totalMB: number;
  limitMB: number;
  utilization: number;
}

export class ConnectionManager {
  private static instance: ConnectionManager;
  private activeConnections = new Set<AbortController>();
  private connectionTimeout = 30000; // 30 seconds

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  /**
   * Create a managed fetch request with timeout and cleanup
   */
  async fetch(
    url: string,
    options: RequestInit = {},
    timeoutMs: number = this.connectionTimeout
  ): Promise<Response> {
    const controller = TimeoutManager.createTimeoutController(timeoutMs);
    this.activeConnections.add(controller);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      return response;
    } finally {
      this.activeConnections.delete(controller);
    }
  }

  /**
   * Abort all active connections
   */
  abortAllConnections(): void {
    this.activeConnections.forEach(controller => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    });
    this.activeConnections.clear();
  }

  /**
   * Get number of active connections
   */
  getActiveConnectionCount(): number {
    return this.activeConnections.size;
  }

  /**
   * Set default timeout for connections
   */
  setDefaultTimeout(timeoutMs: number): void {
    this.connectionTimeout = timeoutMs;
  }
}

export class AsyncBatchProcessor<T, R> {
  constructor(
    private batchSize: number = 10,
    private concurrency: number = 3,
    private delayBetweenBatches: number = 100
  ) {}

  /**
   * Process items in batches with concurrency control
   */
  async processBatches(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    onProgress?: (processed: number, total: number) => void
  ): Promise<R[]> {
    const batches: T[][] = [];
    
    // Split items into batches
    for (let i = 0; i < items.length; i += this.batchSize) {
      batches.push(items.slice(i, i + this.batchSize));
    }

    const results: R[] = [];
    let processedBatches = 0;

    // Process batches with concurrency control
    const semaphore = new Semaphore(this.concurrency);

    const batchPromises = batches.map(async (batch, index) => {
      await semaphore.acquire();
      
      try {
        // Check memory pressure before processing
        const memoryMonitor = MemoryMonitor.getInstance();
        if (memoryMonitor.isMemoryPressure()) {
          console.warn(`Memory pressure detected before batch ${index}, forcing GC`);
          memoryMonitor.forceGC();
          
          // Small delay to allow GC to work
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const batchResults = await processor(batch);
        processedBatches++;
        
        if (onProgress) {
          onProgress(processedBatches * this.batchSize, items.length);
        }

        // Add delay between batches to prevent overwhelming
        if (index < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenBatches));
        }

        return batchResults;
      } finally {
        semaphore.release();
      }
    });

    const batchResults = await Promise.all(batchPromises);
    
    // Flatten results
    for (const batchResult of batchResults) {
      results.push(...batchResult);
    }

    return results;
  }
}

class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise<void>(resolve => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift()!;
      resolve();
    } else {
      this.permits++;
    }
  }
}

/**
 * Resource cleanup utilities
 */
export class ResourceCleanup {
  private static cleanupCallbacks: Array<() => void | Promise<void>> = [];

  /**
   * Register a cleanup callback
   */
  static registerCleanup(callback: () => void | Promise<void>): void {
    this.cleanupCallbacks.push(callback);
  }

  /**
   * Execute all cleanup callbacks
   */
  static async cleanup(): Promise<void> {
    const promises = this.cleanupCallbacks.map(async callback => {
      try {
        await callback();
      } catch (error) {
        console.error('Error in cleanup callback:', error);
      }
    });

    await Promise.all(promises);
    this.cleanupCallbacks = [];
  }

  /**
   * Setup cleanup on page unload
   */
  static setupPageUnloadCleanup(): void {
    const cleanup = () => {
      // Abort all active connections
      ConnectionManager.getInstance().abortAllConnections();
      
      // Stop memory monitoring
      MemoryMonitor.getInstance().stopMonitoring();
      
      // Run synchronous cleanup callbacks
      this.cleanupCallbacks.forEach(callback => {
        try {
          const result = callback();
          // If it's a promise, we can't wait for it in unload
          if (result instanceof Promise) {
            console.warn('Async cleanup callback ignored during page unload');
          }
        } catch (error) {
          console.error('Error in unload cleanup:', error);
        }
      });
    };

    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('unload', cleanup);
  }
}

// Initialize page unload cleanup
if (typeof window !== 'undefined') {
  ResourceCleanup.setupPageUnloadCleanup();
}

// Export singleton instances for convenience
export const memoryMonitor = MemoryMonitor.getInstance();
export const connectionManager = ConnectionManager.getInstance();
