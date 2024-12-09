import React from 'react';
import { FileText, Star, Clock, Lightbulb } from 'lucide-react';
import type { Note } from './index';

interface SidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  onNoteSelect: (id: string) => void;
  onCreateNote: () => void;
}

export function Sidebar({ notes, activeNoteId, onNoteSelect, onCreateNote }: SidebarProps) {
  return (
    <div className="w-64 border-r border-gray-100 p-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Smart Notes</h2>
        <button 
          onClick={onCreateNote}
          className="w-full bg-blue-500 text-white rounded-xl py-2 px-4 flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          New Note
        </button>
      </div>

      <div className="space-y-2 mb-6">
        <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500" />
          Important
        </button>
        <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          Recent
        </button>
        <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-purple-500" />
          Ideas
        </button>
      </div>

      <div className="space-y-2">
        {notes.map((note) => (
          <div
            key={note.id}
            onClick={() => onNoteSelect(note.id)}
            className={`p-3 rounded-lg hover:bg-gray-50 cursor-pointer ${
              activeNoteId === note.id ? 'bg-gray-50' : ''
            }`}
          >
            <h3 className="font-medium">{note.title}</h3>
            <p className="text-sm text-gray-500">
              Updated {new Date(note.updatedAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
} 