import { useMemo } from 'react'

export interface ProjectState {
  isNew: boolean          // Created within last 24h
  isActive: boolean       // Modified within last week  
  isComplete: boolean     // User-defined completion status
  activityLevel: number   // 0-1 based on recent widget changes
}

interface Project {
  _id: string
  name: string
  createdAt: number
  updatedAt: number
  fingerprintId?: string
}

export function useProjectStates(projects: Project[]): Map<string, ProjectState> {
  return useMemo(() => {
    const now = Date.now()
    const oneDayAgo = now - 24 * 60 * 60 * 1000
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000
    
    const stateMap = new Map<string, ProjectState>()
    
    projects.forEach(project => {
      const isNew = project.createdAt > oneDayAgo
      const isActive = project.updatedAt > oneWeekAgo
      
      // Calculate activity level based on recency of updates
      const timeSinceUpdate = now - project.updatedAt
      const activityLevel = Math.max(0, 1 - (timeSinceUpdate / (30 * 24 * 60 * 60 * 1000))) // 30 days max
      
      // For now, consider projects with fingerprintId as "complete" (active projects)
      // This could be enhanced with actual completion status from database
      const isComplete = !!project.fingerprintId && !isActive
      
      stateMap.set(project._id, {
        isNew,
        isActive,
        isComplete,
        activityLevel
      })
    })
    
    return stateMap
  }, [projects])
}

// Visual styling helpers for project states
export function getProjectStateStyles(state: ProjectState) {
  if (state.isNew) {
    return {
      glow: 'shadow-blue-400/60',
      boundaryColor: 'hsl(var(--primary))',
      boundaryOpacity: 0.8,
      starColor: 'hsl(var(--primary))',
      starOpacity: 0.9
    }
  }
  
  if (state.isActive) {
    return {
      glow: 'shadow-orange-400/40',
      boundaryColor: 'hsl(var(--primary))',
      boundaryOpacity: 0.7,
      starColor: 'hsl(var(--primary))',
      starOpacity: 0.8
    }
  }
  
  if (state.isComplete) {
    return {
      glow: 'shadow-green-400/20',
      boundaryColor: 'hsl(var(--muted-foreground))',
      boundaryOpacity: 0.5,
      starColor: 'hsl(var(--muted-foreground))',
      starOpacity: 0.6
    }
  }
  
  // Default state
  return {
    glow: 'shadow-muted/20',
    boundaryColor: 'hsl(var(--muted-foreground))',
    boundaryOpacity: 0.4,
    starColor: 'hsl(var(--muted-foreground))',
    starOpacity: 0.5
  }
}
