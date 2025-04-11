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
    type: 'ai_insight' | 'conversation' | 'idea' | 'url' | 'date';
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

  const handleRequestAIInsights = async (noteId: string) => {
    try {
      const note = notes.find(n => n.id === noteId);
      if (!note) return;

      // In a real app, you'd make an API call to generate insights
      // For demo purposes, we'll simulate this with a delayed response
      
      // Mock insights
      const newInsight = {
        type: 'ai_insight' as const,
        content: 'Based on your note, here are some suggestions:\n- Add more specific examples\n- Consider breaking down into bullet points\n- Link to related content pieces'
      };
      
      // Add the insight to the note's references
      const updatedReferences = [...(note.references || []), newInsight];
      handleUpdateNote(noteId, { references: updatedReferences }, true);
      
      // Show a success message (in a real app)
      console.log('AI insights generated successfully');
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
    }
  };

  const activeNote = notes.find(note => note.id === activeNoteId);

  const fetchNotes = async () => {
    // First try to get from API
    try {
      const response = await fetch('/api/notes');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('API fetch failed, using mock data:', error);
    }
    
    // Fallback to mock data
    return [
      {
        id: '1',
        title: 'Welcome to Smart Notes',
        content: '# Getting Started\n\nSmart Notes helps you organize your thoughts and ideas. Here are some features:\n\n- Markdown formatting\n- Tag organization with #tags\n- AI-powered insights\n\n## Tips\n\nUse the / command to access the command menu.',
        createdAt: new Date(),
        updatedAt: new Date(),
        important: true,
        type: 'default',
        tags: ['welcome'],
        references: [
          {
            type: 'ai_insight',
            content: 'Try using headers to organize your notes better.'
          }
        ]
      },
      {
        id: '2',
        title: 'Content Strategy Ideas',
        content: '# Content Strategy Ideas\n\n## Social Media\n- Post 3x per week on LinkedIn\n- Create more video content\n- Engage with industry leaders\n\n## Blog\n- Write long-form tutorials\n- Update old posts\n- Focus on SEO optimization\n\n#content #strategy #ideas',
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 86400000),
        important: true,
        type: 'idea',
        tags: ['content', 'strategy', 'ideas'],
        references: [
          {
            type: 'ai_insight',
            content: 'Based on your audience analysis, video content performs 40% better than text-only posts.'
          }
        ]
      },
      {
        id: '3',
        title: 'Meeting Notes',
        content: '# Team Meeting - April 5\n\n## Attendees\n- Sarah (Marketing)\n- John (Product)\n- Maya (Design)\n\n## Action Items\n- Update product roadmap by Friday\n- Schedule user testing sessions\n- Finalize Q2 marketing calendar\n\n#meeting #team',
        createdAt: new Date(Date.now() - 172800000),
        updatedAt: new Date(Date.now() - 172800000),
        important: false,
        type: 'default',
        tags: ['meeting', 'team'],
        references: []
      }
    ];
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
      // Fallback for demo: create a local note
      return {
        id: `temp_${Date.now()}`,
        title: note.title || 'Untitled Note',
        content: note.content || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        important: note.important || false,
        type: note.type || 'default',
        tags: note.tags || [],
        references: note.references || []
      };
    }
  };

  const updateNote = async (noteId: string, updates: Partial<Note>) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update note');
      return response.json();
    } catch (error) {
      console.error('Update note error:', error);
      // Fallback for demo: update local note
      const note = notes.find(n => n.id === noteId);
      if (!note) throw new Error('Note not found');
      return {
        ...note,
        ...updates,
        updatedAt: new Date()
      };
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
            onUpdate={(noteId, updates) => handleUpdateNote(noteId, updates, false)}
            onSave={() => activeNote && handleUpdateNote(activeNote.id, {}, true)}
            onToggleShortcuts={() => setShowShortcuts(!showShortcuts)}
            onRequestAIInsights={handleRequestAIInsights}
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