'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { FileText, Hash, AtSign, Star, Calendar, 
  Image, LinkIcon, Lightbulb, MessageSquare, Clock, Keyboard } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { NoteArea } from './NoteArea';
import { ShortcutsHelp } from './ShortcutsHelp';

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  important: boolean;
  type?: 'default' | 'idea';
  tags: string[];
  references: {
    type: 'ai_insight' | 'conversation' | 'idea';
    content: string;
  }[];
}

export default function SmartNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
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

  const handleUpdateNote = async (noteId: string, updates: Partial<Note>, shouldSync: boolean = false) => {
    try {
      // Update local state immediately
      setNotes(prev => prev.map(note => {
        if (note.id === noteId) {
          // Handle metadata updates (important, type) specially
          if ('important' in updates || 'type' in updates) {
            return {
              ...note,
              ...updates,
              updatedAt: new Date()
            };
          }
          // Handle content updates
          return { ...note, ...updates };
        }
        return note;
      }));

      // Always sync metadata changes with server
      if (shouldSync || 'important' in updates || 'type' in updates) {
        const updatedNote = await updateNote(noteId, updates);
        setNotes(prev => prev.map(note => 
          note.id === noteId ? updatedNote : note
        ));
      }
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
            onUpdate={(noteId, updates) => handleUpdateNote(noteId, updates, false)}
            onSave={() => activeNote && handleUpdateNote(activeNote.id, {}, true)}
            onToggleShortcuts={() => setShowShortcuts(!showShortcuts)}
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