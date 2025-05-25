import React, { useState } from 'react';
import { FileText, Star, Clock, Lightbulb, Trash2, Search, Plus, SortDesc, PenLine } from 'lucide-react';
import type { Note } from './types';

interface SidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  onNoteSelect: (id: string) => void;
  onCreateNote: (options?: { type?: string; skipWizard?: boolean }) => void;
  onDeleteNote: (id: string) => void;
  onHideSidebar: () => void;
}

export function Sidebar({ notes, activeNoteId, onNoteSelect, onCreateNote, onDeleteNote, onHideSidebar }: SidebarProps) {
  const [selectedSection, setSelectedSection] = useState<'all' | 'important' | 'brainstorm' | 'ideas'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'importance'>('date');
  const [showSortOptions, setShowSortOptions] = useState(false);

  // Filter notes based on section and search query
  const filteredNotes = notes.filter(note => {
    // First apply section filter
    const sectionMatches =
      selectedSection === 'all' ? true :
      selectedSection === 'important' ? note.important :
      selectedSection === 'ideas' ? note.type === 'idea' :
      selectedSection === 'brainstorm' ? note.type === 'brainstorm' :
      true; // fallback

    // Then apply search filter if there's a query
    if (!sectionMatches) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
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
    // If we're in the brainstorm section, create a brainstorm note directly
    if (selectedSection === 'brainstorm') {
      onHideSidebar();
      // Pass signal to parent to create an empty brainstorm note
      onCreateNote({ type: 'brainstorm', skipWizard: true });
    } else {
      // Regular note creation flow with wizard
      onHideSidebar();
      onCreateNote();
    }
  };

  return (
    <div className="w-64 border-r border-gray-100 flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div className="w-[24px] sm:w-[24px]"></div>
          <div className="flex-1 flex justify-start">
            <div>
              <h1 className="text-base font-medium text-black dark:text-white whitespace-nowrap">Smart Notes</h1>
              <p className="hidden sm:block text-text-gray dark:text-gray-400 font-normal text-sm">
                Organize your thoughts and ideas
              </p>
            </div>
          </div>
          <div className="w-[100px] sm:w-auto flex justify-end">
            <button
              onClick={handleCreateNote}
              className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-600 flex items-center justify-center"
              title="Create new note"
            >
              <PenLine size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-gray-100">
        <div className="relative">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
        </div>
      </div>

      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setSelectedSection('all')}
          className={`flex-1 py-2 text-sm font-medium text-center ${
            selectedSection === 'all' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setSelectedSection('important')}
          className={`flex-1 py-2 text-sm font-medium text-center ${
            selectedSection === 'important' ? 'text-yellow-600 border-b-2 border-yellow-500' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Important
        </button>
        <button
          onClick={() => setSelectedSection('ideas')}
          className={`flex-1 py-2 text-sm font-medium text-center ${
            selectedSection === 'ideas' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Ideas
        </button>
        <button
          onClick={() => setSelectedSection('brainstorm')}
          className={`flex-1 py-2 text-sm font-medium text-center ${
            selectedSection === 'brainstorm' ? 'text-green-600 border-b-2 border-green-500' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Brainstorm
        </button>
      </div>

      <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          {sortedNotes.length} {sortedNotes.length === 1 ? 'note' : 'notes'}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowSortOptions(!showSortOptions)}
            className="p-1 rounded hover:bg-gray-100"
            title="Sort notes"
          >
            <SortDesc className="w-4 h-4 text-gray-500" />
          </button>

          {showSortOptions && (
            <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
              <button
                onClick={() => {setSortBy('date'); setShowSortOptions(false);}}
                className={`w-full text-left px-3 py-2 text-sm ${sortBy === 'date' ? 'text-purple-600' : 'text-gray-700'} hover:bg-gray-50`}
              >
                By date
              </button>
              <button
                onClick={() => {setSortBy('title'); setShowSortOptions(false);}}
                className={`w-full text-left px-3 py-2 text-sm ${sortBy === 'title' ? 'text-purple-600' : 'text-gray-700'} hover:bg-gray-50`}
              >
                By title
              </button>
              <button
                onClick={() => {setSortBy('importance'); setShowSortOptions(false);}}
                className={`w-full text-left px-3 py-2 text-sm ${sortBy === 'importance' ? 'text-purple-600' : 'text-gray-700'} hover:bg-gray-50`}
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
                className={`p-2 rounded-lg cursor-pointer group ${
                  activeNoteId === note._id ? 'bg-purple-50' : 'hover:bg-gray-50'
                }`}
                title={`Open note: ${note.title}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {note.type === 'idea' ? (
                        <Lightbulb size={16} className="text-yellow-500 shrink-0" />
                      ) : (
                        <FileText size={16} className="text-gray-500 shrink-0" />
                      )}
                      <h3 className={`font-medium truncate ${
                        note.important ? 'text-yellow-700' : ''
                      }`}>
                        {note.title || 'Untitled Note'}
                        {note.important && (
                          <Star size={14} className="inline ml-1 text-yellow-500" />
                        )}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">
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
                    className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-red-500"
                    title={`Delete note: ${note.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
            <FileText className="w-10 h-10 text-gray-300 mb-2" />
            {searchQuery ? (
              <>
                <p className="text-sm">No notes match your search</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-purple-500 mt-2"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <p className="text-sm">No notes yet</p>
                <button
                  onClick={handleCreateNote}
                  className="text-xs text-purple-500 mt-2"
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