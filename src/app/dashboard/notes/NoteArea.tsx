"use client";

import React, { useState, useCallback, useMemo } from 'react';
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
import { Edit, Eye } from 'lucide-react';

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
  navigationStack
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
  const [lastSavedContent, setLastSavedContent] = useState(note.content || '');
  const [tags, setTags] = useState<string[]>(note.tags || []);
  const [lastSavedTags, setLastSavedTags] = useState<string[]>(note.tags || []);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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

  // Keep content and tags in sync with note prop
  React.useEffect(() => {
    if (note.content !== content) {
      setContent(note.content || '');
      setLastSavedContent(note.content || '');
    }
    if (JSON.stringify(note.tags || []) !== JSON.stringify(tags)) {
      setTags(note.tags || []);
      setLastSavedTags(note.tags || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note._id, note.content, note.tags]);

  // Autosave function that uses existing updateNote logic
  const autosave = React.useCallback(async () => {
    // Only autosave if content or tags have changed and note is not temporary
    const isTemporary = 'isTemporary' in note ? note.isTemporary : false;
    const contentChanged = content !== lastSavedContent;
    const tagsChanged = JSON.stringify(tags) !== JSON.stringify(lastSavedTags);
    
    if ((contentChanged || tagsChanged) && !isTemporary && content.length > 0) {
      console.log('🔄 [NoteArea] Autosaving note:', {
        noteId: note._id,
        contentChanged,
        tagsChanged,
        contentLength: content.length,
        tags
      });
      
      try {
        // Use onUpdate which already includes metadata generation logic
        await onUpdate(note._id, { 
          content, 
          title: note.title || '',
          tags: tags // Tags are already cleaned in handleTagsChange
        });
        
        setLastSavedContent(content);
        setLastSavedTags([...tags]);
        console.log('✅ [NoteArea] Autosave successful');
      } catch (error) {
        console.error('❌ [NoteArea] Autosave failed:', error);
      }
    }
  }, [content, lastSavedContent, tags, lastSavedTags, note._id, note.title, note, onUpdate]);

  // Debounced autosave that waits for a pause in typing or tag changes
  React.useEffect(() => {
    const isTemporary = 'isTemporary' in note ? note.isTemporary : false;
    const contentChanged = content !== lastSavedContent;
    const tagsChanged = JSON.stringify(tags) !== JSON.stringify(lastSavedTags);
    
    // Only set up debounced autosave if content or tags have changed and note is not temporary
    if ((contentChanged || tagsChanged) && !isTemporary && content.length > 0) {
      console.log('⌨️ [NoteArea] Content or tags changed, setting up debounced autosave');
      
      // Wait 3 seconds after last change before autosaving
      const debounceTimer = setTimeout(() => {
        console.log('🔄 [NoteArea] Debounced autosave triggered');
        autosave();
      }, 3000);

      return () => {
        clearTimeout(debounceTimer);
      };
    }
  }, [content, lastSavedContent, tags, lastSavedTags, note, autosave]);

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
      const contentChanged = content !== lastSavedContent;
      const tagsChanged = JSON.stringify(tags) !== JSON.stringify(lastSavedTags);
      
      // Only show warning and autosave if there are unsaved changes
      if ((contentChanged || tagsChanged) && !isTemporary && content.length > 0) {
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
  }, [content, lastSavedContent, tags, lastSavedTags, note, autosave]);

  // Periodic autosave (every 2 minutes as a safety net, but debounced autosave should handle most cases)
  React.useEffect(() => {
    const interval = setInterval(() => {
      const isTemporary = 'isTemporary' in note ? note.isTemporary : false;
      const contentChanged = content !== lastSavedContent;
      const tagsChanged = JSON.stringify(tags) !== JSON.stringify(lastSavedTags);
      
      if ((contentChanged || tagsChanged) && !isTemporary && content.length > 0) {
        console.log('⏰ [NoteArea] Periodic safety autosave triggered');
        autosave();
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [content, lastSavedContent, tags, lastSavedTags, note, autosave]);

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

  const handleSave = () => {
    onSave(content, note.title);
    // Also trigger autosave to ensure tags are saved
    autosave();
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
    // Always save current note before navigating to linked note
    await autosave();
    if (onLinkNote) {
      onLinkNote(noteId);
    }
  };

  // Unified back handler that saves first, then navigates
  const handleBack = async () => {
    // Always save before navigating back
    await autosave();
    onBack(content);
  };

  const handleNavigateBack = async () => {
    // Always save before navigating to previous note
    await autosave();
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
        <div className="space-y-6">
          {/* Note Content */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Note Content</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors"
                >
                  {showPreview ? <Edit className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPreview ? 'Edit' : 'Preview'}
                </button>
              </div>
            </div>

            {showPreview ? (
              <NoteContentRenderer
                content={content}
                availableNotes={availableNotes}
                availableContent={allLinkableContent || []}
                onLinkNote={handleLinkNote}
                onLinkContent={onLinkContent}
              />
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
              />
            )}
          </div>
        </div>
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
