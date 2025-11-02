'use client'

import React, { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

interface GreetingHeaderProps {
  userId: string | null
}

/**
 * GreetingHeader - Personalized greeting from Ambient Insights
 * 
 * Uses greetings from the ambientInsights query, with fallback to time-based greeting
 */
export function GreetingHeader({ userId }: GreetingHeaderProps) {
  const [selectedGreeting, setSelectedGreeting] = useState<string>("What can I help you with?")

  // Query ambient insights for greetings
  const convexInsights = useQuery(
    api.ambientInsights.getMostRecentByUserId,
    userId ? { userId } : "skip"
  )

  // Update greeting when insights change
  useEffect(() => {
    if (convexInsights?.greetings && convexInsights.greetings.length > 0) {
      // Select a random greeting when insights are loaded
      const randomIndex = Math.floor(Math.random() * convexInsights.greetings.length)
      setSelectedGreeting(convexInsights.greetings[randomIndex])
    } else if (convexInsights !== undefined && (!convexInsights || !convexInsights.greetings || convexInsights.greetings.length === 0)) {
      // Fallback to time-based greeting if no greetings available
      const hour = new Date().getHours()
      if (hour >= 5 && hour < 12) {
        setSelectedGreeting("May thou have a stupendous morning, there")
      } else if (hour >= 12 && hour < 18) {
        setSelectedGreeting("May thou have a delightful afternoon, there")
      } else {
        setSelectedGreeting("May thou have a stupendous evening, there")
      }
    }
  }, [convexInsights?._id, convexInsights?.greetings])

  return (
    <h1 className="text-4xl font-light text-foreground text-center">
      {selectedGreeting}
    </h1>
  )
}


