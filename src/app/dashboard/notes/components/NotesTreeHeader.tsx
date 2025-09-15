'use client';

import React from 'react';
import { Search, Plus, Filter, FolderPlus, Folder, Users, Share2, FileText, Star, Clock } from 'lucide-react';
import { FilterType } from './NotesTree.types';
import { cn } from '@/lib/utils';

interface NotesTreeHeaderProps {
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
  mySharedContentCount
}: NotesTreeHeaderProps) {
  return (
    <div className="border-b border-border/30 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="pt-12 p-4 sm:p-6">
        {/* Title and Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-center sm:justify-between gap-4 mb-4 sm:mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-center sm:text-left text-foreground">
              Files
            </h1>
            <p className="text-muted-foreground/70 mt-1 text-sm sm:text-base text-center sm:text-left">
              Your thoughts, organized and accessible
            </p>
          </div>
        
          {/* Action buttons - side by side on all screens */}
          <div className="flex flex-row items-center justify-center gap-2 sm:gap-3 w-auto">
            <button
              onClick={onCreateFolder}
              disabled={isCreatingFolder}
              className="flex items-center justify-center gap-2 border border-border hover:bg-muted/30 text-foreground px-4 py-3 sm:py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium min-h-[44px] sm:min-h-0"
            >
              {isCreatingFolder ? (
                <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
              ) : (
                <Folder className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">New Folder</span>
              <span className="sm:hidden">Folder</span>
            </button>
            <button
              onClick={onCreateProject}
              disabled={isCreatingProject}
              className="flex items-center justify-center gap-2 border border-border hover:bg-muted/30 text-foreground px-4 py-3 sm:py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium min-h-[44px] sm:min-h-0"
            >
              {isCreatingProject ? (
                <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
              ) : (
                <FolderPlus className="w-5 h-5" />
              )}
              <span className="hidden sm:inline">New Project</span>
              <span className="sm:hidden">Project</span>
            </button>
            <button
              onClick={onCreateNote}
              disabled={isCreatingNote}
              className="flex items-center justify-center gap-2 bg-foreground text-background px-4 py-3 sm:py-2.5 rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50 text-sm font-medium min-h-[44px] sm:min-h-0"
            >
              {isCreatingNote ? (
                <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">New Note</span>
              <span className="sm:hidden">Note</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 w-4 h-4" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 sm:py-2.5 bg-muted/20 border-0 rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:bg-muted/30 transition-colors text-base sm:text-sm"
            />
          </div>
        </div>
        
        {/* Filter Buttons - Horizontal scroll on mobile */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 pb-2 min-w-max">
            {filterOptions.map(({ key, label, icon: Icon }) => {
              const count = key === 'folders' ? foldersCount : 
                          key === 'shared' ? sharedNotesCount : 
                          key === 'my-shared' ? mySharedContentCount : 
                          undefined;
              
              return (
                <button
                  key={key}
                  onClick={() => onFilterChange(key)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 sm:py-1.5 text-sm font-medium rounded-lg transition-colors relative whitespace-nowrap min-h-[44px] sm:min-h-0",
                    selectedFilter === key
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  <Icon className={cn("w-4 h-4 flex-shrink-0", key === 'projects' && "w-5 h-5")} />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">
                    {key === 'all' ? 'All' : 
                     key === 'important' ? 'Starred' :
                     key === 'recent' ? 'Recent' :
                     key === 'folders' ? 'Folders' :
                     key === 'projects' ? 'Projects' :
                     key === 'shared' ? 'Shared' :
                     'My Shared'}
                  </span>
                  {count && count > 0 && (
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0",
                      selectedFilter === key
                        ? "bg-background/20 text-background"
                        : "bg-muted text-muted-foreground"
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
