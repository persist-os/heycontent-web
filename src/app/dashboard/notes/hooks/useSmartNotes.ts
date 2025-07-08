import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Note, NoteUpdate } from "../types";
import { getApiKey } from "@/app/lib/api-helpers";
import { toast } from 'sonner';

// Define the return type for the hook to ensure TypeScript knows about all returned functions
interface SmartNotesHook {
  notes: Note[];
  isLoading: boolean;
  isSaving: boolean;
  createNote: (noteData: NoteUpdate) => Promise<Note | null>;
  updateNote: (noteId: string | Id<"notes">, updateFields: NoteUpdate, force?: boolean) => Promise<Note | null>;
  activeNoteId: string | undefined;
  setActiveNoteId: (id: string | undefined) => void;
}

// Validation layer for NoteUpdate
function validateNoteUpdate(update: NoteUpdate, context: string): NoteUpdate {
  if (update.tags !== undefined && update.tags.length === 0) {
    console.warn(`⚠️ Empty tags being sent from: ${context}`);
    // Optionally: throw or block here if not explicitly clearing tags
  }
  return update;
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
  const [metadataPending, setMetadataPending] = useState<Record<string, boolean>>({});

  // isLoading based on query status
  const isLoading = notesFromConvex === undefined && userId !== undefined;

  // notes: always derived from Convex query
  const notes: Note[] = useMemo(() => {
    if (!notesFromConvex) return [];
    return notesFromConvex.map(note => ({
      ...note,
      content: note.content ?? "",
      title: note.title ?? "",
      createdAt: note.createdAt ?? note._creationTime,
      updatedAt: note.updatedAt ?? note._creationTime,
      important: note.important ?? false,
      tags: note.tags ?? [],
    }));
  }, [notesFromConvex]);

  // --- Metadata Generation (debounced, cancellable) ---
  const generateMetadata = useCallback(
    (noteId: string, noteContent: string) => {
      if (!noteContent || noteContent.trim().length < 10) return;
      // Cancel any in-flight request for this note
      if (abortControllers.current[noteId]) {
        abortControllers.current[noteId].abort();
        delete abortControllers.current[noteId];
      }
      // Debounce: clear any existing timer
      if (metadataTimers.current[noteId]) {
        clearTimeout(metadataTimers.current[noteId]);
      }
      setMetadataPending(prev => ({ ...prev, [noteId]: true }));
      metadataTimers.current[noteId] = setTimeout(async () => {
        const controller = new AbortController();
        abortControllers.current[noteId] = controller;
        try {
          const apiKey = await getApiKey();
          if (!apiKey) {
            toast.error("We need to verify your account to continue. Please sign in again!");
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
              ? "We're getting lots of love from creators right now! Please take a quick break and try again in a moment. Your creative flow is worth the wait! 🎨✨"
              : errorData.message || "We hit a creative block while generating insights. Your work is safe - please try again in a moment!";
            toast.error(friendlyError);
            return;
          }
          // Optionally: show a positive affirmation here
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const friendlyError = errorMessage.includes('rate limit')
            ? "We're getting lots of love from creators right now! Please take a quick break and try again in a moment. Your creative flow is worth the wait! 🎨✨"
            : `We hit a creative block: ${errorMessage}. Your work is safe - please try again!`;
          toast.error(friendlyError);
        } finally {
          setMetadataPending(prev => {
            const updated = { ...prev };
            delete updated[noteId];
            return updated;
          });
          delete abortControllers.current[noteId];
        }
      }, 500); // 500ms debounce
    },
    []
  );

  // --- Create Note ---
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
      // No manual setNotes! Convex will update notes array reactively
      return newNote as Note;
    } catch (error) {
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [userId, updateNoteConvex]);

  // --- Update Note ---
  const updateNote = useCallback(async (
    noteId: string | Id<"notes">,
    updateFields: NoteUpdate,
    force: boolean = false
  ): Promise<Note | null> => {
    if (!userId) return null;
    setIsSaving(true);
    try {
      // CLEAN IMAGE OBJECTS - Remove any extra fields not in schema
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
      // Validate update before sending
      const validatedUpdate = validateNoteUpdate(cleanedUpdateFields, 'useSmartNotes.updateNote');
      const mutationArgs = {
        noteId: noteId as Id<"notes">,
        userId,
        updates: validatedUpdate,
      };
      const updatedNote = await updateNoteConvex(mutationArgs);
      // No manual setNotes! Convex will update notes array reactively
      // Metadata generation (debounced, only if content changed and not forced)
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
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [userId, updateNoteConvex, generateMetadata]);

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => {
      // Clear all timers and abort controllers
      Object.values(metadataTimers.current).forEach(clearTimeout);
      Object.values(abortControllers.current).forEach(ctrl => ctrl.abort());
    };
  }, []);

  // --- Expose only the minimal API ---
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