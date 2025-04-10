import React, { useState } from 'react';
import { FileText, Star, Clock, Lightbulb, Trash2 } from 'lucide-react';
import type { Note } from './index';

interface SidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  onNoteSelect: (id: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string) => void;
}

export function Sidebar({ notes, activeNoteId, onNoteSelect, onCreateNote, onDeleteNote }: SidebarProps) {
  const [selectedSection, setSelectedSection] = useState<'all' | 'important' | 'recent' | 'ideas'>('all');

  // Filter notes based on section
  const filteredNotes = notes.filter(note => {
    switch (selectedSection) {
      case 'important':
        return note.important;
      case 'ideas':
        return note.type === 'idea';
      case 'recent':
        return true; // Will sort by date below
      default:
        return true;
    }
  });

  // Sort notes by date for recent section
  if (selectedSection === 'recent') {
    filteredNotes.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  return (
    <div className="w-64 border-r border-gray-100 p-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Smart Notes</h2>
        <button 
          onClick={onCreateNote}
          className="w-full bg-purple-500 text-white rounded-xl py-2 px-4 flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          New Note
        </button>
      </div>

      <div className="space-y-2 mb-6">
        <button 
          onClick={() => setSelectedSection('important')}
          className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${
            selectedSection === 'important' ? 'bg-yellow-50' : 'hover:bg-gray-50'
          }`}
        >
          <Star className="w-4 h-4 text-yellow-500" />
          Important
        </button>
        <button 
          onClick={() => setSelectedSection('recent')}
          className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${
            selectedSection === 'recent' ? 'bg-purple-50' : 'hover:bg-gray-50'
          }`}
        >
          <Clock className="w-4 h-4 text-purple-500" />
          Recent
        </button>
        <button 
          onClick={() => setSelectedSection('ideas')}
          className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${
            selectedSection === 'ideas' ? 'bg-purple-50' : 'hover:bg-gray-50'
          }`}
        >
          <Lightbulb className="w-4 h-4 text-purple-500" />
          Ideas
        </button>
      </div>

      <div className="space-y-2">
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            className={`p-3 rounded-lg hover:bg-gray-50 cursor-pointer group ${
              activeNoteId === note.id ? 'bg-gray-50' : ''
            } ${note.important ? 'border-l-2 border-yellow-500' : ''} ${
              note.type === 'idea' ? 'border-l-2 border-purple-500' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1" onClick={() => onNoteSelect(note.id)}>
                <h3 className="font-medium truncate">{note.title || 'Untitled Note'}</h3>
                <p className="text-sm text-gray-500">
                  Updated {new Date(note.updatedAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteNote(note.id);
                }}
                className="p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 