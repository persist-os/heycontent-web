import React, { useState } from 'react';
import { FileText, Star, Clock, Lightbulb, Trash2, Search, Plus, SortDesc, PenLine, Users, BarChart3, BookOpen, CheckSquare } from 'lucide-react';
import type { Note, NoteType } from './types';
import { TypeTabs } from './components/TypeTabs';
import { useNoteTypeStats } from './hooks/useNoteTypeStats';

interface SidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  onNoteSelect: (id: string) => void;
  onCreateNote: (options?: { type?: string; skipWizard?: boolean }) => void;
  onDeleteNote: (id: string) => void;
  onHideSidebar: () => void;
}

export function Sidebar({ notes, activeNoteId, onNoteSelect, onCreateNote, onDeleteNote, onHideSidebar }: SidebarProps) {
  const [selectedSection, setSelectedSection] = useState<'all' | 'important' | NoteType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'importance'>('date');
  const [showSortOptions, setShowSortOptions] = useState(false);

  // Get dynamic type statistics
  const { stats: typeStats, totalNotes, importantCount } = useNoteTypeStats(notes);

  // Filter notes based on section and search query
  const filteredNotes = notes.filter(note => {
    // First apply section filter
    const sectionMatches =
      selectedSection === 'all' ? true :
      selectedSection === 'important' ? note.important :
      // For type filtering, use the note's actual type
      selectedSection === (note.type || 'idea_bank');

    // Then apply search filter if there's a query
    if (!sectionMatches) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        note.title.toLowerCase().includes(query) ||
        note.content?.toLowerCase().includes(query) ||
        (note.tags ?? []).some(tag => tag.toLowerCase().includes(query))
      );
    }

    return true;
  });

  // Sort filtered notes
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      case 'importance':
        return (b.important ? 1 : 0) - (a.important ? 1 : 0);
      default:
        return 0;
    }
  });

  const handleCreateNote = async () => {
    // If we're in a specific type section, create a note of that type
    if (selectedSection !== 'all' && selectedSection !== 'important') {
      onHideSidebar();
      onCreateNote({ type: selectedSection, skipWizard: true });
    } else {
      // Regular note creation flow with wizard
      onHideSidebar();
      onCreateNote();
    }
  };

  // Get icon for note type
  const getNoteIcon = (note: Note) => {
    const typeIcons: Record<NoteType, React.ReactNode> = {
      idea_bank: <Lightbulb size={16} className="text-yellow-500 shrink-0" />,
      content_script: <FileText size={16} className="text-blue-500 shrink-0" />,
      collaboration_note: <Users size={16} className="text-green-500 shrink-0" />,
      analytics_insight: <BarChart3 size={16} className="text-purple-500 shrink-0" />,
      reflection_journal: <BookOpen size={16} className="text-indigo-500 shrink-0" />,
      task_checklist: <CheckSquare size={16} className="text-emerald-500 shrink-0" />,
    };
    
    return typeIcons[note.type || 'idea_bank'] || <FileText size={16} className="text-gray-500 shrink-0" />;
  };

  return (
    <div className="w-64 border-r border-border bg-background flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex justify-between items-center">
          <div className="w-[24px] sm:w-[24px]"></div>
          <div className="flex-1 flex justify-start">
            <div>
              <h1 className="text-base font-medium text-foreground whitespace-nowrap">Smart Notes</h1>
              <p className="hidden sm:block text-muted-foreground font-normal text-sm">
                Organize your thoughts and ideas
              </p>
            </div>
          </div>
          <div className="w-[100px] sm:w-auto flex justify-end">
            <button
              onClick={handleCreateNote}
              className="w-8 h-8 rounded-full hover:bg-secondary text-muted-foreground flex items-center justify-center transition-colors"
              title="Create new note"
            >
              <PenLine size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-border">
        <div className="relative">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-secondary rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          />
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Modern Type Tabs */}
      <TypeTabs
        typeStats={typeStats}
        totalNotes={totalNotes}
        importantCount={importantCount}
        selectedSection={selectedSection}
        onSectionChange={setSelectedSection}
      />

      <div className="px-4 py-2 border-b border-border flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          {sortedNotes.length} {sortedNotes.length === 1 ? 'note' : 'notes'}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowSortOptions(!showSortOptions)}
            className="p-1 rounded hover:bg-secondary transition-colors"
            title="Sort notes"
          >
            <SortDesc className="w-4 h-4 text-muted-foreground" />
          </button>

          {showSortOptions && (
            <div className="absolute right-0 mt-1 w-32 bg-popover rounded-lg shadow-lg border-border z-10">
              <button
                onClick={() => {setSortBy('date'); setShowSortOptions(false);}}
                className={`w-full text-left px-3 py-2 text-sm ${sortBy === 'date' ? 'text-purple-600' : 'text-foreground'} hover:bg-secondary transition-colors`}
              >
                By date
              </button>
              <button
                onClick={() => {setSortBy('title'); setShowSortOptions(false);}}
                className={`w-full text-left px-3 py-2 text-sm ${sortBy === 'title' ? 'text-purple-600' : 'text-foreground'} hover:bg-secondary transition-colors`}
              >
                By title
              </button>
              <button
                onClick={() => {setSortBy('importance'); setShowSortOptions(false);}}
                className={`w-full text-left px-3 py-2 text-sm ${sortBy === 'importance' ? 'text-purple-600' : 'text-foreground'} hover:bg-secondary transition-colors`}
              >
                By importance
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sortedNotes.length > 0 ? (
          <div className="space-y-1 p-2">
            {sortedNotes.map((note) => (
              <div
                key={note._id}
                onClick={() => onNoteSelect(note._id)}
                className={`p-3 rounded-lg cursor-pointer group transition-all duration-200 ${
                  activeNoteId === note._id ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30' : 'hover:bg-secondary/50 border border-transparent'
                }`}
                title={`Open note: ${note.title}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getNoteIcon(note)}
                      <h3 className={`font-medium truncate ${
                        note.important ? 'text-yellow-700 dark:text-yellow-400' : 'text-foreground'
                      }`}>
                        {note.title || 'Untitled Note'}
                        {note.important && (
                          <Star size={14} className="inline ml-1 text-yellow-500" />
                        )}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {new Date(note.updatedAt).toLocaleDateString()} • {note.tags?.length > 0 ? (
                        <span>
                          {note.tags.map((tag, tagIndex) => (
                            <span key={`${note._id}-tag-${tagIndex}`}>#{tag}{tagIndex < note.tags.length - 1 ? ' ' : ''}</span>
                          ))}
                        </span>
                      ) : 'No tags'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNote(note._id);
                    }}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/50 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title={`Delete note: ${note.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
            <FileText className="w-10 h-10 text-gray-300 dark:text-gray-700 mb-2" />
            {searchQuery ? (
              <>
                <p className="text-sm">No notes match your search</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-purple-500 mt-2 hover:text-purple-600 transition-colors"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <p className="text-sm">No notes yet</p>
                <button
                  onClick={handleCreateNote}
                  className="text-xs text-purple-500 mt-2 hover:text-purple-600 transition-colors"
                >
                  Create your first note
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}