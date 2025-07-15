/**
 * Performance monitoring and optimization utilities
 */

/**
 * Performance timer for tracking expensive operations
 */
export class PerformanceTimer {
  private startTime: number;
  private operationName: string;

  constructor(operationName: string) {
    this.operationName = operationName;
    this.startTime = performance.now();
    console.time(operationName); // Add console.time for dev tools integration
  }

  end(): number {
    const duration = performance.now() - this.startTime;
    console.timeEnd(this.operationName); // End console.time
    console.log(`${this.operationName} took ${duration.toFixed(2)}ms`);
    return duration;
  }

  endWithThreshold(threshold: number): boolean {
    const duration = this.end();
    if (duration > threshold) {
      console.warn(`${this.operationName} exceeded threshold of ${threshold}ms (${duration.toFixed(2)}ms)`);
      return true;
    }
    return false;
  }
}

/**
 * Check if dataset is considered large for performance optimization
 */
export function isLargeDataset(dataLength: number, threshold: number = 1000): boolean {
  return dataLength > threshold;
}

/**
 * Process data in chunks to prevent blocking the main thread
 */
export function processInChunks<T, R>(
  data: T[],
  processor: (item: T, index: number) => R,
  chunkSize: number = 100,
  onProgress?: (processed: number, total: number) => void
): Promise<R[]> {
  return new Promise((resolve) => {
    const results: R[] = [];
    let index = 0;

    function processChunk() {
      const chunk = data.slice(index, index + chunkSize);
      
      for (let i = 0; i < chunk.length; i++) {
        results.push(processor(chunk[i], index + i));
      }
      
      index += chunkSize;
      
      if (onProgress) {
        onProgress(Math.min(index, data.length), data.length);
      }
      
      if (index < data.length) {
        // Use requestIdleCallback if available, otherwise setTimeout
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(processChunk);
        } else {
          setTimeout(processChunk, 0);
        }
      } else {
        resolve(results);
      }
    }

    processChunk();
  });
}

/**
 * Debounce function to prevent excessive calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function to limit call frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Memoize expensive operations with cache size limit
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  cacheSize: number = 100
): T {
  const cache = new Map<string, any>();
  const keys: string[] = [];
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    
    // Implement LRU cache
    if (keys.length >= cacheSize) {
      const oldestKey = keys.shift();
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }
    
    keys.push(key);
    cache.set(key, result);
    
    return result;
  }) as T;
} 