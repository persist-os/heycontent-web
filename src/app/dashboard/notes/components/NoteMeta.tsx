"use client";
import React, { useState, useRef } from 'react';
import { Note } from '../types';
import { X, Plus, Hash } from 'lucide-react';
import { getRecentTags, type NoteTagData } from '../utils/tag-utils';

interface NoteMetaProps {
  note: Note;
  onUpdate: (noteId: string, updates: { title?: string; tags?: string[] }) => Promise<any>;
  onTitleChange?: (title: string) => void;
  onTagsChange?: (tags: string[]) => void;
  onEditingTitleChange?: (isEditing: boolean) => void;
  noteTagData?: NoteTagData[]; // Array of tag data from all notes for suggestions
}

export function NoteMeta({ note, onUpdate, onTitleChange, onTagsChange, onEditingTitleChange, noteTagData = [] }: NoteMetaProps) {
  const [editedTitle, setEditedTitle] = useState<string | null>(null);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');
  const newTagInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  const isEditingTitle = editedTitle !== null;
  const currentTags = note.tags || [];

  // Get smart tag suggestions (only 2 for minimalism)
  const tagSuggestions = React.useMemo(() => {
    if (!showTagInput || noteTagData.length === 0) return [];
    
    const recentTags = getRecentTags(noteTagData, 4);
    const currentNoteTags = new Set(currentTags);
    
    return recentTags
      .filter(tag => !currentNoteTags.has(tag))
      .slice(0, 2); // Only 2 suggestions for clean design
  }, [showTagInput, noteTagData, currentTags]);

  const displayTitle = isEditingTitle ? editedTitle : (note.title || "Untitled");

  // Elegant title editing
  const startTitleEdit = () => {
    setEditedTitle(note.title || "");
    onEditingTitleChange?.(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const saveTitleEdit = async () => {
    if (editedTitle !== null && editedTitle !== note.title) {
      await onUpdate(String(note._id), { title: editedTitle });
    }
    setEditedTitle(null);
    onEditingTitleChange?.(false);
  };

  const handleTitleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTitleEdit();
    } else if (e.key === 'Escape') {
      setEditedTitle(null);
      onEditingTitleChange?.(false);
    }
  };

  // Elegant tag management
  const addTag = (tag: string) => {
    if (tag && !currentTags.includes(tag)) {
      onTagsChange?.([...currentTags, tag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange?.(currentTags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (newTag.trim()) {
        addTag(newTag.trim());
        setNewTag('');
      }
    } else if (e.key === 'Escape') {
      setShowTagInput(false);
      setNewTag('');
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Breathtaking title section */}
      <div className="group">
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={editedTitle || ''}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={saveTitleEdit}
            onKeyDown={handleTitleKey}
            className="w-full text-2xl font-light tracking-tight bg-transparent border-0 outline-0 text-foreground placeholder:text-muted-foreground/50 focus:text-foreground transition-colors duration-300"
            placeholder="Note title..."
            autoFocus
          />
        ) : (
          <h1
            onClick={startTitleEdit}
            className="text-2xl font-light tracking-tight text-foreground cursor-pointer hover:text-foreground/80 transition-all duration-300 hover:scale-[1.01] transform-gpu"
            title="Click to edit title"
          >
            {displayTitle}
          </h1>
        )}
      </div>

      {/* Minimal metadata row */}
      <div className="flex items-center justify-between">
        {/* Left: full timestamp */}
        <div className="flex items-center text-xs text-muted-foreground/70">
          <time className="font-medium tracking-wide">
            {note.updatedAt
              ? new Date(note.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                }) + ' at ' + new Date(note.updatedAt).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })
              : 'Now'
            }
          </time>
        </div>

        {/* Right: tags */}
        <div className="flex items-center gap-2">
          {currentTags.length > 0 && (
            <div className="flex items-center gap-1.5">
              {currentTags.slice(0, 3).map((tag) => (
                <button
                  key={tag}
                  onClick={() => removeTag(tag)}
                  className="group/tag inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/60 rounded-full border border-border/30 hover:border-border/60 transition-all duration-300 hover:scale-[1.02]"
                  title={`Remove "${tag}"`}
                >
                  <Hash className="w-2.5 h-2.5" />
                  <span className="font-medium">{tag}</span>
                  <X className="w-2.5 h-2.5 opacity-0 group-hover/tag:opacity-70 transition-opacity duration-200" />
                </button>
              ))}
              
              {currentTags.length > 3 && (
                <span className="text-xs text-muted-foreground/60 font-medium">
                  +{currentTags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Tag input when active */}
          {showTagInput ? (
            <div className="flex items-center gap-1.5">
              <input
                ref={newTagInputRef}
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleTagInput}
                onBlur={() => {
                  if (newTag.trim()) {
                    addTag(newTag.trim());
                    setNewTag('');
                  }
                  setShowTagInput(false);
                }}
                className="w-20 px-2 py-1 text-xs bg-muted/40 border border-border/60 rounded-full outline-0 focus:border-primary/50 focus:bg-background transition-all duration-300"
                placeholder="tag..."
                autoFocus
              />
              
              {/* Smart suggestions */}
              {tagSuggestions.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    addTag(tag);
                    setShowTagInput(false);
                  }}
                  className="px-2 py-1 text-xs text-primary/80 hover:text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-full transition-all duration-300 hover:scale-[1.02]"
                  title={`Add "${tag}"`}
                >
                  +{tag}
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={() => setShowTagInput(true)}
              className="p-1.5 text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 rounded-full transition-all duration-300 hover:scale-[1.05]"
              title="Add tags"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
