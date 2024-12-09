'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { FileText, Hash, AtSign, Star, Calendar, 
  Image, LinkIcon, Lightbulb, MessageSquare, Clock, Keyboard } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { NoteArea } from './NoteArea';
import { CommandMenu, type Command } from './CommandMenu';
import { ShortcutsHelp } from './ShortcutsHelp';

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  important: boolean;
  tags: string[];
  references: {
    type: 'ai_insight' | 'conversation' | 'idea';
    content: string;
  }[];
}

export default function SmartNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [showCommands, setShowCommands] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const data = await fetchNotes();
        setNotes(data);
      } catch (error) {
        console.error('Failed to load notes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, []);

  const handleCreateNote = async () => {
    try {
      const newNote = await createNote({
        title: 'Untitled Note',
        content: ''
      });
      
      setNotes(prev => [...prev, newNote]);
      setActiveNoteId(newNote.id);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleUpdateNote = async (noteId: string, updates: Partial<Note>) => {
    try {
      const updatedNote = await updateNote(noteId, updates);
      setNotes(prev => prev.map(note => 
        note.id === noteId ? updatedNote : note
      ));
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      setNotes(prev => prev.filter(note => note.id !== noteId));
      if (activeNoteId === noteId) {
        setActiveNoteId(null);
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const activeNote = notes.find(note => note.id === activeNoteId);

  const fetchNotes = async () => {
    const response = await fetch('/api/notes');
    if (!response.ok) throw new Error('Failed to fetch notes');
    return response.json();
  };

  const createNote = async (note: Partial<Note>) => {
    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note)
    });
    if (!response.ok) throw new Error('Failed to create note');
    return response.json();
  };

  const updateNote = async (noteId: string, updates: Partial<Note>) => {
    const response = await fetch(`/api/notes/${noteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update note');
    return response.json();
  };

  const handleCommand = (command: Command) => {
    setShowCommands(false);
    
    switch (command.label) {
      case 'Text':
        // Add text block
        handleUpdateNote(activeNote!.id, {
          content: activeNote!.content + '\n\n'
        });
        break;
      
      case 'Heading':
        // Add heading
        handleUpdateNote(activeNote!.id, {
          content: activeNote!.content + '\n# '
        });
        break;
      
      case 'Important':
        // Toggle important flag
        handleUpdateNote(activeNote!.id, {
          important: !activeNote!.important
        });
        break;
      
      case 'Capture':
        // Add AI conversation snippet
        handleUpdateNote(activeNote!.id, {
          references: [
            ...activeNote!.references,
            {
              type: 'conversation',
              content: 'Captured conversation snippet'
            }
          ]
        });
        break;
      
      case 'Idea':
        // Add idea reference
        handleUpdateNote(activeNote!.id, {
          references: [
            ...activeNote!.references,
            {
              type: 'idea',
              content: 'New idea'
            }
          ]
        });
        break;
      
      default:
        console.log('Unhandled command:', command.label);
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
            onUpdate={handleUpdateNote}
            showCommands={showCommands}
            setShowCommands={setShowCommands}
          />
          
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="absolute bottom-4 right-4 p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            <Keyboard className="w-5 h-5 text-gray-600" />
          </button>

          {showShortcuts && (
            <div className="absolute bottom-16 right-4">
              <ShortcutsHelp />
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Select a note or create a new one
        </div>
      )}
      
      {showCommands && (
        <CommandMenu
          onSelect={handleCommand}
        />
      )}
    </div>
  );
} 