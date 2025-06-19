// Cache Management Utility for Content Analytics
// This utility helps manage cache across all platform analytics hooks

interface CacheConfig {
  keyPrefix: string;
  duration: number;
  platform: 'instagram' | 'youtube' | 'gmail' | 'all';
}

const CACHE_CONFIGS: Record<string, CacheConfig> = {
  instagram: {
    keyPrefix: 'instagram_analytics_cache_',
    duration: 30 * 60 * 1000, // 30 minutes (simplified)
    platform: 'instagram'
  },
  youtube: {
    keyPrefix: 'youtube_analytics_cache_',
    duration: 60 * 60 * 1000, // 1 hour (simplified)
    platform: 'youtube'
  },
  gmail: {
    keyPrefix: 'gmail_analytics_cache_',
    duration: 30 * 60 * 1000, // 30 minutes (simplified)
    platform: 'gmail'
  }
};

export class CacheManager {
  /**
   * Clear all analytics cache for a specific user
   */
  static clearUserCache(userId: string): void {
    try {
      // Clear localStorage
      Object.values(CACHE_CONFIGS).forEach(config => {
        const key = `${config.keyPrefix}${userId}`;
        localStorage.removeItem(key);
        
        // Also handle Instagram's special format with account ID
        if (config.platform === 'instagram') {
          // Find and remove all Instagram cache entries for this user
          for (let i = 0; i < localStorage.length; i++) {
            const storageKey = localStorage.key(i);
            if (storageKey?.startsWith(config.keyPrefix) && storageKey.includes(userId)) {
              localStorage.removeItem(storageKey);
            }
          }
        }
      });
      
      console.log(`🧹 Cleared all analytics cache for user: ${userId}`);
    } catch (error) {
      console.warn('Failed to clear user cache:', error);
    }
  }

  /**
   * Clear cache for a specific platform and user
   */
  static clearPlatformCache(platform: keyof typeof CACHE_CONFIGS, userId: string, accountId?: string): void {
    try {
      const config = CACHE_CONFIGS[platform];
      if (!config) return;
      
      let key = `${config.keyPrefix}${userId}`;
      if (accountId && platform === 'instagram') {
        key = `${config.keyPrefix}${userId}_${accountId}`;
      }
      
      localStorage.removeItem(key);
      console.log(`🧹 Cleared ${platform} cache for user: ${userId}`);
    } catch (error) {
      console.warn(`Failed to clear ${platform} cache:`, error);
    }
  }

  /**
   * Get cache stats for monitoring
   */
  static getCacheStats(userId: string): Record<string, any> {
    const stats: Record<string, any> = {};
    
    try {
      Object.entries(CACHE_CONFIGS).forEach(([platform, config]) => {
        const key = `${config.keyPrefix}${userId}`;
        const cached = localStorage.getItem(key);
        
        if (cached) {
          try {
            const parsedCache = JSON.parse(cached);
            const age = Date.now() - parsedCache.timestamp;
            const isExpired = age > config.duration;
            
            stats[platform] = {
              exists: true,
              timestamp: new Date(parsedCache.timestamp).toISOString(),
              ageMinutes: Math.round(age / 60000),
              isExpired,
              dataSize: cached.length,
              itemCount: parsedCache.data?.length || 0
            };
          } catch (parseError) {
            stats[platform] = { exists: true, error: 'Parse failed' };
          }
        } else {
          stats[platform] = { exists: false };
        }
      });
      
      // Handle Instagram special case
      const instagramCaches = [];
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (storageKey?.startsWith(CACHE_CONFIGS.instagram.keyPrefix) && storageKey.includes(userId)) {
          const cached = localStorage.getItem(storageKey);
          if (cached) {
            try {
              const parsedCache = JSON.parse(cached);
              const age = Date.now() - parsedCache.timestamp;
              instagramCaches.push({
                key: storageKey,
                ageMinutes: Math.round(age / 60000),
                isExpired: age > CACHE_CONFIGS.instagram.duration,
                itemCount: parsedCache.data?.length || 0
              });
            } catch (error) {
              // Ignore parse errors
            }
          }
        }
      }
      
      if (instagramCaches.length > 0) {
        stats.instagram.accounts = instagramCaches;
      }
      
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
    }
    
    return stats;
  }

  /**
   * Clean up expired cache entries
   */
  static cleanupExpiredCache(): void {
    try {
      let removedCount = 0;
      const keysToRemove: string[] = [];
      
      // Check all localStorage entries
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        // Check if it's an analytics cache key
        const isAnalyticsCache = Object.values(CACHE_CONFIGS).some(config => 
          key.startsWith(config.keyPrefix)
        );
        
        if (isAnalyticsCache) {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const parsedCache = JSON.parse(cached);
              const config = Object.values(CACHE_CONFIGS).find(c => 
                key.startsWith(c.keyPrefix)
              );
              
              if (config && Date.now() - parsedCache.timestamp > config.duration) {
                keysToRemove.push(key);
              }
            }
          } catch (error) {
            // If we can't parse it, it's probably corrupted, so remove it
            keysToRemove.push(key);
          }
        }
      }
      
      // Remove expired entries
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        removedCount++;
      });
      
      if (removedCount > 0) {
        console.log(`🧹 Cleaned up ${removedCount} expired cache entries`);
      }
    } catch (error) {
      console.warn('Failed to cleanup expired cache:', error);
    }
  }

  /**
   * Get total cache size for analytics
   */
  static getCacheSize(): { totalSize: number; entryCount: number; platforms: Record<string, number> } {
    let totalSize = 0;
    let entryCount = 0;
    const platforms: Record<string, number> = {};
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        // Check if it's an analytics cache key
        const platform = Object.entries(CACHE_CONFIGS).find(([_, config]) => 
          key.startsWith(config.keyPrefix)
        );
        
        if (platform) {
          const value = localStorage.getItem(key);
          if (value) {
            const size = value.length;
            totalSize += size;
            entryCount++;
            
            const platformName = platform[0];
            platforms[platformName] = (platforms[platformName] || 0) + size;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to calculate cache size:', error);
    }
    
    return { totalSize, entryCount, platforms };
  }

  /**
   * Initialize cache management (run cleanup on app start)
   */
  static initialize(): void {
    console.log('🔧 Initializing Content Analytics Cache Manager');
    
    // Run initial cleanup
    this.cleanupExpiredCache();
    
    // Set up periodic cleanup (every 5 minutes)
    const cleanupInterval = setInterval(() => {
      this.cleanupExpiredCache();
    }, 5 * 60 * 1000);
    
    // Clean up on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        clearInterval(cleanupInterval);
        this.cleanupExpiredCache();
      });
    }
    
    // Log cache stats for debugging
    if (process.env.NODE_ENV === 'development') {
      const size = this.getCacheSize();
      console.log('📊 Current cache status:', {
        ...size,
        totalSizeKB: Math.round(size.totalSize / 1024)
      });
    }
  }

  /**
   * Force refresh all cached data for a user
   */
  static forceRefreshUser(userId: string): void {
    this.clearUserCache(userId);
    console.log(`🔄 Forced refresh for user: ${userId}`);
    
    // Trigger a custom event that components can listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-cache-refresh', {
        detail: { userId }
      }));
    }
  }
}

// Initialize cache manager when module loads
if (typeof window !== 'undefined') {
  CacheManager.initialize();
}

export default CacheManager; 