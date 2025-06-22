"use client";
import React, { useState, useEffect } from 'react';
import { Note } from '../types';
import { MinimalTypeDisplay } from './TypeSelector';

interface NoteMetaProps {
  note: Note;
  onUpdate: (noteId: string, updates: { title: string }) => Promise<Note>;
  onTitleChange?: (title: string) => void;
  onEditingTitleChange?: (isEditing: boolean) => void;
}

export function NoteMeta({ note, onUpdate, onTitleChange, onEditingTitleChange }: NoteMetaProps) {
  const [title, setTitle] = useState(note.title || "Untitled Note");
  const [isEditing, setIsEditing] = useState(false);
  
  // Update local title state when note prop changes
  useEffect(() => {
    console.log('[NoteMeta] useEffect triggered - note title changed:', {
      noteId: note._id,
      newTitle: note.title,
      currentLocalTitle: title,
      isEditing
    });
    
    if (!isEditing) {
      const newTitle = note.title || "Untitled Note";
      if (newTitle !== title) {
        console.log('[NoteMeta] Updating local title state from:', title, 'to:', newTitle);
        setTitle(newTitle);
      }
      if (onTitleChange) {
        onTitleChange(newTitle);
      }
    }
  }, [note._id, note.title, isEditing, note.titleGenerated]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (onTitleChange) {
      onTitleChange(e.target.value);
      console.log('[NoteMeta] handleTitleChange: called onTitleChange with', e.target.value);
    }
  };

  const handleTitleFocus = () => {
    setIsEditing(true);
    if (onEditingTitleChange) onEditingTitleChange(true);
  };

  const handleTitleBlur = async () => {
    if (title !== note.title) {
      console.log('[NoteMeta] handleTitleBlur: updating title', { noteId: note._id, newTitle: title });
      await onUpdate(String(note._id), { title });
    }
    setIsEditing(false);
    if (onEditingTitleChange) onEditingTitleChange(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="pb-4 px-6 border-b border-border/30">
      {isEditing ? (
        <input
          title="Note Title"
          type="text"
          value={title}
          onChange={handleTitleChange}
          onFocus={handleTitleFocus}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          className="w-full text-xl font-semibold px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-background text-foreground transition-all duration-200"
          autoFocus
        />
      ) : (
        <h1 
          className="text-xl font-semibold px-3 py-2 hover:bg-muted/40 rounded-lg cursor-pointer transition-all duration-200 text-foreground group"
          onClick={() => { setIsEditing(true); if (onEditingTitleChange) onEditingTitleChange(true); }}
        >
          {title || "Untitled Note"}
        </h1>
      )}
      <div className="flex flex-wrap items-center mt-2 px-3 text-xs text-muted-foreground">
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
