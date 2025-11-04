'use client'

/**
 * Quick Actions Component
 * 
 * Manual controls using EXISTING endpoints and mutations.
 * Pattern 5 (wake project) + Pattern 6 (update project) from LOT's audit.
 * 
 * Design: PHASE_2_ADMIN_DASHBOARD_DESIGN_SPEC_2025_11_03.md
 */

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Id } from '@/convex/_generated/dataModel'
import { wakeProject } from '@/app/lib/services/projectService' // LOT confirmed: exists from Phase 1!

interface QuickActionsProps {
  projectId: Id<"projects">
}

export function QuickActions({ projectId }: QuickActionsProps) {
  const [isWaking, setIsWaking] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // LOT's Pattern 6: Use EXISTING Convex mutation
  const updateProject = useMutation(api.projectsMutations.updateProject)

  // LOT's Pattern 5: Wake project (triggers decision engine)
  const handleWake = async () => {
    setIsWaking(true)
    try {
      // Use EXISTING wake endpoint from Phase 1
      await wakeProject(projectId)
      toast.success('Project woken - decision engine triggered! 🌅')
    } catch (error) {
      toast.error(`Failed to wake project: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsWaking(false)
    }
  }

  // LOT's Pattern 6: Reset budget using Convex mutation
  const handleResetBudget = async () => {
    setIsResetting(true)
    try {
      await updateProject({
        projectId,
        llmCallsToday: 0, // Reset counter
        budgetLastReset: Date.now() // Update timestamp
      })
      toast.success('Budget reset to 0 calls')
    } catch (error) {
      toast.error(`Failed to reset budget: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsResetting(false)
    }
  }

  // LOT's Pattern 6: Force status change
  const handleSetStatus = async (status: 'working' | 'sleeping' | 'stable') => {
    setIsUpdating(true)
    try {
      await updateProject({
        projectId,
        status
      })
      toast.success(`Status changed to ${status}`)
    } catch (error) {
      toast.error(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className="bg-card p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">
        Quick Actions
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {/* Wake & Trigger Decision Engine */}
        <Button 
          onClick={handleWake}
          disabled={isWaking}
          variant="default"
          className="w-full"
        >
          {isWaking ? 'Waking...' : '🌅 Wake & Trigger'}
        </Button>

        {/* Reset Budget */}
        <Button
          onClick={handleResetBudget}
          disabled={isResetting}
          variant="outline"
          className="w-full"
        >
          {isResetting ? 'Resetting...' : '🔄 Reset Budget'}
        </Button>

        {/* Force Sleep */}
        <Button
          onClick={() => handleSetStatus('sleeping')}
          disabled={isUpdating}
          variant="outline"
          className="w-full"
        >
          {isUpdating ? 'Updating...' : '💤 Force Sleep'}
        </Button>

        {/* Mark Stable */}
        <Button
          onClick={() => handleSetStatus('stable')}
          disabled={isUpdating}
          variant="outline"
          className="w-full"
        >
          {isUpdating ? 'Updating...' : '✅ Mark Stable'}
        </Button>

        {/* Set Working */}
        <Button
          onClick={() => handleSetStatus('working')}
          disabled={isUpdating}
          variant="outline"
          className="w-full"
        >
          {isUpdating ? 'Updating...' : '🟢 Set Working'}
        </Button>
      </div>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-primary/5 rounded-lg">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Wake & Trigger:</strong> Wakes sleeping project and triggers decision engine
          <br />
          <strong className="text-foreground">Reset Budget:</strong> Resets LLM call counter to 0
          <br />
          <strong className="text-foreground">Force Sleep/Stable/Working:</strong> Manually override project status
        </p>
      </div>
    </Card>
  )
}

