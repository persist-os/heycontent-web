'use client';

import React from 'react';
import { Search, Plus, Filter, FolderPlus, Folder, Users, Share2, FileText, Star, Clock, CheckSquare, Square, Trash2, X } from 'lucide-react';
import { FilterType } from './NotesTree.types';
import { cn } from '@/lib/utils';
import { T } from '@/components/translation';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';

export interface NotesTreeHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onCreateNote: () => void;
  onCreateProject: () => void;
  onCreateFolder: () => void;
  isCreatingNote: boolean;
  isCreatingProject: boolean;
  isCreatingFolder: boolean;
  foldersCount?: number;
  sharedNotesCount?: number;
  mySharedContentCount?: number;
  isSelectionMode?: boolean;
  selectedProjectsCount?: number;
  selectedNotesCount?: number;
  onToggleSelectionMode?: () => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onBatchDelete?: () => void;
  hasSelection?: boolean;
}

const filterOptions = [
  { key: 'all' as const, label: 'All', icon: FileText },
  { key: 'important' as const, label: 'Starred', icon: Star },
  { key: 'recent' as const, label: 'Recent', icon: Clock },
  { key: 'folders' as const, label: 'Folders', icon: Folder },
  { key: 'projects' as const, label: 'Projects', icon: FolderPlus },
  { key: 'shared' as const, label: 'Shared with me', icon: Users },
  { key: 'my-shared' as const, label: 'My shared', icon: Share2 }
];

export function NotesTreeHeader({
  searchTerm,
  onSearchChange,
  selectedFilter,
  onFilterChange,
  onCreateNote,
  onCreateProject,
  onCreateFolder,
  isCreatingNote,
  isCreatingProject,
  isCreatingFolder,
  foldersCount,
  sharedNotesCount,
  mySharedContentCount,
  isSelectionMode = false,
  selectedProjectsCount = 0,
  selectedNotesCount = 0,
  onToggleSelectionMode,
  onSelectAll,
  onDeselectAll,
  onBatchDelete,
  hasSelection = false
}: NotesTreeHeaderProps) {
  // Total count includes both projects and notes for mixed deletion
  const selectedCount = selectedProjectsCount + selectedNotesCount;
  
  const { text: searchPlaceholder } = useTranslation('Search notes...', {
    sourceLang: 'en',
    context: 'notes.search.placeholder'
  });
  
  return (
    <div className="border-b border-border/30 bg-gradient-to-b from-card/80 via-background/80 to-background/60 backdrop-blur-md sticky top-0 left-0 right-0 z-10 shadow-sm shadow-primary/5 w-full overflow-hidden">
      <div className="pt-4 sm:pt-12 px-4 sm:px-6 pb-3 sm:pb-6 w-full max-w-6xl mx-auto safe-top">
        {/* Title and Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-3xl font-light tracking-tight text-center sm:text-left text-foreground">
              <T context="notes.header.title">Files</T>
            </h1>
            <p className="text-muted-foreground mt-0.5 sm:mt-1 text-xs sm:text-base text-center sm:text-left hidden sm:block">
              <T context="notes.header.subtitle">Your thoughts, organized and accessible</T>
            </p>
          </div>
        
          {/* Action buttons - side by side on all screens */}
          <div className="flex flex-row items-center justify-center gap-1.5 sm:gap-3 w-auto">
            {isSelectionMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDeselectAll}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Square className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline"><T context="button.deselect.all">Deselect All</T></span>
                  <span className="sm:hidden"><T context="button.clear">Clear</T></span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSelectAll}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline"><T context="button.select.all">Select All</T></span>
                  <span className="sm:hidden"><T context="button.all">All</T></span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onBatchDelete}
                  disabled={!hasSelection || selectedCount === 0}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">
                    {selectedCount > 0 ? <T context="button.delete.count">Delete {selectedCount}</T> : <T context="button.delete">Delete</T>}
                  </span>
                  <span className="sm:hidden">{selectedCount > 0 ? selectedCount : <T context="button.delete">Delete</T>}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleSelectionMode}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4 mr-2" />
                  <T context="button.cancel">Cancel</T>
                </Button>
              </>
            ) : (
              <>
                <button
                  onClick={onToggleSelectionMode}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 border border-border/50 hover:bg-muted/50 hover:border-border text-foreground px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all text-xs sm:text-sm font-medium min-h-[40px] sm:min-h-0"
                >
                  <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Select</span>
                  <span className="sm:hidden">Select</span>
                </button>
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
                <button
                  onClick={onCreateProject}
                  disabled={isCreatingProject}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 border border-primary/20 hover:bg-primary/5 hover:border-primary/30 text-foreground px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all disabled:opacity-50 text-xs sm:text-sm font-medium min-h-[40px] sm:min-h-0"
                >
                  {isCreatingProject ? (
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                  ) : (
                    <FolderPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                  <span className="hidden sm:inline"><T context="button.new-project">New Project</T></span>
                  <span className="sm:hidden"><T context="button.project">Project</T></span>
                </button>
                <button
                  onClick={onCreateNote}
                  disabled={isCreatingNote}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:from-primary/90 hover:to-primary/80 transition-all disabled:opacity-50 text-xs sm:text-sm font-medium min-h-[40px] sm:min-h-0 shadow-md shadow-primary/20"
                >
                  {isCreatingNote ? (
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                  <span className="hidden sm:inline"><T context="button.new-note">New Note</T></span>
                  <span className="sm:hidden"><T context="button.note">Note</T></span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-2 sm:mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/40 w-4 h-4" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-gradient-to-r from-muted/20 via-primary/5 to-muted/20 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-primary/5 focus:border-primary/30 transition-all text-sm sm:text-sm"
            />
          </div>
        </div>
        
        {/* Filter Buttons - Horizontal scroll on mobile */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="flex items-center gap-1.5 sm:gap-2 pb-1 sm:pb-2 min-w-max">
            {filterOptions.map(({ key, label, icon: Icon }) => {
              const count = key === 'folders' ? foldersCount : 
                          key === 'shared' ? sharedNotesCount : 
                          key === 'my-shared' ? mySharedContentCount : 
                          undefined;
              
              const gradientClasses = selectedFilter === key 
                ? key === 'important' ? "bg-gradient-to-r from-amber-500 to-amber-400 text-white shadow-md shadow-amber-500/30" :
                  key === 'recent' ? "bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-md shadow-orange-500/30" :
                  key === 'folders' ? "bg-gradient-to-r from-indigo-500 to-indigo-400 text-white shadow-md shadow-indigo-500/30" :
                  key === 'projects' ? "bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-md shadow-blue-500/30" :
                  key === 'shared' ? "bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-md shadow-blue-500/30" :
                  key === 'my-shared' ? "bg-gradient-to-r from-green-500 to-green-400 text-white shadow-md shadow-green-500/30" :
                  "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground";
              
              const hoverClasses = selectedFilter !== key 
                ? key === 'important' ? "hover:bg-amber-500/5 hover:border-amber-500/20" :
                  key === 'recent' ? "hover:bg-orange-500/5 hover:border-orange-500/20" :
                  key === 'folders' ? "hover:bg-indigo-500/5 hover:border-indigo-500/20" :
                  key === 'projects' ? "hover:bg-blue-500/5 hover:border-blue-500/20" :
                  key === 'shared' ? "hover:bg-blue-500/5 hover:border-blue-500/20" :
                  key === 'my-shared' ? "hover:bg-green-500/5 hover:border-green-500/20" :
                  "hover:bg-primary/5 hover:border-primary/20"
                : "";
              
              return (
                <button
                  key={key}
                  onClick={() => onFilterChange(key)}
                  className={cn(
                    "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all relative whitespace-nowrap min-h-[40px] sm:min-h-0",
                    selectedFilter !== key && "border border-border/50",
                    gradientClasses,
                    hoverClasses
                  )}
                >
                  <Icon className={cn("w-4 h-4 flex-shrink-0", key === 'projects' && "w-5 h-5")} />
                  <span className="hidden sm:inline">
                    <T context={`notes.filter.${key}`}>{label}</T>
                  </span>
                  <span className="sm:hidden">
                    {key === 'all' ? <T context="notes.filter.all">All</T> : 
                     key === 'important' ? <T context="notes.filter.starred">Starred</T> :
                     key === 'recent' ? <T context="notes.filter.recent">Recent</T> :
                     key === 'folders' ? <T context="notes.filter.folders">Folders</T> :
                     key === 'projects' ? <T context="notes.filter.projects">Projects</T> :
                     key === 'shared' ? <T context="notes.filter.shared">Shared</T> :
                     <T context="notes.filter.my-shared">My Shared</T>}
                  </span>
                  {count && count > 0 && (
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0",
                      selectedFilter === key
                        ? "bg-white/20 text-white"
                        : "bg-muted/50 text-muted-foreground"
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
