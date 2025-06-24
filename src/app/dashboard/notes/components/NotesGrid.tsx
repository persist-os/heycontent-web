import React, { useState, useEffect } from 'react';
import { Note, NoteType } from '../types';
import { NoteCard } from './cards/NoteCard';
import { Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateNote } from '../hooks/useCreateNote';
import { useNotes } from '@/app/context/notes-context';

interface NotesGridProps {
  notes: Note[];
  onEditNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onToggleImportant: (noteId: string) => void;
  onUpdateNote: (noteId: string, updates: any) => void;
  isLoading?: boolean;
}

export function NotesGrid({
  notes,
  onEditNote,
  onDeleteNote,
  onToggleImportant,
  onUpdateNote,
  isLoading,
}: NotesGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | NoteType>('all');
  const { createNote, isCreating: isCreatingNote } = useCreateNote();
  const { setActiveNoteId } = useNotes();

  const handleCreateNote = async () => {
    // Use the current filter as the note type, unless it's 'all'
    const noteType = selectedTypeFilter !== 'all' ? selectedTypeFilter : undefined;
    const newNoteId = await createNote('', { 
      customType: noteType 
    });
    if (newNoteId) {
      setActiveNoteId(newNoteId);
    }
  };

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

  // Sort notes by importance and recency (most recently edited first)
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    // First priority: Important (favorite) notes come first
    if (a.important && !b.important) return -1;
    if (!a.important && b.important) return 1;
    
    // Second priority: Within each group (important/non-important), 
    // sort by most recently updated first (descending order)
    const aTime = a.updatedAt || a._creationTime || 0;
    const bTime = b.updatedAt || b._creationTime || 0;
    return bTime - aTime;
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
              ? "Try adjusting your search or filters to find what you're looking for."
              : 'Start organizing your thoughts, ideas, and insights. Create your first note to get started.'
            }
          </p>
          <button
            onClick={handleCreateNote}
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
        <div className="flex-1 overflow-auto scrollbar-none">
          <div className="px-4">
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-4 pb-6">
              {sortedNotes.map((note) => (
                <div key={String(note._id)} className="break-inside-avoid mb-4 w-full">
                  <NoteCard
                    note={note}
                    availableNotes={notes.map(n => ({ _id: String(n._id), title: n.title, type: n.type }))}
                  onEdit={onEditNote}
                    onDelete={onDeleteNote}
                    onToggleImportant={onToggleImportant}
                    onUpdate={onUpdateNote}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Create Note Button */}
      <button
        onClick={handleCreateNote}
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