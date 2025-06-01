import { useState, useEffect, useCallback } from "react";
import { Note, NoteUpdate } from "../types";
import { getApiKey } from "@/app/lib/api-helpers";
import { formatAnalysisToMarkdown } from '../utils/format-utils';

interface SmartNoteIdea {
  id: string;
  content: string;
  platform: string;
  confidence: number;
}

interface SmartNoteAnalysis {
  success: boolean;
  data?: {
    analysis?: any;
  };
  suggestedTitle?: string;
  message?: string;
}

export function useSmartNotes(userId: string | undefined) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);

  // Fetch notes from API
  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    
    const apiKey = getApiKey();
    if (!apiKey) {
      console.error('No API key available');
      setIsLoading(false);
      return;
    }

    fetch("/api/smart-note/user", {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => setNotes(Array.isArray(data.data) ? data.data : []))
      .catch(error => {
        console.error('Failed to fetch notes:', error);
        setNotes([]);
      })
      .finally(() => setIsLoading(false));
  }, [userId]);

  // Save note with smart capabilities
  // Save a new note (no ID or local ID)
  const saveNote = useCallback(async (
    content: string,
    options: {
      platform?: string;
      metadata?: {
        type?: string;
        templateInput?: any;
      };
      analysisResult?: {
        analysisId?: string;
      };
    } = {}
  ): Promise<{ success: boolean; noteId?: string; error?: string }> => {
    setIsSaving(true);
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        return { success: false, error: 'No API key available' };
      }
      // Provide default placeholders if content or platform are missing
      const safeContent = content && content.trim() ? content : 'Write your note here...';
      const safePlatform = options.platform && options.platform.trim() ? options.platform : 'web';
      if (!content || !content.trim()) {
        console.warn('No note content provided, using default placeholder for save.');
      }
      if (!options.platform || !options.platform.trim()) {
        console.warn('No platform provided for save, using default platform \'web\'.');
      }
      // Log actual values being sent to backend
      console.log('[saveNote] About to save note:', {
        content,
        safeContent,
        platform: options.platform,
        safePlatform,
        type: options.metadata?.type,
        analysisId: options.analysisResult?.analysisId
      });
      // Prepare payload as expected by backend
      const payload = {
        content: safeContent,
        platform: safePlatform,
        type: options.metadata?.type || 'note',
        templateInput: options.metadata?.templateInput || null,
        analysisId: options.analysisResult?.analysisId || null
      };
      const response = await fetch('/api/smart-note/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok && data.success && data.data && data.data._id) {
        // Insert the new note into local state
        setNotes(prev => [{ ...data.data }, ...prev.filter(n => n._id !== data.data._id)]);
        return { success: true, noteId: data.data._id };
      } else {
        return {
          success: false,
          error: data.error || data.message || 'Failed to save note',
        };
      }
    } catch (error) {
      console.error('Error saving note:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Update existing note by Convex ID
  // NoteUpdate type must include: content, platform, type, templateInput, analysisId
  // IMPORTANT: During analysis, updateNote should ONLY be used to update references (AI insights),
  // NOT to update note content, platform, or trigger any save.
  const updateNote = useCallback(async (
    noteId: string,
    updateFields: Partial<Pick<Note, 'content' | 'platform' | 'type' | 'templateInput' | 'analysisId' | 'references' | 'title'>>
  ): Promise<Note | null> => {
    if (!userId || !noteId) return null;
    // If noteId is a local temp ID, do NOT save as a side effect of analysis
    if (noteId.startsWith('local_')) {
      // Only allow updating references (AI insights) for local notes during analysis
      if (Object.keys(updateFields).every(key => key === 'references' || key === 'title')) {
        // Update local note in memory only (not persisted)
        setNotes(prev => prev.map(n => n._id === noteId ? { ...n, ...updateFields } : n));
        return { ...(notes.find(n => n._id === noteId) || {}), ...updateFields } as Note;
      }
      // Prevent accidental save or update of content/platform during analysis
      console.warn('Prevented save/update of content/platform for local note during analysis.');
      return null;
    }
    // For persisted notes, only allow update of references/title during analysis
    if (Object.keys(updateFields).every(key => key === 'references' || key === 'title')) {
      // Perform backend update for references/title
      try {
        const apiKey = await getApiKey();
        if (!apiKey) return null;
        const payload = { ...updateFields };
        const response = await fetch(`/api/smart-note/update/${noteId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          const data = await response.json();
          setNotes(prev => prev.map(n => n._id === noteId ? { ...n, ...updateFields } : n));
          return { ...(notes.find(n => n._id === noteId) || {}), ...updateFields } as Note;
        }
        return null;
      } catch (error) {
        console.error('Error updating note references/title:', error);
        return null;
      }
    }
    // Prevent accidental save or update of content/platform during analysis
    console.warn('Prevented save/update of content/platform for persisted note during analysis.');
    return null;
  }, [userId, notes]);

  // Analyze note content
  const analyzeNote = useCallback(async (
    content: string,
    platform: string = 'general'
  ): Promise<{ success: boolean; ideas?: string[]; message?: string }> => {
    if (!content.trim()) {
      return { success: false, message: 'Content cannot be empty' };
    }

    setIsAnalyzing(true);
    
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        return { success: false, message: 'No API key available' };
      }

      const response = await fetch('/api/smart-note/ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          platform,
          limit: 5
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.ideas) {
        return { 
          success: true, 
          ideas: data.ideas 
        };
      } else {
        return { 
          success: false, 
          message: data.error || data.message || 'Failed to generate ideas' 
        };
      }
    } catch (error) {
      console.error('Error generating ideas:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Network error occurred' 
      };
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Generate content ideas
  const generateIdeas = useCallback(async (
    platform: string = 'general',
    options: {
      contentType?: string;
      targetAudience?: string;
      limit?: number;
    } = {}
  ): Promise<{ success: boolean; ideas?: SmartNoteIdea[]; error?: string }> => {
    setIsGeneratingIdeas(true);
    
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        return { success: false, error: 'No API key available' };
      }

      const response = await fetch('/api/smart-note/ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          platform,
          contentType: options.contentType || 'general',
          targetAudience: options.targetAudience || 'general',
          limit: options.limit || 5,
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        return { success: true, ideas: data.ideas || [] };
      } else {
        return { 
          success: false, 
          error: data.error || data.message || 'Failed to generate ideas' 
        };
      }
    } catch (error) {
      console.error('Error generating ideas:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error occurred' 
      };
    } finally {
      setIsGeneratingIdeas(false);
    }
  }, []);


  // Delete note
  const deleteNote = useCallback(async (noteId: string): Promise<boolean> => {
    if (!userId || !noteId) return false;
    
    try {
      const apiKey = await getApiKey();
      if (!apiKey) return false;

      const response = await fetch(`/api/smart-note/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        setNotes(prev => prev.filter(note => note._id !== noteId));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  }, [userId]);

  return {
    // State
    notes,
    isLoading,
    isAnalyzing,
    isSaving,
    isGeneratingIdeas,
    
    // Actions
    saveNote,
    analyzeNote,
    generateIdeas,
    updateNote,
    deleteNote,
    
    // Utilities
    formatAnalysisToMarkdown,
  };
} 