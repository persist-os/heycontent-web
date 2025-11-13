'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { FullThinkingLab } from '@/app/dashboard/thinking_lab/compositions/LabCompositions'

interface PublicSharePageProps {
  params: Promise<{
    token: string
  }>
}

export default function PublicSharePage({ params }: PublicSharePageProps) {
  const router = useRouter()
  const { token } = React.use(params)
  const [userId, setUserId] = useState<string | null>(null)
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false)
  
  // Query project by public token (no auth required)
  const project = useQuery(
    api.projectsQueries.getProjectByPublicToken,
    token ? { token } : 'skip'
  )

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const id = await getCurrentUserId()
        setUserId(id)
      } catch (error) {
        // User not logged in - that's fine
        setUserId(null)
      }
    }
    checkAuth()
  }, [])

  // Auto-add logged-in user as collaborator
  const addCollaboratorViaPublicLink = useMutation(api.projectsMutations.addCollaboratorViaPublicLink)
  
  useEffect(() => {
    if (userId && project?._id && !isAddingCollaborator) {
      setIsAddingCollaborator(true)
      addCollaboratorViaPublicLink({
        projectId: project._id as any,
        userId,
      }).catch((error) => {
        console.error('Error adding collaborator:', error)
        setIsAddingCollaborator(false)
      })
    }
  }, [userId, project?._id, isAddingCollaborator, addCollaboratorViaPublicLink])

  const handleSignUp = () => {
    // Store token in localStorage for redirect after signup
    if (typeof window !== 'undefined') {
      localStorage.setItem('pendingShareToken', token)
    }
    // Redirect to signup with return URL
    router.push(`/auth/register?returnTo=/share/${token}`)
  }

  // Loading state
  if (project === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Project not found or invalid token
  if (project === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <h1 className="text-2xl font-semibold mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This project link is invalid or has been revoked.
          </p>
          <Button onClick={() => router.push('/')}>Go to Homepage</Button>
        </Card>
      </div>
    )
  }

  // Check user permission for project (to determine if viewer)
  const userPermission = useQuery(
    api.contentAccessHelpers.getUserContentPermission,
    project?._id && userId ? {
      userId,
      contentType: 'project',
      contentId: project._id,
    } : 'skip'
  ) as 'owner' | 'edit' | 'read' | null
  
  // Determine if user is viewer (read-only) or unauthenticated
  const isViewOnly = !userId || userPermission === 'read' || userPermission === null
  
  // Always show thinking lab (chat interface) for public share
  return (
    <div className="min-h-screen bg-background">
      {/* Show thinking lab with project context */}
      {project._id && (
        <FullThinkingLab projectId={project._id} isViewOnly={isViewOnly} />
      )}
    </div>
  )
}

