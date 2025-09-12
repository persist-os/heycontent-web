import React, { useState } from 'react';
import type { Note, NoteType } from '../types/index';
import { CentralizedHeader, createSaveAction, createStarAction, createLightbulbAction } from '@/components/ui/centralized-header';
import { Sparkles } from 'lucide-react';

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

  // Generate breadcrumb for navigation stack (show last 2-3 notes)
  const getBreadcrumb = () => {
    if (!canNavigateBack || navigationStack.length === 0) {
      return [];
    }

    const recentStack = navigationStack.slice(-2); // Show last 2 notes in the stack
    return recentStack.map(entry => {
      const stackNote = notes.find(n => String(n._id) === entry.noteId);
      return {
        label: stackNote ? (stackNote.title || 'Untitled') : 'Unknown',
        onClick: () => onBack()
      };
    });
  };

  // Create actions (removed save button)
  const rightActions = [
    createLightbulbAction(
      note.type === 'idea_bank',
      () => onUpdate(String(note._id), { type: note.type === 'idea_bank' ? 'content_script' : 'idea_bank' as NoteType })
    ),
    createStarAction(
      note.important,
      () => onUpdate(String(note._id), { important: !note.important })
    )
  ];

  return (
    <CentralizedHeader
      title="Smart Notes"
      showBackButton={false}
      backButtonContext={backButtonContext}
      onBack={onBack}
      breadcrumbs={getBreadcrumb()}
      rightActions={rightActions}
      showThemeToggle={false}
      variant="elevated"
    />
  );
}