'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Id } from '@/convex/_generated/dataModel'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import FingerprintDiscoveryComposition from './FingerprintDiscoveryComposition'

export default function ProjectDiscoveryPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const createProject = useMutation(api.projectsMutations.createProject)
  
  const [projectId, setProjectId] = useState<Id<"projects"> | undefined>()
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mode = searchParams.get('mode')
  const existingProjectId = searchParams.get('projectId') as Id<"projects"> | null

  useEffect(() => {
    // If we already have a projectId, use it
    if (existingProjectId) {
      setProjectId(existingProjectId)
      return
    }

    // If mode is 'create', create the project first
    if (mode === 'create' && !isCreating && !projectId) {
      const name = searchParams.get('name')
      const description = searchParams.get('description')
      
      // Parse content IDs from URL parameters
      const noteIds = searchParams.get('noteIds')?.split(',').filter(id => id.trim()) || []
      const conversationIds = searchParams.get('conversationIds')?.split(',').filter(id => id.trim()) || []
      const crystalIds = searchParams.get('crystalIds')?.split(',').filter(id => id.trim()) || []
      const shardIds = searchParams.get('shardIds')?.split(',').filter(id => id.trim()) || []

      if (!name) {
        setError('Project name is required')
        return
      }

      setIsCreating(true)
      
      getCurrentUserId()
        .then(userId => {
          if (!userId) throw new Error('User not authenticated')
          return createProject({ 
            userId, 
            name, 
            description: description || undefined,
            noteIds: noteIds.length > 0 ? noteIds : undefined,
            conversationIds: conversationIds.length > 0 ? conversationIds : undefined,
            crystalIds: crystalIds.length > 0 ? crystalIds : undefined,
            shardIds: shardIds.length > 0 ? shardIds : undefined
          })
        })
        .then(newProjectId => {
          setProjectId(newProjectId)
          // Update URL to reflect the created project
          router.replace(`/dashboard/living-projects/project-discovery?projectId=${newProjectId}`)
        })
        .catch(err => {
          console.error('Failed to create project:', err)
          setError('Failed to create project')
        })
        .finally(() => {
          setIsCreating(false)
        })
    }
  }, [mode, existingProjectId, searchParams, createProject, router, isCreating, projectId])

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-sm text-destructive mb-2">{error}</div>
          <button 
            onClick={() => router.push('/dashboard/living-projects')}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Return to projects
          </button>
        </div>
      </div>
    )
  }

  if (isCreating || !projectId) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-sm text-muted-foreground">
            {isCreating ? 'Creating your project...' : 'Loading...'}
          </div>
        </div>
      </div>
    )
  }

  return <FingerprintDiscoveryComposition projectId={projectId} />
}