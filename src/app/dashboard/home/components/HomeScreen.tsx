'use client'

import React, { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { GreetingHeader } from './GreetingHeader'
import { HomepageChat } from './HomepageChat'
import { PendingQuestionsSection } from './PendingQuestionsSection'
import { ArtifactsSection } from './ArtifactsSection'
import { AssignmentsSection } from './AssignmentsSection'

/**
 * HomeScreen - New Dashboard Homepage
 * 
 * Primary landing page displaying:
 * - Personalized greeting from Ambient Insights
 * - Chat input for quick interactions
 * - Recent artifacts (delivered content)
 * - Active assignments (projects in progress)
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
    api.widgetOutputsQueries.getRecentArtifacts,
    userId ? { userId, limit: 3 } : 'skip'
  )
  
  const pendingQuestions = useQuery(
    api.widgetQuestionsQueries.getUserPendingQuestions,
    userId ? { userId } : 'skip'
  )

  // Handle question click - switches to project chat
  // The question is already in the conversation as an assistant message (from Task 2.4)
  const handleQuestionClick = (projectId: string) => {
    setActiveProjectId(projectId)
  }

  // Handle switching back to main chat
  const handleBackToMainChat = () => {
    setActiveProjectId(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8 space-y-8">
        
        {/* Pass data via props */}
        <GreetingHeader insights={insights} userName={userInfo?.name} />
        
        {/* Chat - with messages and input */}
        <HomepageChat 
          userId={userId} 
          activeProjectId={activeProjectId}
          onBackToMainChat={handleBackToMainChat}
        />
        
        {/* Pending Questions - only shown if questions exist */}
        <PendingQuestionsSection 
          questions={pendingQuestions}
          onQuestionClick={handleQuestionClick}
        />
        
        {/* Artifacts Section */}
        <ArtifactsSection artifacts={artifacts} />
        
        {/* Assignments Section */}
        <AssignmentsSection projects={projects} />
        
      </div>
    </div>
  )
}


