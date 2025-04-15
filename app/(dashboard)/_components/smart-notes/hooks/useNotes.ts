import { useState, useEffect } from 'react';
import { Note, NoteUpdate } from '../types';

async function fetchNotes(): Promise<Note[]> {
  try {
    const response = await fetch('/api/notes');
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to fetch notes');
  } catch (error) {
    console.warn('API fetch failed, using mock data:', error);
    // Fallback to mock data
    return [
      {
        id: '1',
        title: 'Welcome to Smart Notes',
        content: '# Getting Started\n\nSmart Notes helps you organize your thoughts and ideas.',
        createdAt: new Date(),
        updatedAt: new Date(),
        important: true,
        type: 'default',
        tags: ['welcome'],
        references: []
      }
    ];
  }
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

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

  const createNote = async (note: Partial<Note>) => {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // Always send empty object to create a fresh note
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to create note');
      }

      const newNote = await response.json();

      // Validate the note object
      if (!newNote || !newNote.id) {
        throw new Error('Invalid note object returned from API');
      }

      // Ensure dates are properly parsed
      const formattedNote: Note = {
        ...newNote,
        createdAt: newNote.createdAt instanceof Date ? newNote.createdAt : new Date(newNote.createdAt),
        updatedAt: newNote.updatedAt instanceof Date ? newNote.updatedAt : new Date(newNote.updatedAt),
        tags: Array.isArray(newNote.tags) ? newNote.tags : [],
        references: Array.isArray(newNote.references) ? newNote.references : []
      };

      setNotes(prev => [...prev, formattedNote]);
      return formattedNote;
    } catch (error) {
      console.error('Create note error:', error);
      throw error;
    }
  };

  const updateNote = async (noteId: string, updates: NoteUpdate) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to update note');
      }

      const updatedNote = await response.json();

      // Validate the note object
      if (!updatedNote || !updatedNote.id) {
        throw new Error('Invalid note object returned from API');
      }

      // Ensure dates are properly parsed
      const formattedNote: Note = {
        ...updatedNote,
        createdAt: updatedNote.createdAt instanceof Date ? updatedNote.createdAt : new Date(updatedNote.createdAt),
        updatedAt: updatedNote.updatedAt instanceof Date ? updatedNote.updatedAt : new Date(updatedNote.updatedAt),
        tags: Array.isArray(updatedNote.tags) ? updatedNote.tags : [],
        references: Array.isArray(updatedNote.references) ? updatedNote.references : []
      };

      setNotes(prev => prev.map(note =>
        note.id === noteId ? formattedNote : note
      ));
      return formattedNote;
    } catch (error) {
      console.error('Update note error:', error);
      throw error;
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to delete note');
      }

      setNotes(prev => prev.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('Delete note error:', error);
      throw error;
    }
  };

  return {
    notes,
    isLoading,
    createNote,
    updateNote,
    deleteNote,
    loadNotes
  };
}