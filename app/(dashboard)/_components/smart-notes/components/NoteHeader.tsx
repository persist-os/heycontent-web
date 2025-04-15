import React from 'react';
import { Lightbulb, Star, Brain, Save } from 'lucide-react';
import type { Note, NoteType } from '../types/index';

interface NoteHeaderProps {
  note: Note;
  onUpdate: (noteId: string, updates: Partial<Note>) => void;
  onSave: () => void;
  onRequestAIInsights: (noteId: string, note: Note) => Promise<void>;
}

export function NoteHeader({ note, onUpdate, onSave, onRequestAIInsights }: NoteHeaderProps) {
  return (
    <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
      <input
        type="text"
        value={note.title}
        onChange={(e) => {
          const newTitle = e.target.value;
          onUpdate(note.id, { title: newTitle });
        }}
        className="text-2xl font-semibold bg-transparent border-none focus:outline-none w-full"
        placeholder="Untitled Note"
      />
      <div className="flex gap-2">
        <button
          className={`w-8 h-8 rounded-full flex items-center justify-center ${note.type === 'idea' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => onUpdate(note.id, { type: note.type === 'idea' ? undefined : 'idea' as NoteType })}
          title={note.type === 'idea' ? 'Remove idea status' : 'Mark as idea'}
        >
          <Lightbulb size={16} />
        </button>
        <button
          className={`w-8 h-8 rounded-full flex items-center justify-center ${note.important ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => onUpdate(note.id, { important: !note.important })}
          title={note.important ? 'Remove importance' : 'Mark as important'}
        >
          <Star size={16} />
        </button>
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-100 text-purple-600 hover:bg-purple-200"
          onClick={() => onRequestAIInsights(note.id, note)}
          title="Get AI insights"
        >
          <Brain size={16} />
        </button>
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-600 text-white hover:bg-purple-700"
          onClick={onSave}
          title="Save note"
        >
          <Save size={16} />
        </button>
      </div>
    </div>
  );
} 