'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Project, ProjectUpdate, ContentType } from '../types/project';
import { Id } from '@/convex/_generated/dataModel';
import toast from 'react-hot-toast';
import { track } from '@/lib/analytics';

export function useProjects(userId: string | undefined) {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Queries - Using the correct query names from projectsQueries.ts
  const projects = useQuery(
    api.projectsQueries.getByUser,
    userId ? { userId } : "skip"
  );

  // Mutations - Using atomic initialization for project creation
  const initializeConversationMutation = useMutation(api.chatMutations.initializeConversation);
  const updateProjectMutation = useMutation(api.projectsMutations.updateProject);
  const deleteProjectMutation = useMutation(api.projectsMutations.batchDeleteProjects);
  const addContentMutation = useMutation(api.projectsMutations.addContent);
  const removeContentMutation = useMutation(api.projectsMutations.removeContent);
  const addMultipleContentMutation = useMutation(api.projectsMutations.addMultipleContent);

  // Create project - uses atomic initialization (Project + Conversation + Fingerprint + Cognitive Field)
  const createProject = useCallback(async (
    name: string, 
    description?: string,
    noteIds?: string[],
    conversationIds?: string[],
    crystalIds?: string[],
    shardIds?: string[]
  ) => {
    if (!userId) {
      toast.error('User not authenticated');
      return null;
    }

    setIsCreating(true);
    try {
      // Use initializeConversation to create project atomically
      // Note: description, noteIds, etc. are ignored - atomic initialization creates minimal project
      const result = await initializeConversationMutation({
        userId,
        title: name,
        messages: []
      });
      
      // initializeConversation returns { conversationId, projectId, fingerprintId, cognitiveFieldId }
      const projectId = result.projectId as Id<"projects">;
      
      toast.success('Project created successfully');
      track('project_create');
      return projectId;
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [userId, initializeConversationMutation]);

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