import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { GmailContentItem } from '../types';

// 1-Hour Lazy Loading Cache Configuration
const CACHE_KEY_PREFIX = 'gmail_analytics_cache_';
const CACHE_DURATION = 60 * 60 * 1000; // 60 minutes (1-hour lazy loading cycle)

interface CachedData {
  data: GmailContentItem[];
  timestamp: number;
  userId: string;
}

// In-memory cache to persist data across component mounts
const memoryCache = new Map<string, CachedData>();

// Get cache key for a user
const getCacheKey = (userId: string) => `${CACHE_KEY_PREFIX}${userId}`;

// Load cached data with 1-hour lazy loading logic
const loadCachedData = (userId: string): CachedData | null => {
  const cacheKey = getCacheKey(userId);
  
  // Check memory cache first
  const memoryData = memoryCache.get(cacheKey);
  if (memoryData && Date.now() - memoryData.timestamp < CACHE_DURATION) {
    console.log('📧 Gmail: Using memory cache (hour 0-59)');
    return memoryData;
  }
  
  // Check localStorage
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsedCache: CachedData = JSON.parse(cached);
      if (Date.now() - parsedCache.timestamp < CACHE_DURATION) {
        console.log('📧 Gmail: Using localStorage cache (hour 0-59)');
        // Restore to memory cache
        memoryCache.set(cacheKey, parsedCache);
        return parsedCache;
      } else {
        console.log('📧 Gmail: Cache expired (hour 61+) - will fetch fresh data');
      }
    }
  } catch (error) {
    console.warn('Failed to load cached Gmail data:', error);
  }
  
  return null;
};

// Save data to cache with 1-hour duration
const saveCachedData = (userId: string, data: GmailContentItem[]) => {
  const cacheKey = getCacheKey(userId);
  const cachedData: CachedData = {
    data,
    timestamp: Date.now(),
    userId
  };
  
  // Save to memory cache
  memoryCache.set(cacheKey, cachedData);
  
  // Save to localStorage
  try {
    localStorage.setItem(cacheKey, JSON.stringify(cachedData));
    console.log('📧 Gmail: Cached fresh data for next 60 minutes');
  } catch (error) {
    console.warn('Failed to save Gmail data to localStorage:', error);
  }
};

// Clear cache for debugging
const clearCachedData = (userId: string) => {
  const cacheKey = getCacheKey(userId);
  memoryCache.delete(cacheKey);
  try {
    localStorage.removeItem(cacheKey);
    console.log('📧 Gmail: Cache cleared for userId:', userId);
  } catch (error) {
    console.warn('Failed to clear Gmail cache:', error);
  }
};

export function useGmailAnalytics(userId?: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cachedItems, setCachedItems] = useState<GmailContentItem[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  
  // Refs to track if component is mounted
  const isMountedRef = useRef(true);

  // 1-Hour Lazy Loading: Only fetch when cache is expired or doesn't exist
  const shouldFetchFromConvex = useMemo(() => {
    if (!userId) return false;
    
    const cached = loadCachedData(userId);
    const isCacheValid = cached && (Date.now() - cached.timestamp < CACHE_DURATION);
    
    // FIXED: Also fetch if cache is valid but empty (no data)
    const hasValidData = cached && cached.data && cached.data.length > 0;
    
    // Only fetch if cache is invalid/expired OR if cache is empty
    return !isCacheValid || !hasValidData;
  }, [userId]);

  // FIXED: Query for Gmail accounts to check connection status
  const gmailAccounts = useQuery(
    api.gmailQueries.getGmailAccounts,
    userId ? { userId } : "skip"
  );

  // Convex query for Gmail threads (only when cache expired)
  const gmailThreads = useQuery(
    api.gmailQueries.getGmailThreadsWithMessages,
    userId ? { userId } : "skip"
  );

  // Helper to get the received date for an email/thread
  const getReceivedDate = (email: any, thread: any) => {
    if (email && email.internalDate) return new Date(Number(email.internalDate)).toISOString();
    const firstMessage = thread.messages && thread.messages.length > 0 ? thread.messages[0] : null;
    if (firstMessage && firstMessage.internalDate) return new Date(Number(firstMessage.internalDate)).toISOString();
    if (thread.createdAt) return new Date(thread.createdAt).toISOString();
    return '';
  };

  // Map Gmail items
  const mappedGmailItems = useMemo(() => {
    if (Array.isArray(gmailThreads)) {
      const importantEmails: any[] = [];
      gmailThreads.forEach((thread: any, threadIndex: number) => {
        if (thread.analysis && Array.isArray(thread.analysis.important_emails)) {
          thread.analysis.important_emails.forEach((email: any, emailIndex: number) => {
            const firstMessage = thread.messages && thread.messages.length > 0 ? thread.messages[0] : null;
            // Ensure unique ID by prefixing with 'important-' and including indices
            const uniqueId = `gmail-important-${thread.threadId || thread._id || thread.id}-${emailIndex}`;
            importantEmails.push({
              id: uniqueId,
              platform: 'gmail',
              publishedAt: getReceivedDate(email, thread),
              content: {
                data: {
                  subject: email.subject || thread.data?.subject || thread.subject || 'No Subject',
                  snippet: email.snippet || thread.data?.snippet || thread.snippet || 'No preview available',
                  from: email.sender || thread.data?.from || thread.from || 'Unknown Sender',
                  emailType: email.emailType || 'important',
                  threadId: thread.threadId,
                  emailId: firstMessage?.messageId || firstMessage?.id,
                }
              },
              metrics: email.metrics || {},
            });
          });
        }
      });
      
      let mappedItems: GmailContentItem[];
      
      if (importantEmails.length > 0) {
        mappedItems = importantEmails;
      } else {
        // Use the enhanced data structure from getGmailThreadsWithMessages
        mappedItems = gmailThreads.map((thread: any, index: number): GmailContentItem => {
          // Handle different data structures:
          // 1. thread.data.messages[0] (for gmailThreads with messages array)
          // 2. thread.data (for individual gmailMessages)
          // 3. Direct thread properties (fallback)
          
          let emailData = null;
          
          // Check if thread has data.messages array (from gmailThreads)
          if (thread.data?.messages && Array.isArray(thread.data.messages) && thread.data.messages.length > 0) {
            emailData = thread.data.messages[0]; // Get first message from thread
          }
          // Check if thread.data has direct email properties (from gmailMessages)
          else if (thread.data?.subject || thread.data?.from) {
            emailData = thread.data;
          }
          // Fallback to thread.messages if available
          else if (thread.messages && Array.isArray(thread.messages) && thread.messages.length > 0) {
            emailData = thread.messages[0];
          }
          
          // Extract data with proper fallbacks
          const subject = emailData?.subject || 
                         thread.subject || 
                         'No Subject';
                         
          const snippet = emailData?.snippet || 
                         emailData?.body || // Sometimes body contains the snippet
                         thread.snippet || 
                         'No preview available';
                         
          const from = emailData?.from || 
                      thread.from || 
                      'Unknown Sender';
                      
          // Get thread ID and message count
          const threadId = thread.threadId || thread.data?.threadId || thread.data?.id || thread._id;
          const messageCount = thread.data?.messages?.length || thread.messages?.length || 1;
          
          // Ensure unique ID
          const uniqueId = `gmail-${threadId || `thread-${thread._id || thread.id || index}`}`;
          
          return {
            id: uniqueId,
            platform: 'gmail',
            publishedAt: getReceivedDate(emailData, thread),
            content: {
              data: {
                subject: subject,
                snippet: snippet, 
                from: from,
                emailType: emailData?.emailType || 'all',
                threadId: threadId,
                emailId: emailData?.messageId || emailData?.id || threadId,
                messageCount: messageCount,
                messages: thread.data?.messages || thread.messages || [],
              }
            },
            metrics: thread.metrics || { replies: Math.max(0, messageCount - 1) },
          };
        });
      }
      
      // Cache the data when it's loaded from Convex
      if (userId && mappedItems.length > 0) {
        saveCachedData(userId, mappedItems);
        setLastFetchTime(Date.now());
        console.log('📧 Gmail: Fresh data fetched from Convex and cached');
      }
      
      return mappedItems;
    }
    
    // Return cached items if Convex data is not available
    return cachedItems;
  }, [gmailThreads, cachedItems, userId]);

  // Initialize with cached data on mount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 1-Hour Lazy Loading: Load cached data immediately on mount
  useEffect(() => {
    if (userId) {
      const cached = loadCachedData(userId);
      if (cached && cached.data.length > 0) {
        console.log('📧 Gmail: Loading cached data on mount');
        setCachedItems(cached.data);
        setLastFetchTime(cached.timestamp);
        
        // Check if cache is still valid (within 60 minutes)
        const dataAge = Date.now() - cached.timestamp;
        if (dataAge < CACHE_DURATION) {
          // Hour 0-59: Instant display with cached data
          setLoading(false);
          console.log(`📧 Gmail: Cache valid for ${Math.round((CACHE_DURATION - dataAge) / 60000)} more minutes`);
        } else {
          // Hour 61+: Cache expired, will fetch fresh data
          console.log('📧 Gmail: Cache expired, will fetch fresh data');
        }
        setError(null);
      } else {
        console.log('📧 Gmail: No cache found, will fetch fresh data');
      }
    }
  }, [userId]);

  // Handle loading state for when Convex query is skipped due to valid cache
  useEffect(() => {
    if (userId && !shouldFetchFromConvex) {
      // If we're not fetching from Convex because cache is valid, ensure loading is false
      const cached = loadCachedData(userId);
      if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        setLoading(false);
      }
    }
  }, [userId, shouldFetchFromConvex]);

  // Handle Convex data processing
  useEffect(() => {
    if (gmailThreads !== undefined && userId) {
      console.log('📧 Gmail: Processing fresh Convex data');
      setLoading(false);
    }
  }, [gmailThreads, userId]);

  // Reset cache when userId changes (but not when it becomes undefined)
  useEffect(() => {
    // Don't reset cache - let the cache loading effect handle it
    // This was causing the cache to be cleared immediately after loading
  }, [userId]);

  return {
    items: mappedGmailItems,
    loading: gmailThreads === undefined,
    error,
    isConnected: !!gmailAccounts && gmailAccounts.length > 0 && !!gmailAccounts[0]?.email,
    rawData: gmailThreads,
    lastFetchTime: null,
    isCached: false
  };
} 