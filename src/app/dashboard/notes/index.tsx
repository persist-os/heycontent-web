'use client';

import React, { useRef, useCallback } from 'react';
import { useState, useEffect } from 'react';
import { NotesGrid } from './components/NotesGrid';
import { NoteArea } from './NoteArea';
import { useAuth } from '@/app/context/auth-context';
import type { Id } from '@/convex/_generated/dataModel';
import { useNotes } from '@/app/context/notes-context';
import { Note, NoteType } from './types';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { deleteNote, updateNote } from '@/convex/notes';
import { YouTubeVideoCard } from './components/YouTubeVideoCard';
import { InsightCard } from '../ai-insights/_components/InsightCard';

// Help system imports
import { HelpModal } from '@/components/ui/help-modal';
import { HelpIconButton } from '@/components/ui/help-icon-button';
import { notesHelp } from '@/helpContent';

export default function SmartNotes() {
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;
  const [activeNote, setActiveNote] = useState<Note | null>(null);
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
    saveNoteContent, 
    setNotes,
    activeNoteId,
    setActiveNoteId,
    navigationStack,
    canGoBack,
    navigateToNote,
    navigateBack,
    clearNavigationStack
  } = useNotes();
  
  // YouTube video card state
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  
  // Insight card state
  const [selectedInsight, setSelectedInsight] = useState<{ analysisId: string; insightIndex: number } | null>(null);
  
  // Help modal state
  const [helpOpen, setHelpOpen] = useState(false);

  const noteAreaFlushRef = useRef<() => Promise<void>>();

  useEffect(() => {
    if (activeNoteId) {
      const note = notes.find(n => n._id === activeNoteId);
      if (note) {
        setActiveNote(note);
      }
    } else {
      setActiveNote(null);
    }
  }, [activeNoteId, notes]);

  // Auto-select note if noteId param is present in URL
  useEffect(() => {
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

  // Handle note editing
  const handleEditNote = (note: Note) => {
    navigateToNote(note._id, false); // Not from a link, so don't add to stack
  };

  // Handle note deletion
  const handleDeleteNote = async (noteId: string) => {
    try {
      const result = await deleteNote(noteId as Id<"notes">);
      if (result) {
        // If the active note was deleted, clear it
        if (activeNote && String(activeNote._id) === noteId) {
          setActiveNote(null);
        }
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
    // For temporary notes, update local state only
    if (activeNote?.isTemporary) {
      const updatedNote = { ...activeNote, ...updates };
      setActiveNote(updatedNote);
      return updatedNote;
    }
    // Find the current note
    const currentNote = notes.find(note => String(note._id) === String(noteId));
    // Only update if something actually changed
    const isChanged = currentNote && (
      (updates.content !== undefined && updates.content !== currentNote.content) ||
      (updates.title !== undefined && updates.title !== currentNote.title) ||
      (updates.tags !== undefined && JSON.stringify(updates.tags) !== JSON.stringify(currentNote.tags))
    );
    if (isChanged) {
      setNotes(currentNotes =>
        currentNotes.map(note =>
          String(note._id) === String(noteId)
            ? { ...note, ...updates }
            : note
        )
      );
    }
    // Always call backend update to ensure consistency
    return await updateNote(String(noteId), updates);
  }, [activeNote, notes, setActiveNote, setNotes, updateNote]);

  // Handle note saving from editor
  const handleSave = async (latestContent: string, latestTitle?: string) => {
    if (!activeNote) return;
    
    try {
      const result = await saveNoteContent(
        activeNote._id,
        latestContent,
        latestTitle ?? activeNote.title ?? ''
      );
      
      if (result) {
        // Update the active note with the latest data
        setActiveNote(result);
        console.log('Note saved successfully');
      }
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  // Handle going back to grid view
  const handleBackToGrid = async (currentContent?: string) => {
    if (activeNote && currentContent !== undefined) {
      // Only skip metadata generation if both are already generated
      const shouldForce = !!activeNote.titleGenerated && !!activeNote.typeGenerated;
      try {
        await updateNote(
          activeNote._id,
          { content: currentContent, title: activeNote.title ?? '' },
          shouldForce // Only skip metadata if both are generated
        );
        console.log('Note saved before returning to grid');
      } catch (error) {
        console.error('Failed to save note before returning to grid:', error);
      }
    }
    clearNavigationStack();
    clearNoteIdFromUrl();
    
    // If we came from chat, navigate back to chat
    if (fromChat) {
      const chatUrl = chatId ? `/dashboard/chat?id=${chatId}` : '/dashboard/chat';
      router.push(chatUrl);
    }
  };

  // Handle note linking with navigation stack
  const handleLinkNote = (noteId: string) => {
    console.log('handleLinkNote called:', {
      noteId,
      currentActiveNoteId: activeNoteId,
      notesCount: notes.length,
      targetNote: notes.find(n => String(n._id) === noteId),
      currentStack: navigationStack
    });
    navigateToNote(noteId, true); // From a link, so add to navigation stack
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
      router.push(`/dashboard/notes/insight-analysis/${encodeURIComponent(prefixedId)}`);
      return;
    }
    
    // Parse the prefixed ID to determine the content type for other content types
    const [contentType, contentId] = prefixedId.split(':', 2);
    
    console.log('Parsed content:', { contentType, contentId });
    
    switch (contentType) {
      case 'note':
        // Handle note linking (existing functionality)
        handleLinkNote(contentId);
        break;
      case 'youtube':
        // Show YouTube video card
        setSelectedVideoId(contentId);
        break;
      case 'instagram':
        // For now, just log - could open Instagram post in new tab or modal
        console.log('Instagram post linked:', contentId);
        // TODO: Implement Instagram post viewing
        break;
      default:
        console.warn('Unknown content type:', contentType);
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

  console.log('Available notes for linking:', {
    totalNotes: notes.length,
    availableNotesCount: availableNotes.length,
    activeNoteId,
    availableNotes: availableNotes.map(n => ({ id: n._id, title: n.title, type: n.type }))
  });

  // If viewing a specific note, show the editor with smooth transition
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
          isMobile={true} // Always show back button in this context
          availableNotes={availableNotes}
          onLinkNote={handleLinkNote}
          onLinkContent={handleLinkContent}
          canGoBack={canGoBack}
          onNavigateBack={navigateBack}
          navigationStack={navigationStack}
          fromChat={fromChat}
          flushRef={noteAreaFlushRef} // Pass flush ref to NoteArea
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

  // Show the grid view with loading state for note creation
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