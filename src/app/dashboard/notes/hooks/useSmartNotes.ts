import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Note, NoteUpdate, NoteType } from "../types";
import { getApiKey } from "@/app/lib/api-helpers";
import { formatAnalysisToMarkdown } from '../utils/format-utils';
import { useTitleTypeAnalysis } from './useTitleTypeAnalysis';

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
  isSaving: boolean;
  saveNote: (content: string, options?: any) => Promise<{ success: boolean; noteId?: Id<"notes">; error?: string }>;
  updateNote: (noteId: string | Id<"notes">, updateFields: NoteUpdate, force?: boolean) => Promise<Note | null>;
  saveNoteContent: (noteId: string | Id<"notes">, content: string, title: string) => Promise<Note | null>;
  deleteNote: (noteId: Id<"notes"> | string) => Promise<boolean>;
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  generateTitleAndType: (noteId: string | Id<"notes">, content: string) => Promise<void>;
}

export function useSmartNotes(userId: string | undefined): SmartNotesHook {
  // Fetch notes using Convex useQuery
  const notesFromConvex = useQuery(api.notes.getNotesByUser, userId ? { userId } : "skip");
  
  // State variables
  const [notes, setNotes] = useState<Note[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Unified title and type analysis hook
  const { analyzeTitleAndType } = useTitleTypeAnalysis();

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
        content: note.content ?? "",
        title: note.title ?? "",
        createdAt: note.createdAt ?? note._creationTime,
        updatedAt: note.updatedAt ?? note._creationTime,
        important: note.important ?? false,
        tags: note.tags ?? [],
      }));
      
      // Only update state if the data has actually changed
      setNotes(prev => {
        // If no previous notes or different length, definitely update
        if (prev.length === 0 || prev.length !== transformedNotes.length) {
          console.log('[useSmartNotes] Notes length changed, updating:', transformedNotes.length);
          return transformedNotes;
        }
        
        // Check if any note content has actually changed
        const hasChanges = transformedNotes.some((newNote, index) => {
          const oldNote = prev[index];
          return !oldNote || JSON.stringify(oldNote) !== JSON.stringify(newNote);
        });
        
        if (hasChanges) {
          console.log('[useSmartNotes] Notes content changed, updating');
          return transformedNotes;
        }
        
        // No changes, return same reference to prevent re-render
        console.log('[useSmartNotes] No changes in Convex data, skipping update');
        return prev;
      });
    }
  }, [notesFromConvex]);

  /**
   * Save a new note with content - NO AUTO-GENERATION
   */
  const saveNote = useCallback(async (
    content: string,
    options: {
      title?: string;
      type?: NoteType;
      references?: string[];
      platform?: string;
      skipAIGeneration?: boolean;
    } = {}
  ): Promise<{ success: boolean; noteId?: Id<"notes">; error?: string }> => {
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const { 
      title = "Untitled Note", 
      type = "idea_bank", 
      platform = "general"
    } = options;

    console.log("🚀 [saveNote] Creating note with basic info only:", {
      contentLength: content?.length || 0,
      title,
      type,
      platform,
      userId
    });

    try {
      setIsSaving(true);
      
      // Create the note with basic info only - no auto-generation
      const noteId = await createNoteConvex({
        userId,
        title,
        content: content || "",
        type,
        tags: [],
        platform,
      });

      if (noteId) {
        console.log("✅ [saveNote] Note created successfully:", noteId);
        return { success: true, noteId };
      } else {
        console.error("❌ [saveNote] Failed to create note - no ID returned");
        return { success: false, error: "Failed to create note" };
      }
    } catch (error) {
      console.error("💥 [saveNote] Error creating note:", error);
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
   * Save only the content and title of a note - NO AUTO-GENERATION
   */
  const saveNoteContent = useCallback(async (
    noteId: string | Id<"notes">,
    content: string,
    title: string
  ): Promise<Note | null> => {
    if (!userId) return null;
    
    // Always use Convex IDs
    const convexNoteId = noteId as Id<"notes">;
    
    console.log("💾 [saveNoteContent] Saving content only (no auto-generation):", {
      noteId: String(convexNoteId),
      title,
      contentLength: content?.length || 0
    });
    
    setIsSaving(true);
    try {
      const updatedNote = await updateNoteContentConvex({
        noteId: convexNoteId,
        userId,
        content: content || '',
        title: title || ''
      });
      
      if (updatedNote) {
        console.log('✅ [saveNoteContent] Content saved successfully');
        setNotes(prev => {
          const updated = prev.map(n => n._id === convexNoteId ? updatedNote : n);
          return updated;
        });
        
        return updatedNote;
      } else {
        console.warn('❌ [saveNoteContent] Save failed - no note returned');
        return null;
      }
    } catch (error) {
      console.error('💥 [saveNoteContent] Error saving note content:', error);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [userId, updateNoteContentConvex, setNotes]);

  /**
   * Update a note with various fields - NO AUTO-GENERATION
   */
  const updateNote = useCallback(async (
    noteId: string | Id<"notes">,
    updateFields: NoteUpdate,
    force: boolean = false
  ): Promise<Note | null> => {
    if (!userId) return null;

    // Always use Convex IDs
    const convexNoteId = noteId as Id<"notes">;
    
    console.log("🔄 [updateNote] Updating note fields (no auto-generation):", {
      noteId: String(convexNoteId),
      updateFields: Object.keys(updateFields),
      userId
    });
    
    setIsSaving(true);
    try {
      const updatedNote = await updateNoteConvex({
        noteId: convexNoteId,
        userId,
        updates: updateFields,
      });
      
      if (updatedNote) {
        console.log('✅ [updateNote] Note updated successfully');
        
        setNotes(prev => {
          const existingNote = prev.find(n => n._id === convexNoteId);
          const mergedNote = { ...existingNote, ...updatedNote };
          
          // Only update if the data has actually changed
          if (!existingNote || JSON.stringify(existingNote) !== JSON.stringify(mergedNote)) {
            const updated = prev.map(n => 
              n._id === convexNoteId ? mergedNote : n
            );
            return updated;
          }
          
          // No change needed, return the same array reference to prevent re-render
          return prev;
        });
        
        return updatedNote;
      } else {
        console.warn('❌ [updateNote] Update failed - no note returned');
        return null;
      }
    } catch (error) {
      console.error('💥 [updateNote] Error updating note:', error);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [userId, updateNoteConvex, setNotes]);

  /**
   * EXPLICIT function to generate title and type - ONLY called when needed
   * This is the function that should be called on blur or save button click
   */
  const generateTitleAndType = useCallback(async (
    noteId: string | Id<"notes">,
    content: string
  ): Promise<void> => {
    if (!userId || !content || content.trim().length < 10) {
      console.log('⏭️ [generateTitleAndType] Skipping - insufficient content');
      return;
    }

    const convexNoteId = noteId as Id<"notes">;
    
    console.log("🎯 [generateTitleAndType] EXPLICIT generation requested:", {
      noteId: String(convexNoteId),
      contentLength: content.length
    });
    
    try {
      const { getApiKey } = await import('@/app/lib/api-helpers');
      const apiKey = await getApiKey();
      
      if (!apiKey) {
        console.error('❌ [generateTitleAndType] No API key available');
        return;
      }

      const response = await fetch('/api/smart-note/analyze-title-type', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          content: content.trim(),
          platform: "general",
          noteId: String(convexNoteId)
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ [generateTitleAndType] Generation completed:", {
          title: result.title,
          type: result.type,
          titleGenerated: result.titleGenerated,
          typeGenerated: result.typeGenerated
        });
      } else {
        console.error('❌ [generateTitleAndType] API error:', response.status);
      }
    } catch (error) {
      console.error('💥 [generateTitleAndType] Error:', error);
    }
  }, [userId]);

  // Return all functions and state from the hook
  return {
    notes,
    isLoading,
    isSaving,
    saveNote,
    updateNote,
    saveNoteContent,
    deleteNote,
    setNotes,
    generateTitleAndType,
  };
}