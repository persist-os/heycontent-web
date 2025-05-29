import { useCallback, useEffect, useState } from 'react';
import {
  analyzeSmartNote,
  generateSmartNoteIdeas,
  executeSmartNoteIdea,
  AnalyzeSmartNoteRequest,
  AnalyzeSmartNoteResponse,
  GenerateIdeasRequest,
  GenerateIdeasResponse,
  ExecuteIdeaRequest,
  ExecuteIdeaResponse,
} from '@/app/lib/api-helpers';

// Hook for fetching and managing Smart Note ideas (for a note or user)
export function useSmartNoteIdeas({
  noteId,
  userId,
  platform,
  mode = 'note', // 'note' | 'user'
  limit = 5,
}: {
  noteId?: string;
  userId: string;
  platform?: string;
  mode?: 'note' | 'user';
  limit?: number;
}) {
  const [ideas, setIdeas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let result: AnalyzeSmartNoteResponse | GenerateIdeasResponse;
      if (mode === 'note' && noteId && platform) {
        result = await analyzeSmartNote({ noteId, platform, userId });
        setIdeas(result.data.ideas);
      } else if (mode === 'user') {
        result = await generateSmartNoteIdeas({ userId, limit });
        setIdeas(result.ideas);
      } else {
        setIdeas([]);
        setError('Insufficient parameters to fetch ideas');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch ideas');
      setIdeas([]);
    } finally {
      setLoading(false);
    }
  }, [noteId, userId, platform, mode, limit]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  return {
    ideas,
    loading,
    error,
    refresh: fetchIdeas,
  };
}

// Hook for executing/expanding a Smart Note idea
export function useExecuteIdea() {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (req: ExecuteIdeaRequest) => {
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const res: ExecuteIdeaResponse = await executeSmartNoteIdea(req);
        setResult(res.result);
      } catch (err: any) {
        setError(err?.message || 'Failed to execute idea');
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    result,
    loading,
    error,
    execute,
    reset: () => setResult(null),
  };
}
