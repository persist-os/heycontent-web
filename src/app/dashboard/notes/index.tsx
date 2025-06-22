'use client';

import * as React from 'react';
import { useState } from 'react';
import { NotesGrid } from './components/NotesGrid';
import { NoteArea } from './NoteArea';
import { useAIInsights } from './hooks/useAIInsights';
import { useAuth } from '@/app/context/auth-context';
import type { Id } from '@/convex/_generated/dataModel';
import { useNotes } from '@/app/context/notes-context';
import { Note, NoteType } from './types';

export default function SmartNotes() {
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  
  // Get notes and mutations from useNotes context
  const { 
    notes, 
    isLoading, 
    saveNote, 
    updateNote, 
    deleteNote, 
    saveNoteContent, 
    setNotes,
  } = useNotes();
  
  const { requestAIInsights } = useAIInsights(updateNote);

  // Create a new note with optimistic updates for instant UI feedback
  const createNote = React.useCallback(async () => {
    if (isCreatingNote) return; // Prevent double-clicks
    
    setIsCreatingNote(true);
    
    // Generate a temporary ID for optimistic update
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const defaultContent = '';
    
    // Create temporary note object for immediate UI feedback
    const tempNote: Note = {
      _id: tempId as any,
      _creationTime: Date.now(),
      userId: userId || '',
      title: 'New Note',
      content: defaultContent,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      important: false,
      type: 'idea_bank',
      tags: [],
      typeGenerated: false,
      titleGenerated: false,
      isTemporary: true, // Flag to indicate this is a temporary note
    };
    
    // Immediately show the editor with the temporary note for instant feedback
    setActiveNote(tempNote);
    
    try {
      // Create the actual note in the background
      const result = await saveNote(defaultContent, {
        title: 'New Note',
        type: 'idea_bank' as NoteType,
      });

      if (result.success && result.noteId) {
        // Update the temporary note with the real ID
        const realNote: Note = {
          ...tempNote,
          _id: result.noteId,
          isTemporary: false,
        };
        
        setActiveNote(realNote);
        
        // Wait for the note to be added to the notes array for consistency
        setTimeout(() => {
          const newNote = notes.find(note => String(note._id) === String(result.noteId));
          if (newNote) {
            setActiveNote(newNote);
          }
        }, 100); // Reduced timeout for faster sync
      } else {
        // If creation failed, go back to grid
        setActiveNote(null);
        console.error("Failed to create note - no ID returned");
      }
    } catch (error) {
      console.error("Error creating note:", error);
      // If creation failed, go back to grid
      setActiveNote(null);
    } finally {
      setIsCreatingNote(false);
    }
  }, [saveNote, notes, userId, isCreatingNote]);

  // Handle note editing
  const handleEditNote = (note: Note) => {
    setActiveNote(note);
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
      // If this is a temporary note, we need to create it first
      if (activeNote.isTemporary) {
        const result = await saveNote(latestContent, {
          title: latestTitle || 'New Note',
          type: activeNote.type,
        });
        
        if (result.success && result.noteId) {
          const realNote: Note = {
            ...activeNote,
            _id: result.noteId,
            title: latestTitle || 'New Note',
            content: latestContent,
            isTemporary: false,
          };
          setActiveNote(realNote);
        }
      } else {
        // Normal save for existing notes
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
      }
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  // Handle going back to grid view
  const handleBackToGrid = () => {
    setActiveNote(null);
  };

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
            
            // Also update the active note if it's the one being updated
            if (String(activeNote._id) === String(noteId)) {
              setActiveNote(currentNote => ({ ...currentNote, ...updates }));
            }
            
            // Then call the backend update
            const result = await updateNote(String(noteId), updates);
            
            // Update activeNote with the final result from the backend
            if (result && String(activeNote._id) === String(noteId)) {
              setActiveNote(result);
            }
            
            return result;
          }}
          onSave={handleSave}
          onToggleShortcuts={() => {}} // Not used in grid view
          onRequestAIInsights={requestAIInsights}
          onBack={handleBackToGrid}
          isMobile={true} // Always show back button in this context
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