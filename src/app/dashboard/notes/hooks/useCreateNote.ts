'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useNotes } from '@/app/context/notes-context';
import { getApiKey } from '@/app/lib/api-helpers';

export const useCreateNote = () => {
  const router = useRouter();
  const { createNote, setActiveNoteId } = useNotes();
  const [isCreating, setIsCreating] = useState(false);
  const [metadataPending, setMetadataPending] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef(metadataPending);
  // Keep ref in sync
  useCallback(() => { pendingRef.current = metadataPending; }, [metadataPending]);

  const generateMetadata = useCallback(async (
    noteId: string,
    noteContent: string
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    if (!noteContent || noteContent.trim().length < 10) {
      setError("Let's add a bit more to your note before we work our magic!");
      return { success: false, error: "Content too short" };
    }
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        setError("We couldn't verify your account. Please refresh and try again—you're doing great!");
        return { success: false, error: "API key not found" };
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
        setError(
          errorData?.message
            ? `Oops! ${errorData.message} (But don't worry, your note is safe!)`
            : "We hit a little snag generating your note's magic. Please try again in a moment!"
        );
        throw new Error(errorData.message || 'Failed to generate metadata');
      }
      setError(null);
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      setError("Something went sideways, but your creativity is still on track! Please try again.");
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }, []);

  const createNoteInternal = async (
    content: string,
    options: {
      redirect?: boolean;
      callback?: () => void;
      customTitle?: string;
      customType?: string;
    } = {}
  ): Promise<string | null> => {
    const { redirect = false, callback, customTitle, customType } = options;
    setIsCreating(true);
    setError(null);
    try {
      let noteUpdate: any = { content, title: customTitle };
      if (customType && ['idea_bank','content_script','collaboration_note','analytics_insight','reflection_journal','task_checklist'].includes(customType)) {
        noteUpdate.type = customType;
      }
      const noteObj = await createNote(noteUpdate);
      const success = !!noteObj && !!noteObj._id;
      const noteId = noteObj?._id;
      if (success && noteId) {
        // Block duplicate metadata generation for this note
        if (!pendingRef.current[noteId]) {
          setMetadataPending(prev => ({ ...prev, [noteId]: true }));
          if (content && content.trim()) {
            const metaResult = await generateMetadata(noteId.toString(), content);
            if (!metaResult.success) {
              // Error already set by generateMetadata
              setMetadataPending(prev => {
                const updated = { ...prev };
                delete updated[noteId];
                return updated;
              });
            } else {
              // Wait for Convex to confirm in the main notes hook (not here)
            }
          }
        }
        if (redirect) {
          setActiveNoteId(noteId.toString());
          router.push('/dashboard/notes');
        }
        if (callback) {
          callback();
        }
        return noteId.toString();
      } else {
        setError("We couldn't save your note this time, but your ideas are still golden! Please try again.");
        return null;
      }
    } catch (error) {
      setError("Something went sideways, but your creativity is still on track! Please try again.");
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return { createNote: createNoteInternal, isCreating, error };
}; 