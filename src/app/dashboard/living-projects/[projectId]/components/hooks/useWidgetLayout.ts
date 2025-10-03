/**
 * WIDGET LAYOUT HOOK
 * 
 * Advanced constellation layout algorithm for widget positioning using
 * force-directed placement, clustering, and connection generation.
 */

import React from 'react'
import { WidgetConfig } from '@/types/projectWidgets'

export interface WidgetPosition {
  id: string
  x: number
  y: number
  size: 'small' | 'medium' | 'large'
  importance: number
  cluster?: number
}

export interface WidgetConnection {
  from: string
  to: string
  strength: number
}

export interface WidgetLayoutResult {
  positions: WidgetPosition[]
  canvasWidth: number
  canvasHeight: number
  connections: WidgetConnection[]
}

/**
 * Advanced constellation layout hook for widget positioning
 * Uses force-directed algorithm with clustering and importance-based placement
 */
export function useWidgetLayout(widgets: WidgetConfig[]): WidgetLayoutResult {
  return React.useMemo(() => {
    // Handle SSR - use default values when window is not available
    const isSSR = typeof window === 'undefined'
    const defaultWidth = isSSR ? 2400 : window.innerWidth * 3
    const defaultHeight = isSSR ? 1600 : window.innerHeight * 2.5
    
    if (!widgets.length) {
      return {
        positions: [],
        canvasWidth: defaultWidth,
        canvasHeight: defaultHeight,
        connections: []
      }
    }

    const canvasWidth = Math.max(defaultWidth, 2400)
    const canvasHeight = Math.max(defaultHeight, 1600)

    // Calculate widget importance scores
    const widgetsWithImportance = widgets.map(widget => {
      const isHighPriority = widget.priority > 7
      const isLarge = widget.size === 'large'
      const isRecent = true // Widgets are always "current"

      let importance = 0.3 // Base importance

      if (isHighPriority) importance += 0.4
      if (isLarge) importance += 0.2
      if (isRecent) importance += 0.3

      importance = Math.min(importance, 1)

      return { ...widget, importance }
    })

    // Sort by importance for cluster generation
    const sortedWidgets = [...widgetsWithImportance].sort((a, b) => b.importance - a.importance)

    // Generate cluster centers for important widgets
    const numClusters = Math.min(Math.ceil(widgets.length / 4), 6)
    const clusterCenters: Array<{ x: number; y: number; radius: number }> = []

    for (let i = 0; i < numClusters; i++) {
      const angle = (i / numClusters) * Math.PI * 2
      const distance = Math.min(canvasWidth, canvasHeight) * 0.3
      const centerX = canvasWidth / 2 + Math.cos(angle) * distance
      const centerY = canvasHeight / 2 + Math.sin(angle) * distance

      // Add some randomness to break perfect symmetry
      const randomOffsetX = (Math.random() - 0.5) * 150
      const randomOffsetY = (Math.random() - 0.5) * 150

      clusterCenters.push({
        x: centerX + randomOffsetX,
        y: centerY + randomOffsetY,
        radius: 120 + Math.random() * 80
      })
    }

    // Position widgets using force-directed algorithm
    const positions: WidgetPosition[] = []
    const minDistance = 200 // Minimum distance between widgets

    sortedWidgets.forEach((widget, index) => {
      let bestPosition = { x: 0, y: 0 }
      let bestScore = -Infinity
      const maxAttempts = 40

      // Try multiple positions and pick the best one
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let x: number, y: number

        if (index < clusterCenters.length) {
          // Important widgets get cluster centers
          const cluster = clusterCenters[index]
          x = cluster.x + (Math.random() - 0.5) * cluster.radius
          y = cluster.y + (Math.random() - 0.5) * cluster.radius
        } else {
          // Other widgets are placed near existing clusters
          const nearestCluster = clusterCenters[Math.floor(Math.random() * clusterCenters.length)]
          const angle = Math.random() * Math.PI * 2
          const distance = nearestCluster.radius + Math.random() * 150
          x = nearestCluster.x + Math.cos(angle) * distance
          y = nearestCluster.y + Math.sin(angle) * distance
        }

        // Ensure position is within canvas bounds
        x = Math.max(150, Math.min(canvasWidth - 150, x))
        y = Math.max(120, Math.min(canvasHeight - 120, y))

        // Check distance from other widgets
        let validPosition = true
        let score = 0

        for (const existingPos of positions) {
          const distance = Math.sqrt(
            Math.pow(x - existingPos.x, 2) + Math.pow(y - existingPos.y, 2)
          )

          if (distance < minDistance) {
            validPosition = false
            break
          }

          // Prefer positions that create interesting visual patterns
          score += Math.min(distance, 400) / 400
        }

        if (validPosition && score > bestScore) {
          bestScore = score
          bestPosition = { x, y }
        }
      }

      positions.push({
        id: widget._id,  // ✅ Use Convex ID (_id)
        x: bestPosition.x,
        y: bestPosition.y,
        size: widget.size as 'small' | 'medium' | 'large',
        importance: widget.importance,
        cluster: Math.floor(index / Math.ceil(widgets.length / numClusters))
      })
    })

    // Generate connections between related widgets
    const connections: WidgetConnection[] = []

    positions.forEach((pos1, i) => {
      positions.slice(i + 1).forEach(pos2 => {
        const widget1 = widgetsWithImportance.find(w => w._id === pos1.id)!  // ✅ Use Convex ID (_id)
        const widget2 = widgetsWithImportance.find(w => w._id === pos2.id)!  // ✅ Use Convex ID (_id)

        let connectionStrength = 0

        // Same cluster = stronger connection
        if (pos1.cluster === pos2.cluster) {
          connectionStrength += 0.3
        }

        // Same theme = related
        if (widget1.theme === widget2.theme) {
          connectionStrength += 0.2
        }

        // Similar priority = related
        if (Math.abs(widget1.priority - widget2.priority) <= 2) {
          connectionStrength += 0.2
        }

        // Distance-based connection (closer = more likely to connect)
        const distance = Math.sqrt(
          Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
        )
        if (distance < 300) {
          connectionStrength += 0.2 * (1 - distance / 300)
        }

        // Only create connection if strength is above threshold
        if (connectionStrength > 0.25) {
          connections.push({
            from: pos1.id,
            to: pos2.id,
            strength: Math.min(connectionStrength, 1)
          })
        }
      })
    })

    return {
      positions,
      canvasWidth,
      canvasHeight,
      connections
    }
  }, [widgets])
}
