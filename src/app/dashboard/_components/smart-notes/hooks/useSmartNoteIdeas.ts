import { useState, useEffect, useCallback } from 'react';

// Define interfaces for the ideas data structure
interface IdeaItem {
  content: string;
  summary?: string;
  actionable_steps?: string[];
  confidence?: number;
}

/**
 * React hook to fetch and manage smart note AI-generated ideas via the Next.js API route.
 * Usage: const { ideas, loading, error, refetch } = useSmartNoteIdeas({ platform, limit });
 */
export function useSmartNoteIdeas({ platform, limit = 5, noteId }: { platform?: string; limit?: number; noteId?: string }) {
  // DEBUG: Track hook usage
  console.log('[useSmartNoteIdeas] Hook initialized with:', { platform, limit, noteId });
  
  // Create a storage key based on noteId or platform
  const storageKey = `smart_note_ideas_${noteId || platform || 'default'}`;
  
  // Initialize state from local storage if available
  const [ideas, setIdeas] = useState<Array<IdeaItem | string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedIdeas = localStorage.getItem(storageKey);
        if (savedIdeas) {
          const parsedIdeas = JSON.parse(savedIdeas);
          console.log('[useSmartNoteIdeas] Loaded ideas from local storage:', parsedIdeas.length);
          return parsedIdeas;
        }
      } catch (err) {
        console.error('[useSmartNoteIdeas] Error loading from local storage:', err);
      }
    }
    return [];
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = useCallback(async () => {
    console.log('[useSmartNoteIdeas] fetchIdeas called with platform:', platform, 'limit:', limit);
    if (!platform) {
      console.warn('[useSmartNoteIdeas] fetchIdeas called with no platform');
      return;
    }
    setLoading(true);
    setError(null);
    let triedRefresh = false;
    const { fetchWithApiKey, getApiKey } = await import('@/app/lib/api-helpers');
    async function doFetch(forceRefresh = false) {
      try {
        if (forceRefresh) {
          // Remove the API key to force a refresh
          console.log('[useSmartNoteIdeas] Forcing API key refresh');
          localStorage.removeItem('apiKey');
          await getApiKey(); // Will refresh and store a new key
        }
        console.log('[useSmartNoteIdeas] Sending POST to /api/smart-note/ideas', { platform, limit });
        const res = await fetchWithApiKey('/api/smart-note/ideas', {
          method: 'POST',
          body: JSON.stringify({ platform, limit }),
        });
        console.log('[useSmartNoteIdeas] Response status:', res.status);
        if (res.status === 401 && !triedRefresh) {
          triedRefresh = true;
          console.warn('[useSmartNoteIdeas] Got 401, retrying with refreshed API key');
          return await doFetch(true);
        }
        if (!res.ok) {
          let errMsg = 'Failed to fetch ideas';
          try {
            const errData = await res.json();
            errMsg = errData?.error || errData?.message || errMsg;
            console.error('[useSmartNoteIdeas] Backend error:', errData);
          } catch {}
          throw new Error(errMsg);
        }
        const data = await res.json();
        console.log('[useSmartNoteIdeas] Received data:', data);
        const newIdeas = data.ideas || [];
        setIdeas(newIdeas);
        
        // Save to local storage
        if (typeof window !== 'undefined' && newIdeas.length > 0) {
          try {
            localStorage.setItem(storageKey, JSON.stringify(newIdeas));
            console.log('[useSmartNoteIdeas] Saved ideas to local storage');
          } catch (err) {
            console.error('[useSmartNoteIdeas] Error saving to local storage:', err);
          }
        }
        
        setError(null);
      } catch (err: any) {
        console.error('[useSmartNoteIdeas] Error fetching ideas:', err);
        setError(err.message || 'Failed to fetch ideas');
        setIdeas([]);
      } finally {
        setLoading(false);
      }
    }
    await doFetch(false);
  }, [platform, limit]);



  // Clear ideas from local storage
  const clearIdeas = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
        setIdeas([]);
        console.log('[useSmartNoteIdeas] Cleared ideas from local storage');
      } catch (err) {
        console.error('[useSmartNoteIdeas] Error clearing local storage:', err);
      }
    }
  }, [storageKey]);

  return { ideas, loading, error, refetch: fetchIdeas, clearIdeas };
}
