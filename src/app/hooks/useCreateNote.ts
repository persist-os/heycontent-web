'use client';

import { useRouter } from 'next/navigation';
import { useNotes } from '@/app/context/notes-context';

export const useCreateNote = () => {
  const router = useRouter();
  const { createLocalNote, setActiveNoteId } = useNotes();

  const createNote = (content: string, callback?: () => void) => {
    if (!content.trim()) return;
    
    const newNoteId = createLocalNote(content);
    if (newNoteId) {
      setActiveNoteId(newNoteId);
      router.push('/dashboard/notes');
      if (callback) {
        callback();
      }
    }
  };

  return { createNote };
}; 