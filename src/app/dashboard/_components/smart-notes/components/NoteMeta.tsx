"use client";
import React, { useState, useEffect } from 'react';
import { Note } from '../types';

interface NoteMetaProps {
  note: Note;
  onUpdate: (noteId: string, updates: { title: string }) => Promise<Note>;
  onTitleChange?: (title: string) => void;
}

export function NoteMeta({ note, onUpdate, onTitleChange }: NoteMetaProps) {
  const [title, setTitle] = useState(note.title || "Untitled Note");
  const [isEditing, setIsEditing] = useState(false);
  
  // Update local title state when note prop changes
  useEffect(() => {
    setTitle(note.title || "Untitled Note");
    console.log('[NoteMeta] Rendering title:', note.title);
    if (onTitleChange) {
      onTitleChange(note.title || "Untitled Note");
      console.log('[NoteMeta] useEffect: called onTitleChange with', note.title || "Untitled Note");
    }
  }, [note._id, note.title, onTitleChange]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (onTitleChange) {
      onTitleChange(e.target.value);
      console.log('[NoteMeta] handleTitleChange: called onTitleChange with', e.target.value);
    }
  };


  const handleTitleBlur = async () => {
    if (title !== note.title) {
      console.log('[NoteMeta] handleTitleBlur: updating title', { noteId: note._id, newTitle: title });
      await onUpdate(String(note._id), { title });
    }
    setIsEditing(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="pb-3">
      {isEditing ? (
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          className="w-full text-xl font-semibold px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300"
          autoFocus
        />
      ) : (
        <h1 
          className="text-xl font-semibold px-2 py-1 hover:bg-gray-50 rounded-md cursor-pointer"
          onClick={() => setIsEditing(true)}
        >
          {title || "Untitled Note"}
        </h1>
      )}
      <div className="flex flex-wrap items-center mt-1 px-2 text-xs text-gray-500">
        <span>
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
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap items-center ml-2">
            <span className="mr-1">•</span>
            <div className="flex flex-wrap gap-1">
              {note.tags.map((tag, idx) => (
                <span key={idx} className="bg-gray-100 px-1.5 py-0.5 rounded-full text-gray-600">
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
