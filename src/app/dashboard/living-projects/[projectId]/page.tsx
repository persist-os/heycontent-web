'use client'

import React from 'react'
import { ProjectViewScreen } from './components/ProjectViewScreen'

interface ProjectPageProps {
  params: Promise<{
    projectId: string
  }>
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const resolvedParams = React.use(params)
  return <ProjectViewScreen projectId={resolvedParams.projectId} />
}
