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
export function useSmartNoteIdeas({ platform, limit = 5 }: { platform?: string; limit?: number }) {
  const [ideas, setIdeas] = useState<Array<IdeaItem | string>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = useCallback(async () => {
    if (!platform) return;
    setLoading(true);
    setError(null);
    try {
      // Use fetchWithApiKey to ensure Authorization header is set
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { fetchWithApiKey } = await import('@/app/lib/api-helpers');
      const res = await fetchWithApiKey('/api/smart-note/ideas', {
        method: 'POST',
        body: JSON.stringify({ platform, limit }),
      });
      if (!res.ok) throw new Error('Failed to fetch ideas');
      const data = await res.json();
      setIdeas(data.ideas || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch ideas');
      setIdeas([]);
    } finally {
      setLoading(false);
    }
  }, [platform, limit]);



  return { ideas, loading, error, refetch: fetchIdeas };
}
