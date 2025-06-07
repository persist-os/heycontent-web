import { useState, useCallback } from 'react';
import { getApiKey } from '@/app/lib/api-helpers';

export function useInstagramRefresh() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (postId: string, postUrl: string) => {
    setLoading(true);
    setError(null);
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        setError('You are not authenticated. Please log in again.');
        setLoading(false);
        return;
      }
      const res = await fetch('/api/social/instagram/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ post_id: postId, post_url: postUrl }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        setError(data.error || 'Failed to refresh post');
      }
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  return { refresh, loading, error };
} 