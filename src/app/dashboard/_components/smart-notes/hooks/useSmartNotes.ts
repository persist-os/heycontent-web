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

      const payload = {
        content: (typeof content === 'string') ? content : '',
        platform: options.platform || 'general',
        metadata: options.metadata || {},
        analysisResult: options.analysisResult || {}
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
      
      if (response.ok && data.success) {
        // After saving, fetch the latest notes to ensure the new note is present
        try {
          const updatedNotesResponse = await fetch("/api/smart-note/user", {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          });
          if (updatedNotesResponse.ok) {
            const updatedNotes = await updatedNotesResponse.json();
            setNotes(Array.isArray(updatedNotes.data) ? updatedNotes.data : []);
          }
        } catch (fetchError) {
          console.error('Failed to fetch updated notes after save:', fetchError);
        }
        return { success: true, noteId: data.noteId };
      } else {
        return { 
          success: false, 
          error: data.error || data.message || 'Failed to save note' 
        };
      }
    } catch (error) {
      console.error('Error saving note:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error occurred' 
      };
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Analyze note content
  const analyzeNote = useCallback(async (
    content: string,
    platform: string = 'general'
  ): Promise<SmartNoteAnalysis> => {
    if (!content.trim()) {
      return { success: false, message: 'Content cannot be empty' };
    }

    setIsAnalyzing(true);
    
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        return { success: false, message: 'No API key available' };
      }

      const response = await fetch('/api/smart-note/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          content_note: content,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        return data;
      } else {
        return { 
          success: false, 
          message: data.error || data.message || 'Analysis failed' 
        };
      }
    } catch (error) {
      console.error('Error analyzing note:', error);
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

  // Update existing note
  const updateNote = useCallback(async (noteId: string, updates: NoteUpdate): Promise<Note | null> => {
    if (!userId || !noteId) return null;
    
    try {
      const apiKey = await getApiKey();
      if (!apiKey) return null;

      const response = await fetch(`/api/smart-note/${noteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ update_fields: updates }),
      });

      if (response.ok) {
        const updatedNotesResponse = await fetch("/api/smart-note/user", {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (updatedNotesResponse.ok) {
          const updatedNotes = await updatedNotesResponse.json();
          setNotes(Array.isArray(updatedNotes.data) ? updatedNotes.data : []);
          // Return the updated note
          return (Array.isArray(updatedNotes.data) ? updatedNotes.data : []).find((n: Note) => n._id === noteId) || null;
        }
      }
      return null;
    } catch (error) {
      console.error('Error updating note:', error);
      return null;
    }
  }, [userId]);

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