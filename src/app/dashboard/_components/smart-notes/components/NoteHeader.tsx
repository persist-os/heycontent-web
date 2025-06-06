import React, { useState } from 'react';
import { Lightbulb, Star, Brain, Save, Loader2, ArrowLeft } from 'lucide-react';
import type { Note, NoteType } from '../types/index';
import toast from 'react-hot-toast';

interface NoteHeaderProps {
  note: Note;
  onUpdate: (noteId: string, updates: Partial<Note>) => void;
  onSave: () => void;
  onRequestAIInsights: (noteId: string, note: Note) => Promise<void>;
  onBack: () => void;
  isMobile: boolean;
  currentContent?: string; // Add current content prop
}

export function NoteHeader({ note, onUpdate, onSave, onRequestAIInsights, onBack, isMobile, currentContent }: NoteHeaderProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleRequestInsights = async () => {
    if (isAnalyzing) return;
    try {
      setIsAnalyzing(true);
      // Ensure we're using the latest note data with current content
      if (note && note._id) {
        // Create a new note object with the current content if available
        const noteWithCurrentContent = currentContent !== undefined
          ? { ...note, content: currentContent }
          : note;
        
        console.log('Requesting AI insights with note:', {
          noteId: note._id,
          hasCurrentContent: currentContent !== undefined,
          contentLength: noteWithCurrentContent.content?.length || 0
        });
        
        await onRequestAIInsights(note._id, noteWithCurrentContent);
      } else {
        console.error('Cannot request AI insights: Invalid note or note ID');
      }
    } catch (error) {
      console.error('Failed to request AI insights:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handler for Save button that shows a toast
  const handleSave = async () => {
    console.log('[NoteHeader] Save button clicked, calling onSave');
    try {
      await onSave();
      toast.success('Note saved!', { duration: 1800, position: 'top-right' });
    } catch (err) {
      toast.error('Failed to save note');
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
        <div className="text-gray-500 font-medium">Smart Notes</div>
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
          onClick={handleSave}
          title="Save note"
        >
          <Save size={16} />
        </button>
      </div>
    </div>
  );
}