'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { NoteArea } from './NoteArea';
import { ShortcutsHelp } from './ShortcutsHelp';
import { useNotes, Note } from './hooks/useNotes';
import { useAIInsights } from './hooks/useAIInsights';

export default function SmartNotes() {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  const { notes, isLoading, createNote, updateNote, deleteNote } = useNotes();
  const { requestAIInsights } = useAIInsights(updateNote);

  const handleCreateNote = async () => {
    try {
      const newNote = await createNote({});
      if (newNote) {
        setActiveNoteId(newNote._id);
      } else {
        console.error('Failed to create note: Invalid note object returned');
      }
    } catch (error: any) {
      console.error('Failed to create note:', error);
      if (error.message.includes('log in')) {
        return;
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      if (activeNoteId === noteId) {
        setActiveNoteId(null);
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const activeNote = notes.find(note => note._id === activeNoteId);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white/70 backdrop-blur-sm rounded-3xl overflow-hidden">
      <Sidebar
        notes={notes}
        activeNoteId={activeNoteId}
        onNoteSelect={setActiveNoteId}
        onCreateNote={handleCreateNote}
        onDeleteNote={handleDeleteNote}
      />

      {activeNote ? (
        <div className="flex-1 relative">
          <NoteArea
            note={activeNote}
            onUpdate={(noteId, updates) => updateNote(noteId, updates)}
            onSave={() => activeNote && updateNote(activeNote._id, {})}
            onToggleShortcuts={() => setShowShortcuts(!showShortcuts)}
            onRequestAIInsights={requestAIInsights}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Select a note or create a new one
        </div>
      )}

      {showShortcuts && (
        <ShortcutsHelp onClose={() => setShowShortcuts(false)} />
      )}
    </div>
  );
}