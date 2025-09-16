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

interface OrbitalLayoutResult {
  positions: WidgetPosition[]
  spaceRadius: number
}

/**
 * Calculate orbital positions for widgets around a project center
 */
export function useWidgetOrbitalLayout(
  projectX: number,
  projectY: number,
  widgets: WidgetConfig[]
): OrbitalLayoutResult {
  return useMemo(() => {
    if (widgets.length === 0) {
      return {
        positions: [],
        spaceRadius: 120 // Default space radius
      }
    }

    const baseDistance = 100
    const maxWidgetsPerRing = 6
    const ringSpacing = 60

    // Sort widgets by priority (high priority = closer to center)
    const sortedWidgets = [...widgets].sort((a, b) => b.priority - a.priority)

    const positions: WidgetPosition[] = []
    let maxDistance = baseDistance

    sortedWidgets.forEach((widget, index) => {
      const ring = Math.floor(index / maxWidgetsPerRing)
      const positionInRing = index % maxWidgetsPerRing
      const widgetsInRing = Math.min(widgets.length - ring * maxWidgetsPerRing, maxWidgetsPerRing)

      // Equal angular spacing in each ring
      const angle = (positionInRing / widgetsInRing) * Math.PI * 2
      const distance = baseDistance + (ring * ringSpacing)

      // Calculate final position
      const x = projectX + Math.cos(angle) * distance
      const y = projectY + Math.sin(angle) * distance

      // Update max distance for space radius calculation
      maxDistance = Math.max(maxDistance, distance + 40) // Add widget size buffer

      positions.push({
        id: widget.widget_id,
        x,
        y,
        size: widget.size,
        importance: widget.priority / 10, // Normalize to 0-1
        orbital_angle: angle,
        orbital_distance: distance
      })
    })

    // Calculate space radius based on widget positions
    const spaceRadius = Math.max(120, maxDistance + 40)

    return {
      positions,
      spaceRadius
    }
  }, [projectX, projectY, widgets])
}
