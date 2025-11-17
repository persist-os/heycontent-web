'use client';

import React, { useState, useCallback, useRef } from 'react';
import { FileText, Star, Trash2, CheckSquare, Square, X, Folder, Palette } from 'lucide-react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { useRouter } from 'next/navigation';
import { useNotes } from '@/app/context/notes-context';
import { useProjects } from '../hooks/useProjects';
import { useFolders } from '../hooks/useFolders';
import { useAuth } from '@/app/context/auth-context';
import { BaseModal } from '@/components/ui/base-modal';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/useTranslation';
import { NotesTreeProps, FilterType } from './NotesTree.types';
import { NotesTreeHeader } from './NotesTreeHeader';
import { TreeNodeRenderer } from './TreeNodeComponents';
import { useNotesTreeStructure } from './useNotesTreeStructure';
import { useNotesTreeDragDrop } from './useNotesTreeDragDrop';
import { Note } from '../types';
import { T } from '@/components/translation';
import { Button } from '@/components/ui/button';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import toast from 'react-hot-toast';
import { QuickEntryCard } from './QuickEntryCard';
import { useQuickEntryStats } from '../hooks/useQuickEntryStats';
import { RecentActivityTable } from './RecentActivityTable';
import { uploadFile, type FileUploadResponse, getFileDisplayUrl } from '@/lib/file-upload';
import { FilesView } from './FilesView';

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
  const isCreatingNote = false; // No longer creating notes, just navigating
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
  const [showFilesView, setShowFilesView] = useState(false);
  
  // Create folder form state
  const [folderName, setFolderName] = useState('');
  const [folderDescription, setFolderDescription] = useState('');
  const [folderColor, setFolderColor] = useState('#3B82F6'); // Default primary blue
  
  const router = useRouter();
  const { updateNote, deleteNote } = useNotes();
  const { firebaseUser } = useAuth();
  const batchDeleteNotesMutation = useMutation(api.noteMutations.batchDeleteNotes);
  const createFileMutation = useMutation(api.fileMutations.createFile);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    projects: hookProjects, 
    addContentToProject,
    deleteProject,
    batchDeleteProjects,
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

  // Get Quick Entry stats
  const quickEntryStats = useQuickEntryStats();

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

  const handleFilterChange = useCallback((filter: FilterType) => {
    setSelectedFilter(filter);
    // Exit selection mode when switching filters (optional - could keep selection)
    // For now, we'll keep selection mode but clear selections
    if (isSelectionMode) {
      setSelectedProjects(new Set());
      setSelectedNotes(new Set());
    }
  }, [isSelectionMode]);

  const handleCreateNote = useCallback(() => {
    router.push('/dashboard/thinking_lab');
  }, [router]);

  const handleCreateProject = useCallback(() => {
    // Navigate to thinking lab - a new conversation will create a new project automatically
    router.push('/dashboard/thinking_lab');
  }, [router]);

  const handleCreateFolder = useCallback(async (name: string, description?: string, parentFolderId?: any, color?: string) => {
    const folderId = await createFolder(name, description, parentFolderId, color);
    return folderId;
  }, [createFolder]);

  // Create folder form handlers
  const handleCreateFolderSubmit = useCallback(async () => {
    if (!folderName.trim() || !firebaseUser?.uid) return;
    
    try {
      await handleCreateFolder(folderName.trim(), folderDescription.trim() || undefined, undefined, folderColor);
      setFolderName('');
      setFolderDescription('');
      setFolderColor('#3B82F6');
      setShowCreateFolderModal(false);
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  }, [folderName, folderDescription, folderColor, handleCreateFolder, firebaseUser?.uid]);

  const handleCreateFolderCancel = useCallback(() => {
    setFolderName('');
    setFolderDescription('');
    setFolderColor('#3B82F6');
    setShowCreateFolderModal(false);
  }, []);

  const { text: folderNamePlaceholder } = useTranslation('Enter folder name...', {
    sourceLang: 'en',
    context: 'folders.placeholder.name'
  });
  
  const { text: descriptionPlaceholder } = useTranslation('Add a description...', {
    sourceLang: 'en',
    context: 'folders.placeholder.description'
  });

  // File upload handler
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || !firebaseUser?.uid) {
      return;
    }

    setIsUploadingFiles(true);
    const uploadPromises: Promise<FileUploadResponse>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      uploadPromises.push(uploadFile(file, firebaseUser.uid));
    }

    try {
      const uploadResults = await Promise.all(uploadPromises);
      
      // Create file records in Convex
      const fileRecordPromises = uploadResults.map(async (result) => {
        if (result.success && result.file_metadata) {
          const fileUrl = getFileDisplayUrl(result.file_metadata.gcs_url);
          return await createFileMutation({
            userId: firebaseUser.uid!,
            fileData: {
              originalFilename: result.file_metadata.original_filename,
              filename: result.file_metadata.file_id, // file_id is the final filename after conflict resolution
              contentType: result.file_metadata.content_type,
              fileSize: result.file_metadata.file_size,
              gcsUrl: result.file_metadata.gcs_url,
              fileUrl: fileUrl,
              conversationId: undefined, // General files, not tied to conversation
            },
          });
        }
        return null;
      });

      await Promise.all(fileRecordPromises);
      
      toast.success(
        <T context="toast.dashboard.notes.upload.success">
          Successfully uploaded {uploadResults.length} file{uploadResults.length !== 1 ? 's' : ''}
        </T>
      );
    } catch (error) {
      console.error('File upload error:', error);
      toast.error(
        <T context="toast.dashboard.notes.upload.error">
          Failed to upload files. Please try again.
        </T>
      );
    } finally {
      setIsUploadingFiles(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [firebaseUser?.uid, createFileMutation]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  }, [handleFileUpload]);

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

  // Selection mode handlers
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => {
      if (!prev) {
        // Entering selection mode - clear any existing selections
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
      // For notes, select all visible notes based on filter
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

  const getAllNotesFromTree = useCallback((node: any): Note[] => {
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
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedProjects(new Set());
    setSelectedNotes(new Set());
  }, []);

  const handleBatchDelete = useCallback(() => {
    // Handle both projects and notes in a single batch
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
      
      // Process project deletion results
      if (projectIds.length > 0) {
        const projectResult = results[0];
        if (projectResult.status === 'fulfilled' && projectResult.value) {
          successCount += projectIds.length;
          messages.push(`${projectIds.length} project${projectIds.length !== 1 ? 's' : ''}`);
        } else {
          failCount += projectIds.length;
        }
      }
      
      // Process note deletion results
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
      
      // Show success/error messages
      if (successCount > 0) {
        toast.success(<T context="toast.dashboard.notes.delete.success">Successfully deleted {messages.join(' and ')}</T>);
      }
      if (failCount > 0) {
        toast.error(<T context="toast.dashboard.notes.delete.error.count">Failed to delete {failCount} item{failCount !== 1 ? 's' : ''}</T>);
      }
      
      // Clear selections and exit selection mode
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

  // Total count includes both projects and notes for mixed deletion
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
          dragOverFolder={dragOverFolder}
          draggedNote={draggedNote}
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
  }, [expandedNodes, toggleNode, router, searchTerm, dragOverFolder, draggedNote, handleDeleteProject, isDeletingProject, projectToDelete, isSelectionMode, selectedProjects, selectedNotes, toggleProjectSelection, toggleNoteSelection]);

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
          onFilterChange={handleFilterChange}
          onCreateNote={handleCreateNote}
          onCreateProject={handleCreateProject}
          onCreateFolder={() => setShowCreateFolderModal(true)}
          onUpload={() => {
            fileInputRef.current?.click();
          }}
          isCreatingNote={isCreatingNote}
          isCreatingProject={false}
          isCreatingFolder={isCreatingFolder}
          foldersCount={folders?.length}
          sharedNotesCount={sharedNotes?.length}
          mySharedContentCount={mySharedContent?.length}
        />

        {/* Quick Entry Cards Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row gap-5 mb-6">
            <QuickEntryCard
              type="widgets"
              title={<T context="notes.quick_entry.widgets">Widgets</T>}
              tokenUsed={quickEntryStats.widgets.tokenUsed}
              fileCount={quickEntryStats.widgets.count}
              onClick={() => router.push('/dashboard/widgets')}
            />
            <QuickEntryCard
              type="artifacts"
              title={<T context="notes.quick_entry.artifacts">Artifacts</T>}
              tokenUsed={quickEntryStats.artifacts.tokenUsed}
              fileCount={quickEntryStats.artifacts.count}
              onClick={() => router.push('/dashboard/artifacts')}
            />
            <QuickEntryCard
              type="assignments"
              title={<T context="notes.quick_entry.assignments">Assignments</T>}
              tokenUsed={quickEntryStats.assignments.tokenUsed}
              fileCount={quickEntryStats.assignments.count}
              onClick={() => router.push('/dashboard/assignments')}
            />
            <QuickEntryCard
              type="uploaded-files"
              title={<T context="notes.quick_entry.uploaded_files">Uploaded Files</T>}
              mbUsed={quickEntryStats.uploadedFiles.mbUsed}
              fileCount={quickEntryStats.uploadedFiles.count}
              onClick={() => router.push('/dashboard/files')}
            />
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-6">
          <RecentActivityTable />
        </div>


        {/* Create Folder Modal */}
        <BaseModal
          isOpen={showCreateFolderModal}
          onClose={handleCreateFolderCancel}
          onConfirm={handleCreateFolderSubmit}
          onCancel={handleCreateFolderCancel}
          title="Create New Folder"
          titleContext="folders.create.title"
          variant="create-folder"
          confirmText="Create Folder"
          confirmContext="button.create-folder"
          cancelText="Cancel"
          cancelContext="button.cancel"
          isLoading={isCreatingFolder}
          loadingText="Creating..."
          loadingContext="button.creating"
          maxWidth="md"
        >
          <form onSubmit={(e) => { e.preventDefault(); handleCreateFolderSubmit(); }} className="space-y-4">
            <div>
              <label htmlFor="folder-name" className="block text-sm font-medium text-foreground/90 mb-2">
                <T context="folders.label.name">Folder Name</T> *
              </label>
              <Input
                id="folder-name"
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder={folderNamePlaceholder}
                className="w-full"
                autoFocus
                required
              />
            </div>

            <div>
              <label htmlFor="folder-description" className="block text-sm font-medium text-foreground/90 mb-2">
                <T context="folders.label.description">Description (optional)</T>
              </label>
              <textarea
                id="folder-description"
                value={folderDescription}
                onChange={(e) => setFolderDescription(e.target.value)}
                placeholder={descriptionPlaceholder}
                rows={3}
                className="w-full px-3 py-3 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 resize-none transition-colors duration-300 min-h-[80px]"
              />
            </div>

            <div>
              <label htmlFor="folder-color" className="block text-sm font-medium text-foreground/90 mb-3">
                <Palette className="w-4 h-4 inline mr-2" />
                <T context="folders.label.color">Folder Color</T>
              </label>
              <div className="flex items-center gap-4">
                {/* Color preview with folder icon */}
                {/* eslint-disable-next-line react/forbid-dom-props, react/no-unknown-property */}
                <div 
                  className="w-16 h-16 rounded-lg border-2 border-border flex items-center justify-center transition-all duration-200 hover:scale-105"
                  // @ts-ignore - Dynamic color styling required
                  style={{ backgroundColor: folderColor }}
                >
                  <Folder className="w-8 h-8 text-white drop-shadow-md" />
                </div>
                
                {/* Color picker input */}
                <div className="flex-1 space-y-2">
                  <input
                    id="folder-color"
                    type="color"
                    value={folderColor}
                    onChange={(e) => setFolderColor(e.target.value)}
                    className="w-full h-12 rounded-lg border-2 border-border/50 cursor-pointer hover:border-primary/60 transition-colors duration-300"
                    title="Choose folder color"
                  />
                  <button
                    type="button"
                    onClick={() => setFolderColor('#3B82F6')}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    title="Reset to default color"
                  >
                    <T context="folders.reset-color">Reset to default</T>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </BaseModal>

        {/* Delete Project Confirmation Modal */}
        <BaseModal
          isOpen={projectToDelete !== null}
          onClose={cancelDeleteProject}
          onConfirm={confirmDeleteProject}
          onCancel={cancelDeleteProject}
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
        >
          <div />
        </BaseModal>

        {/* Batch Delete Confirmation Modal - Handles both projects and notes */}
        <BaseModal
          isOpen={(projectsToBatchDelete !== null && projectsToBatchDelete.length > 0) || (notesToBatchDelete !== null && notesToBatchDelete.length > 0)}
          onClose={cancelBatchDelete}
          onConfirm={confirmBatchDelete}
          onCancel={cancelBatchDelete}
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
          })() as string}
          descriptionContext="modal.delete_items_description"
          confirmText={(() => {
            const projectCount = projectsToBatchDelete?.length || 0;
            const noteCount = notesToBatchDelete?.length || 0;
            const total = projectCount + noteCount;
            return `Delete ${total} Item${total !== 1 ? 's' : ''}`;
          })() as string}
          confirmContext="button.delete_items"
          cancelText="Cancel"
          cancelContext="button.cancel"
          variant="destructive"
          isLoading={isBatchDeleting || isBatchDeletingNotes}
        >
          <div />
        </BaseModal>

        {/* Hidden file input for uploads */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.zip,.rar"
          disabled={isUploadingFiles}
          aria-label="Upload files"
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
