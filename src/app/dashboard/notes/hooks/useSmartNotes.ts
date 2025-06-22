import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Note, NoteUpdate, NoteType } from "../types";
import { getApiKey } from "@/app/lib/api-helpers";
import { formatAnalysisToMarkdown } from '../utils/format-utils';
import { useTitleGeneration } from './useTitleGeneration';
import { useTypeClassification } from './useTypeClassification';

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
  
  // Title generation hook
  const { generateTitle } = useTitleGeneration();
  
  // Type classification hook
  const { classifyType } = useTypeClassification();

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
      setNotes(transformedNotes);
    }
  }, [notesFromConvex]);

  /**
   * Save a new note with content and automatic title generation
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
      platform = "general",
      skipAIGeneration = false 
    } = options;

    console.log("🚀 [saveNote] Starting note creation:", {
      contentLength: content?.length || 0,
      title,
      initialType: type,
      platform,
      skipAIGeneration,
      userId
    });

    try {
      setIsSaving(true);
      console.log("Creating new note:", { title, type, contentLength: content?.length || 0 });

      // If skipAIGeneration is true, use the direct Convex approach (for chat notes with pre-generated data)
      if (skipAIGeneration) {
        console.log("⏭️ [saveNote] Using direct Convex save - AI already processed");
        
        const noteId = await createNoteConvex({
          userId,
          title,
          content: content || "",
          type,
          tags: [],
          platform,
        });

        console.log("✅ [saveNote] Note created successfully via Convex:", noteId);
        return { success: true, noteId };
      }

      // Otherwise, use the new save-with-title API that handles AI generation
      console.log("🎯 [saveNote] Using save-with-title API for AI generation");
      
      const apiKey = await getApiKey();
      if (!apiKey) {
        return { success: false, error: "API key not available" };
      }

      const payload = {
        content: content || "",
        platform: platform || "general",
        type: type || "idea_bank",
        titleGenerated: title !== "Untitled Note" && title !== "" // If custom title provided, mark as generated
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

      if (!response.ok) {
        console.error('❌ [saveNote] API error:', data);
        return { 
          success: false, 
          error: data.error || data.message || 'Failed to save note' 
        };
      }

      if (data.success && data.noteId) {
        console.log("✅ [saveNote] Note saved successfully with AI features:", {
          noteId: data.noteId,
          title: data.title,
          type: data.type,
          titleGenerated: data.titleGenerated,
          typeGenerated: data.typeGenerated
        });

        // Convert string ID to Convex ID type
        const convexNoteId = data.noteId as Id<"notes">;
        return { success: true, noteId: convexNoteId };
      } else {
        console.error("❌ [saveNote] Save failed:", data);
        return { 
          success: false, 
          error: data.message || 'Failed to save note' 
        };
      }

    } catch (error) {
      console.error("💥 [saveNote] Error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      setIsSaving(false);
    }
  }, [userId, createNoteConvex, getApiKey]);

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
    
    console.log("💾 [saveNoteContent] Starting content save:", {
      noteId: String(convexNoteId),
      title,
      contentLength: content?.length || 0,
      contentPreview: content?.substring(0, 50) + "..."
    });
    
    setIsSaving(true);
    try {
      console.log("About to save note with title:", title);
      console.log('Saving note content:', {
        id: String(convexNoteId),
        title,
        contentLength: content?.length || 0,
        userId
      });
      
      const updatedNote = await updateNoteContentConvex({
        noteId: convexNoteId,
        userId,
        content: content || '',
        title: title || ''
      });
      
      console.log('Raw response from updateNoteContentConvex:', updatedNote);
      
      if (updatedNote) {
        console.log('Note content saved successfully:', updatedNote);
        setNotes(prev => {
          const updated = prev.map(n => n._id === convexNoteId ? updatedNote : n);
          console.log("Notes after update:", updated);
          return updated;
        });

        return updatedNote;
      }
      
      return null;
    } catch (error) {
      console.error('💥 [saveNoteContent] Error saving note content:', error);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [userId, updateNoteContentConvex]);

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
    
    console.log("🔄 [updateNote] Starting note update:", {
      noteId: String(convexNoteId),
      updateFields: Object.keys(updateFields),
      userId,
      hasContent: 'content' in updateFields,
      contentLength: updateFields.content?.length || 0
    });
    
    setIsSaving(true);
    try {
      console.log('Updating note:', {
        id: String(convexNoteId),
        fields: Object.keys(updateFields),
        userId
      });
      
      console.log("updateFields being sent to Convex:", updateFields);
      
      const updatedNote = await updateNoteConvex({
        noteId: convexNoteId,
        userId,
        updates: updateFields,
      });
      console.log('Raw response from updateNoteConvex:', updatedNote);
      
      if (updatedNote) {
        console.log('Note updated successfully:', updatedNote);
        setNotes(prev => {
          const updated = prev.map(n => 
            n._id === convexNoteId ? { ...n, ...updatedNote } : n
          );
          console.log('[useSmartNotes] Notes after update:', updated);
          return updated;
        });

        // 🎯 AUTO-CLASSIFY TYPE if content was updated and conditions are met
        const shouldClassifyType = (
          updateFields.content && 
          updateFields.content.trim().length >= 10 && 
          updatedNote.type === "idea_bank" && // Only classify if still default type
          !updatedNote.typeGenerated // Only classify if not already classified
        );

        console.log("🔍 [updateNote] Type classification check:", {
          shouldClassifyType,
          hasContentUpdate: !!updateFields.content,
          contentLength: updateFields.content?.trim().length || 0,
          currentType: updatedNote.type,
          isDefaultType: updatedNote.type === "idea_bank",
          alreadyClassified: updatedNote.typeGenerated,
          contentPreview: updateFields.content?.trim().substring(0, 50) + "..."
        });

        if (shouldClassifyType) {
          console.log("🎯 [updateNote] Auto-classifying type for updated note:", convexNoteId);
          console.log("📤 [updateNote] Sending to type classifier:", {
            content: updateFields.content!.trim().substring(0, 100) + "...",
            platform: updatedNote.platform || "general",
            noteId: String(convexNoteId)
          });
          
          try {
            const typeResult = await classifyType({
              content: updateFields.content!.trim(),
              platform: updatedNote.platform || "general",
              noteId: String(convexNoteId),
            });
            
            console.log("📥 [updateNote] Type classification result:", {
              success: typeResult.success,
              classifiedType: typeResult.type,
              confidence: typeResult.confidence,
              reasoning: typeResult.reasoning,
              typeGenerated: typeResult.typeGenerated,
              originalType: updatedNote.type
            });
            
            if (typeResult.typeGenerated && typeResult.type !== "idea_bank") {
              console.log("✅ [updateNote] Type auto-classified successfully:", {
                oldType: updatedNote.type,
                newType: typeResult.type,
                confidence: typeResult.confidence,
                reasoning: typeResult.reasoning
              });
            } else {
              console.log("ℹ️ [updateNote] Type classification completed but no change:", {
                resultType: typeResult.type,
                confidence: typeResult.confidence,
                typeGenerated: typeResult.typeGenerated,
                reason: typeResult.reasoning
              });
            }
          } catch (typeError) {
            // Don't fail the save if type classification fails
            console.warn("⚠️ [updateNote] Type classification failed, but note was saved:", typeError);
          }
        } else {
          console.log("⏭️ [updateNote] Skipping type classification:", {
            reason: !shouldClassifyType ? "Conditions not met" : "Unknown",
            noContentUpdate: !updateFields.content,
            contentTooShort: !updateFields.content || updateFields.content.trim().length < 10,
            notDefaultType: updatedNote.type !== "idea_bank",
            alreadyClassified: updatedNote.typeGenerated
          });
        }
        
        return updatedNote;
      } else {
        console.warn('updateNoteConvex returned null or invalid note!', {
          noteId: convexNoteId,
          userId,
          updateFields
        });
        return null;
      }
    } catch (error) {
      console.error('Error updating note:', error);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [userId, updateNoteConvex, setNotes, classifyType]);


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
