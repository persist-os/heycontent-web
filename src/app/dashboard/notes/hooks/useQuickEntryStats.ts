'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { useProjects } from '../hooks/useProjects';

export interface QuickEntryStats {
  chats: {
    count: number;
    tokenUsed?: string;
  };
  artifacts: {
    count: number;
    tokenUsed?: string;
  };
  assignments: {
    count: number;
    tokenUsed?: string;
  };
  uploadedFiles: {
    count: number;
    mbUsed?: string;
  };
  isLoading: boolean;
}

/**
 * Hook to fetch Quick Entry Card statistics in parallel
 * Uses Promise.all pattern for efficient parallel queries
 */
export function useQuickEntryStats(): QuickEntryStats {
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;

  // Get chats count
  const recentThreads = useQuery(
    api.chatQueries.getRecentThreads,
    userId ? { userId, limit: 1000 } : 'skip'
  );

  // Get artifacts count
  const userArtifacts = useQuery(
    api.artifactQueries.getUserArtifacts,
    userId ? { userId } : 'skip'
  );

  // Get projects (assignments) count
  const { projects } = useProjects(userId);

  // Get uploaded files count from messages
  const uploadedFiles = useQuery(
    api.messagesQueries.getUserMessagesWithFiles,
    userId ? { userId } : 'skip'
  );

  const isLoading = 
    (userId && recentThreads === undefined) ||
    (userId && userArtifacts === undefined) ||
    (userId && uploadedFiles === undefined);

  // Calculate counts
  const chatsCount = recentThreads?.length || 0;
  const artifactsCount = userArtifacts?.length || 0;
  const assignmentsCount = projects?.length || 0;
  
  // Calculate total file count and size from messages with attachments
  let filesCount = 0;
  let totalFileSize = 0;
  
  if (uploadedFiles) {
    uploadedFiles.forEach((msg) => {
      if (msg.fileAttachments && msg.fileAttachments.length > 0) {
        filesCount += msg.fileAttachments.length;
        msg.fileAttachments.forEach((file: any) => {
          totalFileSize += file.file_size || file.file_metadata?.file_size || 0;
        });
      }
    });
  }

  const mbUsed = totalFileSize > 0 
    ? `${(totalFileSize / (1024 * 1024)).toFixed(1)} MB`
    : undefined;

  return {
    chats: {
      count: chatsCount,
      tokenUsed: undefined, // Not tracked
    },
    artifacts: {
      count: artifactsCount,
      tokenUsed: undefined, // Not tracked
    },
    assignments: {
      count: assignmentsCount,
      tokenUsed: undefined, // Not tracked
    },
    uploadedFiles: {
      count: filesCount,
      mbUsed,
    },
    isLoading,
  };
}

