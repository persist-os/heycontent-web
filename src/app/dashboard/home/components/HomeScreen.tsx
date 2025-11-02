'use client'

import React, { useState, useEffect } from 'react'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { GreetingHeader } from './GreetingHeader'
import { HomepageChat } from './HomepageChat'
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8 space-y-8">
        
        {/* Greeting */}
        <GreetingHeader userId={userId} />
        
        {/* Chat - with messages and input */}
        <HomepageChat />
        
        {/* Artifacts Section */}
        <ArtifactsSection />
        
        {/* Assignments Section */}
        <AssignmentsSection />
        
      </div>
    </div>
  )
}


