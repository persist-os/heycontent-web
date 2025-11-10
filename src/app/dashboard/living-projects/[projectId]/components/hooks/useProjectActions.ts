/**
 * PROJECT ACTIONS HOOK
 * 
 * Centralized project-level actions like navigation and deletion
 * to keep the main component clean.
 */

import { useRouter } from 'next/navigation'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { getCurrentUserId } from '@/app/lib/api-helpers'

export function useProjectActions(projectId: string) {
  const router = useRouter()
  const deleteProject = useMutation(api.projectsMutations.deleteProject)

  const navigateToChat = () => {
    router.push(`/dashboard/thinking_lab?projectId=${projectId}`)
  }

  const navigateToNotes = () => {
    router.push(`/dashboard/notes?projectId=${projectId}`)
  }

  const editFingerprint = () => {
    // Navigate to thinking lab for project editing
    router.push(`/dashboard/thinking_lab?projectId=${projectId}`)
  }

  const goBack = () => {
    router.push('/dashboard/living-projects')
  }

  const deleteProjectAction = async () => {
    const userId = await getCurrentUserId()
    await deleteProject({ 
      projectId: projectId as any, 
      userId 
    })
    router.push('/dashboard/living-projects')
  }

  return {
    navigateToChat,
    navigateToNotes,
    editFingerprint,
    goBack,
    deleteProjectAction
  }
}
