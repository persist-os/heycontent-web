'use client';

import React, { useRef, useCallback, useMemo, useState } from 'react';
import { NotesGrid } from './components/NotesGrid';
import { NoteArea } from './NoteArea';
import { useAuth } from '@/app/context/auth-context';
import type { Id } from '@/convex/_generated/dataModel';
import { useNotes } from '@/app/context/notes-context';
import { Note } from './types';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { YouTubeVideoCard } from './components/YouTubeVideoCard';
import { InstagramPostCard } from './components/InstagramPostCard';
import { GmailThreadCard } from './components/GmailThreadCard';
import { InsightCard } from '../ai-insights/_components/InsightCard';
import { InsightOverlay } from '@/components/content/overlays/InsightOverlay';

// Help system imports
import { EnhancedHelpButton } from '@/components/ui/enhanced-help-button';
import { InteractiveTooltip } from '@/components/ui/interactive-tooltip';
import { interactiveTours } from '@/helpContent/interactiveTours';
import { buildNoteUpdate, validateNoteUpdate } from './NoteArea';

export default function SmartNotes() {
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;
  const searchParams = useSearchParams();
  const noteIdParam = searchParams.get('noteId');
  const fromChat = searchParams.get('fromChat') === 'true';
  const chatId = searchParams.get('chatId');
  const fromProject = searchParams.get('fromProject') === 'true';
  const projectId = searchParams.get('projectId');
  const router = useRouter();
  const pathname = usePathname();

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
    navigationStack, // <-- add this line
  } = useNotes();

  // YouTube video card state
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  // Instagram post card state
  const [selectedInstagramPostId, setSelectedInstagramPostId] = useState<string | null>(null);
  // Gmail thread card state
  const [selectedGmailThreadId, setSelectedGmailThreadId] = useState<string | null>(null);
  // Insight card state
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null);
  
  // Help modal state

  const [interactiveTourOpen, setInteractiveTourOpen] = useState(false);
  const [quickStartOpen, setQuickStartOpen] = useState(false);
  const noteAreaFlushRef = useRef<() => Promise<void>>();
  const [shouldForcePreview, setShouldForcePreview] = useState(false);

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

  // Clear activeNoteId when navigating away from notes route (defensive cleanup)
  React.useEffect(() => {
    return () => {
      // Cleanup on unmount - ensure no note is active when leaving the component
      if (activeNoteId) {
        console.log('🧹 Notes component unmounting, clearing active note');
        setActiveNoteId(undefined);
      }
    };
  }, []);

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

    // Use smart navigation if we have a stack, otherwise go to grid, chat, or project
    if (canNavigateBack && !fromChat && !fromProject) {
      const previousNoteId = navigateBack();
      console.log('🔙 Smart back navigation to:', previousNoteId);
      // If navigateBack returns null, we're already at the grid
    } else {
      // Clear navigation stack and go to grid, chat, or project
      clearNavigationStack();
      setActiveNoteId(undefined);
      clearNoteIdFromUrl();
      
      // If we came from chat, navigate back to chat
      if (fromChat) {
        const chatUrl = chatId ? `/dashboard/chat?id=${chatId}` : '/dashboard/chat';
        router.push(chatUrl);
      }
      // If we came from project, navigate back to project
      else if (fromProject && projectId) {
        router.push(`/dashboard/notes/projects/${projectId}`);
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
  const handleOpenInsightAnalysis = async (insightId: string) => {
    await flushAutosave();
    setSelectedInsightId(null); // Close the card
    router.push(`/dashboard/notes/insight-analysis/${encodeURIComponent(insightId)}`);
  };

  // Handle content linking (YouTube, Instagram, Insights, etc.)
  const handleLinkContent = async (prefixedId: string) => {
    await flushAutosave();
    console.log('handleLinkContent called:', {
      prefixedId,
      prefixedIdLength: prefixedId.length,
      prefixedIdIncludesColon: prefixedId.includes(':'),
      prefixedIdSplit: prefixedId.split(':'),
      currentActiveNoteId: activeNoteId,
      currentStack: navigationStack
    });
    
    // Special handling for insight links which have format insight:analysisId:index
    if (prefixedId.startsWith('insight:')) {
      setSelectedInsightId(prefixedId);
      return;
    }
    
    // Parse the prefixed ID to determine the content type for other content types
    const [contentType, contentId] = prefixedId.split(':', 2);
    switch (contentType) {
      case 'note':
        handleLinkNote(contentId);
        break;
      case 'youtube':
        setSelectedVideoId(contentId);
        break;
      case 'instagram':
        setSelectedInstagramPostId(contentId);
        break;
      case 'gmail':
        setSelectedGmailThreadId(contentId);
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
          forcePreview={shouldForcePreview}
        />
        {/* YouTube Video Card */}
        {selectedVideoId && (
          <YouTubeVideoCard
            videoId={selectedVideoId}
            onClose={async () => {
              await flushAutosave();
              setSelectedVideoId(null);
              setShouldForcePreview(true);
              setTimeout(() => setShouldForcePreview(false), 0);
            }}
            onOpenAnalysis={handleOpenAnalysis}
          />
        )}
        {/* Instagram Post Card */}
        {selectedInstagramPostId && (
          <InstagramPostCard
            postId={selectedInstagramPostId}
            onClose={async () => {
              await flushAutosave();
              setSelectedInstagramPostId(null);
              setShouldForcePreview(true);
              setTimeout(() => setShouldForcePreview(false), 0);
            }}
            onOpenAnalysis={handleOpenAnalysis}
          />
        )}
        {/* Gmail Thread Card */}
        {selectedGmailThreadId && (
          <GmailThreadCard
            threadId={selectedGmailThreadId}
            onClose={async () => {
              await flushAutosave();
              setSelectedGmailThreadId(null);
              setShouldForcePreview(true);
              setTimeout(() => setShouldForcePreview(false), 0);
            }}
          />
        )}
        {/* Insight Card */}
        {selectedInsightId && (
          <InsightOverlay
            insightId={selectedInsightId}
            onClose={async () => {
              await flushAutosave();
              setSelectedInsightId(null);
              setShouldForcePreview(true);
              setTimeout(() => setShouldForcePreview(false), 0);
            }}
            showAnalysis={true}
          />
        )}
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
        helpButton={
          <EnhancedHelpButton 
            onInteractiveTour={() => setInteractiveTourOpen(true)}
          />
        }
      />


      {/* Interactive Tour */}
      <InteractiveTooltip
        isOpen={interactiveTourOpen}
        onClose={() => setInteractiveTourOpen(false)}
        steps={interactiveTours.notes}
        title="Smart Notes Features Tour"
        autoPlay={false}
      />

      {/* Quick Start Tour */}
      <InteractiveTooltip
        isOpen={quickStartOpen}
        onClose={() => setQuickStartOpen(false)}
        steps={interactiveTours.quickStart}
        title="Quick Start Guide"
        autoPlay={true}
      />
    </div>
  );
}
