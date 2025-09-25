import { useState, useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

export interface Folder {
  _id: Id<"folders">;
  _creationTime: number;
  userId: string;
  name: string;
  description?: string;
  parentFolderId?: Id<"folders">;
  color?: string;
  createdAt: number;
  updatedAt: number;
}

export function useFolders(userId: string | undefined) {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Queries
  const folders = useQuery(
    api.folderQueries.getUserFolders,
    userId ? { userId } : 'skip'
  );

  // Mutations
  const createFolderMutation = useMutation(api.folderMutations.createFolder);
  const updateFolderMutation = useMutation(api.folderMutations.updateFolder);
  const deleteFolderMutation = useMutation(api.folderMutations.deleteFolder);
  const moveNoteToFolderMutation = useMutation(api.folderMutations.moveNoteToFolder);

  const createFolder = useCallback(async (
    name: string,
    description?: string,
    parentFolderId?: Id<"folders">,
    color?: string
  ) => {
    if (!userId) throw new Error('User not authenticated');
    
    setIsCreating(true);
    try {
      const folderId = await createFolderMutation({
        userId,
        name,
        description,
        parentFolderId,
        color,
      });
      return folderId;
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [userId, createFolderMutation]);

  const updateFolder = useCallback(async (
    folderId: Id<"folders">,
    updates: {
      name?: string;
      description?: string;
      parentFolderId?: Id<"folders">;
      color?: string;
    }
  ) => {
    if (!userId) throw new Error('User not authenticated');
    
    setIsUpdating(true);
    try {
      await updateFolderMutation({
        folderId,
        userId,
        updates,
      });
    } catch (error) {
      console.error('Failed to update folder:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [userId, updateFolderMutation]);

  const deleteFolder = useCallback(async (
    folderId: Id<"folders">,
    moveContentsToParent = true
  ) => {
    if (!userId) throw new Error('User not authenticated');
    
    setIsDeleting(true);
    try {
      await deleteFolderMutation({
        folderId,
        userId,
        moveContentsToParent,
      });
    } catch (error) {
      console.error('Failed to delete folder:', error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, [userId, deleteFolderMutation]);

  const moveNoteToFolder = useCallback(async (
    noteId: Id<"notes">,
    folderId?: Id<"folders">
  ) => {
    if (!userId) throw new Error('User not authenticated');
    
    try {
      await moveNoteToFolderMutation({
        noteId,
        folderId,
        userId,
      });
    } catch (error) {
      console.error('Failed to move note to folder:', error);
      throw error;
    }
  }, [userId, moveNoteToFolderMutation]);

  const getFoldersByParent = useCallback((parentFolderId?: Id<"folders">) => {
    if (!folders) return [];
    return folders.filter(folder => folder.parentFolderId === parentFolderId);
  }, [folders]);

  const getFolderPath = useCallback((folderId: Id<"folders">) => {
    if (!folders) return [];
    
    const path: Folder[] = [];
    let currentFolderId: Id<"folders"> | undefined = folderId;
    
    while (currentFolderId) {
      const folder = folders.find(f => f._id === currentFolderId);
      if (!folder) break;
      
      path.unshift(folder);
      currentFolderId = folder.parentFolderId;
    }
    
    return path;
  }, [folders]);

  return {
    folders: folders || [],
    isCreating,
    isUpdating,
    isDeleting,
    createFolder,
    updateFolder,
    deleteFolder,
    moveNoteToFolder,
    getFoldersByParent,
    getFolderPath,
  };
}
