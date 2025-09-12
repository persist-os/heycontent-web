'use client';

import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ContentContext } from '../types';

interface ProjectContentSummary {
  totalItems: number;
  itemCounts: {
    notes: number;
    conversations: number;
  };
  content: string;
  metadata: {
    projectName: string;
    projectDescription?: string;
    createdAt: number;
    updatedAt: number;
    hasFingerprint: boolean;
  };
}

// Content limits to prevent overwhelming the AI - focus on notes and conversations
const CONTENT_LIMITS = {
  MAX_NOTES: 25, // Increased from 10 to get more notes
  MAX_CONVERSATIONS: 15, // Increased from 10 to get more conversations  
  MAX_CONTENT_LENGTH: 12000, // Increased from 8000 to accommodate more content
  MAX_NOTE_LENGTH: 600, // Increased from 300 for more note content
  MAX_CONVERSATION_LENGTH: 800, // Increased from 300 for more conversation content
};

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function formatProjectContent(projectDetails: any): ProjectContentSummary {
  if (!projectDetails) {
    return {
      totalItems: 0,
      itemCounts: {
        notes: 0,
        conversations: 0,
      },
      content: '',
      metadata: {
        projectName: 'Unknown Project',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        hasFingerprint: false,
      },
    };
  }

  const { attachedItems } = projectDetails;
  const contentParts: string[] = [];

  // Add project metadata
  const metadata = {
    projectName: projectDetails.name,
    projectDescription: projectDetails.description,
    createdAt: projectDetails.createdAt,
    updatedAt: projectDetails.updatedAt,
    hasFingerprint: !!projectDetails.fingerprintId,
  };

  contentParts.push(`Project: ${metadata.projectName}`);
  if (metadata.projectDescription) {
    contentParts.push(`Description: ${metadata.projectDescription}`);
  }
  contentParts.push(''); // Empty line for separation

  // Count items - only notes and conversations
  const itemCounts = {
    notes: attachedItems.notes?.length || 0,
    conversations: attachedItems.conversations?.length || 0,
  };

  const totalItems = itemCounts.notes + itemCounts.conversations;

  // Add content sections - focus only on notes and conversations with higher limits
  if (itemCounts.notes > 0) {
    contentParts.push('=== NOTES ===');
    const notesToInclude = attachedItems.notes
      .slice(0, CONTENT_LIMITS.MAX_NOTES)
      .map((note: any, index: number) => {
        const noteTitle = note.title || `Untitled Note ${index + 1}`;
        const noteContent = note.content || '';
        const fullContent = `[${noteTitle}]${noteContent ? `\n${noteContent}` : ''}`;
        return truncateText(fullContent, CONTENT_LIMITS.MAX_NOTE_LENGTH);
      });
    contentParts.push(...notesToInclude);
    contentParts.push(''); // Empty line
  }

  if (itemCounts.conversations > 0) {
    contentParts.push('=== CONVERSATIONS ===');
    const conversationsToInclude = attachedItems.conversations
      .slice(0, CONTENT_LIMITS.MAX_CONVERSATIONS)
      .map((conv: any, index: number) => {
        const title = conv.title || `Conversation ${index + 1}`;
        // Get more messages from each conversation (last 5 instead of 3)
        const messages = conv.messages
          ?.slice(-5)
          .map((msg: any) => `${msg.role}: ${msg.content}`)
          .join('\n') || '';
        const fullContent = `[${title}]\n${messages}`;
        return truncateText(fullContent, CONTENT_LIMITS.MAX_CONVERSATION_LENGTH);
      });
    contentParts.push(...conversationsToInclude);
    contentParts.push(''); // Empty line
  }

  // Join all content and apply overall length limit
  const fullContent = contentParts.join('\n');
  const finalContent = truncateText(fullContent, CONTENT_LIMITS.MAX_CONTENT_LENGTH);

  return {
    totalItems,
    itemCounts,
    content: finalContent,
    metadata,
  };
}

export function useProjectContext(
  projectId?: string,
  fingerprintId?: string,
  userId?: string
): {
  projectContext: ContentContext | null;
  isLoading: boolean;
  error: string | null;
  contentSummary: ProjectContentSummary | null;
} {
  // Fetch project details with all attached items
  const projectDetails = useQuery(
    api.projectsQueries.getProjectDetails,
    projectId && userId ? { 
      projectId: projectId as Id<"projects">, 
      userId 
    } : "skip"
  );

  const isLoading = projectDetails === undefined;
  const error = projectDetails === null && !isLoading ? "Project not found or access denied" : null;

  const { projectContext, contentSummary } = useMemo(() => {
    if (!projectDetails || !projectId) {
      return { 
        projectContext: null, 
        contentSummary: null 
      };
    }

    const summary = formatProjectContent(projectDetails);
    
    // Only create context if there's meaningful content
    if (summary.totalItems === 0) {
      return { 
        projectContext: null, 
        contentSummary: summary 
      };
    }

    const context: ContentContext = {
      platform: 'project' as const,
      contentId: projectId,
      title: `Project: ${summary.metadata.projectName}`,
      content: {
        projectId,
        fingerprintId,
        mode: 'discovery',
        projectData: summary,
      },
      source: 'project-discovery',
      originalPlatform: 'project' as const,
      analysis: summary.content, // Use the formatted content as analysis
      // Add additional context to ensure backend gets the project data
      additionalContext: `This is a project discovery session for "${summary.metadata.projectName}". The project contains ${summary.totalItems} items: ${summary.itemCounts.notes} notes and ${summary.itemCounts.conversations} conversations. Here is the project content:\n\n${summary.content}`,
    };

    return { 
      projectContext: context, 
      contentSummary: summary 
    };
  }, [projectDetails, projectId, fingerprintId]);

  return {
    projectContext,
    isLoading,
    error,
    contentSummary,
  };
}
