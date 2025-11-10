'use client'

/**
 * Status Panel Component
 * 
 * Real-time project status using EXISTING Convex queries.
 * Pattern 2 (project details) + Pattern 3 (widgets) from LOT's audit.
 * 
 * Design: PHASE_2_ADMIN_DASHBOARD_DESIGN_SPEC_2025_11_03.md
 */

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import type { Id } from '@/convex/_generated/dataModel'
import { getCurrentUserIdSync } from '@/app/lib/api-helpers'

interface StatusPanelProps {
  projectId: Id<"projects">
}

export function StatusPanel({ projectId }: StatusPanelProps) {
  const userId = getCurrentUserIdSync()  // ✅ Synchronous - returns string | null immediately

  // LOT's Pattern 2: Get single project with full details
  const project = useQuery(api.projectsQueries.getById, { 
    projectId,
    userId: userId || ''
  })

  // LOT's Pattern 3: Get widgets for this project
  const widgets = useQuery(api.projectWidgetsQueries.getProjectWidgetsByProject, {
    projectId
  })

  if (project === undefined || widgets === undefined) {
    return (
      <Card className="bg-card p-6">
        <Skeleton className="h-48 w-full" />
      </Card>
    )
  }

  if (!project) {
    return (
      <Card className="bg-card p-6">
        <p className="text-muted-foreground">Project not found</p>
      </Card>
    )
  }

  // Calculate metrics from real data
  const budgetUsed = project.llmCallsToday || 0
  const budgetLimit = project.dailyLlmBudget || 100
  const budgetPercent = Math.min((budgetUsed / budgetLimit) * 100, 100)
  
  // ✅ Defensive: Ensure widgets is an array before filtering
  const widgetsArray = Array.isArray(widgets) ? widgets : []
  const activeWidgets = widgetsArray.filter(w => w.status === 'active').length
  const archivedWidgets = widgetsArray.filter(w => w.status === 'archived').length
  const totalWidgets = widgetsArray.length

  return (
    <Card className="bg-card p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">
        Project Status
      </h2>

      <div className="space-y-6">
        {/* Current Status */}
        <StatusSection title="Current State">
          <div className="flex items-center gap-3">
            <StatusIndicator status={project.status || 'fresh'} />
            <div>
              <p className="text-sm font-medium text-foreground">
                {getStatusLabel(project.status || 'fresh')}
              </p>
              <p className="text-xs text-muted-foreground">
                {getStatusDescription(project.status || 'fresh')}
              </p>
            </div>
          </div>
        </StatusSection>

        <Separator />

        {/* Budget Usage */}
        <StatusSection title="Budget Usage">
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-foreground">
                {budgetUsed}/{budgetLimit}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                LLM Calls Today
              </span>
            </div>
            <Progress value={budgetPercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {budgetPercent.toFixed(0)}% of daily budget used
            </p>
          </div>
        </StatusSection>

        <Separator />

        {/* Widget Statistics */}
        <StatusSection title="Widgets">
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              value={totalWidgets}
              label="Total"
              color="text-foreground"
            />
            <StatCard
              value={activeWidgets}
              label="Active"
              color="text-green-600 dark:text-green-400"
            />
            <StatCard
              value={archivedWidgets}
              label="Archived"
              color="text-gray-600 dark:text-gray-400"
            />
          </div>
        </StatusSection>

        <Separator />

        {/* Last Updated */}
        <StatusSection title="Timeline">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated:</span>
              <span className="text-foreground font-medium">
                {formatDistanceToNow(project.updatedAt)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span className="text-foreground font-medium">
                {formatDistanceToNow(project.createdAt)}
              </span>
            </div>
          </div>
        </StatusSection>
      </div>
    </Card>
  )
}

function StatusSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
        {title}
      </h3>
      {children}
    </div>
  )
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${color}`}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {label}
      </div>
    </div>
  )
}

function StatusIndicator({ status }: { status: string }) {
  const colors = {
    working: 'bg-green-500',
    sleeping: 'bg-blue-500',
    stable: 'bg-yellow-500',
    fresh: 'bg-gray-500',
    archived: 'bg-gray-400'
  }
  
  return (
    <div className={`w-3 h-3 rounded-full ${colors[status as keyof typeof colors] || 'bg-gray-500'} animate-pulse`} />
  )
}

function getStatusLabel(status: string): string {
  const labels = {
    working: 'Working',
    sleeping: 'Sleeping',
    stable: 'Stable',
    fresh: 'Fresh',
    archived: 'Archived'
  }
  return labels[status as keyof typeof labels] || status
}

function getStatusDescription(status: string): string {
  const descriptions = {
    working: 'Decision engine is active',
    sleeping: 'Budget exhausted, awaiting wake',
    stable: 'All work complete, monitoring',
    fresh: 'New project, not yet started',
    archived: 'No longer active'
  }
  return descriptions[status as keyof typeof descriptions] || 'Unknown state'
}

function formatDistanceToNow(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

