import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { Note, NoteUpdate, NoteType } from "../types";
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

// Define the return type for the hook to ensure TypeScript knows about all returned functions
interface SmartNotesHook {
  notes: Note[];
  isLoading: boolean;
  isAnalyzing: boolean;
  isSaving: boolean;
  isGeneratingIdeas: boolean;
  saveNote: (content: string, options?: any) => Promise<{ success: boolean; noteId?: Id<"notes">; error?: string }>;
  updateNote: (noteId: string | Id<"notes">, updateFields: NoteUpdate, force?: boolean) => Promise<Note | null>;
  saveNoteContent: (noteId: string | Id<"notes">, content: string, title: string) => Promise<Note | null>;
  deleteNote: (noteId: Id<"notes"> | string) => Promise<boolean>;
  analyzeNote: (content: string, platform?: string) => Promise<{ success: boolean; ideas?: string[]; message?: string }>;
  generateIdeas: (platform?: string, options?: any) => Promise<{ success: boolean; ideas?: SmartNoteIdea[]; error?: string }>;
  formatAnalysisToMarkdown: any;
}

export function useSmartNotes(userId: string | undefined): SmartNotesHook {
  // Fetch notes using Convex useQuery
  const notesFromConvex = useQuery(api.notes.getNotesByUser, userId ? { userId } : "skip");
  
  // State variables
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState<boolean>(false);
  
  // Define isLoading based on query status
  const isLoading = notesFromConvex === undefined && userId !== undefined;

  // Convex mutations
  const createNoteConvex = useMutation(api.notes.createNote);
  const updateNoteConvex = useMutation(api.notes.updateNote);
  const updateNoteContentConvex = useMutation(api.notes.updateNoteContent);
  const deleteNoteConvex = useMutation(api.notes.deleteNote);

  // Update local notes state when Convex data changes
  useEffect(() => {
    if (notesFromConvex) {
      // Transform the data to ensure it matches the Note interface
      const transformedNotes: Note[] = notesFromConvex.map(note => ({
        ...note,
        // Ensure required properties have default values if they're missing
        content: note.content || "",
        title: note.title || "",
        createdAt: note.createdAt || note._creationTime,
        updatedAt: note.updatedAt || note._creationTime,
        important: note.important ?? false,
        tags: note.tags || [],
        references: note.references || []
      }));
      setNotes(transformedNotes);
    }
  }, [notesFromConvex]);

  /**
   * Save a new note with content
   */
  const saveNote = useCallback(async (
    content: string,
    options: {
      title?: string;
      type?: NoteType;
      references?: string[];
    } = {}
  ): Promise<{ success: boolean; noteId?: Id<"notes">; error?: string }> => {
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const { title = "Untitled Note", type = "idea", references = [] } = options;

    try {
      setIsSaving(true);
      console.log("Creating new note:", { title, contentLength: content?.length || 0 });

      const createdNote = await createNoteConvex({
        userId,
        title,
        content: content || "",
        type,
        references,
      });

      if (createdNote) {
        console.log("Note created successfully:", createdNote._id);
        // Optimistic update could be done here, but we'll rely on the query to refresh
        return { success: true, noteId: createdNote._id };
      } else {
        console.error("Failed to create note - no ID returned");
        return { success: false, error: "Failed to create note" };
      }
    } catch (error) {
      console.error("Error creating note:", error);
      return { success: false, error: String(error) };
    } finally {
      setIsSaving(false);
    }
  }, [userId, createNoteConvex]);

  /**
   * Delete a note by ID
   */
  const deleteNote = useCallback(async (
    noteId: Id<"notes"> | string
  ): Promise<boolean> => {
    if (!userId) return false;
    
    if (typeof noteId === 'string' && noteId.startsWith('local_')) {
      // Handle local note deletion
      setNotes(prev => prev.filter(n => n._id !== noteId));
      return true;
    }
    
    const convexNoteId = noteId as Id<"notes">;
    
    setIsSaving(true);
    try {
      const success = await deleteNoteConvex({ 
        noteId: convexNoteId, 
        userId 
      });
      
      if (success) {
        setNotes(prev => prev.filter(n => n._id !== convexNoteId));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [userId, deleteNoteConvex, setNotes]);

  /**
   * Save only the content and title of a note
   * This is a simpler mutation to avoid schema validation errors
   */
  const saveNoteContent = useCallback(async (
    noteId: string | Id<"notes">,
    content: string,
    title: string
  ): Promise<Note | null> => {
    if (!userId) return null;
    
    if (typeof noteId === 'string' && noteId.startsWith('local_')) {
      console.warn('Cannot use saveNoteContent with local IDs');
      return null;
    }
    
    const convexNoteId = noteId as Id<"notes">;
    
    setIsSaving(true);
    try {
      console.log('Saving note content:', {
        id: String(convexNoteId),
        title,
        contentLength: content?.length || 0
      });
      
      const updatedNote = await updateNoteContentConvex({
        noteId: convexNoteId,
        userId,
        content: content || '',
        title: title || ''
      });
      
      if (updatedNote) {
        console.log('Note content saved successfully');
        setNotes(prev => prev.map(n => 
          n._id === convexNoteId ? { ...n, content, title, updatedAt: Date.now() } : n
        ));
      }
      
      return updatedNote as Note | null;
    } catch (error) {
      console.error('Error saving note content:', error);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [userId, updateNoteContentConvex, setNotes]);

  /**
   * Update a note with various fields
   */
  const updateNote = useCallback(async (
    noteId: string | Id<"notes">,
    updateFields: NoteUpdate,
    force: boolean = false
  ): Promise<Note | null> => {
    if (!userId) return null;

    // Handle local notes differently
    if (typeof noteId === 'string' && noteId.startsWith('local_')) {
      if (!force) {
        console.warn('Cannot update local note without force flag');
        return null;
      }
      
      setIsSaving(true);
      try {
        // Update local note in state
        const updatedNote = { 
          ...updateFields, 
          _id: noteId, 
          updatedAt: Date.now() 
        } as Note;
        
        setNotes(prev => prev.map(n => 
          n._id === noteId ? { ...n, ...updatedNote } : n
        ));
        
        return updatedNote;
      } catch (error) {
        console.error('Error updating local note:', error);
        return null;
      } finally {
        setIsSaving(false);
      }
    }

    // Handle Convex notes
    const convexNoteId = noteId as Id<"notes">;
    
    setIsSaving(true);
    try {
      console.log('Updating note:', {
        id: String(convexNoteId),
        fields: Object.keys(updateFields)
      });
      
      const updatedNote = await updateNoteConvex({
        noteId: convexNoteId,
        userId,
        updates: updateFields
      });
      
      if (updatedNote) {
        console.log('Note updated successfully');
        setNotes(prev => prev.map(n => 
          n._id === convexNoteId ? { ...n, ...updateFields, updatedAt: Date.now() } : n
        ));
      }
      
      return updatedNote as Note | null;
    } catch (error) {
      console.error('Error updating note:', error);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [userId, updateNoteConvex, setNotes]);

  /**
   * Analyze note content using AI
   */
  const analyzeNote = useCallback(async (
    content: string,
    platform: string = 'general'
  ): Promise<{ success: boolean; ideas?: string[]; message?: string }> => {
    if (!content || content.trim().length < 10) {
      return { success: false, message: 'Content is too short to analyze' };
    }

    setIsAnalyzing(true);
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        return { success: false, message: 'API key not available' };
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          platform,
          apiKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed with status: ${response.status}`);
      }

      const result: SmartNoteAnalysis = await response.json();
      
      if (result.success && result.data?.analysis) {
        return { 
          success: true, 
          ideas: [result.data.analysis] 
        };
      } else {
        return { 
          success: false, 
          message: result.message || 'Analysis failed without specific error' 
        };
      }
    } catch (error) {
      console.error('Error analyzing note:', error);
      return { 
        success: false, 
        message: String(error) 
      };
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  /**
   * Generate content ideas using AI
   */
  const generateIdeas = useCallback(async (
    platform: string = 'general',
    options: any = {}
  ): Promise<{ success: boolean; ideas?: SmartNoteIdea[]; error?: string }> => {
    setIsGeneratingIdeas(true);
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        return { success: false, error: 'API key not available' };
      }

      const response = await fetch('/api/generate-ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          options,
          apiKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`Idea generation failed with status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.ideas) {
        return { 
          success: true, 
          ideas: result.ideas.map((idea: any, index: number) => ({
            id: `idea-${index}`,
            content: idea.content,
            platform,
            confidence: idea.confidence || 0.8
          }))
        };
      } else {
        return { 
          success: false, 
          error: result.message || 'Idea generation failed without specific error' 
        };
      }
    } catch (error) {
      console.error('Error generating ideas:', error);
      return { 
        success: false, 
        error: String(error) 
      };
    } finally {
      setIsGeneratingIdeas(false);
    }
  }, []);

  // Return all functions and state from the hook
  return {
    notes,
    isLoading,
    isAnalyzing,
    isSaving,
    isGeneratingIdeas,
    saveNote,
    updateNote,
    saveNoteContent,
    deleteNote,
    analyzeNote,
    generateIdeas,
    formatAnalysisToMarkdown
  };
}
