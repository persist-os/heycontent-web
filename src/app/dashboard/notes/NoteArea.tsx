"use client";

import React, { useState, useCallback, useMemo, useRef } from 'react';
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
import { useNotes } from '@/app/context/notes-context';
import { useAuth } from '@/app/context/auth-context';
import { NoteContentRenderer } from './components/NoteContentRenderer';
import { useContentResolver } from '@/lib/content-resolver';

interface NoteAreaProps {
  note: Note;
  onUpdate: (noteId: string | Id<"notes">, updates: NoteUpdate) => Promise<Note | null>;
  onSave: (content: string, title?: string) => void;
  onToggleShortcuts: () => void;
  onBack: (currentContent?: string) => void;
  isMobile: boolean;
  availableNotes?: Array<{ _id: string; title: string; type: string }>;
  onLinkNote?: (noteId: string) => void;
  onLinkContent?: (prefixedId: string) => void;
  // Optional ref to expose flush method
  flushRef?: React.MutableRefObject<() => Promise<void> | undefined>;
  // fromChat prop retained for back button logic
  fromChat?: boolean;
  // fromProject prop for project back navigation
  fromProject?: boolean;
  forcePreview?: boolean;
}

// Utility: Build safe NoteUpdate object
function buildNoteUpdate(changes: Partial<Note>, currentNote: Note): NoteUpdate {
  const update: NoteUpdate = {};
  if (changes.content !== undefined && changes.content !== currentNote.content) {
    update.content = changes.content;
  }
  if (changes.title !== undefined && changes.title !== currentNote.title) {
    update.title = changes.title;
  }
  if (changes.tags !== undefined && JSON.stringify(changes.tags) !== JSON.stringify(currentNote.tags)) {
    update.tags = changes.tags;
  }
  if (changes.type !== undefined && changes.type !== currentNote.type) {
    update.type = changes.type;
  }
  if (changes.typeGenerated !== undefined && changes.typeGenerated !== currentNote.typeGenerated) {
    update.typeGenerated = changes.typeGenerated;
  }
  // Add other fields as needed
  return update;
}

// Validation layer for NoteUpdate
function validateNoteUpdate(update: NoteUpdate, context: string): NoteUpdate {
  if (update.tags !== undefined && update.tags.length === 0) {
    console.warn(`⚠️ Empty tags being sent from: ${context}`);
    // Optionally: throw or block here if not explicitly clearing tags
  }
  return update;
}

// --- Robust Autosave Hook ---
function useRobustAutosave({
  note,
  onUpdate,
  getContent,
  getTags,
  content,
  tags,
}: {
  note: Note;
  onUpdate: (noteId: string | Id<"notes">, updates: NoteUpdate) => Promise<Note | null>;
  getContent: () => string;
  getTags: () => string[];
  content: string;
  tags: string[];
}) {
  const [lastSavedContent, setLastSavedContent] = useState(note.content || '');
  const [lastSavedTags, setLastSavedTags] = useState<string[]>(note.tags || []);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef(false);

  // Save function
  const save = useCallback(async () => {
    const content = getContent();
    const tags = getTags();
    const isTemporary = 'isTemporary' in note ? note.isTemporary : false;
    const contentChanged = content !== lastSavedContent;
    const tagsChanged = JSON.stringify(tags) !== JSON.stringify(lastSavedTags);
    if ((contentChanged || tagsChanged) && !isTemporary && content.length > 0) {
      try {
        // Only send changed fields
        const update = buildNoteUpdate({ content, title: note.title || '', tags }, note);
        const validatedUpdate = validateNoteUpdate(update, 'autosave');
        await onUpdate(note._id, validatedUpdate);
        setLastSavedContent(content);
        setLastSavedTags([...tags]);
        pendingSaveRef.current = false;
      } catch (error) {
        // Optionally: show error to user
        pendingSaveRef.current = true;
      }
    }
  }, [getContent, getTags, lastSavedContent, lastSavedTags, note, onUpdate]);

  // Debounced autosave on content/tags change
  React.useEffect(() => {
    const isTemporary = 'isTemporary' in note ? note.isTemporary : false;
    const contentChanged = content !== lastSavedContent;
    const tagsChanged = JSON.stringify(tags) !== JSON.stringify(lastSavedTags);
    if ((contentChanged || tagsChanged) && !isTemporary && content.length > 0) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        save();
      }, 1200);
      pendingSaveRef.current = true;
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [content, tags, note._id, note.title]);

  // Save on visibility/tab change
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        save();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [save]);

  // Save on beforeunload
  React.useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (pendingSaveRef.current) {
        save();
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [save]);

  // Save on unmount (route change, modal, etc.)
  React.useEffect(() => {
    return () => {
      if (pendingSaveRef.current) {
        save();
      }
    };
  }, [save]);

  // Periodic safety net
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (pendingSaveRef.current) {
        save();
      }
    }, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [save]);

  // Expose flush method
  const flush = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    await save();
  }, [save]);

  return { flush };
}

export { buildNoteUpdate, validateNoteUpdate };

export function NoteArea({
  note: initialNote,
  onUpdate,
  onSave,
  onToggleShortcuts,
  onBack,
  isMobile,
  availableNotes = [],
  onLinkNote,
  onLinkContent,
  flushRef,
  fromChat = false,
  fromProject = false,
  forcePreview = false,
}: NoteAreaProps) {
  // Get all notes from context for tag suggestions
  const { notes, canNavigateBack, navigationStack } = useNotes();
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

  const note = (liveNoteData || initialNote) as Note;
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [content, setContent] = useState(note.content || '');
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

  // Prepare tag data for suggestions (excluding current note to avoid bias)
  const noteTagData = React.useMemo(() => 
    notes
      .filter(n => String(n._id) !== String(note._id)) // Exclude current note
      .map(n => ({
        tags: n.tags || [],
        updatedAt: n.updatedAt || n._creationTime || 0
      }))
  , [notes, note._id]);

  const contentRef = useRef(content);
  const tagsRef = useRef(note.tags || []);
  React.useEffect(() => { contentRef.current = content; }, [content]);
  React.useEffect(() => { tagsRef.current = note.tags || []; }, [note.tags]);

  // --- Use robust autosave ---
  const { flush } = useRobustAutosave({
    note,
    onUpdate,
    getContent: () => contentRef.current,
    getTags: () => tagsRef.current,
    content,
    tags: note.tags || [],
  });

  // Expose flush to parent if ref provided
  React.useEffect(() => {
    if (flushRef) {
      flushRef.current = flush;
    }
  }, [flush, flushRef]);

  // Handle content changes with debounced save
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  // Handle tag changes from NoteMeta
  const handleTagsChange = (newTags: string[]) => {
    // Only send tags if changed
    const update = buildNoteUpdate({ tags: newTags }, note);
    const validatedUpdate = validateNoteUpdate(update, 'handleTagsChange');
    if (Object.keys(validatedUpdate).length > 0) {
      onUpdate(note._id, validatedUpdate);
    }
  };

  const handleTypeChange = async (newType: NoteType) => {
    const update = buildNoteUpdate({ type: newType, typeGenerated: false }, note);
    const validatedUpdate = validateNoteUpdate(update, 'handleTypeChange');
    if (Object.keys(validatedUpdate).length > 0) {
      await onUpdate(note._id, validatedUpdate);
    }
  };

  const handleSave = async () => {
    await flush();
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

  // Handle note linking with save
  const handleLinkNote = async (noteId: string) => {
    await flush();
    if (onLinkNote) {
      onLinkNote(noteId);
    }
  };

  // Unified back handler that saves first, then navigates
  const handleBack = async () => {
    await flush();
    onBack(content);
  };

  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;
  const { allContent: allLinkableContent } = useContentResolver(userId);

  React.useEffect(() => {
    if (forcePreview) setIsEditingTitle(false);
  }, [forcePreview]);

  // Determine back button context for header
  const getBackButtonContext = () => {
    if (fromChat) {
      return "Back to chat";
    } else if (canNavigateBack) {
      const lastEntry = navigationStack[navigationStack.length - 1];
      if (lastEntry) {
        const previousNote = notes.find(n => String(n._id) === lastEntry.noteId);
        if (previousNote) {
          return `Back to "${previousNote.title || 'Untitled'}"`;
        }
      }
      return "Back to previous note";
    } else {
      return "Back to notes grid";
    }
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
        fromChat={fromChat}
        canNavigateBack={canNavigateBack}
        backButtonContext={getBackButtonContext()}
        navigationStack={navigationStack}
        notes={notes}
      />
      
      {/* Note metadata and type selector */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/95">
        <NoteMeta
          note={note} // Use note directly from Convex
          onUpdate={onUpdate}
          onTitleChange={() => {}} // Title changes are handled by NoteMeta internally
          onTagsChange={handleTagsChange} // Pass cleaned tags change handler
          onEditingTitleChange={setIsEditingTitle}
          noteTagData={noteTagData}
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
      <div className="flex-1 overflow-hidden" data-note-editor>
        {(!isEditingTitle && forcePreview) ? (
          <div className="prose prose-sm max-w-none text-foreground p-6">
            <NoteContentRenderer
              content={content}
              availableNotes={availableNotes}
              // Optionally pass onLinkNote/onLinkContent if needed
            />
          </div>
        ) : (
          <RichTextEditor
            content={content}
            onContentChange={handleContentChange}
            placeholder="Start writing your note..."
            noteId={String(note._id)}
            noteTitle={note.title}
            platform={note.platform}
            tags={note.tags}
            userId={String(note.userId)}
            noteType={note.type}
            availableNotes={availableNotes}
            allLinkableContent={allLinkableContent || []}
            onLinkNote={handleLinkNote}
            onLinkContent={onLinkContent}
            onAskAI={handleAskAI}
            onRequestAnalysis={handleRequestAnalysis}
            onRequestIdeas={handleRequestIdeas}
          />
        )}
      </div>

      {/* Floating Image Gallery Button */}
      <button
        onClick={() => setShowImageGallery(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center z-20 ${
          note.images && note.images.length > 0
            ? 'bg-heycontent-purple text-white hover:bg-heycontent-purple/90 ring-2 ring-heycontent-purple/20 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 dark:ring-primary/20' 
            : 'bg-muted/80 backdrop-blur-sm text-muted-foreground hover:bg-muted hover:text-foreground border border-border'
        }`}
        title={`Image Gallery${note.images && note.images.length > 0 ? ` (${note.images.length})` : ''}`}
      >
        <div className="relative">
          <Image size={20} />
          {note.images && note.images.length > 0 && (
            <span className="absolute -top-5 -right-5 w-5 h-5 bg-heycontent-purple text-white text-xs rounded-full flex items-center justify-center font-medium shadow-md dark:bg-primary dark:text-primary-foreground">
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
