import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Note, NoteUpdate } from "../types";
import { getApiKey } from "@/app/lib/api-helpers";
import { toast } from 'sonner';

// Return type for the hook
interface SmartNotesHook {
  notes: Note[];
  isLoading: boolean;
  isSaving: boolean;
  createNote: (noteData: NoteUpdate) => Promise<Note | null>;
  updateNote: (noteId: string | Id<"notes">, updateFields: NoteUpdate, force?: boolean) => Promise<Note | null>;
  activeNoteId: string | undefined;
  setActiveNoteId: (id: string | undefined) => void;
  // Manual metadata generation functions
  generateMetadataManually: (noteId: string, noteContent: string) => Promise<boolean>;
  isGeneratingMetadata: boolean;
}

export function useSmartNotes(userId: string | undefined): SmartNotesHook {
  // Fetch notes using Convex useQuery
  const notesFromConvex = useQuery(api.noteQueries.getUserNotes, userId ? { userId, numItems: 1000 } : "skip");

  // State variables
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeNoteId, setActiveNoteId] = useState<string | undefined>(undefined);
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState<boolean>(false);

  // Convex mutations
  const createNoteConvex = useMutation(api.noteMutations.createNote);
  const updateNoteConvex = useMutation(api.noteMutations.updateNote);

  // Debounce and cancellation for metadata generation
  const metadataTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const abortControllers = useRef<Record<string, AbortController>>({});
  const metadataPending = useRef<Record<string, boolean>>({});

  // Loading state
  const isLoading = notesFromConvex === undefined && userId !== undefined;

  // Transform Convex notes to frontend Note format
  const notes: Note[] = useMemo(() => {
    if (!notesFromConvex?.page) return [];
    return notesFromConvex.page.map(note => {
      // Convert legacy "idea" type to "idea_bank"
      let noteType = note.type ?? 'idea_bank';
      if (noteType === 'idea') {
        noteType = 'idea_bank';
      }
      
      return {
        ...note,
        content: note.content ?? "",
        title: note.title ?? "",
        createdAt: note.createdAt ?? note._creationTime,
        updatedAt: note.updatedAt ?? note._creationTime,
        important: note.important ?? false,
        tags: note.tags ?? [],
        type: noteType,
      };
    });
  }, [notesFromConvex]);

  // Manual metadata generation function
  const generateMetadataManually = useCallback(
    async (noteId: string, noteContent: string): Promise<boolean> => {
      // Skip if content is too short
      if (!noteContent || noteContent.trim().length < 10) {
        toast.error("Need at least 10 characters to generate smart title and tags.");
        return false;
      }
      
      // PREVENT DUPLICATES
      if (metadataPending.current[noteId]) {
        return false;
      }
      
      // Cancel any existing request for this note
      if (abortControllers.current[noteId]) {
        abortControllers.current[noteId].abort();
        delete abortControllers.current[noteId];
      }
      
      // Clear existing timer
      if (metadataTimers.current[noteId]) {
        clearTimeout(metadataTimers.current[noteId]);
      }
      
      setIsGeneratingMetadata(true);
      const controller = new AbortController();
      abortControllers.current[noteId] = controller;
      metadataPending.current[noteId] = true;
      
      try {
        const apiKey = await getApiKey();
        if (!apiKey) {
          toast.error("Please sign in again to generate metadata.");
          return false;
        }

        const response = await fetch('/api/smart-notes/generate-metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ noteId, noteContent }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          const friendlyError = errorData.message?.includes('rate limit')
            ? "We're getting lots of love from creators right now! Please take a quick break and try again in a moment. 🎨✨"
            : errorData.message || "We hit a creative block while generating insights. Your work is safe - please try again!";
          toast.error(friendlyError);
          return false;
        }

        toast.success("✨ Smart title and tags generated!");
        return true;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was cancelled, ignore
          return false;
        }
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        const friendlyError = errorMessage.includes('rate limit')
          ? "We're getting lots of love from creators right now! Please take a quick break and try again in a moment. 🎨✨"
          : `We hit a creative block: ${errorMessage}. Your work is safe - please try again!`;
        toast.error(friendlyError);
        return false;
      } finally {
        delete abortControllers.current[noteId];
        delete metadataPending.current[noteId];
        setIsGeneratingMetadata(false);
      }
    },
    []
  );

  // Create new note
  const createNote = useCallback(async (
    noteData: NoteUpdate
  ): Promise<Note | null> => {
    if (!userId) return null;
    
    setIsSaving(true);
    try {
      const newNote = await createNoteConvex({
        userId,
        title: noteData.title,
        content: noteData.content,
        type: noteData.type,
        tags: noteData.tags,
        platform: noteData.platform,
      });
      return newNote as Note;
    } catch (error) {
      console.error('Failed to create note:', error);
      toast.error('Failed to create note. Please try again.');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [userId, createNoteConvex]);

  // Update existing note (auto-triggering logic removed)
  const updateNote = useCallback(async (
    noteId: string | Id<"notes">,
    updateFields: NoteUpdate,
    force: boolean = false
  ): Promise<Note | null> => {
    if (!userId) return null;
    
    setIsSaving(true);
    try {
      // Clean image objects to match schema
      const cleanedUpdateFields: any = { ...updateFields };
      if (updateFields.images) {
        cleanedUpdateFields.images = updateFields.images.map(img => ({
          url: img.url,
          filename: img.filename,
          originalFilename: img.originalFilename || img.filename,
          uploadedAt: img.uploadedAt,
          size: img.size || 0,
          mimeType: img.mimeType || 'application/octet-stream',
        }));
      }

      const updatedNote = await updateNoteConvex({
        noteId: noteId as Id<"notes">,
        userId,
        updates: cleanedUpdateFields,
      });

      // AUTO-TRIGGERING LOGIC REMOVED - Now only manual generation via button

      return updatedNote as Note;
    } catch (error) {
      console.error('Failed to update note:', error);
      toast.error('Failed to update note. Please try again.');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [userId, updateNoteConvex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all timers and abort controllers
      Object.values(metadataTimers.current).forEach(clearTimeout);
      Object.values(abortControllers.current).forEach(ctrl => ctrl.abort());
    };
  }, []);

  return {
    notes,
    isLoading,
    isSaving,
    createNote,
    updateNote,
    activeNoteId,
    setActiveNoteId,
    generateMetadataManually,
    isGeneratingMetadata,
  };
}