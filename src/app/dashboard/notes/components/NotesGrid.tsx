import React, { useState } from 'react';
import { Note, NoteType } from '../types';
import { NoteCard } from './cards/NoteCard';
import { Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotesGridProps {
  notes: Note[];
  onCreateNote: (noteType?: NoteType) => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onToggleImportant: (noteId: string) => void;
  onUpdateNote: (noteId: string, updates: any) => void;
  isLoading?: boolean;
  isCreatingNote?: boolean;
}

export function NotesGrid({
  notes,
  onCreateNote,
  onEditNote,
  onDeleteNote,
  onToggleImportant,
  onUpdateNote,
  isLoading,
  isCreatingNote
}: NotesGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | NoteType>('all');

  // Note type configurations with colors - matching exact schema types
  const noteTypes = [
    { key: 'all', label: 'All Notes', color: 'bg-gray-500' },
    { key: 'task_checklist', label: 'To-Do List', color: 'bg-yellow-500' },
    { key: 'collaboration_note', label: 'Collaboration', color: 'bg-green-500' },
    { key: 'reflection_journal', label: 'Journal', color: 'bg-blue-500' },
    { key: 'idea_bank', label: 'Idea Bank', color: 'bg-red-500' },
    { key: 'content_script', label: 'Content/Script', color: 'bg-purple-500' },
    { key: 'analytics_insight', label: 'Analytics/Insights', color: 'bg-pink-500' },
  ] as const;

  // Filter notes based on search and type filter
  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchTerm === '' || 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTypeFilter = selectedTypeFilter === 'all' || note.type === selectedTypeFilter;

    return matchesSearch && matchesTypeFilter;
  });

  // Sort notes by importance and recency
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.important && !b.important) return -1;
    if (!a.important && b.important) return 1;
    return b.updatedAt - a.updatedAt;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-base font-medium text-purple-600 dark:text-accent">Smart Notes</h1>
        <p className="text-muted-foreground text-sm">
          Your intelligent note-taking workspace
        </p>
      </div>

      {/* Prominent Search Bar */}
      <div className="mb-6 px-4">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search your notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-base bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-full text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          />
        </div>
      </div>

      {/* Type filter buttons */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {noteTypes.map((type) => (
          <button
            key={type.key}
            onClick={() => setSelectedTypeFilter(type.key as any)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full transition-colors",
              selectedTypeFilter === type.key
                ? "bg-background text-foreground shadow-sm border-2 border-primary"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
            )}
          >
            <div className={cn("w-2 h-2 rounded-full", type.color)}></div>
            {type.label}
          </button>
        ))}
      </div>

      {/* Notes grid */}
      {sortedNotes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {searchTerm || selectedTypeFilter !== 'all' ? 'No notes found' : 'No notes yet'}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            {searchTerm || selectedTypeFilter !== 'all' 
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'Start organizing your thoughts, ideas, and insights. Create your first note to get started.'
            }
          </p>
          <button
            onClick={() => onCreateNote(selectedTypeFilter !== 'all' ? selectedTypeFilter : undefined)}
            disabled={isCreatingNote}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingNote ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                Creating Note...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Your First Note
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-auto px-4">
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-4 pb-6">
            {sortedNotes.map((note) => (
              <div key={String(note._id)} className="break-inside-avoid mb-4 w-full">
                <NoteCard
                  note={note}
                  onEdit={onEditNote}
                  onDelete={onDeleteNote}
                  onToggleImportant={onToggleImportant}
                  onUpdate={onUpdateNote}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Create Note Button */}
      <button
        onClick={() => onCreateNote(selectedTypeFilter !== 'all' ? selectedTypeFilter : undefined)}
        disabled={isCreatingNote}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors flex items-center justify-center shadow-lg hover:shadow-xl z-50 disabled:opacity-50 disabled:cursor-not-allowed"
        title={isCreatingNote ? "Creating note..." : "Create new note"}
      >
        {isCreatingNote ? (
          <div className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <Plus className="w-6 h-6" />
        )}
      </button>
    </div>
  );
} 