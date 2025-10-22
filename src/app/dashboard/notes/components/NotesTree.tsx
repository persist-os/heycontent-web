'use client';

import React, { useState, useCallback } from 'react';
import { FileText, Star } from 'lucide-react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { useRouter } from 'next/navigation';
import { useCreateNote } from '../hooks/useCreateNote';
import { useNotes } from '@/app/context/notes-context';
import { useProjects } from '../hooks/useProjects';
import { useFolders } from '../hooks/useFolders';
import { useAuth } from '@/app/context/auth-context';
import { CreateProjectModal } from '../../living-projects/components/CreateProjectModal';
import { CreateFolderModal } from './folders/CreateFolderModal';
import { NotesTreeProps, FilterType } from './NotesTree.types';
import { NotesTreeHeader } from './NotesTreeHeader';
import { TreeNodeRenderer } from './TreeNodeComponents';
import { useNotesTreeStructure } from './useNotesTreeStructure';
import { useNotesTreeDragDrop } from './useNotesTreeDragDrop';
import { Note } from '../types';
import { T } from '@/components/translation';

export function NotesTree({
  notes,
  projects: propProjects,
  onEditNote,
  onDeleteNote,
  onToggleImportant,
  onUpdateNote,
  isLoading
}: NotesTreeProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['recent', 'projects', 'tags', 'important', 'shared', 'my-shared', 'user-folders']));
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  
  const router = useRouter();
  const { createNote } = useCreateNote();
  const { updateNote } = useNotes();
  const { firebaseUser } = useAuth();
  
  const { 
    projects: hookProjects, 
    createProject, 
    isCreating: isCreatingProject,
    addContentToProject,
  } = useProjects(firebaseUser?.uid);

  const {
    folders,
    isCreating: isCreatingFolder,
    createFolder,
    moveNoteToFolder,
    getFoldersByParent
  } = useFolders(firebaseUser?.uid);
  
  // Use projects from props if provided, otherwise from hook
  const projects = propProjects || hookProjects;

  // Use custom hooks for tree structure and drag & drop
  const { treeStructure, sharedNotes, mySharedContent } = useNotesTreeStructure({
    notes,
    projects,
    searchTerm,
    selectedFilter,
    firebaseUserId: firebaseUser?.uid,
    getFoldersByParent
  });

  // Wrapper function to match expected signature
  const updateNoteWrapper = useCallback(async (noteId: string, updates: Partial<Note>): Promise<void> => {
    await updateNote(noteId, updates);
  }, [updateNote]);

  const {
    sensors,
    draggedNote,
    dragOverFolder,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useNotesTreeDragDrop({
    updateNote: updateNoteWrapper,
    addContentToProject,
    moveNoteToFolder
  });

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const handleCreateNote = useCallback(async () => {
    setIsCreatingNote(true);
    try {
      const newNoteId = await createNote('', {
        customType: selectedFilter === 'projects' ? undefined : (selectedFilter !== 'all' ? selectedFilter : undefined)
      });
      if (newNoteId) {
        router.push(`/dashboard/thinking_lab?noteId=${newNoteId}`);
      }
    } catch (error) {
      console.error('Failed to create note:', error);
    } finally {
      setIsCreatingNote(false);
    }
  }, [createNote, router, selectedFilter]);

  const handleCreateProject = useCallback(async (
    name: string, 
    description?: string,
    noteIds?: string[],
    conversationIds?: string[],
    crystalIds?: string[],
    shardIds?: string[]
  ): Promise<string> => {
    // Pass all content arrays directly to createProject mutation
    const projectId = await createProject(
      name, 
      description,
      noteIds,
      conversationIds,
      crystalIds,
      shardIds
    );
    
    return projectId as string;
  }, [createProject]);

  const handleCreateFolder = useCallback(async (name: string, description?: string, parentFolderId?: any, color?: string) => {
    const folderId = await createFolder(name, description, parentFolderId, color);
    return folderId;
  }, [createFolder]);

  const renderTreeNode = useCallback((node: any): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id}>
        <TreeNodeRenderer
          node={node}
          isExpanded={isExpanded}
          hasChildren={hasChildren}
          onToggleNode={toggleNode}
          router={router}
          searchTerm={searchTerm}
          dragOverFolder={dragOverFolder}
          draggedNote={draggedNote}
        />
        
        {hasChildren && isExpanded && (
          <div className="overflow-hidden transition-all duration-300 ease-out mt-1">
            <div className="space-y-0.5">
              {node.children.map((child: any) => renderTreeNode(child))}
            </div>
          </div>
        )}
      </div>
    );
  }, [expandedNodes, toggleNode, router, searchTerm, dragOverFolder, draggedNote]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="max-w-6xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gradient-to-r from-primary/5 via-muted/30 to-accent/5 rounded-lg w-full" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-8 bg-gradient-to-r from-muted/20 via-primary/3 to-transparent rounded-md" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        {/* Header - Full Width */}
        <NotesTreeHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
          onCreateNote={handleCreateNote}
          onCreateProject={() => setShowCreateProjectModal(true)}
          onCreateFolder={() => setShowCreateFolderModal(true)}
          isCreatingNote={isCreatingNote}
          isCreatingProject={isCreatingProject}
          isCreatingFolder={isCreatingFolder}
          foldersCount={folders?.length}
          sharedNotesCount={sharedNotes?.length}
          mySharedContentCount={mySharedContent?.length}
        />

        {/* Tree content */}
        <div className="max-w-6xl mx-auto">
          <div className="p-4 sm:p-6 pb-safe">
            {treeStructure.length === 0 ? (
              <div className="text-center py-12 sm:py-20">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/5">
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-primary/60" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
                  {searchTerm || selectedFilter !== 'all' ? (
                    <T context="notes.empty.no-results">No notes found</T>
                  ) : (
                    <T context="notes.empty.no-notes">No notes yet</T>
                  )}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground max-w-sm mx-auto px-4">
                  {selectedFilter === 'shared' ? (
                    <T context="notes.empty.no-shared">No notes have been shared with you yet</T>
                  ) : selectedFilter === 'my-shared' ? (
                    <T context="notes.empty.no-my-shared">You haven't shared any notes with others yet</T>
                  ) : searchTerm || selectedFilter !== 'all' ? (
                    <T context="notes.empty.adjust-filter">Try adjusting your search or filter criteria</T>
                  ) : (
                    <T context="notes.empty.get-started">Create your first note to get started with organizing your thoughts</T>
                  )}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {treeStructure.map(node => renderTreeNode(node))}
              </div>
            )}
          </div>
        </div>

        {/* Create Project Modal */}
        <CreateProjectModal
          isOpen={showCreateProjectModal}
          onClose={() => setShowCreateProjectModal(false)}
          onCreateProject={handleCreateProject}
          userId={firebaseUser?.uid || ''}
          isCreating={isCreatingProject}
        />

        {/* Create Folder Modal */}
        <CreateFolderModal
          isOpen={showCreateFolderModal}
          onClose={() => setShowCreateFolderModal(false)}
          onCreateFolder={handleCreateFolder}
          isCreating={isCreatingFolder}
        />
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedNote ? (
            <div className="bg-card/95 backdrop-blur-xl border border-primary/30 rounded-lg p-3 shadow-2xl shadow-primary/20">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary/70" />
              <span className="text-sm font-medium text-foreground">
                {draggedNote.title || <T context="notes.untitled">Untitled</T>}
              </span>
              {draggedNote.important && (
                <Star className="w-3 h-3 text-amber-500 fill-current" />
              )}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
