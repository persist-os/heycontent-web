import { useState, useCallback } from 'react';
import { getApiKey } from '@/app/lib/api-helpers';

export function useGmailBatchRefresh() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        setError('You are not authenticated. Please log in again.');
        setLoading(false);
        return;
      }
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/api/v1/gmail/batch-refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        setError(data.error || 'Failed to refresh Gmail');
      }
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  return { refresh, loading, error };
}
