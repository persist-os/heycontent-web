'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotes } from '@/app/context/notes-context';

export const useCreateNote = () => {
  const router = useRouter();
  const { createLocalNote, setActiveNoteId } = useNotes();
  const [isCreating, setIsCreating] = useState(false);

  const createNote = async (content: string, callback?: () => void, customTitle?: string) => {
    if (!content.trim()) return;
    
    setIsCreating(true);
    
    try {
      console.log("🚀 [useCreateNote] Starting note creation process");
      
      const newNoteId = await createLocalNote(content, customTitle);
      
      if (newNoteId) {
        console.log("✅ [useCreateNote] Note created successfully:", newNoteId);
        setActiveNoteId(newNoteId);
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