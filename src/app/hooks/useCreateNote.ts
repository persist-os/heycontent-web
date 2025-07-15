'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotes } from '@/app/context/notes-context';

export const useCreateNote = () => {
  const router = useRouter();
  const { saveNote, setActiveNoteId } = useNotes();
  const [isCreating, setIsCreating] = useState(false);

  const createNote = async (content: string, callback?: () => void, customTitle?: string) => {
    // Allow empty content for new notes - users can fill them in later
    // if (!content.trim()) return;
    
    setIsCreating(true);
    
    try {
      console.log("🚀 [useCreateNote] Starting note creation process");
      
      const { success, noteId } = await saveNote(content, { title: customTitle });
      
      if (success && noteId) {
        console.log("✅ [useCreateNote] Note created successfully:", noteId);
        setActiveNoteId(noteId.toString());
        router.push('/dashboard/notes');
        if (callback) {
          callback();
        }
      } else {
        console.error("❌ [useCreateNote] Failed to create note - no ID returned");
      }
    } catch (error) {
      console.error("💥 [useCreateNote] Error creating note:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return { createNote, isCreating };
}; 