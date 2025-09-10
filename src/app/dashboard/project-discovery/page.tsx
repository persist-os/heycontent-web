'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import ProjectDiscoveryChat from '../chat/components/ProjectDiscoveryChat'
import { CentralizedHeader } from '@/components/ui/centralized-header'

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
      <div className="h-full bg-background flex flex-col">
        <CentralizedHeader
          title="Preparing"
          subtitle="your space"
          showBackButton={true}
          backButtonContext="Cancel"
          onBack={() => router.push('/dashboard/living-projects')}
          breadcrumbs={[
            { label: 'Projects', href: '/dashboard/living-projects' },
            { label: 'Discovery', href: '#' }
          ]}
          variant="minimal"
          className="border-b border-border/20"
        />
        
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="max-w-md space-y-8">
            {/* Asymmetric gradient line */}
            <div className="h-px bg-gradient-to-r from-blue-400/60 via-transparent to-transparent w-2/3" />
            
            <div className="space-y-6">
              <div className="ml-1 space-y-3">
                <p className="text-muted-foreground/80 leading-relaxed">
                  Setting up your project discovery environment...
                </p>
                
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-blue-400/60 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground/70">
                    Initializing conversation space
                  </span>
                </div>
              </div>
            </div>
            
            {/* Subtle bottom accent */}
            <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-background flex flex-col">
      <CentralizedHeader
        title="Discovery"
        subtitle="conversation"
        showBackButton={true}
        backButtonContext="Back to projects"
        onBack={() => router.push('/dashboard/living-projects')}
        breadcrumbs={[
          { label: 'Projects', href: '/dashboard/living-projects' },
          { label: 'Discovery', href: '#' }
        ]}
        variant="minimal"
        className="border-b border-border/20"
      />
      
      <div className="flex-1 overflow-hidden">
        <ProjectDiscoveryChat
          projectId={currentProjectId || undefined}
          fingerprintId={fingerprintId || undefined}
        />
      </div>
    </div>
  )
}

export default ProjectDiscoveryPage
