'use client'

import { useMemo } from 'react'

interface Project {
  _id: string
  name: string
  description?: string
  fingerprintId?: string
  createdAt: number
  updatedAt: number
}

interface ProjectPosition {
  id: string
  x: number
  y: number
  size: 'small' | 'medium' | 'large'
  importance: number
  cluster?: number
}

interface ConstellationLayout {
  positions: ProjectPosition[]
  canvasWidth: number
  canvasHeight: number
  connections: Array<{ from: string; to: string; strength: number }>
}

export function useConstellationLayout(projects: Project[]): ConstellationLayout {
  return useMemo(() => {
    if (!projects.length) {
      return {
        positions: [],
        canvasWidth: window.innerWidth * 3,
        canvasHeight: window.innerHeight * 2.5,
        connections: []
      }
    }

    const canvasWidth = Math.max(window.innerWidth * 3, 2400)
    const canvasHeight = Math.max(window.innerHeight * 2.5, 1600)

    // Calculate project importance scores
    const projectsWithImportance = projects.map(project => {
      const hasFingerprint = !!project.fingerprintId
      const isRecent = Date.now() - project.updatedAt < 7 * 24 * 60 * 60 * 1000 // 7 days
      const age = Date.now() - project.createdAt
      const daysSinceCreated = age / (24 * 60 * 60 * 1000)
      
      let importance = 0.3 // Base importance
      
      if (hasFingerprint) importance += 0.4 // Active projects are more important
      if (isRecent) importance += 0.3 // Recent activity adds importance
      if (daysSinceCreated < 30) importance += 0.2 // New projects get a boost
      if (project.description && project.description.length > 100) importance += 0.1 // Detailed projects
      
      // Normalize to 0-1 range
      importance = Math.min(importance, 1)
      
      return { ...project, importance }
    })

    // Sort by importance for cluster generation
    const sortedProjects = [...projectsWithImportance].sort((a, b) => b.importance - a.importance)

    // Generate cluster centers for important projects
    const numClusters = Math.min(Math.ceil(projects.length / 5), 8)
    const clusterCenters: Array<{ x: number; y: number; radius: number }> = []
    
    for (let i = 0; i < numClusters; i++) {
      const angle = (i / numClusters) * Math.PI * 2
      const distance = Math.min(canvasWidth, canvasHeight) * 0.25
      const centerX = canvasWidth / 2 + Math.cos(angle) * distance
      const centerY = canvasHeight / 2 + Math.sin(angle) * distance
      
      // Add some randomness to break perfect symmetry
      const randomOffsetX = (Math.random() - 0.5) * 200
      const randomOffsetY = (Math.random() - 0.5) * 200
      
      clusterCenters.push({
        x: centerX + randomOffsetX,
        y: centerY + randomOffsetY,
        radius: 150 + Math.random() * 100
      })
    }

    // Position projects using force-directed algorithm
    const positions: ProjectPosition[] = []
    const minDistance = 280 // Minimum distance between projects
    
    sortedProjects.forEach((project, index) => {
      let bestPosition = { x: 0, y: 0 }
      let bestScore = -Infinity
      const maxAttempts = 50
      
      // Determine project size based on importance
      let size: 'small' | 'medium' | 'large' = 'small'
      if (project.importance > 0.7) size = 'large'
      else if (project.importance > 0.4) size = 'medium'
      
      // Try multiple positions and pick the best one
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let x: number, y: number
        
        if (index < clusterCenters.length) {
          // Important projects get cluster centers
          const cluster = clusterCenters[index]
          x = cluster.x + (Math.random() - 0.5) * cluster.radius
          y = cluster.y + (Math.random() - 0.5) * cluster.radius
        } else {
          // Other projects are placed near existing clusters
          const nearestCluster = clusterCenters[Math.floor(Math.random() * clusterCenters.length)]
          const angle = Math.random() * Math.PI * 2
          const distance = nearestCluster.radius + Math.random() * 200
          x = nearestCluster.x + Math.cos(angle) * distance
          y = nearestCluster.y + Math.sin(angle) * distance
        }
        
        // Ensure position is within canvas bounds
        x = Math.max(200, Math.min(canvasWidth - 200, x))
        y = Math.max(150, Math.min(canvasHeight - 150, y))
        
        // Check distance from other projects
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
          score += Math.min(distance, 500) / 500
        }
        
        if (validPosition && score > bestScore) {
          bestScore = score
          bestPosition = { x, y }
        }
      }
      
      positions.push({
        id: project._id,
        x: bestPosition.x,
        y: bestPosition.y,
        size,
        importance: project.importance,
        cluster: Math.floor(index / Math.ceil(projects.length / numClusters))
      })
    })

    // Generate connections between related projects
    const connections: Array<{ from: string; to: string; strength: number }> = []
    
    positions.forEach((pos1, i) => {
      positions.slice(i + 1).forEach(pos2 => {
        const project1 = projectsWithImportance.find(p => p._id === pos1.id)!
        const project2 = projectsWithImportance.find(p => p._id === pos2.id)!
        
        let connectionStrength = 0
        
        // Same cluster = stronger connection
        if (pos1.cluster === pos2.cluster) {
          connectionStrength += 0.3
        }
        
        // Both have fingerprints = related work
        if (project1.fingerprintId && project2.fingerprintId) {
          connectionStrength += 0.2
        }
        
        // Similar creation time = related projects
        const timeDiff = Math.abs(project1.createdAt - project2.createdAt)
        const daysDiff = timeDiff / (24 * 60 * 60 * 1000)
        if (daysDiff < 30) {
          connectionStrength += 0.3 * (1 - daysDiff / 30)
        }
        
        // Distance-based connection (closer = more likely to connect)
        const distance = Math.sqrt(
          Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
        )
        if (distance < 400) {
          connectionStrength += 0.2 * (1 - distance / 400)
        }
        
        // Only create connection if strength is above threshold
        if (connectionStrength > 0.3) {
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
  }, [projects])
}
