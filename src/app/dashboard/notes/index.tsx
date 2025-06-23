'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { NotesGrid } from './components/NotesGrid';
import { NoteArea } from './NoteArea';
import { useAuth } from '@/app/context/auth-context';
import type { Id } from '@/convex/_generated/dataModel';
import { useNotes } from '@/app/context/notes-context';
import { Note, NoteType } from './types';
import { useCreateNote } from './hooks/useCreateNote';

export default function SmartNotes() {
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  
  const { 
    notes, 
    isLoading, 
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
    clearNavigationStack,
  } = useNotes();
  
  const { createNote: createNewNote, isCreating: isCreatingNote } = useCreateNote();

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
  
  const createNote = React.useCallback(async (noteType?: NoteType) => {
    if (isCreatingNote) return;
    await createNewNote('', undefined, undefined, noteType);
  }, [createNewNote, isCreatingNote]);

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

  // Handle note updates
  const handleUpdateNote = async (noteId: string, updates: any) => {
    await updateNote(noteId, updates);
  };

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
  const handleBackToGrid = () => {
    clearNavigationStack();
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
          onUpdate={async (noteId, updates) => {
            // For temporary notes, update local state only
            if (activeNote.isTemporary) {
              const updatedNote = { ...activeNote, ...updates };
              setActiveNote(updatedNote);
              return updatedNote;
            }
            
            // Optimistically update the note in local state
            setNotes(currentNotes =>
              currentNotes.map(note =>
                String(note._id) === String(noteId)
                  ? { ...note, ...updates }
                  : note
              )
            );
            // Then call the backend update
            return await updateNote(String(noteId), updates);
          }}
          onSave={handleSave}
          onToggleShortcuts={() => {}} // Not used in grid view
          onBack={handleBackToGrid}
          isMobile={true} // Always show back button in this context
          availableNotes={availableNotes}
          onLinkNote={handleLinkNote}
          canGoBack={canGoBack}
          onNavigateBack={navigateBack}
          navigationStack={navigationStack}
        />
      </div>
    );
  }

  // Show the grid view with loading state for note creation
  return (
    <div className="h-full w-full bg-background p-3 sm:p-4 md:p-6">
      {isCreatingNote && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-background rounded-lg p-6 shadow-lg border border-border flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Creating your note...</span>
          </div>
        </div>
      )}
      <NotesGrid
        notes={notes}
        onCreateNote={createNote}
        onEditNote={handleEditNote}
        onDeleteNote={handleDeleteNote}
        onToggleImportant={handleToggleImportant}
        onUpdateNote={handleUpdateNote}
        isLoading={isLoading}
        isCreatingNote={isCreatingNote}
      />
    </div>
  );
}