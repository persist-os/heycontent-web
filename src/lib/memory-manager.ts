import { UnifiedContent } from '@/store/content-store';

// Memory management configuration
export interface MemoryConfig {
  maxItems: number;
  purgeThreshold: number; // Percentage of maxItems to trigger purge
  retentionCount: number; // Items to keep when purging
  gcInterval: number; // Garbage collection interval in ms
  trackMemoryUsage: boolean;
  enableLazyLoading: boolean;
}

// Default memory configuration
export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  maxItems: 500,
  purgeThreshold: 0.9, // Purge when 90% full
  retentionCount: 300, // Keep 300 items when purging
  gcInterval: 30000, // GC every 30 seconds
  trackMemoryUsage: true,
  enableLazyLoading: true,
};

// Memory usage statistics
export interface MemoryStats {
  totalItems: number;
  totalMemoryMB: number;
  itemsInMemory: number;
  itemsPurged: number;
  lastGCTime: number;
  gcCount: number;
  averageItemSize: number;
  memoryEfficiency: number; // Percentage of memory actually used
}

// Memory manager class
export class MemoryManager<T extends UnifiedContent> {
  private config: MemoryConfig;
  private items: Map<string, T> = new Map();
  private accessOrder: string[] = [];
  private stats: MemoryStats = {
    totalItems: 0,
    totalMemoryMB: 0,
    itemsInMemory: 0,
    itemsPurged: 0,
    lastGCTime: Date.now(),
    gcCount: 0,
    averageItemSize: 0,
    memoryEfficiency: 0,
  };
  private gcTimer: NodeJS.Timeout | null = null;
  private observers: Array<(stats: MemoryStats) => void> = [];

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = { ...DEFAULT_MEMORY_CONFIG, ...config };
    this.startGarbageCollection();
  }

  // Add items to memory with sliding window management
  addItems(newItems: T[]): T[] {
    const startTime = performance.now();
    
    // Add items to internal storage
    newItems.forEach(item => {
      this.items.set(item.id, item);
      this.updateAccessOrder(item.id);
    });

    // Check if we need to purge old items
    if (this.items.size > this.config.maxItems * this.config.purgeThreshold) {
      this.purgeOldItems();
    }

    // Update statistics
    this.updateStats();
    
    // Return current items in access order
    const result = this.getItemsInOrder();
    
    if (process.env.NODE_ENV === 'development') {
      const processingTime = performance.now() - startTime;
      console.log(`[MEMORY] Added ${newItems.length} items in ${Math.round(processingTime)}ms`);
    }
    
    return result;
  }

  // Get items in access order (most recently accessed first)
  getItemsInOrder(): T[] {
    return this.accessOrder
      .map(id => this.items.get(id))
      .filter(Boolean) as T[];
  }

  // Get items with optional pagination
  getItems(offset: number = 0, limit?: number): T[] {
    const allItems = this.getItemsInOrder();
    if (limit) {
      return allItems.slice(offset, offset + limit);
    }
    return allItems.slice(offset);
  }

  // Access an item (updates access order)
  accessItem(id: string): T | undefined {
    const item = this.items.get(id);
    if (item) {
      this.updateAccessOrder(id);
    }
    return item;
  }

  // Remove items by ID
  removeItems(ids: string[]): void {
    ids.forEach(id => {
      this.items.delete(id);
      this.accessOrder = this.accessOrder.filter(accessId => accessId !== id);
    });
    this.updateStats();
  }

  // Clear all items
  clear(): void {
    this.items.clear();
    this.accessOrder = [];
    this.updateStats();
  }

  // Purge old items to stay within memory limits
  private purgeOldItems(): void {
    const itemsToPurge = this.items.size - this.config.retentionCount;
    if (itemsToPurge <= 0) return;

    const startTime = performance.now();
    
    // Remove least recently accessed items
    const itemsToRemove = this.accessOrder.slice(-itemsToPurge);
    itemsToRemove.forEach(id => {
      this.items.delete(id);
    });
    
    // Update access order
    this.accessOrder = this.accessOrder.slice(0, -itemsToPurge);
    
    // Update statistics
    this.stats.itemsPurged += itemsToPurge;
    this.updateStats();
    
    if (process.env.NODE_ENV === 'development') {
      const processingTime = performance.now() - startTime;
      console.log(`[MEMORY] Purged ${itemsToPurge} items in ${Math.round(processingTime)}ms`);
    }
  }

  // Update access order for an item
  private updateAccessOrder(id: string): void {
    // Remove from current position
    this.accessOrder = this.accessOrder.filter(accessId => accessId !== id);
    // Add to front (most recently accessed)
    this.accessOrder.unshift(id);
  }

  // Update memory statistics
  private updateStats(): void {
    const itemsInMemory = this.items.size;
    const totalMemoryMB = this.estimateMemoryUsage();
    
    this.stats = {
      ...this.stats,
      totalItems: this.stats.totalItems,
      totalMemoryMB,
      itemsInMemory,
      averageItemSize: itemsInMemory > 0 ? totalMemoryMB / itemsInMemory : 0,
      memoryEfficiency: this.config.maxItems > 0 ? (itemsInMemory / this.config.maxItems) * 100 : 0,
    };
    
    this.notifyObservers();
  }

  // Estimate memory usage in MB
  private estimateMemoryUsage(): number {
    if (!this.config.trackMemoryUsage) return 0;
    
    let totalSize = 0;
    
    // Sample a few items to estimate average size
    const sampleSize = Math.min(10, this.items.size);
    let sampledItems = 0;
    
    for (const [id, item] of this.items) {
      if (sampledItems >= sampleSize) break;
      totalSize += this.estimateItemSize(item);
      sampledItems++;
    }
    
    if (sampledItems === 0) return 0;
    
    const averageSize = totalSize / sampledItems;
    const totalEstimatedSize = averageSize * this.items.size;
    
    return totalEstimatedSize / (1024 * 1024); // Convert to MB
  }

  // Estimate size of a single item
  private estimateItemSize(item: T): number {
    try {
      const json = JSON.stringify(item);
      return json.length * 2; // Rough estimate for UTF-16 encoding
    } catch {
      return 1024; // Default estimate if serialization fails
    }
  }

  // Start garbage collection timer
  private startGarbageCollection(): void {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
    }
    
    this.gcTimer = setInterval(() => {
      this.runGarbageCollection();
    }, this.config.gcInterval);
  }

  // Run garbage collection
  private runGarbageCollection(): void {
    const startTime = performance.now();
    
    // Check for memory pressure
    if (this.items.size > this.config.maxItems * this.config.purgeThreshold) {
      this.purgeOldItems();
    }
    
    // Update statistics
    this.stats.lastGCTime = Date.now();
    this.stats.gcCount++;
    this.updateStats();
    
    if (process.env.NODE_ENV === 'development') {
      const processingTime = performance.now() - startTime;
      console.log(`[MEMORY] GC completed in ${Math.round(processingTime)}ms`);
    }
  }

  // Stop garbage collection
  stopGarbageCollection(): void {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
      this.gcTimer = null;
    }
  }

  // Subscribe to memory stats updates
  subscribe(observer: (stats: MemoryStats) => void): () => void {
    this.observers.push(observer);
    
    // Return unsubscribe function
    return () => {
      this.observers = this.observers.filter(obs => obs !== observer);
    };
  }

  // Notify all observers
  private notifyObservers(): void {
    this.observers.forEach(observer => {
      try {
        observer(this.stats);
      } catch (error) {
        console.error('Error in memory stats observer:', error);
      }
    });
  }

  // Get current memory statistics
  getStats(): MemoryStats {
    return { ...this.stats };
  }

  // Get memory configuration
  getConfig(): MemoryConfig {
    return { ...this.config };
  }

  // Update memory configuration
  updateConfig(newConfig: Partial<MemoryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart GC with new interval if changed
    if (newConfig.gcInterval !== undefined) {
      this.startGarbageCollection();
    }
    
    // Trigger purge if new max items is smaller
    if (newConfig.maxItems !== undefined && this.items.size > newConfig.maxItems) {
      this.purgeOldItems();
    }
  }

  // Destroy memory manager
  destroy(): void {
    this.stopGarbageCollection();
    this.clear();
    this.observers = [];
  }
}

// Sliding window manager for infinite scroll
export class SlidingWindowManager<T extends UnifiedContent> {
  private window: T[] = [];
  private windowStart: number = 0;
  private maxWindowSize: number;
  private totalItems: number = 0;

  constructor(maxWindowSize: number = 500) {
    this.maxWindowSize = maxWindowSize;
  }

  // Add items to the sliding window
  addItems(newItems: T[]): T[] {
    // Add new items to the end of the window
    this.window = [...this.window, ...newItems];
    this.totalItems += newItems.length;

    // If window exceeds max size, remove items from the beginning
    if (this.window.length > this.maxWindowSize) {
      const itemsToRemove = this.window.length - this.maxWindowSize;
      this.window = this.window.slice(itemsToRemove);
      this.windowStart += itemsToRemove;
    }

    return this.window;
  }

  // Get current window
  getWindow(): T[] {
    return this.window;
  }

  // Get window metadata
  getWindowInfo() {
    return {
      windowStart: this.windowStart,
      windowEnd: this.windowStart + this.window.length,
      windowSize: this.window.length,
      totalItems: this.totalItems,
      maxWindowSize: this.maxWindowSize,
    };
  }

  // Clear the window
  clear(): void {
    this.window = [];
    this.windowStart = 0;
    this.totalItems = 0;
  }

  // Check if item is in current window
  isInWindow(itemId: string): boolean {
    return this.window.some(item => item.id === itemId);
  }

  // Get item from window
  getItem(itemId: string): T | undefined {
    return this.window.find(item => item.id === itemId);
  }
}

// Memory-aware cache for content
export class ContentCache<T extends UnifiedContent> {
  private cache: Map<string, { data: T; timestamp: number; accessCount: number }> = new Map();
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds

  constructor(maxSize: number = 1000, ttl: number = 10 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  // Set item in cache
  set(key: string, data: T): void {
    // Remove expired items first
    this.cleanup();

    // If cache is full, remove least recently used items
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 1,
    });
  }

  // Get item from cache
  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    // Check if item is expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // Update access count
    item.accessCount++;
    item.timestamp = Date.now();

    return item.data;
  }

  // Check if item exists in cache
  has(key: string): boolean {
    return this.cache.has(key) && !this.isExpired(key);
  }

  // Delete item from cache
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Clear all items from cache
  clear(): void {
    this.cache.clear();
  }

  // Get cache size
  size(): number {
    return this.cache.size;
  }

  // Check if item is expired
  private isExpired(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return true;
    return Date.now() - item.timestamp > this.ttl;
  }

  // Remove expired items
  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache) {
      if (now - item.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Evict least recently used items
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.cache) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
      utilization: (this.cache.size / this.maxSize) * 100,
    };
  }
}

// Hook for using memory manager
export function useMemoryManager<T extends UnifiedContent>(
  config?: Partial<MemoryConfig>
) {
  const manager = new MemoryManager<T>(config);
  
  return {
    manager,
    addItems: (items: T[]) => manager.addItems(items),
    getItems: (offset?: number, limit?: number) => manager.getItems(offset, limit),
    accessItem: (id: string) => manager.accessItem(id),
    removeItems: (ids: string[]) => manager.removeItems(ids),
    clear: () => manager.clear(),
    getStats: () => manager.getStats(),
    subscribe: (observer: (stats: MemoryStats) => void) => manager.subscribe(observer),
    updateConfig: (newConfig: Partial<MemoryConfig>) => manager.updateConfig(newConfig),
    destroy: () => manager.destroy(),
  };
}

// Memory optimization utilities
export const MemoryUtils = {
  // Estimate object size in bytes
  estimateObjectSize(obj: any): number {
    try {
      return JSON.stringify(obj).length * 2;
    } catch {
      return 0;
    }
  },

  // Check if browser supports performance.memory
  supportsMemoryAPI(): boolean {
    return 'memory' in performance;
  },

  // Get browser memory usage (if available)
  getBrowserMemoryUsage(): { used: number; total: number } | null {
    if (this.supportsMemoryAPI()) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
      };
    }
    return null;
  },

  // Format bytes to human readable
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Debounce function for memory operations
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function for memory operations
  throttle<T extends (...args: any[]) => any>(
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
  },
}; 