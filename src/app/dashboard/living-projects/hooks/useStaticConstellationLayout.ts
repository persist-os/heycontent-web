import { useMemo } from 'react'
import { calculateCanvasBounds } from '@/convex/positioningUtils'

interface Project {
  _id: string
  name: string
  description?: string
  position_x: number
  position_y: number
  space_radius: number
  createdAt: number
  updatedAt: number
}

interface ProjectPosition {
  id: string
  x: number
  y: number
  size: 'small' | 'medium' | 'large'
  importance: number
  space_radius: number
}

interface StaticLayoutResult {
  positions: ProjectPosition[]
  connections: Array<{ from: string; to: string; strength: number }>
  canvasWidth: number
  canvasHeight: number
}

/**
 * Static constellation layout hook - uses stored positions instead of calculating them
 */
export function useStaticConstellationLayout(projects: Project[]): StaticLayoutResult {
  return useMemo(() => {
    // Projects use their stored positions - no calculation needed
    const projectPositions: ProjectPosition[] = projects.map(project => {
      // Calculate importance based on various factors
      const isRecent = Date.now() - project.updatedAt < 24 * 60 * 60 * 1000 // Active if updated in last 24h
      const ageFactor = Math.max(0.3, 1 - (Date.now() - project.createdAt) / (30 * 24 * 60 * 60 * 1000)) // Decay over 30 days
      
      let importance = 0.5 // Base importance
      if (isRecent) importance += 0.3
      importance *= ageFactor
      importance = Math.min(importance, 1)

      // Determine size based on space radius
      let size: 'small' | 'medium' | 'large' = 'medium'
      if (project.space_radius > 160) size = 'large'
      else if (project.space_radius < 140) size = 'small'

      return {
        id: project._id,
        x: project.position_x,
        y: project.position_y,
        size,
        importance,
        space_radius: project.space_radius,
      }
    })

    // Calculate canvas bounds to fit all projects
    const bounds = calculateCanvasBounds(projectPositions.map(pos => ({
      id: pos.id,
      x: pos.x,
      y: pos.y,
      space_radius: pos.space_radius,
    })))
    
    return {
      positions: projectPositions,
      connections: [], // We'll remove project-to-project connections in this phase
      canvasWidth: bounds.width,
      canvasHeight: bounds.height,
    }
  }, [projects])
}
