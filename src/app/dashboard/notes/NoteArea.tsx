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
import { ImageGalleryModal } from './components/ImageGalleryModal';
import { Image } from 'lucide-react';
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
  // Use the live query conditionally with "skip" parameter to avoid conditional hook call
  const liveNoteData = useQuery(
    api.notes.getNote, 
    initialNote.isTemporary 
      ? "skip" 
      : {
          noteId: initialNote._id as Id<"notes">, 
          userId: String(initialNote.userId) 
        }
  );

  const note = liveNoteData || initialNote;
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [content, setContent] = useState(note.content || '');
  const [lastSavedContent, setLastSavedContent] = useState(note.content || '');
  const [showImageGallery, setShowImageGallery] = useState(false);

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
      setLastSavedContent(note.content || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note._id, note.content]);

  // Autosave function that uses existing updateNote logic
  const autosave = React.useCallback(async () => {
    // Only autosave if content has changed and note is not temporary
    const isTemporary = 'isTemporary' in note ? note.isTemporary : false;
    if (content !== lastSavedContent && !isTemporary && content.length > 0) {
      console.log('🔄 [NoteArea] Autosaving note:', {
        noteId: note._id,
        contentChanged: content !== lastSavedContent,
        contentLength: content.length
      });
      
      try {
        // Use onUpdate which already includes metadata generation logic
        await onUpdate(note._id, { 
          content, 
          title: note.title || '' 
        });
        
        setLastSavedContent(content);
        console.log('✅ [NoteArea] Autosave successful');
      } catch (error) {
        console.error('❌ [NoteArea] Autosave failed:', error);
      }
    }
  }, [content, lastSavedContent, note._id, note.title, note, onUpdate]);

  // Debounced autosave that waits for a pause in typing
  React.useEffect(() => {
    const isTemporary = 'isTemporary' in note ? note.isTemporary : false;
    
    // Only set up debounced autosave if content has changed and note is not temporary
    if (content !== lastSavedContent && !isTemporary && content.length > 0) {
      console.log('⌨️ [NoteArea] Content changed, setting up debounced autosave');
      
      // Wait 3 seconds after last keystroke before autosaving
      const debounceTimer = setTimeout(() => {
        console.log('🔄 [NoteArea] Debounced autosave triggered');
        autosave();
      }, 3000);

      return () => {
        clearTimeout(debounceTimer);
      };
    }
  }, [content, lastSavedContent, note, autosave]);

  // Handle page visibility change (when switching tabs or minimizing)
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('🔍 [NoteArea] Page hidden, triggering autosave');
        autosave();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [autosave]);

  // Handle beforeunload (when closing tab or navigating away)
  React.useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const isTemporary = 'isTemporary' in note ? note.isTemporary : false;
      
      // Only show warning and autosave if there are unsaved changes
      if (content !== lastSavedContent && !isTemporary && content.length > 0) {
        console.log('⚠️ [NoteArea] Before unload, triggering autosave');
        
        // Try to save synchronously (limited time)
        autosave();
        
        // Show warning to user
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [content, lastSavedContent, note, autosave]);

  // Periodic autosave (every 2 minutes as a safety net, but debounced autosave should handle most cases)
  React.useEffect(() => {
    const interval = setInterval(() => {
      const isTemporary = 'isTemporary' in note ? note.isTemporary : false;
      
      if (content !== lastSavedContent && !isTemporary && content.length > 0) {
        console.log('⏰ [NoteArea] Periodic safety autosave triggered');
        autosave();
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [content, lastSavedContent, note, autosave]);

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
    <div className="flex flex-col h-full w-full bg-background relative">
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

      {/* Floating Image Gallery Button */}
      <button
        onClick={() => setShowImageGallery(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center z-20 ${
          note.images && note.images.length > 0
            ? 'bg-primary text-primary-foreground hover:bg-primary/90 ring-2 ring-primary/20' 
            : 'bg-muted/80 backdrop-blur-sm text-muted-foreground hover:bg-muted hover:text-foreground border border-border'
        }`}
        title={`Image Gallery${note.images && note.images.length > 0 ? ` (${note.images.length})` : ''}`}
      >
        <div className="relative">
          <Image size={20} />
          {note.images && note.images.length > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-medium">
              {note.images.length}
            </span>
          )}
        </div>
      </button>

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        isOpen={showImageGallery}
        noteId={String(note._id)}
        images={note.images || []}
        onClose={() => setShowImageGallery(false)}
      />
    </div>
  );
}
