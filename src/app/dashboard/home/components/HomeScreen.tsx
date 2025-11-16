'use client'

import React, { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { GreetingHeader } from './GreetingHeader'
import { HomepageChat } from './HomepageChat'
import { ArtifactsSection } from './ArtifactsSection'
import { AssignmentsSection } from './AssignmentsSection'

/**
 * HomeScreen - New Dashboard Homepage
 * 
 * Primary landing page displaying:
 * - Personalized greeting from Ambient Insights (via GreetingHeader)
 * - HomepageChat for starting conversations
 * - Recent artifacts from artifacts table
 * - Active assignments (projects in progress)
 * 
 * NOTE: Assignments and conversations are now the same thing - projects serve both purposes
 * 
 * Data Flow (per convex-frontend-data-display.md):
 * - All data comes from Convex queries (useQuery hooks in this component)
 * - Queries are centralized here (ONE per data type)
 * - Data is passed down to child components as props
 * - No hardcoded data - all values come from Convex
 */
export function HomeScreen() {
  const [userId, setUserId] = useState<string | null>(null)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)

  // Get user ID on component mount
  useEffect(() => {
    const getUserId = async () => {
      try {
        const id = await getCurrentUserId()
        setUserId(id)
      } catch (error) {
        console.error('Failed to get user ID:', error)
      }
    }
    getUserId()
  }, [])
  
  // Handle returning to main chat from project chat
  const handleBackToMainChat = () => {
    setActiveProjectId(null)
  }

  // Centralized Convex queries (ONE per data type)
  // Pattern: convex-frontend-data-display.md - queries in components, not stores
  const userInfo = useQuery(
    api.userQueries.getUserInfo,
    userId ? { userId } : 'skip'
  )
  
  const insights = useQuery(
    api.ambientInsights.getMostRecentByUserId,
    userId ? { userId } : 'skip'
  )
  
  const projects = useQuery(
    api.projectsQueries.getByUser,
    userId ? { userId, limit: 6 } : 'skip'
  )
  
  const artifacts = useQuery(
    api.artifactQueries.getUserArtifacts,
    userId ? { userId, limit: 9 } : 'skip'
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8 space-y-8">
        
        {/* Greeting Header */}
        <GreetingHeader insights={insights} userName={userInfo?.name} />
        
        {/* ✨ HomepageChat - Hero element for starting conversations */}
        <HomepageChat 
          userId={userId}
          activeProjectId={activeProjectId}
          onBackToMainChat={handleBackToMainChat}
        />
        
        {/* Artifacts Section */}
        <ArtifactsSection artifacts={artifacts} />
        
        {/* Assignments Section */}
        <AssignmentsSection projects={projects} userId={userId} />
        
      </div>
    </div>
  )
}


