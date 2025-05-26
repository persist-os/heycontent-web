import { LRUCache } from 'lru-cache';

interface RateLimitInfo {
  count: number;
  resetTime: number;
  concurrentRequests: number;
}

export const RATE_LIMIT = 10;  // requests per minute
export const BURST_LIMIT = 3;  // max concurrent requests
export const WINDOW_MS = 60 * 1000; // 1 minute window

const rateLimit = new LRUCache<string, RateLimitInfo>({
  max: 500,
  ttl: WINDOW_MS,
});

export async function checkRateLimit(identifier: string): Promise<{
  success: boolean;
  remaining: number;
  reset: number;
  error?: string;
}> {
  const now = Date.now();
  const info = rateLimit.get(identifier) || { 
    count: 0, 
    resetTime: now + WINDOW_MS,
    concurrentRequests: 0 
  };
  
  // Reset if window expired
  if (now > info.resetTime) {
    info.count = 0;
    info.resetTime = now + WINDOW_MS;
  }

  // Check burst limit
  if (info.concurrentRequests >= BURST_LIMIT) {
    return {
      success: false,
      remaining: RATE_LIMIT - info.count,
      reset: info.resetTime,
      error: `Too many concurrent requests. Maximum is ${BURST_LIMIT}`
    };
  }

  // Check rate limit
  if (info.count >= RATE_LIMIT) {
    return {
      success: false,
      remaining: 0,
      reset: info.resetTime,
      error: `Rate limit exceeded. Try again in ${Math.ceil((info.resetTime - now) / 1000)} seconds`
    };
  }

  // Increment counters
  info.count++;
  info.concurrentRequests++;
  rateLimit.set(identifier, info);

  // Schedule concurrent request decrement
  setTimeout(() => {
    const currentInfo = rateLimit.get(identifier);
    if (currentInfo) {
      currentInfo.concurrentRequests = Math.max(0, currentInfo.concurrentRequests - 1);
      rateLimit.set(identifier, currentInfo);
    }
  }, 1000); // Assume request takes at most 1 second

  return {
    success: true,
    remaining: RATE_LIMIT - info.count,
    reset: info.resetTime
  };
} 