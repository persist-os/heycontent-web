'use client';

import React, { useRef, useCallback, useMemo, useState } from 'react';
import { NotesGrid } from './components/NotesGrid';
import { NoteArea } from './NoteArea';
import { useAuth } from '@/app/context/auth-context';
import type { Id } from '@/convex/_generated/dataModel';
import { useNotes } from '@/app/context/notes-context';
import { Note } from './types';
import { useSearchParams, useRouter } from 'next/navigation';
import { YouTubeVideoCard } from './components/YouTubeVideoCard';
import { InsightCard } from '../ai-insights/_components/InsightCard';
import { HelpModal } from '@/components/ui/help-modal';
import { HelpIconButton } from '@/components/ui/help-icon-button';
import { notesHelp } from '@/helpContent';
import { buildNoteUpdate, validateNoteUpdate } from './NoteArea';

export default function SmartNotes() {
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;
  const searchParams = useSearchParams();
  const noteIdParam = searchParams.get('noteId');
  const fromChat = searchParams.get('fromChat') === 'true';
  const chatId = searchParams.get('chatId');
  const router = useRouter();

  const {
    notes,
    isLoading: notesIsLoading,
    updateNote,
    deleteNote,
    activeNoteId,
    setActiveNoteId,
    // Smart navigation functionality
    navigateToNote,
    navigateBack,
    canNavigateBack,
    clearNavigationStack,
  } = useNotes();

  // YouTube video card state
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  // Insight card state
  const [selectedInsight, setSelectedInsight] = useState<{ analysisId: string; insightIndex: number } | null>(null);
  // Help modal state
  const [helpOpen, setHelpOpen] = useState(false);
  const noteAreaFlushRef = useRef<() => Promise<void>>();

  // Compute activeNote from notes and activeNoteId (single source of truth)
  const activeNote = useMemo(() =>
    activeNoteId ? notes.find(n => n._id === activeNoteId) || null : null,
    [notes, activeNoteId]
  );

  // Auto-select note if noteId param is present in URL
  React.useEffect(() => {
    if (noteIdParam && notes.length > 0) {
      try {
        const found = notes.find(n => String(n._id) === String(noteIdParam));
        if (found) {
          setActiveNoteId(found._id);
        }
      } catch (error) {
        console.error('Error selecting note by noteId param:', error);
      }
    }
  }, [noteIdParam, notes, setActiveNoteId]);

  // Helper to clear noteId from URL
  const clearNoteIdFromUrl = React.useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    params.delete('noteId');
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newUrl);
  }, [router]);

  // Handle note editing (select note)
  const handleEditNote = (note: Note) => {
    setActiveNoteId(note._id);
  };

  // Handle note deletion
  const handleDeleteNote = async (noteId: string) => {
    try {
      const result = await deleteNote(noteId as Id<'notes'>);
      if (result && activeNote && String(activeNote._id) === noteId) {
        setActiveNoteId(undefined);
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  // Handle importance toggle
  const handleToggleImportant = async (noteId: string) => {
    const note = notes.find(n => String(n._id) === noteId);
    if (note) {
      await updateNote(noteId, { important: !note.important });
    }
  };

  // Stable, safe onUpdate handler for NoteArea
  const handleNoteUpdate = useCallback(async (noteId, updates) => {
    // Always call backend update to ensure consistency
    // Use buildNoteUpdate and validateNoteUpdate to ensure only changed fields are sent
    const note = notes.find(n => String(n._id) === String(noteId));
    if (!note) return null;
    const safeUpdate = buildNoteUpdate(updates, note);
    const validatedUpdate = validateNoteUpdate(safeUpdate, 'handleNoteUpdate');
    if (Object.keys(validatedUpdate).length > 0) {
      return await updateNote(String(noteId), validatedUpdate);
    }
    return null;
  }, [updateNote, notes]);

  // Handle note saving from editor
  const handleSave = async (latestContent: string, latestTitle?: string) => {
    if (!activeNote) return;
    try {
      const safeUpdate = buildNoteUpdate({ content: latestContent, title: latestTitle ?? activeNote.title ?? '' }, activeNote);
      const validatedUpdate = validateNoteUpdate(safeUpdate, 'handleSave');
      if (Object.keys(validatedUpdate).length > 0) {
        await updateNote(activeNote._id, validatedUpdate);
      }
      // No manual state patching needed
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  // Handle going back - now uses smart navigation when available
  const handleBackToGrid = async (currentContent?: string) => {
    if (activeNote && currentContent !== undefined) {
      // Only skip metadata generation if both are already generated
      const shouldForce = !!activeNote.titleGenerated && !!activeNote.typeGenerated;
      try {
        const safeUpdate = buildNoteUpdate({ content: currentContent, title: activeNote.title ?? '' }, activeNote);
        const validatedUpdate = validateNoteUpdate(safeUpdate, 'handleBackToGrid');
        if (Object.keys(validatedUpdate).length > 0) {
          await updateNote(activeNote._id, validatedUpdate, shouldForce);
        }
      } catch (error) {
        console.error('Failed to save note before returning to grid:', error);
      }
    }

    // Use smart navigation if we have a stack, otherwise go to grid or chat
    if (canNavigateBack && !fromChat) {
      const previousNoteId = navigateBack();
      console.log('🔙 Smart back navigation to:', previousNoteId);
      // If navigateBack returns null, we're already at the grid
    } else {
      // Clear navigation stack and go to grid or chat
      clearNavigationStack();
      setActiveNoteId(undefined);
      clearNoteIdFromUrl();
      
      // If we came from chat, navigate back to chat
      if (fromChat) {
        const chatUrl = chatId ? `/dashboard/chat?id=${chatId}` : '/dashboard/chat';
        router.push(chatUrl);
      }
    }
  };

  // Handle note linking - now uses smart navigation
  const handleLinkNote = (noteId: string) => {
    navigateToNote(noteId, true); // true indicates this is from a note link
  };

  // Helper to flush autosave before navigation
  const flushAutosave = async () => {
    if (noteAreaFlushRef.current) {
      await noteAreaFlushRef.current();
    }
  };

  // Handle YouTube video analysis navigation
  const handleOpenAnalysis = async (videoId: string) => {
    await flushAutosave();
    setSelectedVideoId(null); // Close the card
    router.push(`/dashboard/notes/youtube-analysis/${videoId}`);
  };

  // Handle insight analysis navigation
  const handleOpenInsightAnalysis = async (analysisId: string, insightIndex: number) => {
    await flushAutosave();
    setSelectedInsight(null); // Close the card
    const insightId = `insight:${analysisId}:${insightIndex}`;
    router.push(`/dashboard/notes/insight-analysis/${encodeURIComponent(insightId)}`);
  };

  // Handle content linking (YouTube, Instagram, Insights, etc.)
  const handleLinkContent = async (prefixedId: string) => {
    await flushAutosave();
    const [contentType, contentId] = prefixedId.split(':', 2);
    switch (contentType) {
      case 'note':
        handleLinkNote(contentId);
        break;
      case 'youtube':
        setSelectedVideoId(contentId);
        break;
      case 'instagram':
        // TODO: Implement Instagram post viewing
        break;
      default:
        // Unknown content type
        break;
    }
  };

  // Prepare available notes for linking (exclude current note)
  const availableNotes = notes
    .filter(note => String(note._id) !== activeNoteId)
    .map(note => ({
      _id: String(note._id),
      title: note.title,
      type: note.type || 'idea_bank'
    }));

  // If viewing a specific note, show the editor
  if (activeNote) {
    return (
      <div className="h-full w-full bg-background animate-in slide-in-from-right-4 duration-200">
        <NoteArea
          key={String(activeNote._id)}
          note={activeNote}
          onUpdate={handleNoteUpdate}
          onSave={handleSave}
          onToggleShortcuts={() => {}} // Not used in grid view
          onBack={handleBackToGrid}
          isMobile={true}
          availableNotes={availableNotes}
          onLinkNote={handleLinkNote}
          onLinkContent={handleLinkContent}
          flushRef={noteAreaFlushRef}
        />
        {/* YouTube Video Card */}
        {selectedVideoId && (
          <YouTubeVideoCard
            videoId={selectedVideoId}
            onClose={async () => {
              await flushAutosave();
              setSelectedVideoId(null);
            }}
            onOpenAnalysis={handleOpenAnalysis}
          />
        )}
        {/* Insight Card */}
        {selectedInsight && (async () => {
          await flushAutosave();
          const insightId = `insight:${selectedInsight.analysisId}:${selectedInsight.insightIndex}`;
          setSelectedInsight(null);
          router.push(`/dashboard/notes/insight-analysis/${encodeURIComponent(insightId)}`);
          return null;
        })()}
      </div>
    );
  }

  // Show the grid view
  return (
    <div className="h-full w-full bg-background p-3 sm:p-4 md:p-6">
      <NotesGrid
        notes={notes}
        onEditNote={handleEditNote}
        onDeleteNote={handleDeleteNote}
        onToggleImportant={handleToggleImportant}
        onUpdateNote={handleNoteUpdate}
        isLoading={notesIsLoading}
        helpButton={<HelpIconButton onClick={() => setHelpOpen(true)} />}
      />
      {/* Help Modal */}
      <HelpModal 
        open={helpOpen} 
        onClose={() => setHelpOpen(false)} 
        pages={notesHelp}
      />
    </div>
  );
}
