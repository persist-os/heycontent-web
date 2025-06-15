import { useState, useCallback } from 'react';
import { getApiKey } from '@/app/lib/api-helpers';

export function useGmailRefresh() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Accepts threadId and emailId (adjust as needed for your backend)
  const refresh = useCallback(async (threadId: string, emailId: string) => {
    setLoading(true);
    setError(null);
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        setError('You are not authenticated. Please log in again.');
        setLoading(false);
        return;
      }
      const res = await fetch('/api/social/gmail/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ threadId, emailId }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        setError(data.error || 'Failed to refresh Gmail thread');
      }
      // On success, do NOT reload the page—let the parent/card update its state
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  return { refresh, loading, error };
}
