'use client'

import React from 'react'
import { ProjectViewScreen } from './components/ProjectViewScreen'

interface ProjectPageProps {
  params: {
    projectId: string
  }
}

export default function ProjectPage({ params }: ProjectPageProps) {
  return <ProjectViewScreen projectId={params.projectId} />
}
