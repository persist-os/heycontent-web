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
      console.error("Cannot create local note without a user.");
      return '';
    }

    // Clean the content for note saving (remove quote markers)
    const cleanedContent = cleanContentForNotes(content);

    console.log("🚀 [createLocalNote] Starting smart note creation from chat:", {
      originalContentLength: content?.length || 0,
      cleanedContentLength: cleanedContent?.length || 0,
      hasCustomTitle: !!title,
      contentPreview: cleanedContent?.substring(0, 100) + "..."
    });

    let finalTitle = title || 'New Note from Chat';
    let finalType = 'idea_bank';

    // Generate smart title if content is substantial and no custom title provided
    const shouldGenerateTitle = (
      !title && 
      cleanedContent && 
      cleanedContent.trim().length >= 10
    );

    // Generate smart type classification if content is substantial
    const shouldClassifyType = (
      cleanedContent && 
      cleanedContent.trim().length >= 10
    );

    // Run title generation and type classification in parallel
    try {
      const promises = [];
      
      if (shouldGenerateTitle) {
        console.log("🎯 [createLocalNote] Generating smart title for chat content");
        const tempNoteId = `temp_${Date.now()}`;
        promises.push(
          generateTitle({
            content: cleanedContent.trim(),
            platform: 'chat',
            noteId: tempNoteId,
          })
        );
      } else {
        promises.push(Promise.resolve(null));
      }

      if (shouldClassifyType) {
        console.log("🎯 [createLocalNote] Classifying note type for chat content");
        const tempNoteId = `temp_${Date.now()}`;
        promises.push(
          classifyType({
            content: cleanedContent.trim(),
            platform: 'chat',
            noteId: tempNoteId,
          })
        );
      } else {
        promises.push(Promise.resolve(null));
      }

      const [titleResult, typeResult] = await Promise.all(promises);

      // Process title result
      if (titleResult?.title && titleResult.wasGenerated) {
        finalTitle = titleResult.title;
        console.log("✅ [createLocalNote] Smart title generated:", finalTitle);
      } else if (!title) {
        console.log("⚠️ [createLocalNote] Title generation failed, using fallback");
        finalTitle = cleanedContent.length > 50 
          ? cleanedContent.substring(0, 50).trim() + "..."
          : cleanedContent.trim() || 'New Note from Chat';
      }

      // Process type result
      if (typeResult?.typeGenerated && typeResult.type !== 'idea_bank') {
        finalType = typeResult.type;
        console.log("✅ [createLocalNote] Smart type classified:", finalType);
      }

    } catch (error) {
      console.warn("⚠️ [createLocalNote] AI generation error:", error);
      // Use fallbacks
      if (!title) {
        finalTitle = cleanedContent.length > 50 
          ? cleanedContent.substring(0, 50).trim() + "..."
          : cleanedContent.trim() || 'New Note from Chat';
      }
    }

    // Save directly to backend with AI-generated title and type using cleaned content
    console.log("💾 [createLocalNote] Saving note to backend with AI data:", {
      title: finalTitle,
      type: finalType,
      platform: 'chat',
      cleanedContent: true
    });

    try {
      const result = await backendSaveNote(cleanedContent, {
        title: finalTitle,
        type: finalType,
        platform: 'chat',
        // Prevent the backend from running AI generation again since we already did it
        skipAIGeneration: true
      });

      if (result.success && result.noteId) {
        console.log("✅ [createLocalNote] Note saved successfully with AI features:", {
          noteId: result.noteId,
          title: finalTitle,
          type: finalType
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
  }, [userId, generateTitle, classifyType, backendSaveNote, cleanContentForNotes]);

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