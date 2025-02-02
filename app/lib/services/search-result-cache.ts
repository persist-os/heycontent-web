import { EmailMessage, PartnershipEmail } from '../../types/social-platforms';

interface CachedResult {
  timestamp: number;
  results: (EmailMessage | PartnershipEmail)[];
  query: string;
  normalizedQuery: string;
}

export class SearchResultCache {
  private cache: Map<string, CachedResult>;
  private readonly TTL: number;

  constructor(ttlMinutes: number = 30) {
    this.cache = new Map();
    this.TTL = ttlMinutes * 60 * 1000; // Convert to milliseconds
  }

  private generateCacheKey(query: string, filters?: Record<string, any>): string {
    const normalizedQuery = query.toLowerCase().trim();
    const filterString = filters ? JSON.stringify(filters) : '';
    return `${normalizedQuery}:${filterString}`;
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.TTL;
  }

  private normalizeQuery(query: string): string {
    return query.toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  get(query: string, filters?: Record<string, any>): (EmailMessage | PartnershipEmail)[] | null {
    const cacheKey = this.generateCacheKey(query, filters);
    const cached = this.cache.get(cacheKey);

    if (!cached || this.isExpired(cached.timestamp)) {
      if (cached) {
        this.cache.delete(cacheKey); // Clean up expired entry
      }
      return null;
    }

    return cached.results;
  }

  set(
    query: string, 
    results: (EmailMessage | PartnershipEmail)[], 
    filters?: Record<string, any>
  ): void {
    const cacheKey = this.generateCacheKey(query, filters);
    const normalizedQuery = this.normalizeQuery(query);

    this.cache.set(cacheKey, {
      timestamp: Date.now(),
      results,
      query,
      normalizedQuery
    });
  }

  clear(): void {
    this.cache.clear();
  }

  // Find similar results based on normalized query
  getSimilarResults(query: string): (EmailMessage | PartnershipEmail)[] | null {
    const normalizedQuery = this.normalizeQuery(query);
    
    for (const [_, cached] of this.cache) {
      if (this.isExpired(cached.timestamp)) continue;
      
      if (cached.normalizedQuery.includes(normalizedQuery) || 
          normalizedQuery.includes(cached.normalizedQuery)) {
        return cached.results;
      }
    }
    
    return null;
  }

  // Get all cached entries for debugging
  getDebugInfo(): Record<string, any> {
    const debug: Record<string, any> = {};
    
    for (const [key, value] of this.cache.entries()) {
      debug[key] = {
        timestamp: value.timestamp,
        expired: this.isExpired(value.timestamp),
        resultCount: value.results.length,
        originalQuery: value.query,
        normalizedQuery: value.normalizedQuery
      };
    }
    
    return debug;
  }
}

// Export singleton instance
export const searchResultCache = new SearchResultCache(); 