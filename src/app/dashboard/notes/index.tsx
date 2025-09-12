'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { NotesTree } from './components/NotesTree';
import { useAuth } from '@/app/context/auth-context';
import type { Id } from '@/convex/_generated/dataModel';
import { useNotes } from '@/app/context/notes-context';
import { useProjects } from './hooks/useProjects';
import { Note } from './types';
import { useSearchParams, useRouter } from 'next/navigation';
import { YouTubeVideoCard } from './components/YouTubeVideoCard';
import { InstagramPostCard } from './components/InstagramPostCard';
import { GmailThreadCard } from './components/GmailThreadCard';
import { InsightCard } from '../ai-insights/_components/InsightCard';
import { InsightOverlay } from '@/components/content/overlays/InsightOverlay';

export default function SmartNotes() {
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;
  const router = useRouter();

  const {
    notes,
    isLoading: notesIsLoading,
    updateNote,
    deleteNote,
  } = useNotes();
  
  const { projects } = useProjects(userId);

  // Content overlay states
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedInstagramPostId, setSelectedInstagramPostId] = useState<string | null>(null);
  const [selectedGmailThreadId, setSelectedGmailThreadId] = useState<string | null>(null);
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null);

  // Handle note editing - redirect to chat with noteId
  const handleEditNote = (note: Note) => {
    router.push(`/dashboard/chat?noteId=${note._id}`);
  };

  // Handle note deletion
  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId as Id<'notes'>);
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

  // Simple note update handler for tree operations
  const handleNoteUpdate = useCallback(async (noteId: string | Id<'notes'>, updates: any) => {
    return await updateNote(String(noteId), updates);
  }, [updateNote]);

  // Handle YouTube video analysis navigation
  const handleOpenAnalysis = async (videoId: string) => {
    setSelectedVideoId(null); // Close the card
    router.push(`/dashboard/notes/youtube-analysis/${videoId}`);
  };

  // Handle insight analysis navigation
  const handleOpenInsightAnalysis = async (insightId: string) => {
    setSelectedInsightId(null); // Close the card
    router.push(`/dashboard/notes/insight-analysis/${encodeURIComponent(insightId)}`);
  };

  // Show the tree view with clean organization
  return (
    <div className="min-h-screen w-full bg-background">
      <NotesTree
        notes={notes}
        projects={projects}
        onEditNote={handleEditNote}
        onDeleteNote={handleDeleteNote}
        onToggleImportant={handleToggleImportant}
        onUpdateNote={handleNoteUpdate}
        isLoading={notesIsLoading}
      />
      
      {/* Content overlays */}
      {selectedVideoId && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 animate-in fade-in duration-300">
          <YouTubeVideoCard
            videoId={selectedVideoId}
            onClose={() => setSelectedVideoId(null)}
            onOpenAnalysis={handleOpenAnalysis}
          />
        </div>
      )}
      
      {selectedInstagramPostId && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 animate-in fade-in duration-300">
          <InstagramPostCard
            postId={selectedInstagramPostId}
            onClose={() => setSelectedInstagramPostId(null)}
            onOpenAnalysis={handleOpenAnalysis}
          />
        </div>
      )}
      
      {selectedGmailThreadId && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 animate-in fade-in duration-300">
          <GmailThreadCard
            threadId={selectedGmailThreadId}
            onClose={() => setSelectedGmailThreadId(null)}
          />
        </div>
      )}
      
      {selectedInsightId && (
        <div className="animate-in fade-in duration-300">
          <InsightOverlay
            insightId={selectedInsightId}
            onClose={() => setSelectedInsightId(null)}
            showAnalysis={true}
          />
        </div>
      )}
    </div>
  );
}
