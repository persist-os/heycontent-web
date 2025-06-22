'use client';

import { useState } from 'react';
import { useCreateNote } from '@/app/dashboard/notes/hooks/useCreateNote';
import { Button } from './button';
import React from 'react';
import { FilePlus, Loader2 } from 'lucide-react';

interface CreateNoteButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  content: string;
  onNoteCreate?: () => void;
  children?: React.ReactNode;
  title?: string;
}

export const CreateNoteButton = React.forwardRef<HTMLButtonElement, CreateNoteButtonProps>(
  ({ content, children, onClick, onNoteCreate, className, title, ...props }, ref) => {
    const { createNote, isCreating } = useCreateNote();

    const handleCreateNote = async () => {
      if (onClick) {
        onClick({} as React.MouseEvent<HTMLButtonElement>);
      }
      
      if (content.trim()) {
        await createNote(content.trim(), onNoteCreate, title);
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
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          children || (
            <>
              <FilePlus className="mr-2 h-4 w-4" />
              Save as Note
            </>
          )
        )}
      </Button>
    );
  }
);

CreateNoteButton.displayName = 'CreateNoteButton';