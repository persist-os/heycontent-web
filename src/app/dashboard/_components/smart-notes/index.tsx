'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { NoteArea } from './NoteArea';
import { useSmartNotes } from './hooks/useSmartNotes';
import { useAIInsights } from './hooks/useAIInsights';
import { FileText, Plus, Lightbulb, ArrowLeft } from 'lucide-react';
import { useSidebar } from '@/app/context/sidebar-context';
import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import type { Id } from '../../../../../convex/_generated/dataModel'; // Import Id type from Convex generated data model

function EmptyState({ onCreateNote }: { onCreateNote: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
      <div className="bg-purple-50 rounded-full p-4 mb-4">
        <FileText className="w-12 h-12 text-purple-500" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No Notes Yet</h3>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        Start organizing your thoughts, ideas, and insights. Create your first note to get started.
      </p>
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={onCreateNote}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Your First Note</span>
        </button>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Lightbulb className="w-4 h-4" />
          <span>Tip: Use keyboard shortcuts for faster note-taking</span>
        </div>
      </div>
    </div>
  );
}

function SelectNotePrompt({ onCreateNote }: { onCreateNote: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 relative">
      <div className="bg-purple-50 rounded-full p-4 mb-4">
        <FileText className="w-12 h-12 text-purple-500" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Select a Note</h3>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        Choose a note from the sidebar or create a new one to start writing.
      </p>
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={onCreateNote}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Note</span>
        </button>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Lightbulb className="w-4 h-4" />
          <span>Tip: Use keyboard shortcuts for faster note-taking</span>
        </div>
      </div>
    </div>
  );
}

export default function SmartNotes() {
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true); // Make sidebar visible by default
  
  // Get notes and mutations from useSmartNotes hook
  const { notes, isLoading, saveNote, updateNote, deleteNote, saveNoteContent } = useSmartNotes(userId);
  
  const { requestAIInsights } = useAIInsights(updateNote); // updateNote from useSmartNotes is passed here
  const { setIsViewingNote } = useSidebar();
  const router = useRouter();

  // Local note creation: This creates a temporary local note.
  // The actual saving to Convex will happen via saveNote from useSmartNotes when the user explicitly saves.
  const createNote = React.useCallback(async (options: any = {}) => {
    // For creating a new note, we'll call the saveNote mutation immediately with minimal content.
    // The user can then edit it. This avoids managing purely local state that needs complex syncing.
    // Alternatively, could create a truly local object and then call saveNote on first explicit save action.
    // For simplicity with Convex, let's try to save immediately.
    const placeholderContent = options.type === 'brainstorm' ? 'New Brainstorm' : 'New Note';
    const result = await saveNote(options.content || '', {
      metadata: {
        type: options.type || 'idea',
        title: options.title || placeholderContent,
      }
    });

    if (result.success && result.noteId) {
      setActiveNoteId(result.noteId.toString()); // Convex IDs are objects, convert to string for activeNoteId state
      setShowSidebar(false);
    } else {
      console.error("Failed to create note via Convex immediately");
      // Fallback or error handling: maybe create a purely local note if immediate save fails
      // For now, log error. The UI might not show a new note if this fails.
    }
  }, [userId, saveNote]);


  // Update isViewingNote when showSidebar changes
  useEffect(() => {
    setIsViewingNote(!showSidebar);
  }, [showSidebar, setIsViewingNote]);

  const handleDeleteNote = async (noteId: string | Id<"notes">) => {
    try {
      // deleteNote from useSmartNotes handles both local string IDs (like 'local_...') and Convex Id<"notes">
      // It will only call Convex deletion for actual Convex IDs.
      const result = await deleteNote(noteId);
      if (result) {
        // If the active note was deleted, clear activeNoteId
        // activeNoteId is string | null. noteId is string | Id<"notes">.
        // Use String() for a safe string conversion for comparison.
        if (activeNoteId === String(noteId)) {
          setActiveNoteId(null);
        }
      } else {
        console.error('Failed to delete note');
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };



  // activeNote is derived from the `notes` array (from useSmartNotes)
  const activeNote = notes?.find(note => note._id.toString() === activeNoteId);

  // This function is called by NoteArea's onSave button
  // It ensures all content is properly saved to the database using the simpler saveNoteContent function
  const handleSave = async () => {
    if (!activeNote || !activeNoteId) return;
    
    // Log the active note for debugging
    console.log('Saving note content:', { 
      id: activeNote._id, 
      title: activeNote.title,
      contentLength: activeNote.content?.length || 0
    });
    
    try {
      // Use the simpler saveNoteContent function that only updates content and title
      // This avoids schema validation issues with references and other complex fields
      const result = await saveNoteContent(
        activeNote._id,
        activeNote.content || '',
        activeNote.title || ''
      );
      
      if (result) {
        console.log('Note content saved successfully:', { 
          id: result._id,
          contentSaved: result.content?.substring(0, 30) + '...',
          updatedAt: new Date(result.updatedAt).toLocaleTimeString()
        });
      } else {
        console.warn('Note content save returned null result');
      }
    } catch (error) {
      console.error('Failed to save note content:', error);
    }
  };



  return (
    <div className="flex h-screen bg-white/70 backdrop-blur-sm rounded-3xl overflow-hidden">
      {showSidebar && (
        <Sidebar
          notes={notes}
          activeNoteId={activeNoteId}
          onNoteSelect={setActiveNoteId}
          onCreateNote={createNote}
          onDeleteNote={handleDeleteNote}
          onHideSidebar={() => setShowSidebar(false)}
        />
      )}
      {/* Main content area */}
      <div className="flex-1 relative">
        {activeNote ? (
          <NoteArea
            note={activeNote}
            onUpdate={async (noteId, updates) => {
              // Optimistic update (manual setNotes) can be done here if desired for immediate UI feedback.
              // However, updateNote (from useSmartNotes) will trigger Convex update, and reactivity should refresh the notes list.
              // For simplicity, relying on Convex reactivity initially.
              // const currentNotes = notes || [];
              // setNotes(currentNotes.map(note => note._id.toString() === noteId.toString() ? { ...note, ...updates } as Note : note));
              return await updateNote(noteId, updates);
            }}
            onSave={handleSave}
            onToggleShortcuts={() => setShowShortcuts(!showShortcuts)}
            onRequestAIInsights={requestAIInsights}
            onBack={() => {
              setShowSidebar(true);
              setActiveNoteId(null);
            }}
            isMobile={!showSidebar}
          />
        ) : notes.length === 0 ? (
          <EmptyState onCreateNote={() => createNote({})} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 relative">
            {!showSidebar && (
              <button
                onClick={() => setShowSidebar(true)}
                className="absolute top-4 left-4 p-2 rounded-full hover:bg-gray-100"
                title="Back to notes"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            {isLoading && <p>Loading notes...</p> } {/* Show loading indicator */}
            {!isLoading && notes && notes.length > 0 && !activeNote && (
                <SelectNotePrompt onCreateNote={() => createNote({})} />
            )}
            {!isLoading && (!notes || notes.length === 0) && (
                 <EmptyState onCreateNote={() => createNote({})} />
            )}
          </div>
        )}

      </div>
    </div>
  );
}