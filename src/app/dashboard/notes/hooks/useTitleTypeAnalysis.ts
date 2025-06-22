import { useState, useCallback, useRef } from 'react';
import { getApiKey } from '@/app/lib/api-helpers';

interface TitleTypeAnalysisOptions {
  content: string;
  platform?: string;
  noteId?: string;
}

interface TitleTypeAnalysisResult {
  success: boolean;
  title: string;
  type: string;
  confidence: number;
  reasoning: string;
  message: string;
  titleGenerated: boolean;
  typeGenerated: boolean;
  error?: string;
}

export function useTitleTypeAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track which notes have had analysis attempted to prevent duplicates
  const attemptedNotesRef = useRef<Set<string>>(new Set());
  
  const analyzeTitleAndType = useCallback(async (options: TitleTypeAnalysisOptions): Promise<TitleTypeAnalysisResult> => {
    const { content, platform = 'general', noteId } = options;
    
    console.log('🎯 [useTitleTypeAnalysis] analyzeTitleAndType called with:', {
      contentLength: content?.length || 0,
      contentPreview: content?.substring(0, 100) + "...",
      platform,
      noteId
    });
    
    // SAFEGUARD 1: Prevent multiple attempts for same note if noteId provided
    if (noteId && attemptedNotesRef.current.has(noteId)) {
      return {
        success: false,
        title: '',
        type: 'idea_bank',
        confidence: 0,
        reasoning: 'Analysis already attempted for this note',
        message: 'Analysis already attempted for this note',
        titleGenerated: false,
        typeGenerated: false,
        error: 'Analysis already attempted for this note'
      };
    }
    
    // SAFEGUARD 2: Content validation
    if (!content || content.trim().length < 5) {
      console.log('⚠️ [useTitleTypeAnalysis] Content too short:', {
        contentLength: content?.length || 0,
        threshold: 5
      });
      return {
        success: false,
        title: '',
        type: 'idea_bank',
        confidence: 0,
        reasoning: 'Content too short for analysis',
        message: 'Content must be at least 5 characters long',
        titleGenerated: false,
        typeGenerated: false,
        error: 'Content too short for analysis'
      };
    }

    setLoading(true);
    setError(null);
    
    // Mark as attempted immediately to prevent race conditions
    if (noteId) {
      attemptedNotesRef.current.add(noteId);
    }

    try {
      console.log('📤 [useTitleTypeAnalysis] Making API call to unified analyze-title-type endpoint');
      
      const apiKey = await getApiKey();
      console.log('🔑 [useTitleTypeAnalysis] API key obtained:', apiKey ? 'Yes' : 'No');
      
      if (!apiKey) {
        throw new Error('Authentication required');
      }

      const requestBody = {
        content,
        platform,
        ...(noteId && { noteId })
      };

      const response = await fetch('/api/smart-note/analyze-title-type', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 [useTitleTypeAnalysis] API response status:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [useTitleTypeAnalysis] API error response:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📥 [useTitleTypeAnalysis] API success response:', {
        success: result.success,
        title: result.title,
        type: result.type,
        confidence: result.confidence,
        reasoning: result.reasoning?.substring(0, 100) + "...",
        titleGenerated: result.titleGenerated,
        typeGenerated: result.typeGenerated,
        message: result.message
      });
      
      return {
        success: result.success || false,
        title: result.title || '',
        type: result.type || 'idea_bank',
        confidence: result.confidence || 0,
        reasoning: result.reasoning || '',
        message: result.message || '',
        titleGenerated: result.titleGenerated || false,
        typeGenerated: result.typeGenerated || false
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Title and type analysis failed';
      console.error('💥 [useTitleTypeAnalysis] Error in analyzeTitleAndType:', err);
      setError(errorMessage);
      
      // Remove from attempted set on error to allow retry
      if (noteId) {
        attemptedNotesRef.current.delete(noteId);
      }
      
      return {
        success: false,
        title: '',
        type: 'idea_bank',
        confidence: 0,
        reasoning: errorMessage,
        message: 'Failed to analyze title and type',
        titleGenerated: false,
        typeGenerated: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
      console.log('🏁 [useTitleTypeAnalysis] Analysis process completed');
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

  return { 
    analyzeTitleAndType, 
    loading, 
    error, 
    clearAttempted 
  };
} 