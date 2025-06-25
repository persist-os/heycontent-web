'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ProjectDetailPage } from '../../components/projects/ProjectDetailPage';
import { Id } from '@/convex/_generated/dataModel';

export default function ProjectDetailPageRoute() {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Invalid project ID</div>
      </div>
    );
  }

  return <ProjectDetailPage projectId={projectId} />;
} 