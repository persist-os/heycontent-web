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
  isSaving: boolean;
  saveNote: (content: string, options?: any) => Promise<{ success: boolean; noteId?: Id<"notes">; error?: string }>;
  updateNote: (noteId: string | Id<"notes">, updateFields: NoteUpdate, force?: boolean) => Promise<Note | null>;
  saveNoteContent: (noteId: string | Id<"notes">, content: string, title: string) => Promise<Note | null>;
  deleteNote: (noteId: Id<"notes"> | string) => Promise<boolean>;
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
}

export function useSmartNotes(userId: string | undefined): SmartNotesHook {
  // Fetch notes using Convex useQuery
  const notesFromConvex = useQuery(api.notes.getNotesByUser, userId ? { userId } : "skip");
  
  // State variables
  const [notes, setNotes] = useState<Note[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
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

    const { title = "Untitled Note", type = "idea" } = options;

    try {
      setIsSaving(true);
      console.log("Creating new note:", { title, contentLength: content?.length || 0 });

      const noteId = await createNoteConvex({
        userId,
        title,
        content: content || "",
        type,
        tags: [],
      });

      if (noteId) {
        console.log("Note created successfully:", noteId);
        // No optimistic update, rely on Convex query
        return { success: true, noteId };
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
    
    // Always use Convex IDs
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
      
    } catch (error) {
      console.error('Error saving note content:', error);
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

    // Always use Convex IDs
    const convexNoteId = noteId as Id<"notes">;
    
    setIsSaving(true);
    try {
      console.log('Updating note:', {
        id: String(convexNoteId),
        fields: Object.keys(updateFields)
      });
      
      console.log("updateFields being sent to Convex:", updateFields);
      
      const updatedNote = await updateNoteConvex({
        noteId: convexNoteId,
        userId,
        updates: updateFields,
      });
      
      if (updatedNote) {
        console.log('Note updated successfully');
        setNotes(prev => prev.map(n => 
          n._id === convexNoteId ? { ...n, ...updateFields, updatedAt: Date.now() } : n
        ));
      }
      
    } catch (error) {
      console.error('Error updating note:', error);
    } finally {
      setIsSaving(false);
    }
  }, [userId, updateNoteConvex, setNotes]);


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
  };
}
