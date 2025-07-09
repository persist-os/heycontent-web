import React, { useState } from 'react';
import { Lightbulb, Star, Save, Loader2, ArrowLeft, ChevronRight } from 'lucide-react';
import type { Note, NoteType } from '../types/index';
import toast from 'react-hot-toast';

interface NoteHeaderProps {
  note: Note;
  onUpdate: (noteId: string, updates: Partial<Note>) => void;
  onSave: () => void;
  onBack: () => void;
  isMobile: boolean;
  currentContent?: string;
  fromChat?: boolean;
  canNavigateBack?: boolean;
  backButtonContext?: string;
  navigationStack?: Array<{ noteId: string; timestamp: number; fromLink: boolean }>;
  notes?: Array<{ _id: string; title: string }>;
}

export function NoteHeader({ 
  note, 
  onUpdate, 
  onSave, 
  onBack, 
  isMobile, 
  currentContent, 
  fromChat,
  canNavigateBack = false,
  backButtonContext = "Back",
  navigationStack = [],
  notes = []
}: NoteHeaderProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Handler for Save button that shows a toast
  const handleSave = async () => {
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

  // Enhanced back button title with navigation context
  const getBackButtonTitle = () => {
    if (backButtonContext) {
      return backButtonContext;
    }
    return fromChat ? "Back to chat" : "Back to notes grid";
  };

  // Generate breadcrumb for navigation stack (show last 2-3 notes)
  const getBreadcrumb = () => {
    if (!canNavigateBack || navigationStack.length === 0) {
      return null;
    }

    const recentStack = navigationStack.slice(-2); // Show last 2 notes in the stack
    const breadcrumbItems = recentStack.map(entry => {
      const stackNote = notes.find(n => String(n._id) === entry.noteId);
      return stackNote ? (stackNote.title || 'Untitled') : 'Unknown';
    });

    return breadcrumbItems;
  };

  const breadcrumb = getBreadcrumb();

  return (
    <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
      <div className="px-4 py-3 flex items-center">
        {/* Left spacer for centering */}
        <div className="flex-1"></div>
        
        {/* Centered title with optional breadcrumb */}
        <div className="text-center">
          {breadcrumb && breadcrumb.length > 0 ? (
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              <span className="truncate max-w-20">{breadcrumb[0]}</span>
              {breadcrumb.length > 1 && (
                <>
                  <ChevronRight className="w-3 h-3 mx-1" />
                  <span className="truncate max-w-20">{breadcrumb[1]}</span>
                </>
              )}
              <ChevronRight className="w-3 h-3 mx-1" />
              <span className="text-foreground font-medium">Current</span>
            </div>
          ) : (
            <h1 className="text-base font-medium text-foreground inline-block">Smart Notes</h1>
          )}
        </div>
        
        {/* Right side with back button and action buttons */}
        <div className="flex-1 flex justify-end">
          <div className="flex gap-2">
            {/* Enhanced back button with smart navigation context */}
            {(isMobile || fromChat || canNavigateBack) && (
              <button
                onClick={onBack}
                className={`w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/60 transition-all duration-200 group ${
                  canNavigateBack && !fromChat ? 'bg-muted/40 ring-1 ring-primary/20' : ''
                }`}
                title={getBackButtonTitle()}
              >
                <ArrowLeft className={`w-5 h-5 transition-colors duration-200 ${
                  canNavigateBack && !fromChat 
                    ? 'text-primary group-hover:text-primary/80' 
                    : 'text-muted-foreground group-hover:text-foreground'
                }`} />
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