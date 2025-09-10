'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import ProjectDiscoveryChat from '../chat/components/ProjectDiscoveryChat'

const ProjectDiscoveryPage: React.FC = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { firebaseUser } = useAuth()
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  
  // Get parameters
  const mode = searchParams.get('mode')
  const projectId = searchParams.get('projectId')
  const fingerprintId = searchParams.get('fingerprintId')
  const name = searchParams.get('name')
  const description = searchParams.get('description')

  // Mutation for creating projects
  const createProjectMutation = useMutation(api.projectsMutations.createProject)

  // Handle project creation when in create mode
  useEffect(() => {
    if (mode === 'create' && name && firebaseUser?.uid && !currentProjectId) {
      const createProject = async () => {
        try {
          const newProjectId = await createProjectMutation({
            userId: firebaseUser.uid,
            name,
            description: description || undefined,
          })
          
          setCurrentProjectId(newProjectId)
          
          // Update URL to reflect the new project
          const newParams = new URLSearchParams()
          newParams.set('projectId', newProjectId)
          if (fingerprintId) newParams.set('fingerprintId', fingerprintId)
          
          router.replace(`/dashboard/project-discovery?${newParams}`)
        } catch (error) {
          console.error('Failed to create project:', error)
          // Redirect back to living projects on error
          router.push('/dashboard/living-projects')
        }
      }
      
      createProject()
    } else if (projectId) {
      setCurrentProjectId(projectId)
    }
  }, [mode, name, description, firebaseUser?.uid, createProjectMutation, currentProjectId, router, projectId, fingerprintId])

  // Show loading state while creating project
  if (mode === 'create' && !currentProjectId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Creating Your Project</h2>
          <p className="text-muted-foreground">Setting up your project discovery session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <ProjectDiscoveryChat
        projectId={currentProjectId || undefined}
        fingerprintId={fingerprintId || undefined}
      />
    </div>
  )
}

export default ProjectDiscoveryPage
