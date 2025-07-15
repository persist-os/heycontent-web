'use client';

import React, { createContext, useContext, useCallback, useState } from 'react';
import { useSmartNotes } from '@/app/dashboard/notes/hooks/useSmartNotes';
import { Note, NoteUpdate } from '@/app/dashboard/notes/types';
import type { Id } from '@/convex/_generated/dataModel';
import { useAuth } from './auth-context';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Navigation stack entry
interface NavigationEntry {
  noteId: string;
  timestamp: number;
  fromLink: boolean; // true if navigated via a note link, false if direct navigation
}

interface NotesContextType {
  notes: Note[];
  isLoading: boolean;
  isSaving: boolean;
  createNote: (noteData: NoteUpdate) => Promise<Note | null>;
  updateNote: (noteId: string | Id<'notes'>, updateFields: NoteUpdate, force?: boolean) => Promise<Note | null>;
  activeNoteId: string | undefined;
  setActiveNoteId: (id: string | undefined) => void;
  deleteNote: (noteId: Id<'notes'> | string) => Promise<boolean>;
  // Smart navigation functionality
  navigateToNote: (noteId: string, fromLink?: boolean) => void;
  navigateBack: () => string | null; // Returns the noteId we navigated back to, or null if back to grid
  navigationStack: NavigationEntry[];
  canNavigateBack: boolean;
  clearNavigationStack: () => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;
  const {
    notes,
    isLoading,
    isSaving,
    createNote,
    updateNote,
    activeNoteId,
    setActiveNoteId,
  } = useSmartNotes(userId);

  // Navigation stack state
  const [navigationStack, setNavigationStack] = useState<NavigationEntry[]>([]);

  const convexDeleteNote = useMutation(api.notes.deleteNote);

  // Delete note: just call Convex, let reactivity update notes
  const deleteNote = useCallback(async (noteId: Id<'notes'> | string): Promise<boolean> => {
    if (!userId) {
      console.warn('Cannot delete note: user not authenticated');
      return false;
    }
    try {
      await convexDeleteNote({ noteId: noteId as Id<'notes'>, userId });
      
      // Clean up navigation stack if the deleted note is in it
      setNavigationStack(prev => prev.filter(entry => entry.noteId !== String(noteId)));
      
      // If the active note was deleted, clear it
      if (String(activeNoteId) === String(noteId)) {
        setActiveNoteId(undefined);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  }, [userId, convexDeleteNote, activeNoteId, setActiveNoteId]);

  // Smart navigation to a note
  const navigateToNote = useCallback((noteId: string, fromLink: boolean = false) => {
    console.log('🧠 Smart navigation:', { noteId, fromLink, currentActive: activeNoteId });
    
    // Don't navigate to the same note
    if (String(activeNoteId) === String(noteId)) {
      return;
    }

    // Verify the note exists
    const targetNote = notes.find(n => String(n._id) === String(noteId));
    if (!targetNote) {
      console.warn('Cannot navigate to note: note not found', noteId);
      return;
    }

    // If we're currently viewing a note and this is a link navigation, add current note to stack
    if (activeNoteId && fromLink) {
      const currentEntry: NavigationEntry = {
        noteId: String(activeNoteId),
        timestamp: Date.now(),
        fromLink: false // The current note wasn't reached via link (it's where we're leaving from)
      };
      
      setNavigationStack(prev => {
        // Avoid duplicates - if the last entry is the same note, don't add it again
        if (prev.length > 0 && prev[prev.length - 1].noteId === currentEntry.noteId) {
          return prev;
        }
        
        // Limit stack size to prevent memory issues
        const newStack = [...prev, currentEntry];
        if (newStack.length > 20) {
          return newStack.slice(-15); // Keep last 15 entries
        }
        return newStack;
      });
    }

    // Navigate to the new note
    setActiveNoteId(noteId);
  }, [activeNoteId, setActiveNoteId, notes]);

  // Smart back navigation
  const navigateBack = useCallback((): string | null => {
    console.log('🔙 Smart back navigation:', { stackLength: navigationStack.length });
    
    if (navigationStack.length === 0) {
      // No stack, go back to grid
      setActiveNoteId(undefined);
      return null;
    }

    // Get the last entry from the stack
    const lastEntry = navigationStack[navigationStack.length - 1];
    
    // Remove the last entry from the stack
    setNavigationStack(prev => prev.slice(0, -1));
    
    // Verify the note still exists
    const targetNote = notes.find(n => String(n._id) === lastEntry.noteId);
    if (!targetNote) {
      console.warn('Note in navigation stack no longer exists, trying next:', lastEntry.noteId);
      // Recursively try the next entry in the stack
      return navigateBack();
    }

    // Navigate to the previous note
    setActiveNoteId(lastEntry.noteId);
    return lastEntry.noteId;
  }, [navigationStack, setActiveNoteId, notes]);

  // Clear navigation stack
  const clearNavigationStack = useCallback(() => {
    setNavigationStack([]);
  }, []);

  // Computed property for whether we can navigate back
  const canNavigateBack = navigationStack.length > 0;

  // Clear stack when activeNoteId is manually set to undefined (e.g., going to grid)
  React.useEffect(() => {
    if (!activeNoteId) {
      setNavigationStack([]);
    }
  }, [activeNoteId]);

  // Provide the enhanced API
  const value: NotesContextType = {
    notes,
    isLoading,
    isSaving,
    createNote,
    updateNote,
    activeNoteId,
    setActiveNoteId,
    deleteNote,
    navigateToNote,
    navigateBack,
    navigationStack,
    canNavigateBack,
    clearNavigationStack,
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}; 