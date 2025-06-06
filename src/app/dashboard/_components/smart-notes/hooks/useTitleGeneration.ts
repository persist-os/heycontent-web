import { useState, useCallback, useRef } from 'react';
import { getApiKey } from '@/app/lib/api-helpers';

interface TitleGenerationOptions {
  content: string;
  platform?: string;
  noteId: string;
}

interface TitleGenerationResult {
  title: string | null;
  wasGenerated: boolean;
  error: string | null;
}

export function useTitleGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track which notes have had title generation attempted
  const attemptedNotesRef = useRef<Set<string>>(new Set());
  
  const generateTitle = useCallback(async (options: TitleGenerationOptions): Promise<TitleGenerationResult> => {
    const { content, platform = 'general', noteId } = options;
    
    // SAFEGUARD 1: Prevent multiple attempts for same note
    if (attemptedNotesRef.current.has(noteId)) {
      return { title: null, wasGenerated: false, error: 'Title generation already attempted for this note' };
    }
    
    // SAFEGUARD 2: Content validation
    if (!content || content.trim().length < 10) {
      return { title: null, wasGenerated: false, error: 'Content too short' };
    }

    setLoading(true);
    setError(null);
    
    // Mark as attempted immediately to prevent race conditions
    attemptedNotesRef.current.add(noteId);

    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/smart-note/ideas/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          content,
          platform,
          noteId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Title generation failed: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        title: data.title || null,
        wasGenerated: data.titleGenerated || false,
        error: null
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Title generation failed';
      setError(errorMessage);
      
      // Remove from attempted set on error to allow retry
      attemptedNotesRef.current.delete(noteId);
      
      return { title: null, wasGenerated: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Clear attempted notes when component unmounts or note changes
  const clearAttempted = useCallback((noteId?: string) => {
    if (noteId) {
      attemptedNotesRef.current.delete(noteId);
    } else {
      attemptedNotesRef.current.clear();
    }
  }, []);

  return { generateTitle, loading, error, clearAttempted };
}
