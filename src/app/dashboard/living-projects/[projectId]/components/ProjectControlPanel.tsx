'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Play, Eye, Zap, Activity, CheckCircle2, Moon } from 'lucide-react'
import { toast } from 'sonner'


interface ProjectControlPanelProps {
  projectId: Id<"projects">
  userId: string
}

/**
 * Living Projects Control Panel
 * 
 * Shows real-time project status with Living Projects states:
 * - fresh: Just created, waiting for discovery
 * - working: AI actively executing widgets
 * - sleeping: Budget exceeded, needs wake up
 * - stable: All work complete, monitoring
 * - archived: User archived
 * 
 * Displays:
 * - Current state with clear explanation
 * - Budget usage (LLM calls today / daily limit)
 * - Widget status (pending/executing/completed)
 * - Decision engine activity
 * - Actionable buttons based on state
 */
export function ProjectControlPanel({
  projectId,
  userId
}: ProjectControlPanelProps) {
  const router = useRouter()
  
  // Direct Convex query for project data
  const project = useQuery(api.projectsQueries.getById, {
    projectId: projectId,
    userId
  })
  
  // Direct Convex query for widgets (families)
  const widgets = useQuery(api.widgetsQueries.getProjectWidgets, {
    projectId: projectId,
    userId
  })
  
  // Living Projects states: fresh, working, sleeping, stable, archived
  const projectStatus = project?.status || 'fresh'
  const budgetUsed = project?.llmCallsToday || 0
  const budgetLimit = project?.dailyLlmBudget || 50
  const budgetPercent = Math.round((budgetUsed / budgetLimit) * 100)
  
  const familyCount = widgets?.length || 0
  const pendingWidgets = widgets?.filter(w => w.status === 'pending' || w.status === 'ready').length || 0
  const runningWidgets = widgets?.filter(w => w.status === 'working').length || 0
  const completedWidgets = widgets?.filter(w => w.status === 'completed').length || 0
  
  const handleWakeProject = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/wake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to wake project')
      }
      
      toast.success('Project woken! Decision engine activated.')
    } catch (error) {
      console.error('Failed to wake project:', error)
      toast.error('Failed to wake project. Please try again.')
    }
  }, [projectId])
  
  const handleViewResults = useCallback(() => {
    router.push(`/dashboard/living-projects/${projectId}`)
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
    <div className="bg-card/80 backdrop-blur-lg border border-border/40 rounded-xl p-4 space-y-4">
      {/* Status Header with Icon */}
      <div className="flex items-center gap-3">
        {projectStatus === 'working' && (
          <>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <div>
              <div className="text-sm font-medium text-foreground">Working</div>
              <div className="text-xs text-muted-foreground">AI is actively executing</div>
            </div>
          </>
        )}
        {projectStatus === 'sleeping' && (
          <>
            <Moon className="w-4 h-4 text-blue-400 animate-bounce" />
            <div>
              <div className="text-sm font-medium text-foreground">Sleeping</div>
              <div className="text-xs text-muted-foreground">Budget exceeded - wake to resume</div>
            </div>
          </>
        )}
        {projectStatus === 'stable' && (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <div>
              <div className="text-sm font-medium text-foreground">Stable</div>
              <div className="text-xs text-muted-foreground">All work complete, monitoring</div>
            </div>
          </>
        )}
        {projectStatus === 'fresh' && (
          <>
            <Activity className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium text-foreground">Fresh</div>
              <div className="text-xs text-muted-foreground">Just created, waiting for setup</div>
            </div>
          </>
        )}
      </div>

      {/* Budget Display */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-yellow-500" />
            <span className="text-muted-foreground">AI Budget Today</span>
          </div>
          <span className={`font-medium ${budgetPercent >= 90 ? 'text-red-500' : budgetPercent >= 70 ? 'text-yellow-500' : 'text-foreground'}`}>
            {budgetUsed} / {budgetLimit}
          </span>
        </div>
        <div className="w-full bg-muted/30 rounded-full h-1.5 overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              budgetPercent >= 90 ? 'bg-red-500' : 
              budgetPercent >= 70 ? 'bg-yellow-500' : 
              'bg-green-500'
            }`}
            style={{ width: `${Math.min(budgetPercent, 100)}%` }}
          />
        </div>
        {budgetPercent >= 100 && (
          <div className="text-xs text-red-500 flex items-center gap-1">
            Budget exceeded - project sleeping
          </div>
        )}
      </div>

      {/* Widget Status */}
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Pending Widgets:</span>
          <span className="font-medium text-foreground">{pendingWidgets}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Executing:</span>
          <span className="font-medium text-blue-400">{runningWidgets}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Completed:</span>
          <span className="font-medium text-green-500">{completedWidgets}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t border-border/40 space-y-2">
        {projectStatus === 'sleeping' && (
          <>
            <Button
              onClick={handleWakeProject}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              size="lg"
            >
              <Play className="w-4 h-4 mr-2" />
              Wake Project
            </Button>
            <div className="text-xs text-center text-muted-foreground">
              Resets budget and triggers decision engine
            </div>
          </>
        )}
        {projectStatus === 'stable' && (
          <>
            <Button
              onClick={handleViewResults}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Project
            </Button>
            <div className="text-xs text-center text-muted-foreground">
              Project is stable - decision engine monitoring
            </div>
          </>
        )}
        {projectStatus === 'working' && (
          <>
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground">Decision engine active</span>
            </div>
          </>
        )}
        {projectStatus === 'fresh' && (
          <div className="text-xs text-center text-muted-foreground py-2">
            Complete project discovery to activate
          </div>
        )}
      </div>
    </div>
  )
}

