'use client'

/**
 * Living Projects Admin Control Panel
 * 
 * Real-time visibility and manual control for decision engine testing.
 * Uses existing Convex queries - zero new endpoints needed.
 * 
 * Design Spec: PHASE_2_ADMIN_DASHBOARD_DESIGN_SPEC_2025_11_03.md
 * Blueprint: PHASE_2_TESTING_DASHBOARD_SWARM_2025_11_03.md
 */

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ProjectList, 
  StatusPanel, 
  QuickActions, 
  ActivityStream 
} from './components'
import type { Id } from '@/convex/_generated/dataModel'

export default function LivingProjectsControlPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | null>(null)
  const userId = getCurrentUserId()
  
  // Use EXISTING Convex query - already reactive!
  const projects = useQuery(api.projectsQueries.getByUser, { 
    userId: userId || '',
    limit: 50
  })

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">
          Living Projects Control Panel
        </h1>
        <p className="text-muted-foreground mt-2">
          Real-time visibility and manual control over decision engine
        </p>
      </div>

      {/* Main Layout */}
      <div className="flex gap-6">
        {/* Left Column: Project List (1/3 width) */}
        <div className="w-1/3">
          <Card className="bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Projects
            </h2>
            
            {projects === undefined ? (
              // Loading state
              <div className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <ProjectList
                projects={projects}
                selectedProjectId={selectedProjectId}
                onSelect={setSelectedProjectId}
              />
            )}
          </Card>
        </div>

        {/* Right Column: Details & Controls (2/3 width) */}
        <div className="w-2/3 space-y-4">
          {selectedProjectId ? (
            <>
              {/* Status Panel */}
              <StatusPanel projectId={selectedProjectId} />

              {/* Quick Actions */}
              <QuickActions projectId={selectedProjectId} />

              {/* Activity Stream */}
              <ActivityStream projectId={selectedProjectId} />
            </>
          ) : (
            <Card className="bg-card p-12 text-center">
              <p className="text-muted-foreground">
                Select a project to view details and controls
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

