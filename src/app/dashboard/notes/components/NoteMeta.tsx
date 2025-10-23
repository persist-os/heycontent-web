"use client";
import React, { useState, useRef } from 'react';
import { Note } from '../types';
import { X, Plus, Hash } from 'lucide-react';
import { getRecentTags, type NoteTagData } from '../utils/tag-utils';
import { T } from '@/components/translation/T';
import { useTranslation } from '@/hooks/useTranslation';

interface NoteMetaProps {
  note: Note;
  onUpdate: (noteId: string, updates: { title?: string; tags?: string[] }) => Promise<any>;
  onTitleChange?: (title: string) => void;
  onTagsChange?: (tags: string[]) => void;
  onEditingTitleChange?: (isEditing: boolean) => void;
  noteTagData?: NoteTagData[]; // Array of tag data from all notes for suggestions
  isReadOnly?: boolean;
  notePermission?: "owner" | "read" | "edit" | null;
}

export function NoteMeta({ note, onUpdate, onTitleChange, onTagsChange, onEditingTitleChange, noteTagData = [], isReadOnly = false, notePermission = null }: NoteMetaProps) {
  const [editedTitle, setEditedTitle] = useState<string | null>(null);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');
  const newTagInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  // Translation hooks for string attributes
  const { text: untitledText } = useTranslation("Untitled", { context: "note.default_title" });
  const { text: placeholderText } = useTranslation("Untitled Notes", { context: "note.placeholder" });
  const { text: readonlyTooltipText } = useTranslation("Read-only note", { context: "note.readonly_tooltip" });
  const { text: editTooltipText } = useTranslation("Click to edit title", { context: "note.edit_tooltip" });
  const { text: readonlyText } = useTranslation("Read-only", { context: "note.readonly" });
  const { text: tagPlaceholderText } = useTranslation("tag name", { context: "note.tag_placeholder" });
  const { text: addLabelTooltipText } = useTranslation("Add label", { context: "note.add_label_tooltip" });
  const { text: addTagTooltipText } = useTranslation("Add tag", { context: "note.add_tag_tooltip" });
  const { text: labelButtonText } = useTranslation("Label", { context: "note.label_button" });
  const { text: addTagButtonText } = useTranslation("Add Tag", { context: "note.add_tag_button" });
  
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

  const displayTitle = isEditingTitle ? editedTitle : (note.title || untitledText);

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
    <div className="space-y-3">
      {/* Clean title section */}
      <div className="group">
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={editedTitle || ''}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={saveTitleEdit}
            onKeyDown={handleTitleKey}
            className="w-full text-2xl sm:text-3xl font-normal tracking-tight bg-transparent border-0 outline-0 text-foreground placeholder:text-[hsl(var(--notepad-icon))]/40 focus:text-foreground transition-colors duration-200"
            placeholder={placeholderText}
            autoFocus
          />
        ) : (
          <h1
            onClick={isReadOnly ? undefined : startTitleEdit}
            className={`text-2xl sm:text-3xl font-normal tracking-tight text-foreground transition-colors duration-200 ${
              isReadOnly 
                ? 'cursor-default' 
                : 'cursor-text'
            }`}
            title={isReadOnly ? readonlyTooltipText : editTooltipText}
          >
            {displayTitle}
          </h1>
        )}
      </div>

      {/* Timestamp and action row - single line to match screenshots */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: timestamp */}
        <div className="text-sm text-[hsl(var(--notepad-icon))] shrink-0">
          <time>
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

        {/* Right: tags and action buttons in single line */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Tags display as simple chips */}
          {currentTags.length > 0 && (
            <div className="flex items-center gap-1.5 shrink">
              {currentTags.slice(0, 3).map((tag) => (
                <button
                  key={tag}
                  onClick={() => !isReadOnly && removeTag(tag)}
                  disabled={isReadOnly}
                  className="group/tag inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[hsl(var(--notepad-icon))] hover:text-foreground bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-md border border-[hsl(var(--notepad-border))] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isReadOnly ? readonlyText : `Remove "${tag}"`}
                >
                  <span className="font-medium whitespace-nowrap">{tag}</span>
                  {!isReadOnly && <X className="w-3 h-3 opacity-0 group-hover/tag:opacity-100 transition-opacity duration-200 shrink-0" />}
                </button>
              ))}
              
              {currentTags.length > 3 && (
                <span className="text-xs text-[hsl(var(--notepad-icon))] font-medium shrink-0">
                  +{currentTags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Tag input when active */}
          {showTagInput ? (
            <div className="flex items-center gap-2 shrink-0">
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
                className="w-24 px-2.5 py-1 text-xs bg-black/5 dark:bg-white/5 border border-[hsl(var(--notepad-border))] rounded-md outline-0 focus:border-accent/50 transition-all duration-200"
                placeholder={tagPlaceholderText}
                autoFocus
              />
              
              {/* Smart suggestions with amber accent */}
              {tagSuggestions.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    addTag(tag);
                    setNewTag('');
                    setShowTagInput(false);
                  }}
                  onMouseDown={(e) => {
                    // Prevent input blur ONLY on mouse interaction
                    e.preventDefault();
                  }}
                  onKeyDown={(e) => {
                    // Full keyboard support
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      addTag(tag);
                      setNewTag('');
                      setShowTagInput(false);
                    }
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-white bg-accent hover:bg-accent/90 rounded-md transition-all duration-200 whitespace-nowrap"
                  title={`Add "${tag}"`}
                  tabIndex={0}
                >
                  {tag}
                </button>
              ))}
            </div>
          ) : !isReadOnly && (
            <div className="flex items-center gap-2 shrink-0">
              {/* Label button (Apple Notes style) */}
              {currentTags.length === 0 && (
                <button
                  onClick={() => setShowTagInput(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-accent border border-[hsl(var(--notepad-border))] rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200 whitespace-nowrap"
                  title={addLabelTooltipText}
                >
                  <Hash className="w-3 h-3 shrink-0" />
                  {labelButtonText}
                </button>
              )}
              
              {/* add tag button (Apple Notes style) */}
              <button
                onClick={() => setShowTagInput(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-accent hover:bg-accent/90 rounded-md transition-all duration-200 whitespace-nowrap"
                title={addTagTooltipText}
              >
                <Plus className="w-3 h-3 shrink-0" />
                {addTagButtonText}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
