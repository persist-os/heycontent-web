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
  // Navigation stack props
  canGoBack?: boolean;
  onNavigateBack?: () => void;
  navigationStack?: string[];
  // Chat navigation prop
  fromChat?: boolean;
  // Optional ref to expose flush method
  flushRef?: React.MutableRefObject<() => Promise<void> | undefined>;
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
        await onUpdate(note._id, { content, title: note.title || '', tags });
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
  // Navigation stack props
  canGoBack,
  onNavigateBack,
  navigationStack,
  // Chat navigation prop
  fromChat = false,
  flushRef
}: NoteAreaProps) {
  // Get all notes from context for tag suggestions
  const { notes } = useNotes();
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
  const [tags, setTags] = useState<string[]>(note.tags || []);
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
  const tagsRef = useRef(tags);
  React.useEffect(() => { contentRef.current = content; }, [content]);
  React.useEffect(() => { tagsRef.current = tags; }, [tags]);

  // --- Use robust autosave ---
  const { flush } = useRobustAutosave({
    note,
    onUpdate,
    getContent: () => contentRef.current,
    getTags: () => tagsRef.current,
    content,
    tags,
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
    setTags(newTags);
  };

  const handleTypeChange = async (newType: NoteType) => {
    await onUpdate(note._id, { type: newType, typeGenerated: false });
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

  const handleNavigateBack = async () => {
    await flush();
    if (onNavigateBack) {
      onNavigateBack();
    }
  };

  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;
  const allLinkableContent = useQuery(api.notes.getAllLinkableContent, { 
    userId: firebaseUser?.uid || '' 
  });

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
        onNavigateBack={handleNavigateBack}
        navigationStack={navigationStack}
        fromChat={fromChat}
      />
      
      {/* Note metadata and type selector */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/95">
        <NoteMeta
          note={{...note, tags}} // Pass current tags state to NoteMeta
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
      <div className="flex-1 overflow-hidden">
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
