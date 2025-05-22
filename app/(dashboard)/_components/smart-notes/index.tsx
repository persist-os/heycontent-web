'use client';

import { useState, useEffect } from 'react';
import SmartNoteWizard from './SmartNoteWizard';
import { Sidebar } from './Sidebar';
import { NoteArea } from './NoteArea';
import { ShortcutsHelp } from './ShortcutsHelp';
import { useNotes } from './hooks/useNotes';
import { Note } from './types';
import { useAIInsights } from './hooks/useAIInsights';
import { FileText, Plus, Lightbulb, ArrowLeft } from 'lucide-react';
import { useSidebar } from '@/app/context/sidebar-context';

function EmptyState({ onCreateNote }: { onCreateNote: () => void }) {
  // Show the wizard instead of the button if needed
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

export default function SmartNotes() {
  const [showWizard, setShowWizard] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true); // Make sidebar visible by default
  
  const { notes, isLoading, createNote, updateNote, deleteNote } = useNotes();
  const { requestAIInsights } = useAIInsights(updateNote);
  const { setIsViewingNote } = useSidebar();

  // Update isViewingNote when showSidebar changes
  useEffect(() => {
    setIsViewingNote(!showSidebar);
  }, [showSidebar, setIsViewingNote]);

  const handleCreateNote = async (options?: { type?: string; skipWizard?: boolean }) => {
    // If skipWizard is true, create a note directly without showing the wizard
    if (options?.skipWizard) {
      try {
        // Create an empty note with the specified type (e.g., 'brainstorm')
        const noteId = await createNote({
          title: `Brainstorm ${new Date().toLocaleDateString()}`,
          content: '',
          type: options.type as any, // Type is specified in options
        });
        if (noteId) {
          setActiveNoteId(noteId);
          setShowSidebar(false);
        }
      } catch (error: any) {
        console.error('Failed to create brainstorm note:', error);
      }
    } else {
      // Show the wizard for normal note creation
      setShowWizard(true);
    }
  };

  // Called when the wizard is completed
  const handleWizardComplete = async (wizardData: any) => {
    try {
      // You might want to adapt this to send all wizardData to backend
      const noteId = await createNote({
        platform: wizardData.platform,
        category: wizardData.category,
        topic: wizardData.topic,
        content: wizardData.description || '',
        analysis: wizardData.analysis || null,
      });
      if (noteId) {
        setActiveNoteId(noteId);
        setShowSidebar(false);
      } else {
        console.error('Failed to create note: Invalid note ID returned');
      }
    } catch (error: any) {
      console.error('Failed to create note:', error);
      if (error.message && error.message.includes('log in')) {
        return;
      }
    }
    setShowWizard(false);
  };

  const handleWizardCancel = () => {
    setShowWizard(false);
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
    <>
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full">
            <SmartNoteWizard
              // On completion, pass wizard data to create the note
              // You can expand this as you add more fields/logic
              onComplete={handleWizardComplete}
              onCancel={handleWizardCancel}
            />
          </div>
        </div>
      )}
      <div className="flex h-screen bg-white/70 backdrop-blur-sm rounded-3xl overflow-hidden">
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
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 relative">
              <EmptyState onCreateNote={handleCreateNote} />
            </div>
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
              <div className="bg-purple-50 rounded-full p-4 mb-4">
                <FileText className="w-12 h-12 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Select a Note</h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                Choose a note from the sidebar or create a new one to start writing.
              </p>
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={handleCreateNote}
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
          )}

          {/* Overlay sidebar */}
          <div 
            className={`${
              showSidebar ? 'translate-x-0' : '-translate-x-full'
            } transform transition-transform absolute top-0 left-0 h-full z-50 bg-white shadow-lg`}
          >
            <Sidebar
              notes={notes}
              activeNoteId={activeNoteId}
              onNoteSelect={(id) => {
                setActiveNoteId(id);
                setShowSidebar(false);
              }}
              onCreateNote={handleCreateNote}
              onDeleteNote={handleDeleteNote}
              onHideSidebar={() => setShowSidebar(false)}
            />
          </div>
        </div>

        {showShortcuts && (
          <ShortcutsHelp onClose={() => setShowShortcuts(false)} />
        )}
      </div>
    </>
  );
}