import { useMemo } from 'react'

interface Project {
  _id: string
  name: string
  description?: string
  fingerprintId?: string
  createdAt: number
  updatedAt: number
  // Static positioning fields
  position_x: number
  position_y: number
  space_radius: number
  // New grid fields
  grid_x?: number
  grid_y?: number
  grid_width?: number
  grid_height?: number
}

interface ProjectPosition {
  id: string
  x: number
  y: number
  size: 'small' | 'medium' | 'large'
  importance: number
  space_radius: number
  // Grid positioning
  grid_x: number
  grid_y: number
  grid_width: number
  grid_height: number
}

interface GridLayoutResult {
  positions: ProjectPosition[]
  connections: any[]
  canvasWidth: number
  canvasHeight: number
}

// Grid constants
const GRID_CELL_WIDTH = 1600 // 1200px wide grid cells
const GRID_CELL_HEIGHT = 850 // 800px high grid cells
const GRID_SPACING = 50 // 50px spacing between grid cells
const CANVAS_WIDTH = 2400
const CANVAS_HEIGHT = 1600
const GRID_ORIGIN_X = CANVAS_WIDTH / 2
const GRID_ORIGIN_Y = CANVAS_HEIGHT / 2

/**
 * Grid-based constellation layout hook - uses rectangular grid cells instead of circular spaces
 */
export function useGridProjectLayout(projects: Project[]): GridLayoutResult {
  return useMemo(() => {
    // Convert projects to grid positions
    const projectPositions: ProjectPosition[] = projects.map(project => {
      // Calculate importance based on various factors
      const isRecent = Date.now() - project.updatedAt < 24 * 60 * 60 * 1000 // Active if updated in last 24h
      const ageFactor = Math.max(0.3, 1 - (Date.now() - project.createdAt) / (30 * 24 * 60 * 60 * 1000)) // Decay over 30 days
      
      let importance = 0.5 // Base importance
      if (isRecent) importance += 0.3
      importance *= ageFactor
      importance = Math.min(importance, 1)

      // Determine size based on space radius (for backward compatibility)
      let size: 'small' | 'medium' | 'large' = 'medium'
      if (project.space_radius > 160) size = 'large'
      else if (project.space_radius < 140) size = 'small'

      // Use existing grid coordinates or calculate from position_x/position_y
      let grid_x: number, grid_y: number
      if (project.grid_x !== undefined && project.grid_y !== undefined) {
        // Use existing grid coordinates
        grid_x = project.grid_x
        grid_y = project.grid_y
      } else {
        // Convert from circular position to grid position
        grid_x = Math.round((project.position_x - GRID_ORIGIN_X) / (GRID_CELL_WIDTH + GRID_SPACING))
        grid_y = Math.round((project.position_y - GRID_ORIGIN_Y) / (GRID_CELL_HEIGHT + GRID_SPACING))
      }

      // Calculate actual pixel position from grid coordinates
      const x = GRID_ORIGIN_X + grid_x * (GRID_CELL_WIDTH + GRID_SPACING)
      const y = GRID_ORIGIN_Y + grid_y * (GRID_CELL_HEIGHT + GRID_SPACING)

      return {
        id: project._id,
        x,
        y,
        size,
        importance,
        space_radius: project.space_radius,
        grid_x,
        grid_y,
        grid_width: GRID_CELL_WIDTH,
        grid_height: GRID_CELL_HEIGHT,
      }
    })

    // Calculate canvas bounds to fit all projects
    const bounds = calculateGridCanvasBounds(projectPositions)
    
    return {
      positions: projectPositions,
      connections: [], // No project-to-project connections in grid layout
      canvasWidth: bounds.width,
      canvasHeight: bounds.height,
    }
  }, [projects])
}

/**
 * Calculate canvas bounds for grid-based layout
 */
function calculateGridCanvasBounds(projects: ProjectPosition[]): {
  width: number
  height: number
  minX: number
  minY: number
  maxX: number
  maxY: number
} {
  if (projects.length === 0) {
    return {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      minX: 0,
      minY: 0,
      maxX: CANVAS_WIDTH,
      maxY: CANVAS_HEIGHT,
    }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  projects.forEach(project => {
    const halfWidth = project.grid_width / 2
    const halfHeight = project.grid_height / 2
    minX = Math.min(minX, project.x - halfWidth)
    minY = Math.min(minY, project.y - halfHeight)
    maxX = Math.max(maxX, project.x + halfWidth)
    maxY = Math.max(maxY, project.y + halfHeight)
  })

  // Add padding
  const padding = 200
  minX -= padding
  minY -= padding
  maxX += padding
  maxY += padding

  // Ensure minimum canvas size
  const width = Math.max(CANVAS_WIDTH, maxX - minX)
  const height = Math.max(CANVAS_HEIGHT, maxY - minY)

  return {
    width,
    height,
    minX,
    minY,
    maxX,
    maxY,
  }
}

/**
 * Generate next available grid position for new projects
 */
export function generateNextGridPosition(existingProjects: Project[]): { grid_x: number, grid_y: number } {
  const usedPositions = new Set<string>()
  
  // Mark existing positions as used
  existingProjects.forEach(project => {
    if (project.grid_x !== undefined && project.grid_y !== undefined) {
      usedPositions.add(`${project.grid_x},${project.grid_y}`)
    }
  })

  // Spiral pattern from center (0,0)
  const maxAttempts = 100
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const position = generateSpiralGridPosition(attempt)
    const key = `${position.grid_x},${position.grid_y}`
    
    if (!usedPositions.has(key)) {
      return position
    }
  }
  
  // Fallback: random position
  return {
    grid_x: Math.floor(Math.random() * 10) - 5,
    grid_y: Math.floor(Math.random() * 10) - 5,
  }
}

/** Find nearest free grid cell to a target (gx, gy) */
export function findNearestFreeGridCell(
  existing: Project[],
  target: { grid_x: number; grid_y: number }
): { grid_x: number; grid_y: number } {
  const used = new Set<string>()
  existing.forEach(p => {
    if (p.grid_x !== undefined && p.grid_y !== undefined) used.add(`${p.grid_x},${p.grid_y}`)
  })
  if (!used.has(`${target.grid_x},${target.grid_y}`)) return target
  // Expand spiral until a free cell is found
  const maxR = 50
  for (let r = 1; r <= maxR; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue // only ring
        const gx = target.grid_x + dx
        const gy = target.grid_y + dy
        const key = `${gx},${gy}`
        if (!used.has(key)) return { grid_x: gx, grid_y: gy }
      }
    }
  }
  return target
}

/**
 * Generate position using spiral pattern from center
 */
function generateSpiralGridPosition(attempt: number): { grid_x: number, grid_y: number } {
  if (attempt === 0) return { grid_x: 0, grid_y: 0 }
  
  const ring = Math.ceil(Math.sqrt(attempt))
  const positionInRing = attempt - (ring - 1) * (ring - 1)
  const maxPositionsInRing = ring * 4 - 4 // Square pattern: 4, 8, 12, 16...
  
  if (positionInRing < ring) {
    // Top edge
    return { grid_x: positionInRing - ring + 1, grid_y: -ring }
  } else if (positionInRing < ring * 2) {
    // Right edge
    return { grid_x: ring, grid_y: positionInRing - ring * 2 + ring + 1 }
  } else if (positionInRing < ring * 3) {
    // Bottom edge
    return { grid_x: ring - (positionInRing - ring * 2), grid_y: ring }
  } else {
    // Left edge
    return { grid_x: -ring, grid_y: ring - (positionInRing - ring * 3) }
  }
}

/**
 * Check if two grid positions overlap
 */
export function doGridPositionsOverlap(
  grid1: { grid_x: number, grid_y: number },
  grid2: { grid_x: number, grid_y: number }
): boolean {
  // Since all grid cells are the same size, we just need to check if they're the same position
  return grid1.grid_x === grid2.grid_x && grid1.grid_y === grid2.grid_y
}
