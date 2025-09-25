/**
 * Project Discovery Main Page
 * 
 * Main entry point for the project discovery feature. Handles project
 * creation from URL parameters and renders the modular project
 * discovery container component.
 * 
 * Used by: Next.js routing, project discovery navigation
 */
'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import ProjectDiscoveryContainer from './components/ProjectDiscoveryContainer'
import { CentralizedHeader } from '@/components/ui/centralized-header'
import { useContentContextActions } from '@/store/content-context-store'

/**
 * Renders the Project Discovery experience and creates a project when requested via URL.
 */
const ProjectDiscoveryPage: React.FC = () => {
  const params = useSearchParams(); const router = useRouter(); const { firebaseUser } = useAuth();
  const { clearContentContext } = useContentContextActions(); const creatingRef = useRef(false)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const createProject = useMutation(api.projectsMutations.createProject)
  const mode = params.get('mode'); const name = params.get('name'); const description = params.get('description')
  const projectId = params.get('projectId'); const fingerprintId = params.get('fingerprintId')

  useEffect(() => { clearContentContext() }, [clearContentContext])
  useEffect(() => {
    if (mode === 'create' && name && firebaseUser?.uid && !currentProjectId && !creatingRef.current) {
      creatingRef.current = true
      createProject({ userId: firebaseUser.uid, name, description: description || undefined })
        .then(id => { setCurrentProjectId(id); const next = new URLSearchParams(); next.set('projectId', id); if (fingerprintId) next.set('fingerprintId', fingerprintId); router.replace(`/dashboard/project-discovery?${next}`) })
        .catch(() => router.push('/dashboard/living-projects'))
        .finally(() => { creatingRef.current = false })
    } else if (projectId) setCurrentProjectId(projectId)
  }, [mode, name, description, firebaseUser?.uid, projectId, fingerprintId, router, currentProjectId, createProject])

  if (mode === 'create' && !currentProjectId) return (
    <div className="h-full bg-background flex flex-col">
      <CentralizedHeader title="Preparing" subtitle="your space" showBackButton backButtonContext="Cancel" onBack={() => router.push('/dashboard/living-projects')} breadcrumbs={[{ label: 'Projects', href: '/dashboard/living-projects' }, { label: 'Discovery', href: '#' }]} variant="minimal" className="border-b border-border/20" />
      <div className="flex-1 flex items-center justify-center px-8"><div className="max-w-md space-y-6 text-muted-foreground/80">Setting up your project discovery...</div></div>
    </div>
  )

  return (
    <div className="h-full bg-background flex flex-col">
      <CentralizedHeader title="Discovery" subtitle="conversation" showBackButton backButtonContext="Back to projects" onBack={() => router.push('/dashboard/living-projects')} breadcrumbs={[{ label: 'Projects', href: '/dashboard/living-projects' }, { label: 'Discovery', href: '#' }]} variant="minimal" className="border-b border-border/20" />
      <div className="flex-1 overflow-hidden"><ProjectDiscoveryContainer projectId={currentProjectId || undefined} fingerprintId={fingerprintId || undefined} /></div>
    </div>
  )
}

export default ProjectDiscoveryPage
