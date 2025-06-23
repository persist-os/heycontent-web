"use client";

import React, { useState, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useInlineAI } from './hooks/useInlineAI';
import { Note, NoteUpdate, NoteType } from './types';
import { NoteHeader } from './components/NoteHeader';
import { RichTextEditor } from '@/components/ui/rich-text-editor/rich-text-editor';
import { NoteMeta } from './components/NoteMeta';
import { TypeSelector } from './components/TypeSelector';
import type { Id } from "@/convex/_generated/dataModel";

interface NoteAreaProps {
  note: Note;
  onUpdate: (noteId: string | Id<"notes">, updates: NoteUpdate) => Promise<Note | null>;
  onSave: (content: string, title?: string) => void;
  onToggleShortcuts: () => void;
  onBack: (currentContent?: string) => void;
  isMobile: boolean;
  availableNotes?: Array<{ _id: string; title: string; type: string }>;
  onLinkNote?: (noteId: string) => void;
  // Navigation stack props
  canGoBack?: boolean;
  onNavigateBack?: () => void;
  navigationStack?: string[];
}

export function NoteArea({
  note: initialNote,
  onUpdate,
  onSave,
  onToggleShortcuts,
  onBack,
  isMobile,
  availableNotes = [],
  onLinkNote,
  // Navigation stack props
  canGoBack,
  onNavigateBack,
  navigationStack
}: NoteAreaProps) {
  // Only use the live query if the note is not temporary
  const liveNoteData = initialNote.isTemporary 
    ? null 
    : useQuery(api.notes.getNote, {
        noteId: initialNote._id as Id<"notes">, 
        userId: String(initialNote.userId) 
      });

  const note = liveNoteData || initialNote;
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [content, setContent] = useState(note.content || '');

  // Initialize the inline AI hook
  const { askAI, requestAnalysis, requestIdeas } = useInlineAI({
    noteId: String(note._id),
    noteContent: content,
    noteTitle: note.title,
    platform: note.platform,
    tags: note.tags,
    userId: String(note.userId),
  });

  // Keep content in sync with note prop
  React.useEffect(() => {
    if (note.content !== content) {
      setContent(note.content || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note._id, note.content]);

  // Handle content changes with debounced save
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleTypeChange = async (newType: NoteType) => {
    await onUpdate(note._id, { type: newType, typeGenerated: false });
  };

  const handleSave = () => {
    onSave(content, note.title);
  };

  // AI handlers that return values for RichTextEditor
  const handleAskAI = useCallback(async (prompt: string) => {
    try {
      const response = await askAI(prompt);
      return response;
    } catch (error) {
      console.error('Failed to get AI response:', error);
      throw error;
    }
  }, [askAI]);

  const handleRequestAnalysis = useCallback(async (noteType: string) => {
    try {
      const analysis = await requestAnalysis(noteType);
      return analysis;
    } catch (error) {
      console.error('Failed to get analysis:', error);
      throw error;
    }
  }, [requestAnalysis]);

  const handleRequestIdeas = useCallback(async () => {
    try {
      const ideas = await requestIdeas();
      return ideas;
    } catch (error) {
      console.error('Failed to get ideas:', error);
      throw error;
    }
  }, [requestIdeas]);

  // Handle note linking
  const handleLinkNote = (noteId: string) => {
    if (onLinkNote) {
      onLinkNote(noteId);
    }
  };

  const handleBack = () => {
    onBack(content);
  };

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header */}
      <NoteHeader 
        note={note}
        onUpdate={onUpdate}
        onSave={handleSave}
        onBack={handleBack} 
        isMobile={isMobile}
        currentContent={content}
        onContentChange={setContent}
        canGoBack={canGoBack}
        onNavigateBack={onNavigateBack}
        navigationStack={navigationStack}
      />
      
      {/* Note metadata and type selector */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/95">
        <NoteMeta
          note={note}
          onUpdate={onUpdate}
          onTitleChange={() => {}} // Title changes are handled by NoteMeta internally
          onEditingTitleChange={setIsEditingTitle}
        />
        
        <TypeSelector
          noteId={note._id}
          userId={note.userId}
          currentType={note.type || 'idea_bank'}
          typeGenerated={note.typeGenerated}
          onTypeChange={handleTypeChange}
        />
      </div>
      
      {/* Main editor area */}
      <div className="flex-1 overflow-hidden">
        <RichTextEditor
          content={content}
          onContentChange={handleContentChange}
          placeholder="Start writing your note..."
          disabled={false}
          onAskAI={handleAskAI}
          onRequestAnalysis={handleRequestAnalysis}
          onRequestIdeas={handleRequestIdeas}
          noteId={String(note._id)}
          noteTitle={note.title}
          platform={note.platform}
          tags={note.tags}
          userId={String(note.userId)}
          noteType={note.type}
          availableNotes={availableNotes}
          onLinkNote={handleLinkNote}
          className="h-full border-0"
        />
      </div>
    </div>
  );
}
