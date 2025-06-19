import { useState } from 'react';

interface ExecuteSmartNoteIdeaParams {
  userId: string;
  idea: string;
  note: string;
  context?: Record<string, any>;
}

export function useExecuteSmartNoteIdea() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const execute = async (params: ExecuteSmartNoteIdeaParams) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/smart-note/ideas/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Failed to execute smart note idea');
      const data = await res.json();
      setResult(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to execute smart note idea');
      setResult(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error, result };
} 