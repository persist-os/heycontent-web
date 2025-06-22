'use client';

import { useState } from 'react';
import { useCreateNote } from '@/app/hooks/useCreateNote';
import { Button } from './button';
import React from 'react';
import { FilePlus, Loader2 } from 'lucide-react';

interface CreateNoteButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  content: string;
  onNoteCreate?: () => void;
  children?: React.ReactNode;
}

export const CreateNoteButton = React.forwardRef<HTMLButtonElement, CreateNoteButtonProps>(
  ({ content, children, onClick, onNoteCreate, className, ...props }, ref) => {
    const { createNote, isCreating } = useCreateNote();

    const handleCreateNote = async () => {
      if (onClick) {
        onClick({} as React.MouseEvent<HTMLButtonElement>);
      }
      
      if (content.trim()) {
        await createNote(content.trim(), onNoteCreate);
      }
    };

    return (
      <Button
        ref={ref}
        onClick={handleCreateNote}
        disabled={isCreating || !content.trim()}
        className={className}
        {...props}
      >
        {isCreating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          children || <FilePlus className="mr-2 h-4 w-4" />
        )}
        {isCreating ? 'Saving...' : 'Save as Note'}
      </Button>
    );
  }
);

CreateNoteButton.displayName = 'CreateNoteButton';