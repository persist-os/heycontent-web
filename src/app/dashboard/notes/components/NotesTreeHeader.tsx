'use client';

import React from 'react';
import { Search, Plus, Folder, Upload } from 'lucide-react';
import { FilterType } from './NotesTree.types';
import { T } from '@/components/translation';
import { useTranslation } from '@/hooks/useTranslation';

export interface NotesTreeHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onCreateNote: () => void;
  onCreateProject: () => void;
  onCreateFolder: () => void;
  onUpload?: () => void;
  isCreatingNote: boolean;
  isCreatingProject: boolean;
  isCreatingFolder: boolean;
  foldersCount?: number;
  sharedNotesCount?: number;
  mySharedContentCount?: number;
}


export function NotesTreeHeader({
  searchTerm,
  onSearchChange,
  selectedFilter,
  onFilterChange,
  onCreateNote,
  onCreateProject,
  onCreateFolder,
  onUpload,
  isCreatingNote,
  isCreatingProject,
  isCreatingFolder,
  foldersCount,
  sharedNotesCount,
  mySharedContentCount
}: NotesTreeHeaderProps) {
  
  const { text: searchPlaceholder } = useTranslation('What are you looking for?', {
    sourceLang: 'en',
    context: 'notes.search.placeholder'
  });
  
  return (
    <div className="border-b border-border/30 bg-gradient-to-b from-card/80 via-background/80 to-background/60 backdrop-blur-md sticky top-0 left-0 right-0 z-10 shadow-sm shadow-primary/5 w-full overflow-hidden">
      <div className="pt-4 sm:pt-12 px-4 sm:px-6 pb-3 sm:pb-6 w-full max-w-6xl mx-auto safe-top">
        {/* Title and Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-h1 text-center sm:text-left text-foreground">
              <T context="notes.header.title">All Files</T>
            </h1>
          </div>
        
          {/* Action buttons - side by side on all screens */}
          <div className="flex flex-row items-center justify-center gap-1.5 sm:gap-3 w-auto">
            <button
              onClick={onCreateFolder}
              disabled={isCreatingFolder}
              className="flex items-center justify-center gap-1.5 sm:gap-2 border border-accent/20 hover:bg-accent/5 hover:border-accent/30 text-foreground px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all disabled:opacity-50 text-xs sm:text-sm font-medium min-h-[40px] sm:min-h-0"
            >
              {isCreatingFolder ? (
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
              ) : (
                <Folder className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
              <span className="hidden sm:inline"><T context="button.new-folder">New Folder</T></span>
              <span className="sm:hidden"><T context="button.folder">Folder</T></span>
            </button>
            {onUpload && (
              <button
                onClick={onUpload}
                className="flex items-center justify-center gap-1.5 sm:gap-2 bg-[hsl(var(--assignment-primary-blue))] text-[hsl(var(--assignment-primary-blue-text))] px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-[hsl(var(--notes-primary-hover))] transition-all text-xs sm:text-sm font-medium min-h-[40px] sm:min-h-0"
              >
                <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline"><T context="button.upload">Upload</T></span>
                <span className="sm:hidden"><T context="button.upload">Upload</T></span>
              </button>
            )}
            <button
              onClick={onCreateNote}
              disabled={isCreatingNote}
              className="flex items-center justify-center gap-1.5 sm:gap-2 bg-[hsl(var(--assignment-primary-blue))] text-[hsl(var(--assignment-primary-blue-text))] px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-[hsl(var(--notes-primary-hover))] transition-all disabled:opacity-50 text-xs sm:text-sm font-medium min-h-[40px] sm:min-h-0"
            >
              {isCreatingNote ? (
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-[hsl(var(--assignment-primary-blue-text))]/30 border-t-[hsl(var(--assignment-primary-blue-text))] rounded-full animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
              <span className="hidden sm:inline"><T context="button.create-new">Create New</T></span>
              <span className="sm:hidden"><T context="button.create">Create</T></span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-2 sm:mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-[hsl(var(--notes-surface-dim))] border border-[hsl(var(--notes-stroke-focus))] rounded-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[hsl(var(--notes-ghost-blue))] transition-all text-sm sm:text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
