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
}

export function useSmartNotes(userId: string | undefined): SmartNotesHook {
  // Fetch notes using Convex useQuery
  const notesFromConvex = useQuery(api.notes.getNotesByUser, userId ? { userId } : "skip");

  // State variables
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeNoteId, setActiveNoteId] = useState<string | undefined>(undefined);

  // Convex mutations
  const updateNoteConvex = useMutation(api.notes.updateNote);

  // Debounce and cancellation for metadata generation
  const metadataTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const abortControllers = useRef<Record<string, AbortController>>({});

  // Loading state
  const isLoading = notesFromConvex === undefined && userId !== undefined;

  // Transform Convex notes to frontend Note format
  const notes: Note[] = useMemo(() => {
    if (!notesFromConvex) return [];
    return notesFromConvex.map(note => {
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

  // Debounced metadata generation
  const generateMetadata = useCallback(
    (noteId: string, noteContent: string) => {
      // Skip if content is too short
      if (!noteContent || noteContent.trim().length < 10) return;
      
      // Cancel any existing request for this note
      if (abortControllers.current[noteId]) {
        abortControllers.current[noteId].abort();
        delete abortControllers.current[noteId];
      }
      
      // Clear existing timer
      if (metadataTimers.current[noteId]) {
        clearTimeout(metadataTimers.current[noteId]);
      }
      
      // Set up new debounced request
      metadataTimers.current[noteId] = setTimeout(async () => {
        const controller = new AbortController();
        abortControllers.current[noteId] = controller;
        
        try {
          const apiKey = await getApiKey();
          if (!apiKey) {
            toast.error("Please sign in again to generate metadata.");
            return;
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
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            // Request was cancelled, ignore
            return;
          }
          
          const errorMessage = error instanceof Error ? error.message : String(error);
          const friendlyError = errorMessage.includes('rate limit')
            ? "We're getting lots of love from creators right now! Please take a quick break and try again in a moment. 🎨✨"
            : `We hit a creative block: ${errorMessage}. Your work is safe - please try again!`;
          toast.error(friendlyError);
        } finally {
          delete abortControllers.current[noteId];
        }
      }, 500); // 500ms debounce
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
      const newNote = await updateNoteConvex({
        userId,
        updates: noteData,
      });
      return newNote as Note;
    } catch (error) {
      console.error('Failed to create note:', error);
      toast.error('Failed to create note. Please try again.');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [userId, updateNoteConvex]);

  // Update existing note
  const updateNote = useCallback(async (
    noteId: string | Id<"notes">,
    updateFields: NoteUpdate,
    force: boolean = false
  ): Promise<Note | null> => {
    if (!userId) return null;
    
    setIsSaving(true);
    try {
      // Clean image objects to match schema
      const cleanedUpdateFields = { ...updateFields };
      if (cleanedUpdateFields.images) {
        cleanedUpdateFields.images = cleanedUpdateFields.images.map(img => ({
          url: img.url,
          filename: img.filename,
          ...(img.originalFilename !== undefined && { originalFilename: img.originalFilename }),
          uploadedAt: img.uploadedAt,
          ...(img.size !== undefined && { size: img.size }),
          ...(img.mimeType !== undefined && { mimeType: img.mimeType }),
          ...(img.width !== undefined && { width: img.width }),
          ...(img.height !== undefined && { height: img.height }),
        }));
      }

      const updatedNote = await updateNoteConvex({
        noteId: noteId as Id<"notes">,
        userId,
        updates: cleanedUpdateFields,
      });

      // Generate metadata if content changed and not forced
      if (
        !force &&
        updateFields.content &&
        updateFields.content.trim().length >= 10 &&
        (!updatedNote?.titleGenerated || !updatedNote?.typeGenerated)
      ) {
        generateMetadata(String(noteId), updateFields.content.trim());
      }

      return updatedNote as Note;
    } catch (error) {
      console.error('Failed to update note:', error);
      toast.error('Failed to update note. Please try again.');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [userId, updateNoteConvex, generateMetadata]);

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
  };
}