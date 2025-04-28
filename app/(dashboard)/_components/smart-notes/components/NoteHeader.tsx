import React, { useState } from 'react';
import { Lightbulb, Star, Brain, Save, Loader2, ArrowLeft } from 'lucide-react';
import type { Note, NoteType } from '../types/index';

interface NoteHeaderProps {
  note: Note;
  onUpdate: (noteId: string, updates: Partial<Note>) => void;
  onSave: () => void;
  onRequestAIInsights: (noteId: string, note: Note) => Promise<void>;
  onBack: () => void;
  isMobile: boolean;
}

export function NoteHeader({ note, onUpdate, onSave, onRequestAIInsights, onBack, isMobile }: NoteHeaderProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleRequestInsights = async () => {
    if (isAnalyzing) return;
    try {
      setIsAnalyzing(true);
      await onRequestAIInsights(note.id, note);
    } catch (error) {
      console.error('Failed to request AI insights:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-4 flex-1">
        {isMobile && (
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100"
            title="Back to notes"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}
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
      </div>
      <div className="flex gap-2">
        <button
          className={`w-8 h-8 rounded-full flex items-center justify-center ${note.type === 'idea' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => onUpdate(note._id, { type: note.type === 'idea' ? undefined : 'idea' as NoteType })}
          title={note.type === 'idea' ? 'Remove idea status' : 'Mark as idea'}
        >
          <Lightbulb size={16} />
        </button>
        <button
          className={`w-8 h-8 rounded-full flex items-center justify-center ${note.important ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => onUpdate(note._id, { important: !note.important })}
          title={note.important ? 'Remove importance' : 'Mark as important'}
        >
          <Star size={16} />
        </button>
        <button
          className={`w-8 h-8 rounded-full flex items-center justify-center ${isAnalyzing ? 'bg-purple-50' : 'bg-purple-100'} text-purple-600 hover:bg-purple-200`}
          onClick={handleRequestInsights}
          disabled={isAnalyzing}
          title={isAnalyzing ? 'Analyzing note...' : 'Get AI insights'}
        >
          {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
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