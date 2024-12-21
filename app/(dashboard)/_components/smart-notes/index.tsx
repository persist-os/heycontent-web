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
        content: '',
        important: false,
        tags: [],
        references: []
      });
      
      setNotes(prev => [...prev, newNote]);
      setActiveNoteId(newNote.id);
    } catch (error: any) {
      console.error('Failed to create note:', error);
      if (error.message.includes('log in')) {
        return;
      }
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
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Failed to fetch notes');
    }
    return response.json();
  };

  const createNote = async (note: Partial<Note>) => {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create note:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });

        if (response.status === 401) {
          window.location.href = '/login';
          throw new Error('Please log in to create notes');
        }

        throw new Error(errorData.details || 'Failed to create note');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Create note error:', error);
      throw error;
    }
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
    
    if (!activeNote) return;

    const insertText = (text: string) => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const content = activeNote.content;
        const newContent = content.substring(0, start) + text + content.substring(end);
        handleUpdateNote(activeNote.id, { content: newContent });
        // Set cursor position after inserted text
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + text.length;
          textarea.focus();
        }, 0);
      }
    };
    
    switch (command.label) {
      case 'Text':
        insertText('\n\n');
        break;
      
      case 'Heading':
        insertText('\n# ');
        break;
      
      case 'Important':
        handleUpdateNote(activeNote.id, {
          important: !activeNote.important
        });
        break;
      
      case 'Date':
        insertText(`\n${new Date().toLocaleDateString()}\n`);
        break;
      
      case 'Capture':
        handleUpdateNote(activeNote.id, {
          references: [
            ...activeNote.references,
            {
              type: 'conversation',
              content: 'Captured conversation snippet'
            }
          ]
        });
        break;
      
      case 'Link':
        insertText('[](url)');
        break;
      
      case 'Idea':
        handleUpdateNote(activeNote.id, {
          references: [
            ...activeNote.references,
            {
              type: 'idea',
              content: 'New idea'
            }
          ]
        });
        break;
      
      case 'Comment':
        insertText('\n> ');
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
            onSave={() => handleUpdateNote(activeNote.id, { content: activeNote.content })}
            onToggleShortcuts={() => setShowShortcuts(!showShortcuts)}
          />
          
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="absolute bottom-4 right-4 p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            <Keyboard className="w-5 h-5 text-gray-600" />
          </button>

          {showShortcuts && (
            <div className="absolute bottom-16 right-4">
              <ShortcutsHelp onClose={() => setShowShortcuts(false)} />
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
          onClose={() => setShowCommands(false)}
        />
      )}
    </div>
  );
} 