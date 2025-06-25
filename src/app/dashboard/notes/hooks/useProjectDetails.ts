'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

export function useProjectDetails(projectId: Id<"projects"> | null) {
  const projectDetails = useQuery(
    api.projects.getProjectDetails,
    projectId ? { projectId } : "skip"
  );

  return {
    project: projectDetails,
    isLoading: projectDetails === undefined,
  };
} 