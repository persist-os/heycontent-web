'use client'

import React from 'react'
import { ProjectViewScreen } from './components/ProjectViewScreen'

interface ProjectPageProps {
  params: Promise<{
    projectId: string
  }>
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = React.use(params)
  return <ProjectViewScreen projectId={projectId} />
}
