'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Project, ProjectUpdate, ContentType } from '../types/project';
import { Id } from '@/convex/_generated/dataModel';
import toast from 'react-hot-toast';

export function useProjects(userId: string | undefined) {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Queries - Using the correct query names from projectsQueries.ts
  const projects = useQuery(
    api.projectsQueries.getByUser,
    userId ? { userId } : "skip"
  );

  // Mutations - Using the correct mutation names from projectsMutations.ts
  const createProjectMutation = useMutation(api.projectsMutations.createProject);
  const updateProjectMutation = useMutation(api.projectsMutations.updateProject);
  const deleteProjectMutation = useMutation(api.projectsMutations.deleteProject);
  const addContentMutation = useMutation(api.projectsMutations.addContent);
  const removeContentMutation = useMutation(api.projectsMutations.removeContent);
  const addMultipleContentMutation = useMutation(api.projectsMutations.addMultipleContent);

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
    if (!userId) {
      toast.error('User not authenticated');
      return false;
    }

    setIsUpdating(true);
    try {
      await updateProjectMutation({
        projectId,
        userId,
        updates,
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
  }, [updateProjectMutation, userId]);

  // Delete project
  const deleteProject = useCallback(async (projectId: Id<"projects">) => {
    if (!userId) {
      toast.error('User not authenticated');
      return false;
    }

    try {
      await deleteProjectMutation({ projectId, userId });
      toast.success('Project deleted successfully');
      return true;
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project');
      return false;
    }
  }, [deleteProjectMutation, userId]);

  // Add content to project (notes, conversations, crystals, shards, analysis)
  const addContentToProject = useCallback(async (
    projectId: Id<"projects">,
    contentType: ContentType,
    contentId: string
  ) => {
    if (!userId) {
      toast.error('User not authenticated');
      return false;
    }

    try {
      const result = await addContentMutation({
        projectId,
        userId,
        contentType,
        contentId,
      });
      
      const displayName = contentType === 'note' ? 'Note' : 
                         contentType === 'conversation' ? 'Conversation' : 
                         contentType === 'crystal' ? 'Crystal' :
                         contentType === 'shard' ? 'Shard' :
                         contentType === 'analysis' ? 'Analysis' :
                         contentType;
      
      if (result?.success) {
        toast.success(`${displayName} added to project`);
        return true;
      } else {
        toast.error(`Failed to add ${displayName} to project`);
        return false;
      }
    } catch (error) {
      console.error('Failed to add content to project:', error);
      const displayName = contentType === 'note' ? 'Note' : 
                         contentType === 'conversation' ? 'Conversation' : 
                         contentType === 'crystal' ? 'Crystal' :
                         contentType === 'shard' ? 'Shard' :
                         contentType === 'analysis' ? 'Analysis' :
                         contentType;
      toast.error(`Failed to add ${displayName} to project`);
      return false;
    }
  }, [addContentMutation, userId]);

  // Remove content from project
  const removeContentFromProject = useCallback(async (
    projectId: Id<"projects">,
    contentType: ContentType,
    contentId: string
  ) => {
    if (!userId) {
      toast.error('User not authenticated');
      return false;
    }

    try {
      const result = await removeContentMutation({
        projectId,
        userId,
        contentType,
        contentId,
      });
      
      const displayName = contentType === 'note' ? 'Note' : 
                         contentType === 'conversation' ? 'Conversation' : 
                         contentType === 'crystal' ? 'Crystal' :
                         contentType === 'shard' ? 'Shard' :
                         contentType === 'analysis' ? 'Analysis' :
                         contentType;
      
      if (result?.success) {
        toast.success(`${displayName} removed from project`);
        return true;
      } else {
        toast.error(`Failed to remove ${displayName} from project`);
        return false;
      }
    } catch (error) {
      console.error('Failed to remove content from project:', error);
      const displayName = contentType === 'note' ? 'Note' : 
                         contentType === 'conversation' ? 'Conversation' : 
                         contentType === 'crystal' ? 'Crystal' :
                         contentType === 'shard' ? 'Shard' :
                         contentType === 'analysis' ? 'Analysis' :
                         contentType;
      toast.error(`Failed to remove ${displayName} from project`);
      return false;
    }
  }, [removeContentMutation, userId]);

  // Add multiple content items to project (bulk operation)
  const addMultipleContentToProject = useCallback(async (
    projectId: Id<"projects">,
    content: Array<{ type: ContentType; id: string }>
  ) => {
    if (!userId) {
      toast.error('User not authenticated');
      return false;
    }

    try {
      const result = await addMultipleContentMutation({
        projectId,
        userId,
        content,
      });
      
      if (result?.success) {
        toast.success(`${result.addedCount} items added to project`);
        return true;
      } else {
        toast.error('Failed to add items to project');
        return false;
      }
    } catch (error) {
      console.error('Failed to add multiple content to project:', error);
      toast.error('Failed to add items to project');
      return false;
    }
  }, [addMultipleContentMutation, userId]);

  return {
    projects: projects || [],
    isLoading: projects === undefined,
    isCreating,
    isUpdating,
    createProject,
    updateProject,
    deleteProject,
    addContentToProject,
    removeContentFromProject,
    addMultipleContentToProject,
  };
} 