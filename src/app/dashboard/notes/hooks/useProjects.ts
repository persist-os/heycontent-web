'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Project, ProjectUpdate, ItemType } from '../types/project';
import { Id } from '@/convex/_generated/dataModel';
import toast from 'react-hot-toast';

export function useProjects(userId: string | undefined) {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Queries
  const projects = useQuery(
    api.projectsQueries.getByUser,
    userId ? { userId } : "skip"
  );

  // Mutations
  const createProjectMutation = useMutation(api.projectsMutations.createProject);
  const updateProjectMutation = useMutation(api.projectsMutations.updateProject);
  const deleteProjectMutation = useMutation(api.projectsMutations.deleteProject);
  const addItemMutation = useMutation(api.projectsMutations.addItemToProject);
  const removeItemMutation = useMutation(api.projectsMutations.removeItemFromProject);
  const migrateAnalysisItemsMutation = useMutation(api.projectsMutations.migrateAnalysisItems);

  // Create project
  const createProject = useCallback(async (name: string, description?: string) => {
    if (!userId) {
      toast.error('User not authenticated');
      return null;
    }

    setIsCreating(true);
    try {
      const projectId = await createProjectMutation({
        userId,
        name,
        description,
      });
      
      toast.success('Project created successfully');
      return projectId;
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [userId, createProjectMutation]);

  // Update project
  const updateProject = useCallback(async (
    projectId: Id<"projects">, 
    updates: ProjectUpdate
  ) => {
    setIsUpdating(true);
    try {
      await updateProjectMutation({
        projectId,
        userId,
        ...updates,
      });
      
      toast.success('Project updated successfully');
      return true;
    } catch (error) {
      console.error('Failed to update project:', error);
      toast.error('Failed to update project');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [updateProjectMutation]);

  // Delete project
  const deleteProject = useCallback(async (projectId: Id<"projects">) => {
    try {
      await deleteProjectMutation({ projectId, userId });
      toast.success('Project deleted successfully');
      return true;
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project');
      return false;
    }
  }, [deleteProjectMutation]);

  // Add item to project
  const addItemToProject = useCallback(async (
    projectId: Id<"projects">,
    itemType: ItemType,
    itemId: string
  ) => {
    try {
      const result = await addItemMutation({
        projectId,
        userId,
        itemType,
        itemId,
      });
      
      const displayName = itemType === 'instagramPost' ? 'Instagram post' : 
                         itemType === 'youtubeVideo' ? 'YouTube video' : 
                         itemType === 'analysis' ? 'Analysis report' :
                         itemType;
      
      // Check if the operation was successful
      if (result) {
        toast.success(`${displayName} added to project`);
        return true;
      } else {
        toast.error(`Failed to add ${displayName} to project`);
        return false;
      }
    } catch (error) {
      console.error('Failed to add item to project:', error);
      const displayName = itemType === 'instagramPost' ? 'Instagram post' : 
                         itemType === 'youtubeVideo' ? 'YouTube video' : 
                         itemType === 'analysis' ? 'Analysis report' :
                         itemType;
      toast.error(`Failed to add ${displayName} to project`);
      return false;
    }
  }, [addItemMutation]);

  // Remove item from project
  const removeItemFromProject = useCallback(async (
    projectId: Id<"projects">,
    itemType: ItemType,
    itemId: string
  ) => {
    try {
      await removeItemMutation({
        projectId,
        userId,
        itemType,
        itemId,
      });
      
      const displayName = itemType === 'instagramPost' ? 'Instagram post' : 
                         itemType === 'youtubeVideo' ? 'YouTube video' : 
                         itemType === 'analysis' ? 'Analysis report' :
                         itemType;
      toast.success(`${displayName} removed from project`);
      return true;
    } catch (error) {
      console.error('Failed to remove item from project:', error);
      const displayName = itemType === 'instagramPost' ? 'Instagram post' : 
                         itemType === 'youtubeVideo' ? 'YouTube video' : 
                         itemType === 'analysis' ? 'Analysis report' :
                         itemType;
      toast.error(`Failed to remove ${displayName} from project`);
      return false;
    }
  }, [removeItemMutation]);

  // Migrate analysis items
  const migrateAnalysisItems = useCallback(async (projectId: Id<"projects">) => {
    try {
      const result = await migrateAnalysisItemsMutation({
        projectId,
        userId,
      });
      
      if (result) {
        toast.success('Analysis items migrated successfully');
      } else {
        toast.info('No analysis items found to migrate');
      }
      return result;
    } catch (error) {
      console.error('Failed to migrate analysis items:', error);
      toast.error('Failed to migrate analysis items');
      return false;
    }
  }, [migrateAnalysisItemsMutation, userId]);

  return {
    projects: projects || [],
    isLoading: projects === undefined,
    isCreating,
    isUpdating,
    createProject,
    updateProject,
    deleteProject,
    addItemToProject,
    removeItemFromProject,
    migrateAnalysisItems,
  };
} 