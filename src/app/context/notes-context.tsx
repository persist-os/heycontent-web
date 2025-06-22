'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSmartNotes } from '@/app/dashboard/notes/hooks/useSmartNotes';
import { useTitleGeneration } from '@/app/dashboard/notes/hooks/useTitleGeneration';
import { useTypeClassification } from '@/app/dashboard/notes/hooks/useTypeClassification';
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
  createLocalNote: (content: string, title?: string) => Promise<string>;
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
    saveNote: backendSaveNote,
    updateNote, 
    deleteNote, 
    saveNoteContent 
  } = useSmartNotes(userId);

  // Add title generation and type classification hooks
  const { generateTitle } = useTitleGeneration();
  const { classifyType } = useTypeClassification();

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Clean content for note saving - remove markdown quote formatting
  const cleanContentForNotes = useCallback((content: string): string => {
    return content
      .split('\n')
      .map(line => {
        // Remove quote markers (> ) from the beginning of lines
        let cleanedLine = line.replace(/^>\s?/, '');
        
        // Remove leading and trailing quotation marks from the line
        cleanedLine = cleanedLine.replace(/^["'"'""]/, '').replace(/["'"'""]$/, '');
        
        return cleanedLine;
      })
      .join('\n')
      .trim();
  }, []);

  const createLocalNote = useCallback(async (content: string, title?: string): Promise<string> => {
    if (!userId) {
      console.warn('Cannot create note: user not authenticated');
      return '';
    }

    const cleanedContent = cleanContentForNotes(content);
    console.log("📝 [createLocalNote] Creating note from chat content:", {
      originalLength: content.length,
      cleanedLength: cleanedContent.length,
      hasTitle: !!title,
      title: title,
      userId
    });

    // Use the save-with-title API that handles AI generation automatically
    console.log("🎯 [createLocalNote] Using save-with-title API for chat content");

    try {
      const result = await backendSaveNote(cleanedContent, {
        title: title || undefined, // Let the API generate if no title provided
        type: 'idea_bank', // Start with default, let API classify
        platform: 'chat',
        skipAIGeneration: false // Let the API handle AI generation
      });

      if (result.success && result.noteId) {
        console.log("✅ [createLocalNote] Note saved successfully:", {
          noteId: result.noteId,
          platform: 'chat'
        });
        return result.noteId.toString();
      } else {
        console.error("❌ [createLocalNote] Failed to save note:", result.error);
        return '';
      }
    } catch (error) {
      console.error("💥 [createLocalNote] Error saving note:", error);
      return '';
    }
  }, [userId, backendSaveNote, cleanContentForNotes]);

  // Wrapper for saveNote to maintain compatibility
  const saveNote = useCallback(async (content: string, options: any = {}) => {
    return await backendSaveNote(content, options);
  }, [backendSaveNote]);

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