import React, { useState, useMemo } from 'react';
import { Note, NoteType } from '../types';
import { NoteCard } from './cards/NoteCard';
import { EmailCard } from './cards/EmailCard';
import { ProjectCard } from './projects/ProjectCard';
import { CreateProjectModal } from '../../living-projects/components/CreateProjectModal';
import { ShareContentModal } from '@/components/sharing/ShareContentModal';
import { Plus, Search, Folder, X, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateNote } from '../hooks/useCreateNote';
import { useProjects } from '../hooks/useProjects';
import { useNotes } from '@/app/context/notes-context';
import { useAuth } from '@/app/context/auth-context';
import { getPopularTags } from '../utils/tag-utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { T } from '@/components/translation';
import { useTranslation } from '@/hooks/useTranslation';
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
import { CentralizedHeader } from '@/components/ui/centralized-header';

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
      <span>
        {isDraggedOver ? (
          <T context="notes.drag.drop-to-create-project">Drop to create new project</T>
        ) : (
          <T context="button.create-new-project">Create New Project</T>
        )}
      </span>
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
  
  // Share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareContent, setShareContent] = useState<{
    type: 'note' | 'project';
    id: string;
    title: string;
  } | null>(null);
  
  const { createNote, isCreating: isCreatingNote } = useCreateNote();
  const { setActiveNoteId } = useNotes();
  const { firebaseUser } = useAuth();
  const pathname = usePathname();
  
  // Projects functionality
  const { 
    projects, 
    isLoading: isLoadingProjects, 
    isCreating: isCreatingProject,
    createProject,
    deleteProject,
    addContentToProject
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

  const handleCreateProject = async (
    name: string, 
    description?: string,
    noteIds?: string[],
    conversationIds?: string[],
    crystalIds?: string[],
    shardIds?: string[]
  ): Promise<string> => {
    // Include pending note if exists
    const allNoteIds = [...(noteIds || [])];
    if (pendingProjectNote) {
      allNoteIds.push(String(pendingProjectNote.note._id));
      setPendingProjectNote(null);
    }
    
    // Pass all content arrays directly to createProject mutation
    const projectId = await createProject(
      name, 
      description, 
      allNoteIds.length > 0 ? allNoteIds : undefined,
      conversationIds,
      crystalIds,
      shardIds
    );
    
    return projectId as string;
  };

  const handleEditProject = (project: any) => {
    // Navigate to the project detail page for editing
    window.location.href = `/dashboard/living-projects/${project._id}`;
  };

  const handleTagFilter = (tag: string) => {
    setSelectedTagFilter(selectedTagFilter === tag ? null : tag);
  };

  const clearTagFilter = () => {
    setSelectedTagFilter(null);
  };

  // Share handlers
  const handleShareNote = (noteId: string) => {
    const note = notes.find(n => String(n._id) === noteId);
    if (note) {
      setShareContent({
        type: 'note',
        id: noteId,
        title: note.title || 'Untitled Note'
      });
      setShareModalOpen(true);
    }
  };

  const handleShareProject = (projectId: string) => {
    const project = projects?.find(p => String(p._id) === projectId);
    if (project) {
      setShareContent({
        type: 'project',
        id: projectId,
        title: project.name || 'Untitled Project'
      });
      setShareModalOpen(true);
    }
  };

  const handleCloseShareModal = () => {
    setShareModalOpen(false);
    setShareContent(null);
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
        await addContentToProject(projectId, 'note', String(note._id));
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

  // Filter notes based on search term, type filter, and tag filter
  const filteredNotes = useMemo(() => {
    let filtered = notes;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(note => 
        note.title?.toLowerCase().includes(searchLower) ||
        note.content?.toLowerCase().includes(searchLower) ||
        note.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply type filter
    if (selectedTypeFilter !== 'all') {
      filtered = filtered.filter(note => note.type === selectedTypeFilter);
    }

    // Apply tag filter
    if (selectedTagFilter) {
      filtered = filtered.filter(note => 
        note.tags?.includes(selectedTagFilter)
      );
    }

    return filtered;
  }, [notes, searchTerm, selectedTypeFilter, selectedTagFilter]);

  // Filter projects based on search term
  const filteredProjects = useMemo(() => {
    if (selectedTypeFilter !== 'all' && selectedTypeFilter !== 'projects') {
      return [];
    }

    let filtered = projects;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(project => 
        project.name?.toLowerCase().includes(searchLower) ||
        project.description?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [projects, searchTerm, selectedTypeFilter]);

  // Combine notes and projects for display
  const allItems = [...filteredNotes, ...filteredProjects];
  const totalItems = allItems.length;

  // Determine what we're showing
  const showingAll = selectedTypeFilter === 'all';
  const showingProjectsOnly = selectedTypeFilter === 'projects';

  // Note types for filter buttons - translations will be handled inline
  const noteTypes = [
    { key: 'all', label: 'All', context: 'notes.filter.all', color: 'bg-gray-400' },
    { key: 'idea_bank', label: 'Ideas', context: 'notes.filter.ideas', color: 'bg-primary' },
    { key: 'content_script', label: 'Content', context: 'notes.filter.content', color: 'bg-primary' },
    { key: 'projects', label: 'Projects', context: 'notes.filter.projects', color: 'bg-accent' },
  ];

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
          onShare={handleShareNote}
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
        onShare={handleShareNote}
        isDraggable={true}
      />
    );
  };

  // Helper function to properly distinguish between notes and projects
  const isProject = (item: any): item is any => {
    return 'members' in item || 'noteIds' in item || 'conversationIds' in item;
  };

  const isNote = (item: any): item is Note => {
    return 'type' in item || 'content' in item;
  };

  // Helper function to get item type for key generation
  const getItemType = (item: any): string => {
    if (isProject(item)) return 'project';
    if (isNote(item)) return 'note';
    return 'unknown';
  };

  // Helper function to render the appropriate card
  const renderItemCard = (item: any) => {
    if (isProject(item)) {
      return (
        <ProjectCard
          project={item}
          onEdit={handleEditProject}
          onDelete={() => deleteProject(item._id)}
          onShare={handleShareProject}
          dragOverProject={dragOverProject}
        />
      );
    } else if (isNote(item)) {
      return renderNoteCard(item as Note);
    }
    return null;
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col min-h-full">
        {/* Asymmetric Header with breathing space - mobile optimized */}
        <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-4 sm:pb-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 items-end">
              <div className="lg:col-span-2">
                <div className="flex items-baseline gap-3 sm:gap-6 mb-2">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-foreground">
                    <T context="notes.header.title">Files</T>
                  </h1>
                  <div className="h-px bg-gradient-to-r from-border/50 to-transparent flex-1 mb-2 sm:mb-3" />
                </div>
                <h2 className="text-base sm:text-lg font-light text-muted-foreground ml-1 sm:ml-2 tracking-wide">
                  <T context="notes.header.subtitle-grid">Your thoughts and ideas</T>
                </h2>
              </div>
              <div className="flex flex-col items-start lg:items-end gap-2 sm:gap-4">
                <div className="text-sm font-light text-muted-foreground">
                  {totalItems} {totalItems === 1 ? (
                    <T context="notes.count.item">item</T>
                  ) : (
                    <T context="notes.count.items">items</T>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Elegant Search Bar - mobile optimized */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 w-4 h-4" />
              <input
                type="text"
                placeholder={showingAll ? "Search your thoughts..." : showingProjectsOnly ? "Find projects..." : "Discover notes..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 sm:pr-6 py-3 sm:py-3.5 text-sm sm:text-base bg-background/50 backdrop-blur-sm border-0 border-b border-border/30 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 transition-all duration-300 focus:bg-background/80 touch-manipulation"
              />
            </div>
          </div>
        </div>

        {/* Typography-focused filter navigation - mobile optimized */}
        <div className="px-4 sm:px-6 pb-6 sm:pb-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 sm:gap-8 border-b border-border/20 pb-4 overflow-x-auto scrollbar-none">
              {noteTypes.map((type, index) => (
                <button
                  key={type.key}
                  onClick={() => setSelectedTypeFilter(type.key as any)}
                  className={cn(
                    "relative pb-4 px-2 text-sm font-medium transition-all duration-300 hover:scale-[1.02] whitespace-nowrap touch-manipulation",
                    selectedTypeFilter === type.key
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground/70"
                  )}
                  {...(type.key === 'projects' && { 'data-projects-filter': true })}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-300",
                      selectedTypeFilter === type.key ? type.color : "bg-muted-foreground/30"
                    )} />
                    <span className="tracking-wide text-xs sm:text-sm">
                      <T context={type.context}>{type.label}</T>
                    </span>
                  </div>
                  {selectedTypeFilter === type.key && (
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground to-transparent" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Subtle tag exploration */}
        {topTags.length > 0 && (
          <div className="px-6 pb-8">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-4 mb-4">
                <h3 className="text-sm font-light text-muted-foreground tracking-wide">
                  <T context="notes.explore-by-topic">Explore by topic</T>
                </h3>
                <div className="h-px bg-gradient-to-r from-border/30 to-transparent flex-1" />
                {selectedTagFilter && (
                  <button
                    onClick={clearTagFilter}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors duration-200"
                  >
                    <X className="w-3 h-3" />
                    <T context="notes.clear-filter">Clear filter</T>
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 justify-start">
                {topTags.slice(0, 12).map(({ tag, count }) => (
                  <button
                    key={tag}
                    onClick={() => handleTagFilter(tag)}
                    className={cn(
                      "group flex items-center gap-2 px-3 py-1.5 text-xs font-light rounded-full transition-all duration-300 hover:scale-[1.02]",
                      selectedTagFilter === tag
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                    )}
                  >
                    <span className="tracking-wide">{tag}</span>
                    <span className={cn(
                      "text-xs transition-opacity duration-200",
                      selectedTagFilter === tag ? "opacity-70" : "opacity-50 group-hover:opacity-70"
                    )}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content with asymmetric masonry layout */}
        {totalItems === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 bg-muted/50 rounded-2xl flex items-center justify-center">
                {showingProjectsOnly ? <Folder className="w-10 h-10 text-muted-foreground/60" /> : <Plus className="w-10 h-10 text-muted-foreground/60" />}
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-light text-foreground tracking-tight">
                  {searchTerm || (selectedTypeFilter !== 'all' && selectedTypeFilter !== 'projects') || selectedTagFilter ? (
                    <T context="notes.empty.nothing-found">Nothing found</T>
                  ) : showingProjectsOnly ? (
                    <T context="notes.empty.first-project">Your first project awaits</T>
                  ) : showingAll ? (
                    <T context="notes.empty.begin-journey">Begin your creative journey</T>
                  ) : (
                    <T context="notes.empty.start-capturing">Start capturing ideas</T>
                  )}
                </h3>
                <p className="text-muted-foreground font-light leading-relaxed">
                  {searchTerm || (selectedTypeFilter !== 'all' && selectedTypeFilter !== 'projects') || selectedTagFilter ? (
                    <T context="notes.empty.try-different">Try a different search term or adjust your filters to discover content.</T>
                  ) : showingProjectsOnly ? (
                    <T context="notes.empty.organize-content">Organize your notes, conversations, and content into meaningful projects.</T>
                  ) : showingAll ? (
                    <T context="notes.empty.transform-thoughts">Transform your thoughts into organized, AI-enhanced notes and projects.</T>
                  ) : (
                    <T context="notes.empty.capture-insights">Capture insights, ideas, and inspirations with AI-powered organization.</T>
                  )}
                </p>
              </div>
              <button
                onClick={handleCreateNote}
                disabled={isCreatingNote}
                className="inline-flex items-center gap-3 px-6 py-3 bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-light tracking-wide"
              >
                {isCreatingNote ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <T context="button.creating">Creating...</T>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <T context={showingProjectsOnly ? 'button.create-project' : showingAll ? 'button.create-something-new' : 'button.create-note'}>
                      {showingProjectsOnly ? 'Create Project' : showingAll ? 'Create Something New' : 'Create Note'}
                    </T>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 pb-24">
            <div className="px-6">
              <div className="max-w-7xl mx-auto">
                {/* Asymmetric masonry grid with staggered layout */}
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-6">
                  {showingAll 
                    ? allItems.map((item, index) => (
                        <div 
                          key={`${getItemType(item)}-${String(item._id)}`} 
                          className={cn(
                            "break-inside-avoid mb-6 w-full transition-all duration-300 ease-out",
                            // Staggered animation delays
                            "animate-in fade-in slide-in-from-bottom-4",
                            // Subtle offset for visual interest
                            index % 5 === 1 && "sm:mt-4",
                            index % 5 === 3 && "sm:mt-2 lg:mt-6",
                            // Animation delay classes
                            index < 10 && `[animation-delay:${Math.min(index * 50, 500)}ms] [animation-fill-mode:both]`
                          )}
                        >
                          {renderItemCard(item)}
                        </div>
                      ))
                    : showingProjectsOnly 
                    ? filteredProjects.map((project, index) => (
                        <div 
                          key={String(project._id)} 
                          className={cn(
                            "break-inside-avoid mb-6 w-full transition-all duration-300 ease-out",
                            "animate-in fade-in slide-in-from-bottom-4",
                            index % 4 === 1 && "sm:mt-4",
                            index % 4 === 2 && "lg:mt-6",
                            // Animation delay classes
                            index < 10 && `[animation-delay:${Math.min(index * 50, 500)}ms] [animation-fill-mode:both]`
                          )}
                        >
                          {renderItemCard(project)}
                        </div>
                      ))
                    : filteredNotes.map((note, index) => (
                        <div 
                          key={String(note._id)} 
                          className={cn(
                            "break-inside-avoid mb-6 w-full transition-all duration-300 ease-out",
                            "animate-in fade-in slide-in-from-bottom-4",
                            index % 6 === 2 && "sm:mt-3",
                            index % 6 === 4 && "lg:mt-5",
                            // Animation delay classes
                            index < 10 && `[animation-delay:${Math.min(index * 50, 500)}ms] [animation-fill-mode:both]`
                          )}
                        >
                          {renderItemCard(note)}
                        </div>
                      ))
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Elegant floating create button */}
        <button
          onClick={handleCreateNote}
          disabled={isCreatingNote}
          className="fixed bottom-8 right-8 w-16 h-16 bg-primary/90 text-primary-foreground rounded-2xl backdrop-blur-sm hover:bg-primary hover:scale-[1.05] transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl z-50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation border border-primary/20"
          title={isCreatingNote ? "Creating..." : "Create new item"}
          aria-label={isCreatingNote ? "Creating..." : "Create new item"}
        >
          {isCreatingNote ? (
            <div className="w-5 h-5 border-2 border-primary-foreground/80 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Plus className="w-6 h-6" />
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
          userId={firebaseUser?.uid || ''}
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

      {/* Share Content Modal */}
      {shareContent && (
        <ShareContentModal
          isOpen={shareModalOpen}
          onClose={handleCloseShareModal}
          contentType={shareContent.type}
          contentId={shareContent.id}
          contentTitle={shareContent.title}
        />
      )}
    </DndContext>
  );
} 