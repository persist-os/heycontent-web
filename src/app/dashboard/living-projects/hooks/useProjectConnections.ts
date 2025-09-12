'use client'

import { useMemo } from 'react'

// TODO: Replace hardcoded connection logic with AI-powered relationship mapping
// TODO: Implement connection strength learning from user interactions
// TODO: Add manual connection creation and editing capabilities
// TODO: Implement connection visualization with different relationship types

interface Project {
  _id: string
  name: string
  description?: string
  fingerprintId?: string
  createdAt: number
  updatedAt: number
}

interface Connection {
  from: string
  to: string
  strength: number
  reason: string[]
}

export function useProjectConnections(projects: Project[]): Connection[] {
  return useMemo(() => {
    if (!projects || projects.length < 2) return []

    const connections: Connection[] = []

    // Compare each project with every other project
    for (let i = 0; i < projects.length; i++) {
      for (let j = i + 1; j < projects.length; j++) {
        const project1 = projects[i]
        const project2 = projects[j]
        
        let strength = 0
        const reasons: string[] = []

        // 1. Both have fingerprints (active projects tend to be related)
        if (project1.fingerprintId && project2.fingerprintId) {
          strength += 0.3
          reasons.push('both-active')
        }

        // 2. Similar creation time (projects started around the same time)
        const timeDiff = Math.abs(project1.createdAt - project2.createdAt)
        const daysDiff = timeDiff / (24 * 60 * 60 * 1000)
        if (daysDiff < 30) {
          const timeStrength = 0.4 * (1 - daysDiff / 30)
          strength += timeStrength
          reasons.push('similar-timing')
        }

        // 3. Similar update patterns (worked on together)
        const updateDiff = Math.abs(project1.updatedAt - project2.updatedAt)
        const updateDaysDiff = updateDiff / (24 * 60 * 60 * 1000)
        if (updateDaysDiff < 7) {
          const updateStrength = 0.3 * (1 - updateDaysDiff / 7)
          strength += updateStrength
          reasons.push('concurrent-work')
        }

        // 4. Name similarity (basic keyword matching)
        if (project1.name && project2.name) {
          const name1Words = project1.name.toLowerCase().split(/\s+/)
          const name2Words = project2.name.toLowerCase().split(/\s+/)
          
          const commonWords = name1Words.filter(word => 
            word.length > 3 && name2Words.includes(word)
          )
          
          if (commonWords.length > 0) {
            strength += Math.min(0.4, commonWords.length * 0.2)
            reasons.push('similar-names')
          }
        }

        // 5. Description similarity (basic keyword matching)
        if (project1.description && project2.description) {
          const desc1Words = project1.description.toLowerCase().split(/\s+/)
          const desc2Words = project2.description.toLowerCase().split(/\s+/)
          
          const commonWords = desc1Words.filter(word => 
            word.length > 4 && desc2Words.includes(word)
          )
          
          if (commonWords.length > 0) {
            strength += Math.min(0.3, commonWords.length * 0.1)
            reasons.push('similar-content')
          }
        }

        // 6. Status similarity (discovering projects often relate)
        const bothDiscovering = !project1.fingerprintId && !project2.fingerprintId
        const bothActive = project1.fingerprintId && project2.fingerprintId
        
        if (bothDiscovering || bothActive) {
          strength += 0.2
          reasons.push(bothDiscovering ? 'both-discovering' : 'both-established')
        }

        // 7. Recent activity correlation
        const recentThreshold = 7 * 24 * 60 * 60 * 1000 // 7 days
        const project1Recent = Date.now() - project1.updatedAt < recentThreshold
        const project2Recent = Date.now() - project2.updatedAt < recentThreshold
        
        if (project1Recent && project2Recent) {
          strength += 0.25
          reasons.push('both-recent')
        }

        // Only create connection if strength is above threshold
        if (strength > 0.3) {
          connections.push({
            from: project1._id,
            to: project2._id,
            strength: Math.min(1, strength), // Cap at 1.0
            reason: reasons
          })
        }
      }
    }

    // Sort by strength (strongest connections first)
    return connections.sort((a, b) => b.strength - a.strength)
  }, [projects])
}
