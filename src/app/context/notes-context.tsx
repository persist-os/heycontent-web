'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSmartNotes } from '@/app/dashboard/notes/hooks/useSmartNotes';
import { Note, NoteUpdate } from '@/app/dashboard/notes/types';
import type { Id } from '@/convex/_generated/dataModel';
import { useAuth } from './auth-context';

interface NotesContextType {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  isLoading: boolean;
  isSaving: boolean;
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
  createLocalNote: (content: string, title?: string) => string;
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
    saveNote,
    updateNote, 
    deleteNote, 
    saveNoteContent 
  } = useSmartNotes(userId);

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  const createLocalNote = useCallback((content: string, title: string = 'New Note from Chat'): string => {
    if (!userId) {
      console.error("Cannot create local note without a user.");
      return '';
    }
    const localId = `local_${Date.now()}`;
    const newNote: Note = {
      _id: localId as any, // Treat localId as Id<"notes"> for consistency
      _creationTime: Date.now(),
      userId: userId,
      content,
      title,
      type: 'idea',
      platform: 'twitter',
      isLocal: true, // Flag to identify local-only notes
      // Add default values for other required fields
      createdAt: Date.now(),
      updatedAt: Date.now(),
      important: false,
      tags: [],
    };

    setFetchedNotes(prevNotes => [newNote, ...prevNotes]);
    return localId;
  }, [userId, setFetchedNotes]);

  const value = {
    notes: fetchedNotes,
    setNotes: setFetchedNotes,
    isLoading,
    isSaving,
    activeNoteId,
    setActiveNoteId,
    createLocalNote,
    deleteNote,
    updateNote,
    saveNoteContent,
    saveNote,
  };

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
};

export const useNotes = (): NotesContextType => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}; 