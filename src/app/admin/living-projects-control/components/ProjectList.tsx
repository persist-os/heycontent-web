'use client'

/**
 * Project List Component
 * 
 * Displays all user projects with real-time status indicators.
 * Uses EXISTING Convex query - Pattern 1 from LOT's audit.
 * 
 * Design: PHASE_2_ADMIN_DASHBOARD_DESIGN_SPEC_2025_11_03.md
 */

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { Id } from '@/convex/_generated/dataModel'

interface Project {
  _id: Id<"projects">
  name: string
  description?: string
  status?: 'fresh' | 'working' | 'stable' | 'sleeping' | 'archived'
  totalContent: number
  updatedAt: number
}

interface ProjectListProps {
  projects: Project[]
  selectedProjectId: Id<"projects"> | null
  onSelect: (projectId: Id<"projects">) => void
}

export function ProjectList({ projects, selectedProjectId, onSelect }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No projects found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Create a project to get started
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-2">
        {projects.map(project => (
          <ProjectCard
            key={project._id}
            project={project}
            isSelected={project._id === selectedProjectId}
            onClick={() => onSelect(project._id)}
          />
        ))}
      </div>
    </ScrollArea>
  )
}

interface ProjectCardProps {
  project: Project
  isSelected: boolean
  onClick: () => void
}

function ProjectCard({ project, isSelected, onClick }: ProjectCardProps) {
  const status = project.status || 'fresh'
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 rounded-lg text-left transition-colors',
        'border border-border',
        isSelected 
          ? 'bg-primary/10 border-primary/20' 
          : 'bg-card hover:bg-primary/5'
      )}
    >
      {/* Project Name + Status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-foreground truncate flex-1">
          {project.name}
        </h3>
        <StatusBadge status={status} />
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {project.description}
        </p>
      )}

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{project.totalContent} items</span>
        <span>{formatDistanceToNow(project.updatedAt)}</span>
      </div>
    </button>
  )
}

interface StatusBadgeProps {
  status: 'fresh' | 'working' | 'stable' | 'sleeping' | 'archived'
}

function StatusBadge({ status }: StatusBadgeProps) {
  // Design Spec: Match Phase 1 ThreadCard patterns EXACTLY
  switch (status) {
    case 'working':
      return (
        <Badge className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300">
          🟢 Working
        </Badge>
      )
    case 'sleeping':
      return (
        <Badge className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
          💤 Sleeping
        </Badge>
      )
    case 'stable':
      return (
        <Badge className="bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300">
          ✅ Stable
        </Badge>
      )
    case 'fresh':
      return (
        <Badge className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
          ✨ Fresh
        </Badge>
      )
    case 'archived':
      return (
        <Badge className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400">
          📦 Archived
        </Badge>
      )
  }
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

