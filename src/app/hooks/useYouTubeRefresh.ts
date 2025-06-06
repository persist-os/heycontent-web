import { useState, useCallback } from 'react';
import { getApiKey } from '@/app/lib/api-helpers';

export function useYouTubeRefresh() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (videoId: string, videoUrl: string) => {
    setLoading(true);
    setError(null);
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        setError('You are not authenticated. Please log in again.');
        setLoading(false);
        return;
      }
      const res = await fetch('/api/social/youtube/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ videoId, videoUrl }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        setError(data.error || 'Failed to refresh video');
      } else {
        // Optionally, trigger a refetch or reload
        window.location.reload();
      }
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  return { refresh, loading, error };
} 