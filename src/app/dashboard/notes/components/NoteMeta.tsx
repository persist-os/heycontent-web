"use client";
import React, { useState, useEffect } from 'react';
import { Note } from '../types';
import { MinimalTypeDisplay } from './TypeSelector';

interface NoteMetaProps {
  note: Note;
  onUpdate: (noteId: string, updates: { title: string }) => Promise<any>;
  onTitleChange?: (title: string) => void;
  onEditingTitleChange?: (isEditing: boolean) => void;
}

export function NoteMeta({ note, onUpdate, onTitleChange, onEditingTitleChange }: NoteMetaProps) {
  const [editedTitle, setEditedTitle] = useState<string | null>(null);
  const isEditing = editedTitle !== null;

  const displayTitle = isEditing ? editedTitle : (note.title || "Untitled Note");

  const handleStartEditing = () => {
    setEditedTitle(note.title || "");
    if (onEditingTitleChange) onEditingTitleChange(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedTitle(e.target.value);
    if (onTitleChange) {
      onTitleChange(e.target.value);
    }
  };

  const handleTitleBlur = async () => {
    if (editedTitle !== null && editedTitle !== note.title) {
      await onUpdate(String(note._id), { title: editedTitle });
    }
    setEditedTitle(null);
    if (onEditingTitleChange) onEditingTitleChange(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
    if (e.key === 'Escape') {
      setEditedTitle(null);
      if (onEditingTitleChange) onEditingTitleChange(false);
    }
  };
  
  return (
    <div className="flex-1 min-w-0">
      {isEditing ? (
        <input
          title="Note Title"
          type="text"
          value={editedTitle || ''}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          className="w-full text-xl font-semibold px-1 -ml-1 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-background text-foreground transition-all duration-200"
          autoFocus
        />
      ) : (
        <h1 
          className="text-xl font-semibold px-1 -ml-1 hover:bg-muted/40 rounded-lg cursor-pointer transition-all duration-200 text-foreground truncate"
          onClick={handleStartEditing}
          title={displayTitle}
        >
          {displayTitle}
        </h1>
      )}
      <div className="flex flex-wrap items-center mt-2 text-xs text-muted-foreground">
        <span className="font-medium">
          {note.updatedAt
            ? new Date(note.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            : 'Just now'
          }
        </span>
        <span className="mx-2 text-muted-foreground/60">•</span>
        <MinimalTypeDisplay currentType={note.type || 'idea_bank'} />
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap items-center ml-3">
            <span className="mr-2 text-muted-foreground/60">•</span>
            <div className="flex flex-wrap gap-1.5">
              {note.tags.map((tag, idx) => (
                <span key={idx} className="bg-muted/60 px-2 py-1 rounded-full text-muted-foreground text-xs font-medium border border-border/40 hover:border-border transition-colors duration-200">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
