'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { NoteArea } from './NoteArea';
import { ShortcutsHelp } from './ShortcutsHelp';
import { useNotes } from './hooks/useNotes';
import type { NoteType } from './types/index';
import { Note } from './types/index';
import { useAIInsights } from './hooks/useAIInsights';
import { FileText, Plus, Lightbulb, ArrowLeft } from 'lucide-react';
import { useSidebar } from '@/app/context/sidebar-context';
import { useAuth } from '@/app/context/auth-context';

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
  const { user } = useAuth();
  const userId = user?.uid;
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true); // Make sidebar visible by default
  
  const { notes, isLoading, createNote, updateNote, deleteNote } = useNotes(userId);
  const { requestAIInsights } = useAIInsights(updateNote);
  const { setIsViewingNote } = useSidebar();

  // Update isViewingNote when showSidebar changes
  useEffect(() => {
    setIsViewingNote(!showSidebar);
  }, [showSidebar, setIsViewingNote]);

  const handleCreateNote = async (options: { type?: NoteType; skipWizard?: boolean } = {}) => {
    try {
      // Create an empty note directly (Notion-like experience)
      const type = options?.type || 'idea';
      const title = type === 'brainstorm'
        ? `Brainstorm ${new Date().toLocaleDateString()}`
        : `Untitled Note ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      // Send all required fields for Convex schema
      const noteId = await createNote({
        title,
        content: '',
        type,
        platform: 'web',
        tags: [],
        references: [],
        important: false,
      });
      if (noteId) {
        setActiveNoteId(noteId);
        setShowSidebar(false);
      }
    } catch (error: any) {
      console.error('Failed to create note:', error);
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

  const handleSave = async () => {
    if (!activeNote) return;
    try {
      await updateNote(activeNote._id, { content: activeNote.content });
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white/70 backdrop-blur-sm rounded-3xl overflow-hidden">
      {showSidebar && (
        <Sidebar
          notes={notes}
          activeNoteId={activeNoteId}
          onNoteSelect={setActiveNoteId}
          onCreateNote={handleCreateNote}
          onDeleteNote={handleDeleteNote}
          onHideSidebar={() => setShowSidebar(false)}
        />
      )}
      {/* Main content area */}
      <div className="flex-1 relative">
        {activeNote ? (
          <NoteArea
            note={activeNote}
            onUpdate={(noteId, updates) => updateNote(noteId, updates)}
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
          <EmptyState onCreateNote={handleCreateNote} />
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
            <SelectNotePrompt onCreateNote={handleCreateNote} />
          </div>
        )}
      </div>
    </div>
  );
}