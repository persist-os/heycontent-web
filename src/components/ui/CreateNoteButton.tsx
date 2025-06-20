'use client';

import { useCreateNote } from '@/app/hooks/useCreateNote';
import { Button } from './button';
import React from 'react';
import { FilePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateNoteButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  content: string;
  onNoteCreate?: () => void;
  children?: React.ReactNode;
}

export const CreateNoteButton = React.forwardRef<HTMLButtonElement, CreateNoteButtonProps>(
  ({ content, children, onClick, onNoteCreate, className, ...props }, ref) => {
    const { createNote } = useCreateNote();

    const handleCreateNote = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (onClick) {
        onClick(e);
      }
      createNote(content, onNoteCreate);
    };

    return (
      <Button
        ref={ref}
        onClick={handleCreateNote}
        disabled={!content.trim() || props.disabled}
        variant="ghost"
        className={cn("text-xs bg-gray-100 dark:bg-gray-800", className)}
        {...props}
      >
        <FilePlus />
        {children}
      </Button>
    );
  }
);

CreateNoteButton.displayName = 'CreateNoteButton';