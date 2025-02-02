import { DEFAULT_CONFIG } from './config';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

export class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly cacheTimeout: number;

  constructor(config = DEFAULT_CONFIG) {
    this.cacheTimeout = config.cacheTimeout;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (this.isExpired(entry.timestamp)) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.data;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0
    });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (this.isExpired(entry.timestamp)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getCacheStats(): {
    size: number;
    hitRates: Record<string, number>;
    averageAge: number;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    if (entries.length === 0) {
      return {
        size: 0,
        hitRates: {},
        averageAge: 0
      };
    }

    const hitRates: Record<string, number> = {};
    let totalAge = 0;

    entries.forEach(([key, entry]) => {
      hitRates[key] = entry.hits;
      totalAge += now - entry.timestamp;
    });

    return {
      size: this.cache.size,
      hitRates,
      averageAge: totalAge / entries.length
    };
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.cacheTimeout;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }
} 