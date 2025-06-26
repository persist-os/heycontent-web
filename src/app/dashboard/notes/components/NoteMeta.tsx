"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Note } from '../types';
import { MinimalTypeDisplay } from './TypeSelector';
import { X, Plus, Edit2 } from 'lucide-react';
import { getRecentTags, type NoteTagData } from '../utils/tag-utils';

interface NoteMetaProps {
  note: Note;
  onUpdate: (noteId: string, updates: { title?: string; tags?: string[] }) => Promise<any>;
  onTitleChange?: (title: string) => void;
  onEditingTitleChange?: (isEditing: boolean) => void;
  noteTagData?: NoteTagData[]; // Array of tag data from all notes for suggestions
}

export function NoteMeta({ note, onUpdate, onTitleChange, onEditingTitleChange, noteTagData = [] }: NoteMetaProps) {
  const [editedTitle, setEditedTitle] = useState<string | null>(null);
  const [editingTags, setEditingTags] = useState(false);
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const newTagInputRef = useRef<HTMLInputElement>(null);
  
  const isEditing = editedTitle !== null;

  // Calculate recent tag suggestions (excluding tags already on this note)
  const recentTagSuggestions = React.useMemo(() => {
    if (!editingTags || noteTagData.length === 0) return [];
    
    const recentTags = getRecentTags(noteTagData, 6); // Get more than 3 in case some are filtered out
    const currentNoteTags = new Set(note.tags || []);
    const alreadyAddedTags = new Set(editedTags);
    
    return recentTags
      .filter(tag => !currentNoteTags.has(tag) && !alreadyAddedTags.has(tag))
      .slice(0, 3); // Show max 3 suggestions
  }, [editingTags, noteTagData, note.tags, editedTags]);

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

  // Tag editing functions
  const handleStartEditingTags = () => {
    setEditingTags(true);
    setEditedTags([...(note.tags || [])]);
    setNewTag('');
  };

  const handleSaveTags = async () => {
    const trimmedTags = editedTags.map(tag => tag.trim()).filter(tag => tag.length > 0);
    if (JSON.stringify(trimmedTags) !== JSON.stringify(note.tags || [])) {
      await onUpdate(String(note._id), { tags: trimmedTags });
    }
    setEditingTags(false);
    setEditedTags([]);
    setNewTag('');
  };

  const handleCancelEditingTags = () => {
    setEditingTags(false);
    setEditedTags([]);
    setNewTag('');
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setEditedTags(tags => tags.filter((_, index) => index !== indexToRemove));
  };

  const handleEditTag = (index: number, newValue: string) => {
    setEditedTags(tags => tags.map((tag, i) => i === index ? newValue : tag));
  };

  const handleAddNewTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !editedTags.includes(trimmedTag)) {
      setEditedTags(tags => [...tags, trimmedTag]);
      setNewTag('');
      if (newTagInputRef.current) {
        newTagInputRef.current.focus();
      }
    }
  };

  const handleAddSuggestedTag = (tag: string) => {
    if (!editedTags.includes(tag)) {
      setEditedTags(tags => [...tags, tag]);
    }
  };

  const handleNewTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNewTag();
    }
    if (e.key === 'Escape') {
      handleCancelEditingTags();
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (newTagInputRef.current) {
        newTagInputRef.current.focus();
      }
    }
    if (e.key === 'Escape') {
      handleCancelEditingTags();
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
        {/* Tags Section */}
        {((note.tags && note.tags.length > 0) || editingTags) && (
          <div className="flex flex-wrap items-center ml-3">
            <span className="mr-2 text-muted-foreground/60">•</span>
            {editingTags ? (
              <div className="flex flex-wrap gap-1.5 items-center">
                {editedTags.map((tag, idx) => (
                  <div key={idx} className="flex items-center bg-muted/60 rounded-full border border-border/40 overflow-hidden">
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => handleEditTag(idx, e.target.value)}
                      onKeyDown={(e) => handleTagKeyDown(e, idx)}
                      className="bg-transparent px-2 py-1 text-xs font-medium text-muted-foreground border-none outline-none min-w-[40px] max-w-[120px]"
                      style={{ width: `${Math.max(40, tag.length * 8)}px` }}
                      title={`Edit tag: ${tag}`}
                      aria-label={`Edit tag: ${tag}`}
                    />
                    <button
                      onClick={() => handleRemoveTag(idx)}
                      className="p-1 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                      title={`Remove tag: ${tag}`}
                      aria-label={`Remove tag: ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                {/* Add new tag input */}
                <div className="flex items-center bg-muted/40 border-2 border-dashed border-border/60 rounded-full overflow-hidden">
                  <input
                    ref={newTagInputRef}
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleNewTagKeyDown}
                    placeholder="Add tag..."
                    className="bg-transparent px-2 py-1 text-xs font-medium text-muted-foreground border-none outline-none min-w-[60px] max-w-[100px]"
                  />
                  <button
                    onClick={handleAddNewTag}
                    disabled={!newTag.trim()}
                    className="p-1 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                    title="Add new tag"
                    aria-label="Add new tag"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Recent tag suggestions */}
                {recentTagSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-muted-foreground/60 self-center">Recent:</span>
                    {recentTagSuggestions.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleAddSuggestedTag(tag)}
                        className="px-2 py-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full hover:bg-primary/20 transition-colors"
                        title={`Add "${tag}" tag`}
                      >
                        +{tag}
                      </button>
                    ))}
                  </div>
                )}
                
                                 {/* Save/Cancel buttons */}
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={handleSaveTags}
                    className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors touch-manipulation"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEditingTags}
                    className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors touch-manipulation"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 items-center">
                {note.tags!.map((tag, idx) => (
                  <span key={idx} className="bg-muted/60 px-2 py-1 rounded-full text-muted-foreground text-xs font-medium border border-border/40 hover:border-border transition-colors duration-200">
                    #{tag}
                  </span>
                ))}
                <button
                  onClick={handleStartEditingTags}
                  className="ml-1 p-1 hover:bg-muted/60 rounded text-muted-foreground hover:text-foreground transition-colors"
                  title="Edit tags"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Add tags button when no tags exist and not editing */}
        {!note.tags?.length && !editingTags && (
          <div className="flex items-center ml-3">
            <span className="mr-2 text-muted-foreground/60">•</span>
            <button
              onClick={handleStartEditingTags}
              className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/60 rounded-full border border-dashed border-border/60 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add tags
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
