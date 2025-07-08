import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Note, NoteUpdate, NoteType } from "../types";
import { getApiKey } from "@/app/lib/api-helpers";
import { formatAnalysisToMarkdown } from '../utils/format-utils';
import { toast } from 'sonner';

// Define the return type for the hook to ensure TypeScript knows about all returned functions
interface SmartNotesHook {
  notes: Note[];
  isLoading: boolean;
  isSaving: boolean;
  createNote: (noteData: NoteUpdate) => Promise<Note | null>;
  updateNote: (noteId: string | Id<"notes">, updateFields: NoteUpdate, force?: boolean) => Promise<Note | null>;
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
  const updateNoteConvex = useMutation(api.notes.updateNote);

  const generateMetadata = useCallback(async (
    noteId: string,
    noteContent: string
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    console.log("🚀 [generateMetadata] Starting metadata generation for note:", noteId);
    if (!noteContent || noteContent.trim().length < 10) {
      console.log("⏭️ [generateMetadata] Skipping: content is too short.");
      return { success: false, error: "Content too short" };
    }

    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        console.error("🔑 [generateMetadata] API key not found.");
        return { success: false, error: "We need to verify your account to continue. Please sign in again!" };
      }

      const response = await fetch('/api/smart-notes/generate-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ noteId, noteContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("⚠️ [generateMetadata] API call failed:", { status: response.status, errorData });
        const friendlyError = errorData.message?.includes('rate limit') 
          ? "We're getting lots of love from creators right now! Please take a quick break and try again in a moment. Your creative flow is worth the wait! 🎨✨"
          : errorData.message || "We hit a creative block while generating insights. Your work is safe - please try again in a moment!";
        throw new Error(friendlyError);
      }

      const data = await response.json();
      console.log("✅ [generateMetadata] Metadata generated successfully:", data);
      return { success: true, data };
    } catch (error) {
      console.error("🔄 [generateMetadata] Error during metadata generation:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const friendlyError = errorMessage.includes('rate limit')
        ? "We're getting lots of love from creators right now! Please take a quick break and try again in a moment. Your creative flow is worth the wait! 🎨✨"
        : `We hit a creative block: ${errorMessage}. Your work is safe - please try again!`;
      return { success: false, error: friendlyError };
    }
  }, []);

  const createNote = useCallback(async (
    noteData: NoteUpdate
  ): Promise<Note | null> => {
    if (!userId) return null;

    console.log("📝 [createNote] Starting note creation:", {
      userId,
      noteData: Object.keys(noteData),
    });

    setIsSaving(true);
    try {
      const newNote = await updateNoteConvex({
        userId,
        updates: noteData,
      });

      if (newNote) {
        console.log('✅ [createNote] Note created successfully:', newNote);
        setNotes(prev => [newNote as Note, ...prev]);
        return newNote as Note;
      } else {
        console.warn('⚠️ [createNote] Note creation returned an unexpected response.');
        toast.error("Hmm, we couldn't save your note. Your creative work is safe - please try again!");
        return null;
      }
    } catch (error) {
      console.error('🔄 [createNote] Error creating note:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(
        errorMessage.includes('rate limit')
          ? "We're getting lots of love from creators right now! Please take a quick break and try again in a moment. Your creative flow is worth the wait! 🎨✨"
          : "We hit a creative block while saving your note. Your work is safe - please try again!"
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [userId, updateNoteConvex, setNotes]);

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
      setNotes(transformedNotes);
    }
  }, [notesFromConvex]);

  /**
   * Update a note with various fields
   */
  const updateNote = useCallback(async (
    noteId: string | Id<"notes">,
    updateFields: NoteUpdate,
    force: boolean = false
  ): Promise<Note | null> => {
    if (!userId) return null;

    console.log("🔄 [updateNote] Starting note update:", {
      noteId: String(noteId),
      updateFields: Object.keys(updateFields),
      userId,
      hasContent: 'content' in updateFields,
      contentLength: updateFields.content?.length || 0
    });
    
    // DEBUG: Add detailed logging for image updates
    if (updateFields.images) {
      console.log("🖼️ [updateNote] DEBUG - Image update detected:");
      console.log("Raw noteId:", noteId);
      console.log("Raw noteId type:", typeof noteId);
      console.log("Images array length:", updateFields.images.length);
      console.log("Images array:", updateFields.images);
      console.log("UserId:", userId);
      console.log("UserId type:", typeof userId);
      
      // DETAILED TYPE CHECKING
      console.log("🔬 [updateNote] DETAILED IMAGE ANALYSIS:");
      updateFields.images.forEach((img, index) => {
        console.log(`Image ${index} FULL ANALYSIS:`, {
          // Raw values
          url: img.url,
          filename: img.filename,
          originalFilename: img.originalFilename,
          uploadedAt: img.uploadedAt,
          size: img.size,
          mimeType: img.mimeType,
          width: img.width,
          height: img.height,
          // Type checking
          urlType: typeof img.url,
          urlValid: typeof img.url === 'string' && img.url.length > 0,
          filenameType: typeof img.filename,
          filenameValid: typeof img.filename === 'string' && img.filename.length > 0,
          originalFilenameType: typeof img.originalFilename,
          originalFilenameValid: img.originalFilename === undefined || typeof img.originalFilename === 'string',
          uploadedAtType: typeof img.uploadedAt,
          uploadedAtValid: typeof img.uploadedAt === 'number' && !isNaN(img.uploadedAt),
          sizeType: typeof img.size,
          sizeValid: img.size === undefined || (typeof img.size === 'number' && !isNaN(img.size)),
          mimeTypeType: typeof img.mimeType,
          mimeTypeValid: img.mimeType === undefined || typeof img.mimeType === 'string',
          widthType: typeof img.width,
          widthValid: img.width === undefined || (typeof img.width === 'number' && !isNaN(img.width)),
          heightType: typeof img.height,
          heightValid: img.height === undefined || (typeof img.height === 'number' && !isNaN(img.height)),
        });
        
        // Check for NaN values specifically
        if (typeof img.uploadedAt === 'number' && isNaN(img.uploadedAt)) {
          console.warn(`🖼️ Image ${index} has an invalid upload timestamp`);
        }
        if (img.size !== undefined && typeof img.size === 'number' && isNaN(img.size)) {
          console.warn(`🖼️ Image ${index} has an invalid size`);
        }
        if (img.width !== undefined && typeof img.width === 'number' && isNaN(img.width)) {
          console.warn(`🖼️ Image ${index} has an invalid width`);
        }
        if (img.height !== undefined && typeof img.height === 'number' && isNaN(img.height)) {
          console.warn(`🖼️ Image ${index} has an invalid height`);
        }
      });
    }
    
    setIsSaving(true);
    try {
      console.log('Updating note:', {
        id: String(noteId),
        fields: Object.keys(updateFields),
        userId
      });
      
      console.log("updateFields being sent to Convex:", updateFields);
      
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
        console.log("🧹 [updateNote] CLEANED images for Convex:", cleanedUpdateFields.images);
      }
      
      // Construct the mutation arguments properly
      const mutationArgs = {
        noteId: noteId as Id<"notes">,
        userId,
        updates: cleanedUpdateFields,
      };
      
      console.log("Final mutation args:", mutationArgs);
      
      const updatedNote = await updateNoteConvex(mutationArgs);
      console.log('Raw response from updateNoteConvex:', updatedNote);
      
      if (updatedNote) {
        console.log('Note updated successfully:', updatedNote);
        setNotes(prev => {
          const updated = prev.map(n => 
            n._id === noteId ? { ...n, ...updatedNote } : n
          );
          console.log('[useSmartNotes] Notes after update:', updated);
          return updated;
        });

        const shouldGenerateMetadata =
          !force && // Skip metadata generation if force is true
          updateFields.content &&
          updateFields.content.trim().length >= 10 &&
          (!updatedNote.titleGenerated || !updatedNote.typeGenerated);

        if (shouldGenerateMetadata) {
          console.log(
            "🎯 [updateNote] Auto-generating metadata for updated note:",
            noteId
          );
          try {
            await generateMetadata(
              String(noteId),
              updateFields.content.trim()
            );
          } catch (metadataError) {
            console.warn(
              "⚠️ [updateNote] Metadata generation failed, but note was saved:",
              metadataError
            );
            toast.warning("We saved your note, but couldn't generate insights. Don't worry, your work is safe!");
          }
        } else if (force) {
          console.log(
            "⏭️ [updateNote] Skipping metadata generation due to force=true"
          );
        }
        
        return updatedNote;
      } else {
        console.warn('⚠️ Note update returned an unexpected response', {
          noteId,
          userId,
          updateFields: Object.keys(updateFields)
        });
        toast.error("We couldn't save your changes. Your work is safe - please try again!");
        return null;
      }
    } catch (error) {
      console.error('🔄 Error updating note:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(
        errorMessage.includes('rate limit')
          ? "We're getting lots of love from creators right now! Please take a quick break and try again in a moment. Your creative flow is worth the wait! 🎨✨"
          : "We hit a creative block while saving your changes. Your work is safe - please try again!"
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [userId, updateNoteConvex, setNotes, generateMetadata]);


  // Return all functions and state from the hook
  return {
    notes,
    isLoading,
    isSaving,
    createNote,
    updateNote,
    setNotes,
  };
}