'use client'

import React, { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { GreetingHeader } from './GreetingHeader'
import { ThreadQuickAccess } from './ThreadQuickAccess'
import { ArtifactsSection } from './ArtifactsSection'
import { AssignmentsSection } from './AssignmentsSection'

/**
 * HomeScreen - New Dashboard Homepage
 * 
 * Primary landing page displaying:
 * - Personalized greeting from Ambient Insights
 * - Thread cards (replaces chat box, pending questions, activity feed)
 * - Recent artifacts from artifacts table
 * - Active assignments (projects in progress)
 * 
 * CRITICAL: Unified threads replace 3 separate sections (70% UI reduction)
 */
export function HomeScreen() {
  const [userId, setUserId] = useState<string | null>(null)

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

  // Centralized Convex queries (ONE per data type)
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
        
        {/* ✨ NEW: Thread Quick Access - Replaces 3 sections */}
        <ThreadQuickAccess userId={userId} />
        
        {/* Artifacts Section */}
        <ArtifactsSection artifacts={artifacts} />
        
        {/* Assignments Section */}
        <AssignmentsSection projects={projects} />
        
      </div>
    </div>
  )
}


