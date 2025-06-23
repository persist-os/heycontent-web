"use client";

import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Note, NoteUpdate, NoteType } from './types';
import { NoteHeader } from './components/NoteHeader';
import { TiptapNoteEditor } from './components/TiptapNoteEditor';
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
        <TiptapNoteEditor
          content={content}
          onContentChange={handleContentChange}
          placeholder="Start writing your note..."
          disabled={false}
          noteId={String(note._id)}
          noteTitle={note.title}
          platform={note.platform}
          tags={note.tags}
          userId={String(note.userId)}
          noteType={note.type}
          availableNotes={availableNotes}
          onLinkNote={handleLinkNote}
        />
      </div>
    </div>
  );
}
