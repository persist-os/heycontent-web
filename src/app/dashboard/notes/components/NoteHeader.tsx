import React, { useState } from 'react';
import { Lightbulb, Star, Brain, Save, Loader2, ArrowLeft, ChevronLeft } from 'lucide-react';
import type { Note, NoteType } from '../types/index';
import toast from 'react-hot-toast';

interface NoteHeaderProps {
  note: Note;
  onUpdate: (noteId: string, updates: Partial<Note>) => void;
  onSave: () => void;
  onBack: () => void;
  isMobile: boolean;
  currentContent?: string; // Add current content prop
  // Navigation stack props
  canGoBack?: boolean;
  onNavigateBack?: () => void;
  navigationStack?: string[];
}

export function NoteHeader({ note, onUpdate, onSave, onBack, isMobile, currentContent, canGoBack, onNavigateBack, navigationStack }: NoteHeaderProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Handler for Save button that shows a toast
  const handleSave = async () => {
    console.log('[NoteHeader] Save button clicked, calling onSave');
    try {
      await onSave();
      toast.success('Note saved', { 
        duration: 1800, 
        position: 'top-center',
        icon: null 
      });
    } catch (err) {
      toast.error('Failed to save note');
    }
  };

  return (
    <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
      <div className="px-4 py-3 flex items-center">
        {/* Left spacer for centering */}
        <div className="flex-1"></div>
        
        {/* Centered title */}
        <div className="text-center">
          <h1 className="text-base font-medium text-foreground inline-block">Smart Notes</h1>
        </div>
        
        {/* Right side with back button and action buttons */}
        <div className="flex-1 flex justify-end">
          <div className="flex gap-2">
            {/* Unified back button */}
            {(isMobile || (canGoBack && onNavigateBack)) && (
              <button
                onClick={canGoBack && onNavigateBack ? onNavigateBack : onBack}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/60 transition-all duration-200 group"
                title={canGoBack && onNavigateBack ? `Back to previous note (${navigationStack?.length || 0} in history)` : "Back to notes grid"}
              >
                {canGoBack && onNavigateBack ? (
                  <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
                ) : (
                  <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
                )}
              </button>
            )}
            
            <button
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 group ${
                note.type === 'idea_bank' 
                  ? 'bg-primary border-2 border-primary ring-2 ring-primary/30' 
                  : 'bg-muted/60 hover:bg-primary border border-transparent'
              }`}
              onClick={() => onUpdate(String(note._id), { type: note.type === 'idea_bank' ? 'content_script' : 'idea_bank' as NoteType })}
              title={note.type === 'idea_bank' ? 'Switch to content script' : 'Mark as idea bank'}
            >
              <Lightbulb 
                size={16} 
                className={
                  note.type === 'idea_bank'
                    ? '!text-white group-hover:!text-white dark:!text-black dark:group-hover:!text-black dark:group-hover:stroke-black'
                    : 'text-black dark:text-white group-hover:!text-white dark:group-hover:!text-white dark:group-hover:stroke-black'
                }
              />
            </button>
            <button
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 group ${
                note.important 
                  ? 'bg-primary border-2 border-primary ring-2 ring-primary/30' 
                  : 'bg-muted/60 hover:bg-primary border border-transparent'
              }`}
              onClick={() => onUpdate(String(note._id), { important: !note.important })}
              title={note.important ? 'Remove importance' : 'Mark as important'}
            >
              <Star 
                size={16} 
                fill={note.important ? "currentColor" : "none"}
                className={
                  note.important
                    ? '!text-white group-hover:!text-white dark:!text-black dark:group-hover:!text-black dark:group-hover:stroke-black'
                    : 'text-black dark:text-white group-hover:!text-white dark:group-hover:!text-white dark:group-hover:stroke-black'
                }
              />
            </button>
            
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary border border-white dark:border-primary hover:bg-primary/90 transition-all duration-200 shadow-sm group"
              onClick={handleSave}
              title="Save note"
            >
              <Save size={16} className="!text-white dark:!text-black" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}