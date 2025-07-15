import React, { useState, useMemo } from 'react';
import { Note, NoteType } from '../types';
import { NoteCard } from './cards/NoteCard';
import { EmailCard } from './cards/EmailCard';
import { ProjectCard } from './projects/ProjectCard';
import { CreateProjectModal } from './projects/CreateProjectModal';
import { Plus, Search, Folder, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateNote } from '../hooks/useCreateNote';
import { useProjects } from '../hooks/useProjects';
import { useNotes } from '@/app/context/notes-context';
import { useAuth } from '@/app/context/auth-context';
import { getPopularTags } from '../utils/tag-utils';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverEvent,
  useDroppable,
} from '@dnd-kit/core';

interface NotesGridProps {
  notes: Note[];
  onEditNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onToggleImportant: (noteId: string) => void;
  onUpdateNote: (noteId: string, updates: any) => void;
  isLoading?: boolean;
  helpButton?: React.ReactNode;
}

// Add CreateProjectDropZone component
function CreateProjectDropZone({ isVisible, isDraggedOver }: { isVisible: boolean; isDraggedOver: boolean }) {
  const { setNodeRef } = useDroppable({
    id: 'create-project-zone',
    data: {
      type: 'create-project',
    },
  });

  if (!isVisible) return null;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40",
        "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground",
        "px-6 py-4 rounded-full shadow-lg border-2 border-dashed",
        "transition-all duration-200 ease-in-out",
        isDraggedOver 
          ? "scale-110 bg-gradient-to-r from-primary/90 to-primary border-white" 
          : "border-primary-foreground/50",
        "flex items-center gap-3 font-medium"
      )}
    >
      <Plus className="w-5 h-5" />
      <span>{isDraggedOver ? "Drop to create new project" : "Create New Project"}</span>
    </div>
  );
}

export function NotesGrid({
  notes,
  onEditNote,
  onDeleteNote,
  onToggleImportant,
  onUpdateNote,
  isLoading,
  helpButton,
}: NotesGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'projects' | NoteType>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [draggedNote, setDraggedNote] = useState<Note | null>(null);
  const [dragOverProject, setDragOverProject] = useState<string | null>(null);
  const [pendingProjectNote, setPendingProjectNote] = useState<{ note: Note; projectName?: string } | null>(null);
  const [isCreateProjectZoneDraggedOver, setIsCreateProjectZoneDraggedOver] = useState(false);
  
  const { createNote, isCreating: isCreatingNote } = useCreateNote();
  const { setActiveNoteId } = useNotes();
  const { firebaseUser } = useAuth();
  
  // Projects functionality
  const { 
    projects, 
    isLoading: isLoadingProjects, 
    isCreating: isCreatingProject,
    createProject,
    deleteProject,
    addItemToProject
  } = useProjects(firebaseUser?.uid);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance to start dragging
      },
    })
  );

  // Extract and sort top tags from all notes using utility function
  const topTags = useMemo(() => {
    const noteTagData = notes.map(note => ({
      tags: note.tags || [],
      updatedAt: note.updatedAt || note._creationTime || 0
    }));
    
    return getPopularTags(noteTagData, 15);
  }, [notes]);

  const handleCreateNote = async () => {
    if (selectedTypeFilter === 'projects') {
      setShowCreateProjectModal(true);
      return;
    }
    
    // Use the current filter as the note type, unless it's 'all'
    const noteType = selectedTypeFilter !== 'all' ? selectedTypeFilter : undefined;
    const newNoteId = await createNote('', { 
      customType: noteType 
    });
    if (newNoteId) {
      setActiveNoteId(newNoteId);
    }
  };

  const handleCreateProject = async (name: string, description?: string) => {
    const projectId = await createProject(name, description);
    
    // If we have a pending note to add to this project, add it now
    if (pendingProjectNote && projectId) {
      await addItemToProject(projectId, 'note', String(pendingProjectNote.note._id));
      setPendingProjectNote(null);
    }
    
    return projectId;
  };

  const handleEditProject = (project: any) => {
    // Navigate to the project detail page for editing
    window.location.href = `/dashboard/notes/projects/${project._id}`;
  };

  const handleTagFilter = (tag: string) => {
    setSelectedTagFilter(selectedTagFilter === tag ? null : tag);
  };

  const clearTagFilter = () => {
    setSelectedTagFilter(null);
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'note') {
      setDraggedNote(active.data.current.note);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over?.data.current?.type === 'project') {
      setDragOverProject(String(over.id));
      setIsCreateProjectZoneDraggedOver(false);
    } else if (over?.id === 'create-project-zone') {
      setDragOverProject(null);
      setIsCreateProjectZoneDraggedOver(true);
    } else {
      setDragOverProject(null);
      setIsCreateProjectZoneDraggedOver(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setDraggedNote(null);
    setDragOverProject(null);
    setIsCreateProjectZoneDraggedOver(false);

    if (!over) return;

    const noteData = active.data.current;
    const dropData = over.data.current;

    // Handle dropping note on project
    if (noteData?.type === 'note' && dropData?.type === 'project') {
      const note = noteData.note as Note;
      const projectId = over.id as any; // Cast to handle Convex ID type
      
      try {
        await addItemToProject(projectId, 'note', String(note._id));
      } catch (error) {
        console.error('Failed to add note to project:', error);
      }
    }
    
    // Handle dropping note on "create project" zone
    if (noteData?.type === 'note' && over.id === 'create-project-zone') {
      const note = noteData.note as Note;
      setPendingProjectNote({ note, projectName: note.title || 'New Project' });
      setShowCreateProjectModal(true);
    }
  };

  // Note type configurations with colors - matching exact schema types
  const noteTypes = [
    { key: 'all', label: 'All Items', color: 'bg-gray-500' },
    { key: 'projects', label: 'Projects', color: 'bg-blue-500' },
    { key: 'task_checklist', label: 'To-Do List', color: 'bg-yellow-500' },
    { key: 'collaboration_note', label: 'Collaboration', color: 'bg-green-500' },
    { key: 'reflection_journal', label: 'Journal', color: 'bg-blue-500' },
    { key: 'idea_bank', label: 'Idea Bank', color: 'bg-red-500' },
    { key: 'content_script', label: 'Content/Script', color: 'bg-purple-500' },
    { key: 'analytics_insight', label: 'Analytics/Insights', color: 'bg-pink-500' },
    { key: 'email_draft', label: 'Emails', color: 'bg-orange-500' },
  ] as const;

  // Determine what to show based on filter
  const showingProjectsOnly = selectedTypeFilter === 'projects';
  const showingAll = selectedTypeFilter === 'all';
  
  // ✨ MAIN CHANGE: Filter notes to exclude those that belong to ANY project
  const notesInProjects = useMemo(() => {
    const noteIds = new Set<string>();
    projects.forEach(project => {
      project.noteIds?.forEach(noteId => noteIds.add(noteId));
    });
    return noteIds;
  }, [projects]);

  // Filter notes based on search, type filter, tag filter, and project membership
  const filteredNotes = showingProjectsOnly ? [] : notes.filter(note => {
    // ✨ DEDUPLICATION: Exclude notes that belong to any project
    if (notesInProjects.has(String(note._id))) {
      return false;
    }

    const matchesSearch = searchTerm === '' || 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTypeFilter = selectedTypeFilter === 'all' || note.type === selectedTypeFilter;

    const matchesTagFilter = !selectedTagFilter || 
      note.tags?.some(tag => tag.toLowerCase() === selectedTagFilter.toLowerCase());

    return matchesSearch && matchesTypeFilter && matchesTagFilter;
  });
  
  // Filter projects based on search - show in 'all' view and 'projects' view
  const filteredProjects = (showingAll || showingProjectsOnly) ? projects.filter(project => {
    const matchesSearch = searchTerm === '' || 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }) : [];

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
  
  // Sort projects by recency
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    return b.updatedAt - a.updatedAt;
  });

  // Helper function to render the appropriate card component
  const renderNoteCard = (note: Note) => {
    if (note.type === 'email_draft') {
      return (
        <EmailCard
          note={note}
          availableNotes={notes.map(n => ({ _id: String(n._id), title: n.title, type: n.type }))}
          onEdit={onEditNote}
          onDelete={onDeleteNote}
          onToggleImportant={onToggleImportant}
          onUpdate={onUpdateNote}
          isDraggable={true}
        />
      );
    }

    return (
      <NoteCard
        note={note}
        availableNotes={notes.map(n => ({ _id: String(n._id), title: n.title, type: n.type }))}
        onEdit={onEditNote}
        onDelete={onDeleteNote}
        onToggleImportant={onToggleImportant}
        onUpdate={onUpdateNote}
        isDraggable={true}
      />
    );
  };

  // Combined items for mixed view (when showing 'all')
  const combinedItems = showingAll ? [
    ...sortedProjects.map(project => ({ type: 'project', item: project, timestamp: project.updatedAt })),
    ...sortedNotes.map(note => ({ type: 'note', item: note, timestamp: note.updatedAt || note._creationTime || 0 }))
  ].sort((a, b) => {
    // Projects get slight priority in mixed view, then by timestamp
    if (a.type === 'project' && b.type === 'note') return -1;
    if (a.type === 'note' && b.type === 'project') return 1;
    return b.timestamp - a.timestamp;
  }) : [];

  const totalItems = showingAll ? combinedItems.length : 
                   showingProjectsOnly ? sortedProjects.length : 
                   sortedNotes.length;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="text-center mb-6 relative">
          <h1 className="text-base font-medium text-purple-600 dark:text-accent">Smart Notes</h1>
          <p className="text-muted-foreground text-sm">
            Your intelligent note-taking workspace
          </p>
          {helpButton && (
            <div className="absolute top-0 right-0">
              {helpButton}
            </div>
          )}
        </div>

        {/* Prominent Search Bar */}
        <div className="mb-6 px-4">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={showingAll ? "Search notes and projects..." : showingProjectsOnly ? "Search projects..." : "Search notes..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-base bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-full text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        {/* Type filter buttons */}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
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

        {/* Tag filter pills */}
        {topTags.length > 0 && (
          <div className="px-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground font-medium">Popular Tags:</span>
              {selectedTagFilter && (
                <button
                  onClick={clearTagFilter}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1 justify-center max-w-4xl mx-auto">
              {topTags.map(({ tag, count }) => (
                <button
                  key={tag}
                  onClick={() => handleTagFilter(tag)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors",
                    selectedTagFilter === tag
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  <span>{tag}</span>
                  <span className="text-xs opacity-70">({count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Grid */}
        {totalItems === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              {showingProjectsOnly ? <Folder className="w-8 h-8 text-muted-foreground" /> : <Plus className="w-8 h-8 text-muted-foreground" />}
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchTerm || (selectedTypeFilter !== 'all' && selectedTypeFilter !== 'projects') || selectedTagFilter
                ? `No ${showingProjectsOnly ? 'projects' : showingAll ? 'items' : 'notes'} found` 
                : `No ${showingProjectsOnly ? 'projects' : showingAll ? 'items' : 'notes'} yet`
              }
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {searchTerm || (selectedTypeFilter !== 'all' && selectedTypeFilter !== 'projects') || selectedTagFilter
                ? "Try adjusting your search, filters, or tags to find what you're looking for."
                : showingProjectsOnly 
                ? 'Create your first project to start organizing your notes, conversations, and content together.'
                : showingAll
                ? 'Start organizing your thoughts and ideas. Create your first note or project to get started.'
                : 'Start organizing your thoughts, ideas, and insights. Create your first note to get started.'
              }
            </p>
            <button
              onClick={handleCreateNote}
              disabled={isCreatingNote}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground dark:text-black rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingNote ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Your First {showingProjectsOnly ? 'Project' : showingAll ? 'Item' : 'Note'}
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-auto scrollbar-none">
            <div className="px-4">
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-4 pb-6">
                {showingAll 
                  ? combinedItems.map((item) => (
                      <div key={`${item.type}-${String(item.item._id)}`} className="break-inside-avoid mb-4 w-full">
                        {item.type === 'project' ? (
                          <ProjectCard
                            project={item.item as any}
                            onEdit={handleEditProject}
                            onDelete={() => deleteProject(item.item._id as any)}
                            dragOverProject={dragOverProject}
                          />
                        ) : (
                          renderNoteCard(item.item as Note)
                        )}
                      </div>
                    ))
                  : showingProjectsOnly 
                  ? sortedProjects.map((project) => (
                      <div key={String(project._id)} className="break-inside-avoid mb-4 w-full">
                        <ProjectCard
                          project={project}
                          onEdit={handleEditProject}
                          onDelete={() => deleteProject(project._id)}
                          dragOverProject={dragOverProject}
                        />
                      </div>
                    ))
                  : sortedNotes.map((note) => (
                      <div key={String(note._id)} className="break-inside-avoid mb-4 w-full">
                        {renderNoteCard(note)}
                      </div>
                    ))
                }
              </div>
            </div>
          </div>
        )}

        {/* Floating Create Button */}
        <button
          onClick={handleCreateNote}
          disabled={isCreatingNote}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors flex items-center justify-center shadow-lg hover:shadow-xl z-50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          title={isCreatingNote ? "Creating..." : "Create new item"}
        >
          {isCreatingNote ? (
            <div className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Plus className="w-6 h-6 text-white dark:text-black" />
          )}
        </button>

        {/* Create Project Modal */}
        <CreateProjectModal
          isOpen={showCreateProjectModal}
          onClose={() => {
            setShowCreateProjectModal(false);
            setPendingProjectNote(null);
          }}
          onCreateProject={handleCreateProject}
          isCreating={isCreatingProject}
          defaultName={pendingProjectNote?.projectName}
        />
      </div>

      {/* Create Project Drop Zone */}
      <CreateProjectDropZone 
        isVisible={!!draggedNote && !showingProjectsOnly}
        isDraggedOver={isCreateProjectZoneDraggedOver}
      />

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedNote ? (
          <div className="transform rotate-3 opacity-90">
            {draggedNote.type === 'email_draft' ? (
              <EmailCard
                note={draggedNote}
                availableNotes={[]}
                isDraggable={false}
                isOverlay={true}
              />
            ) : (
              <NoteCard
                note={draggedNote}
                availableNotes={[]}
                isDraggable={false}
                isOverlay={true}
              />
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
} 