'use client';

import React, { useState, useCallback } from 'react';
import { FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCreateNote } from '../hooks/useCreateNote';
import { useNotes } from '@/app/context/notes-context';
import { useProjects } from '../hooks/useProjects';
import { useFolders } from '../hooks/useFolders';
import { useAuth } from '@/app/context/auth-context';
import { CreateFolderModal } from './folders/CreateFolderModal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { NotesTreeProps, FilterType } from './NotesTree.types';
import { CollapsibleHeader } from './CollapsibleHeader';
import { TreeNodeRenderer } from './TreeNodeComponents';
import { useNotesTreeStructure } from './useNotesTreeStructure';
import { Note } from '../types';
import { T } from '@/components/translation';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import toast from 'react-hot-toast';

export function NotesTreeMobile({
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
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [projectsToBatchDelete, setProjectsToBatchDelete] = useState<string[] | null>(null);
  const [notesToBatchDelete, setNotesToBatchDelete] = useState<string[] | null>(null);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [isBatchDeletingNotes, setIsBatchDeletingNotes] = useState(false);
  
  const router = useRouter();
  const { createNote } = useCreateNote();
  const { updateNote } = useNotes();
  const { firebaseUser } = useAuth();
  const batchDeleteNotesMutation = useMutation(api.noteMutations.batchDeleteNotes);
  
  const { 
    projects: hookProjects, 
    deleteProject,
    batchDeleteProjects,
  } = useProjects(firebaseUser?.uid);

  const {
    folders,
    isCreating: isCreatingFolder,
    createFolder,
    getFoldersByParent
  } = useFolders(firebaseUser?.uid);
  
  // Use projects from props if provided, otherwise from hook
  const projects = propProjects || hookProjects;

  // Use custom hooks for tree structure (no drag & drop on mobile)
  const { treeStructure, sharedNotes, mySharedContent } = useNotesTreeStructure({
    notes,
    projects,
    searchTerm,
    selectedFilter,
    firebaseUserId: firebaseUser?.uid,
    getFoldersByParent
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

  const handleFilterChange = useCallback((filter: FilterType) => {
    setSelectedFilter(filter);
    if (isSelectionMode) {
      setSelectedProjects(new Set());
      setSelectedNotes(new Set());
    }
  }, [isSelectionMode]);

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

  const handleCreateProject = useCallback(() => {
    router.push('/dashboard/thinking_lab');
  }, [router]);

  const handleCreateFolder = useCallback(async (name: string, description?: string, parentFolderId?: any, color?: string) => {
    const folderId = await createFolder(name, description, parentFolderId, color);
    return folderId;
  }, [createFolder]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    setProjectToDelete(projectId);
  }, []);

  const confirmDeleteProject = useCallback(async () => {
    if (!projectToDelete || !firebaseUser?.uid) return;
    
    setIsDeletingProject(true);
    try {
      const success = await deleteProject(projectToDelete as any);
      if (success) {
        setProjectToDelete(null);
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setIsDeletingProject(false);
    }
  }, [projectToDelete, deleteProject, firebaseUser?.uid]);

  const cancelDeleteProject = useCallback(() => {
    setProjectToDelete(null);
  }, []);

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => {
      if (!prev) {
        setSelectedProjects(new Set());
        setSelectedNotes(new Set());
      }
      return !prev;
    });
  }, []);

  const toggleProjectSelection = useCallback((projectId: string) => {
    setSelectedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  }, []);

  const toggleNoteSelection = useCallback((noteId: string) => {
    setSelectedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  }, []);

  const selectAllVisible = useCallback(() => {
    if (selectedFilter === 'projects') {
      const allProjectIds = projects.map(p => p._id);
      setSelectedProjects(new Set(allProjectIds));
    } else {
      const getAllNotesFromTree = (node: any): Note[] => {
        const notes: Note[] = [];
        if (node.type === 'note' && node.note) {
          notes.push(node.note);
        }
        if (node.children) {
          node.children.forEach((child: any) => {
            notes.push(...getAllNotesFromTree(child));
          });
        }
        return notes;
      };
      
      const visibleNotes = treeStructure
        .flatMap(node => getAllNotesFromTree(node))
        .map(note => note._id);
      setSelectedNotes(new Set(visibleNotes));
    }
  }, [selectedFilter, projects, treeStructure]);

  const deselectAll = useCallback(() => {
    setSelectedProjects(new Set());
    setSelectedNotes(new Set());
  }, []);

  const handleBatchDelete = useCallback(() => {
    const projectIds = selectedProjects.size > 0 ? Array.from(selectedProjects) : [];
    const noteIds = selectedNotes.size > 0 ? Array.from(selectedNotes) : [];
    
    if (projectIds.length > 0 || noteIds.length > 0) {
      setProjectsToBatchDelete(projectIds.length > 0 ? projectIds : null);
      setNotesToBatchDelete(noteIds.length > 0 ? noteIds : null);
    }
  }, [selectedProjects, selectedNotes]);

  const confirmBatchDelete = useCallback(async () => {
    if (!firebaseUser?.uid) return;
    
    const projectIds = projectsToBatchDelete || [];
    const noteIds = notesToBatchDelete || [];
    const totalItems = projectIds.length + noteIds.length;
    
    if (totalItems === 0) return;
    
    setIsBatchDeleting(true);
    setIsBatchDeletingNotes(true);
    
    try {
      const results = await Promise.allSettled([
        projectIds.length > 0 ? batchDeleteProjects(projectIds as any) : Promise.resolve(false),
        noteIds.length > 0 ? batchDeleteNotesMutation({ 
          noteIds: noteIds as any, 
          userId: firebaseUser.uid 
        }) : Promise.resolve({ success: false, successfulOperations: 0, failedOperations: 0 })
      ]);
      
      let successCount = 0;
      let failCount = 0;
      const messages: string[] = [];
      
      if (projectIds.length > 0) {
        const projectResult = results[0];
        if (projectResult.status === 'fulfilled' && projectResult.value) {
          successCount += projectIds.length;
          messages.push(`${projectIds.length} project${projectIds.length !== 1 ? 's' : ''}`);
        } else {
          failCount += projectIds.length;
        }
      }
      
      if (noteIds.length > 0) {
        const noteResult = results[1];
        if (noteResult.status === 'fulfilled' && noteResult.value && typeof noteResult.value === 'object' && 'successfulOperations' in noteResult.value) {
          const noteData = noteResult.value as { success: boolean; successfulOperations: number; failedOperations: number };
          successCount += noteData.successfulOperations;
          failCount += noteData.failedOperations;
          if (noteData.successfulOperations > 0) {
            messages.push(`${noteData.successfulOperations} note${noteData.successfulOperations !== 1 ? 's' : ''}`);
          }
        } else {
          failCount += noteIds.length;
        }
      }
      
      if (successCount > 0) {
        toast.success(<T context="toast.dashboard.notes.delete.success">Successfully deleted {messages.join(' and ')}</T>);
      }
      if (failCount > 0) {
        toast.error(<T context="toast.dashboard.notes.delete.error.count">Failed to delete {failCount} item{failCount !== 1 ? 's' : ''}</T>);
      }
      
      setProjectsToBatchDelete(null);
      setNotesToBatchDelete(null);
      setSelectedProjects(new Set());
      setSelectedNotes(new Set());
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Failed to batch delete:', error);
      toast.error(<T context="toast.dashboard.notes.delete.error">Failed to delete items</T>);
    } finally {
      setIsBatchDeleting(false);
      setIsBatchDeletingNotes(false);
    }
  }, [projectsToBatchDelete, notesToBatchDelete, batchDeleteProjects, batchDeleteNotesMutation, firebaseUser?.uid]);

  const cancelBatchDelete = useCallback(() => {
    setProjectsToBatchDelete(null);
    setNotesToBatchDelete(null);
  }, []);

  const selectedCount = selectedProjects.size + selectedNotes.size;
  const hasSelection = selectedCount > 0;

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
          dragOverFolder={null}
          draggedNote={null}
          onDeleteProject={handleDeleteProject}
          isDeletingProject={(id) => isDeletingProject && projectToDelete === id}
          isSelectionMode={isSelectionMode}
          selectedProjects={selectedProjects}
          selectedNotes={selectedNotes}
          onToggleProjectSelection={toggleProjectSelection}
          onToggleNoteSelection={toggleNoteSelection}
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
  }, [expandedNodes, toggleNode, router, searchTerm, handleDeleteProject, isDeletingProject, projectToDelete, isSelectionMode, selectedProjects, selectedNotes, toggleProjectSelection, toggleNoteSelection]);

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Collapsible Header */}
      <CollapsibleHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedFilter={selectedFilter}
        onFilterChange={handleFilterChange}
        onCreateNote={handleCreateNote}
        onCreateProject={handleCreateProject}
        onCreateFolder={() => setShowCreateFolderModal(true)}
        isCreatingNote={isCreatingNote}
        isCreatingProject={false}
        isCreatingFolder={isCreatingFolder}
        foldersCount={folders?.length}
        sharedNotesCount={sharedNotes?.length}
        mySharedContentCount={mySharedContent?.length}
        isSelectionMode={isSelectionMode}
        selectedProjectsCount={selectedProjects.size}
        selectedNotesCount={selectedNotes.size}
        onToggleSelectionMode={toggleSelectionMode}
        onSelectAll={selectAllVisible}
        onDeselectAll={deselectAll}
        onBatchDelete={handleBatchDelete}
        hasSelection={hasSelection}
      />

      {/* Tree content */}
      <div className="max-w-6xl mx-auto">
        <div className="p-4 pb-safe">
          {treeStructure.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/5">
                <FileText className="w-6 h-6 text-primary/60" />
              </div>
              <h3 className="text-base font-medium text-foreground mb-2">
                {searchTerm || selectedFilter !== 'all' ? (
                  <T context="notes.empty.no-results">No notes found</T>
                ) : (
                  <T context="notes.empty.no-notes">No notes yet</T>
                )}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto px-4">
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

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        onCreateFolder={handleCreateFolder}
        isCreating={isCreatingFolder}
      />

      {/* Delete Project Confirmation Modal */}
      <ConfirmationModal
        isOpen={projectToDelete !== null}
        onClose={cancelDeleteProject}
        onConfirm={confirmDeleteProject}
        title="Delete Project"
        titleContext="modal.delete_project_title"
        description={`Are you sure you want to delete "${projects.find(p => p._id === projectToDelete)?.name || 'this project'}"? This action cannot be undone.`}
        descriptionContext="modal.delete_project_description"
        confirmText="Delete Project"
        confirmContext="button.delete_project"
        cancelText="Cancel"
        cancelContext="button.cancel"
        variant="destructive"
        isLoading={isDeletingProject}
      />

      {/* Batch Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={(projectsToBatchDelete !== null && projectsToBatchDelete.length > 0) || (notesToBatchDelete !== null && notesToBatchDelete.length > 0)}
        onClose={cancelBatchDelete}
        onConfirm={confirmBatchDelete}
        title="Delete Items"
        titleContext="modal.delete_items_title"
        description={(() => {
          const projectCount = projectsToBatchDelete?.length || 0;
          const noteCount = notesToBatchDelete?.length || 0;
          const parts: string[] = [];
          if (projectCount > 0) {
            parts.push(`${projectCount} project${projectCount !== 1 ? 's' : ''}`);
          }
          if (noteCount > 0) {
            parts.push(`${noteCount} note${noteCount !== 1 ? 's' : ''}`);
          }
          return `Are you sure you want to delete ${parts.join(' and ')}? This action cannot be undone.`;
        })()}
        descriptionContext="modal.delete_items_description"
        confirmText={(() => {
          const projectCount = projectsToBatchDelete?.length || 0;
          const noteCount = notesToBatchDelete?.length || 0;
          const total = projectCount + noteCount;
          return `Delete ${total} Item${total !== 1 ? 's' : ''}`;
        })()}
        confirmContext="button.delete_items"
        cancelText="Cancel"
        cancelContext="button.cancel"
        variant="destructive"
        isLoading={isBatchDeleting || isBatchDeletingNotes}
      />
    </div>
  );
}

