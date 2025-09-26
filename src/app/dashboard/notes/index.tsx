'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { NotesTree } from './components/NotesTree';
import { useAuth } from '@/app/context/auth-context';
import type { Id } from '@/convex/_generated/dataModel';
import { useNotes } from '@/app/context/notes-context';
import { useProjects } from './hooks/useProjects';
import { Note } from './types';
import { useSearchParams, useRouter } from 'next/navigation';

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

  // Handle note editing - redirect to thinking lab with noteId
  const handleEditNote = (note: Note) => {
    router.push(`/dashboard/thinking_lab?noteId=${note._id}`);
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
    </div>
  );
}
