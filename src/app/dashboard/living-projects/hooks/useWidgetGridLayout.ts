import { useMemo } from 'react'
import { WidgetConfig } from '@/types/projectWidgets'

interface WidgetPosition {
  id: string
  x: number
  y: number
  size: 'small' | 'medium' | 'large'
  importance: number
  orbital_angle: number
  orbital_distance: number
}

interface ConnectionEdge {
  fromId: string
  toId: string
  // Curve control offset multiplier, small value like 0.12
  curvature: number
}

interface GridLayoutResult {
  positions: WidgetPosition[]
  edges: ConnectionEdge[]
  spaceRadius: number
}

type LayoutMode = 'grid' | 'constellation'

/**
 * Calculate grid-based positions for widgets with better spacing
 * Uses a hexagonal grid pattern for more natural distribution
 */
export function useWidgetGridLayout(
  projectX: number,
  projectY: number,
  widgets: WidgetConfig[],
  projectWidth: number = 1200,
  projectHeight: number = 800,
  mode: LayoutMode = 'constellation'
): GridLayoutResult {
  return useMemo(() => {
    if (widgets.length === 0) {
      return {
        positions: [],
        edges: [],
        spaceRadius: 200 // Default space radius
      }
    }

    const positions: WidgetPosition[] = []
    const edges: ConnectionEdge[] = []

    const widgetWidth = 140
    const widgetHeight = 70
    const padding = 40
    const spacing = 20
    const collisionPadding = 12

    const minX = projectX - projectWidth / 2 + padding
    const maxX = projectX + projectWidth / 2 - padding
    const minY = projectY - projectHeight / 2 + padding
    const maxY = projectY + projectHeight / 2 - padding

    const snapSize = 24 // invisible grid for snapping

    // Helper to clamp and snap within rect keeping full card inside
    const clampSnap = (cx: number, cy: number) => {
      const halfW = widgetWidth / 2
      const halfH = widgetHeight / 2
      let x = Math.max(minX + halfW, Math.min(maxX - halfW, cx))
      let y = Math.max(minY + halfH, Math.min(maxY - halfH, cy))
      // snap
      x = Math.round((x - minX) / snapSize) * snapSize + minX
      y = Math.round((y - minY) / snapSize) * snapSize + minY
      // re-clamp after snapping
      x = Math.max(minX + halfW, Math.min(maxX - halfW, x))
      y = Math.max(minY + halfH, Math.min(maxY - halfH, y))
      return { x, y }
    }

    // Existing manual positions: use relative offsets when present
    const withManual = widgets.filter(w => w.offset_x !== undefined && w.offset_y !== undefined)
    for (const w of withManual) {
      const cx = minX + (maxX - minX) * (w.offset_x as number)
      const cy = minY + (maxY - minY) * (w.offset_y as number)
      const { x, y } = clampSnap(cx, cy)
      positions.push({
        id: w.widget_id,
        x, y,
        size: w.size === 'xlarge' ? 'large' : w.size as 'small' | 'medium' | 'large',
        importance: w.priority / 10,
        orbital_angle: 0,
        orbital_distance: 0,
      })
    }

    // Remaining widgets: Poisson disk sampling for organic spacing
    const remaining = widgets.filter(w => w.offset_x === undefined || w.offset_y === undefined)
    const minDist = Math.max(widgetWidth, widgetHeight) + spacing + collisionPadding

    const taken: Array<{x:number;y:number}> = positions.map(p => ({ x: p.x, y: p.y }))
    const attemptsPerPoint = 30
    const rnd = (seed => () => (seed = (seed * 9301 + 49297) % 233280) / 233280)(
      Math.abs((projectX + projectY + widgets.length) | 0)
    )

    const randomInRect = () => ({
      x: minX + rnd() * (maxX - minX),
      y: minY + rnd() * (maxY - minY),
    })
    const farEnough = (x: number, y: number) => taken.every(p => {
      const dx = p.x - x, dy = p.y - y
      return Math.hypot(dx, dy) >= minDist
    })

    for (const w of remaining) {
      let placed = false
      for (let a = 0; a < attemptsPerPoint; a++) {
        const r = randomInRect()
        const { x, y } = clampSnap(r.x, r.y)
        if (farEnough(x, y)) {
          positions.push({
            id: w.widget_id,
            x, y,
            size: w.size === 'xlarge' ? 'large' : w.size as 'small' | 'medium' | 'large',
            importance: w.priority / 10,
            orbital_angle: 0,
            orbital_distance: 0,
          })
          taken.push({ x, y })
          placed = true
          break
        }
      }
      if (!placed) {
        // fallback center placement
        const { x, y } = clampSnap(projectX, projectY)
        positions.push({
          id: w.widget_id,
          x, y,
          size: w.size === 'xlarge' ? 'large' : w.size as 'small' | 'medium' | 'large',
          importance: w.priority / 10,
          orbital_angle: 0,
          orbital_distance: 0,
        })
        taken.push({ x, y })
      }
    }

    // Build connections only in constellation mode
    if (mode === 'constellation') {
      // Simple MST (Prim's) on positions
      const n = positions.length
      if (n >= 2) {
        const connected = new Set<number>()
        connected.add(0)
        const edgesLocal: Array<[number, number, number]> = [] // i,j,dist
        while (connected.size < n) {
          let best: [number, number, number] | null = null
          for (const i of connected) {
            for (let j = 0; j < n; j++) if (!connected.has(j)) {
              const dx = positions[i].x - positions[j].x
              const dy = positions[i].y - positions[j].y
              const d = Math.hypot(dx, dy)
              if (!best || d < best[2]) best = [i, j, d]
            }
          }
          if (!best) break
          edgesLocal.push(best)
          connected.add(best[1])
        }
        // Add a couple of extra short edges for richness
        const allPairs: Array<[number, number, number]> = []
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            const dx = positions[i].x - positions[j].x
            const dy = positions[i].y - positions[j].y
            const d = Math.hypot(dx, dy)
            allPairs.push([i, j, d])
          }
        }
        allPairs.sort((a, b) => a[2] - b[2])
        let extras = 0
        for (const e of allPairs) {
          if (extras >= 2) break
          const exists = edgesLocal.some(el => (el[0] === e[0] && el[1] === e[1]) || (el[0] === e[1] && el[1] === e[0]))
          if (!exists) {
            edgesLocal.push(e)
            extras++
          }
        }
        for (const [i, j] of edgesLocal) {
          edges.push({ fromId: positions[i].id, toId: positions[j].id, curvature: 0.12 })
        }
      }
    }

    const spaceRadius = Math.max(projectWidth, projectHeight) / 2
    return { positions, edges, spaceRadius }
  }, [projectX, projectY, widgets, projectWidth, projectHeight])
}
