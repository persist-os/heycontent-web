'use client'

import React from 'react'
import { UnifiedConstellationView } from '../components/UnifiedConstellationView'

interface ProjectPageProps {
  params: Promise<{
    projectId: string
  }>
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = React.use(params)

  // Show the unified view with the specific project focused
  return <UnifiedConstellationView initialProjectId={projectId} />
}
