'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSmartNotes } from '@/app/dashboard/notes/hooks/useSmartNotes';
import { Note, NoteUpdate } from '@/app/dashboard/notes/types';
import type { Id } from '@/convex/_generated/dataModel';
import { useAuth } from './auth-context';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface NotesContextType {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  isLoading: boolean;
  isSaving: boolean;
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
  navigationStack: string[];
  canGoBack: boolean;
  navigateToNote: (noteId: string, fromLink?: boolean) => void;
  navigateBack: () => void;
  clearNavigationStack: () => void;
  deleteNote: (noteId: Id<"notes"> | string) => Promise<boolean>;
  updateNote: (noteId: string | Id<"notes">, updateFields: NoteUpdate, force?: boolean) => Promise<Note | null>;
  saveNoteContent: (noteId: string | Id<"notes">, content: string, title: string) => Promise<Note | null>;
  saveNote: (content: string, options?: any) => Promise<{ success: boolean; noteId?: Id<"notes">; error?: string }>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;
  const { 
    notes: fetchedNotes, 
    setNotes: setFetchedNotes,
    isLoading, 
    isSaving,
    createNote,
    updateNote, 
  } = useSmartNotes(userId);
  
  const convexDeleteNote = useMutation(api.notes.deleteNote);

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [navigationStack, setNavigationStack] = useState<string[]>([]);

  const deleteNote = useCallback(async (noteId: Id<"notes"> | string): Promise<boolean> => {
    if (!userId) {
      console.warn('Cannot delete note: user not authenticated');
      return false;
    }
    try {
      await convexDeleteNote({ noteId: noteId as Id<"notes">, userId });
      setFetchedNotes(prev => prev.filter(note => note._id !== noteId));
      return true;
    } catch (error) {
      console.error("Error deleting note:", error);
      return false;
    }
  }, [userId, convexDeleteNote, setFetchedNotes]);

  const saveNoteContent = useCallback(async (noteId: string | Id<"notes">, content: string, title: string): Promise<Note | null> => {
    return await updateNote(noteId, { content, title });
  }, [updateNote]);


  const saveNote = useCallback(async (content: string, options: any = {}) => {
    const noteData = { content, ...options };
    try {
      const newNote = await createNote(noteData);
      if (newNote) {
        return { success: true, noteId: newNote._id as Id<"notes"> };
      }
      return { success: false, error: 'Failed to create note.' };
    } catch(e) {
      const error = e as Error;
      return { success: false, error: error.message };
    }
  }, [createNote]);

  const navigateToNote = useCallback((noteId: string, fromLink?: boolean) => {
    console.log('navigateToNote called:', { noteId, fromLink, currentActiveNoteId: activeNoteId, currentStack: navigationStack });
    if (fromLink && activeNoteId) {
      setNavigationStack(prev => {
        const newStack = [...prev, activeNoteId];
        console.log('Updated navigation stack:', newStack);
        return newStack;
      });
    }
    setActiveNoteId(noteId);
  }, [activeNoteId, navigationStack]);

  const navigateBack = useCallback(() => {
    console.log('navigateBack called:', { currentStack: navigationStack });
    if (navigationStack.length > 0) {
      const previousNoteId = navigationStack[navigationStack.length - 1];
      setNavigationStack(prev => {
        const newStack = prev.slice(0, -1);
        console.log('Navigation stack after back:', newStack);
        return newStack;
      });
      setActiveNoteId(previousNoteId);
      console.log('Navigating back to:', previousNoteId);
    }
  }, [navigationStack]);

  const clearNavigationStack = useCallback(() => {
    setNavigationStack([]);
    setActiveNoteId(null);
  }, []);

  const value = {
    notes: fetchedNotes,
    setNotes: setFetchedNotes,
    isLoading,
    isSaving,
    activeNoteId,
    setActiveNoteId,
    navigationStack,
    canGoBack: navigationStack.length > 0,
    navigateToNote,
    navigateBack,
    clearNavigationStack,
    deleteNote,
    updateNote,
    saveNoteContent,
    saveNote,
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