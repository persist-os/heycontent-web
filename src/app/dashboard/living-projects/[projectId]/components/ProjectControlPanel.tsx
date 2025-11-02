'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Play, Pause, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { StartProjectModal } from './StartProjectModal'

interface ProjectControlPanelProps {
  projectId: string
  userId: string
}

/**
 * Project-level execution control panel.
 * 
 * Displays:
 * - Current project status (idle, running, needs_review, complete)
 * - Active/completed family counts
 * - Primary action button (Start Project / Pause / Review Results)
 * 
 * CRITICAL:
 * - Uses direct Convex queries (NO polling)
 * - Replaces individual widget "Run" buttons
 * - One-click project kickoff
 */
export function ProjectControlPanel({
  projectId,
  userId
}: ProjectControlPanelProps) {
  const router = useRouter()
  const [showStartModal, setShowStartModal] = useState(false)
  
  // Direct Convex query for project data
  const project = useQuery(api.projectsQueries.getById, {
    projectId: projectId as any,
    userId
  })
  
  // Direct Convex query for widgets (families)
  const widgets = useQuery(api.widgetsQueries.getProjectWidgets, {
    projectId: projectId as any,
    userId
  })
  
  // Direct Convex query for pending questions
  const pendingQuestions = useQuery(api.widgetQuestionsQueries.getPendingQuestions, {
    projectId: projectId as any
  })
  
  // Derive status from project data
  const projectStatus = project?.status || 'idle'
  const familyCount = widgets?.length || 0
  const completedFamilies = widgets?.filter(w => w.lastRunStatus === 'complete').length || 0
  const activeFamilies = widgets?.filter(w => w.lastRunStatus === 'running').length || 0
  const waitingFamilies = pendingQuestions?.length || 0
  
  const handleStartProject = useCallback(async () => {
    setShowStartModal(true)
  }, [])
  
  const handleConfirmStart = useCallback(async () => {
    try {
      // Call backend to start project execution
      const response = await fetch(`/api/projects/${projectId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to start project')
      }
      
      toast.success('Project started! Families are working in the background.')
      setShowStartModal(false)
    } catch (error) {
      console.error('Failed to start project:', error)
      toast.error('Failed to start project. Please try again.')
    }
  }, [projectId])
  
  const handlePauseProject = useCallback(async () => {
    try {
      await fetch(`/api/projects/${projectId}/pause`, { method: 'POST' })
      toast.info('Project paused. Families will stop after current tasks.')
    } catch (error) {
      console.error('Failed to pause project:', error)
      toast.error('Failed to pause project.')
    }
  }, [projectId])
  
  const handleReviewResults = useCallback(() => {
    // Open unified gallery filtered to completed artifacts
    router.push(`/dashboard/living-projects/${projectId}/gallery?type=artifacts&filter=completed`)
  }, [projectId, router])
  
  // Loading state
  if (!project || !widgets) {
    return (
      <div className="bg-card/80 backdrop-blur-lg border border-border/40 rounded-xl p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted/30 rounded w-24" />
          <div className="h-8 bg-muted/30 rounded w-32" />
        </div>
      </div>
    )
  }
  
  return (
    <>
      <div className="bg-card/80 backdrop-blur-lg border border-border/40 rounded-xl p-4 space-y-3">
        {/* IDLE STATE */}
        {projectStatus === 'idle' && (
          <>
            <div className="text-sm text-muted-foreground">
              Project Ready
            </div>
            <Button
              onClick={handleStartProject}
              className="w-full"
              size="lg"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Project
            </Button>
            <div className="text-xs text-muted-foreground">
              {familyCount} families ready
            </div>
          </>
        )}
        
        {/* RUNNING STATE */}
        {projectStatus === 'running' && (
          <>
            <div className="text-sm text-foreground font-medium">
              Project Running
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Active:</span>
                <span className="text-foreground font-medium">{activeFamilies}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Complete:</span>
                <span className="text-foreground font-medium">{completedFamilies}</span>
              </div>
              {waitingFamilies > 0 && (
                <div className="flex items-center justify-between text-yellow-400">
                  <span>Questions:</span>
                  <span className="font-medium">{waitingFamilies}</span>
                </div>
              )}
            </div>
            <Button
              onClick={handlePauseProject}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause All
            </Button>
          </>
        )}
        
        {/* NEEDS REVIEW STATE */}
        {projectStatus === 'needs_review' && (
          <>
            <div className="text-sm text-primary font-medium">
              ✅ Ready for Review
            </div>
            <div className="text-xs text-muted-foreground">
              {completedFamilies} families completed
            </div>
            <Button
              onClick={handleReviewResults}
              className="w-full"
              size="lg"
            >
              <Eye className="w-4 h-4 mr-2" />
              Review Results
            </Button>
          </>
        )}
        
        {/* COMPLETE STATE */}
        {projectStatus === 'complete' && (
          <>
            <div className="text-sm text-primary font-medium">
              ✅ Project Complete
            </div>
            <div className="text-xs text-muted-foreground">
              All families finished
            </div>
            <Button
              onClick={handleReviewResults}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Results
            </Button>
          </>
        )}
        
        {/* PAUSED STATE */}
        {projectStatus === 'paused' && (
          <>
            <div className="text-sm text-muted-foreground font-medium">
              ⏸️ Project Paused
            </div>
            <Button
              onClick={handleStartProject}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              <Play className="w-4 h-4 mr-2" />
              Resume
            </Button>
          </>
        )}
      </div>
      
      {/* Start Project Confirmation Modal */}
      <StartProjectModal
        open={showStartModal}
        onClose={() => setShowStartModal(false)}
        onConfirm={handleConfirmStart}
        familyCount={familyCount}
        artifactCount={0}  // TODO: Get from artifact shells query
        estimatedMinutes={25}  // TODO: Calculate from families
        budgetTotal={project?.dailyLlmBudget || 50}
      />
    </>
  )
}

