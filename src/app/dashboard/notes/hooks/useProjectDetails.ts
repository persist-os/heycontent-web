'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

export function useProjectDetails(projectId: Id<"projects"> | null, userId?: string) {
  const projectDetails = useQuery(
    api.projectsQueries.getProjectDetails,
    projectId ? { projectId, userId } : "skip"
  );

  return {
    project: projectDetails,
    isLoading: projectDetails === undefined,
  };
} 