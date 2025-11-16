'use client'

import React, { useState, useEffect } from 'react'
import { T } from '@/components/translation/T'
import { useTranslation } from '@/hooks/useTranslation'

interface GreetingHeaderProps {
  insights: any
  userName?: string
}

/**
 * GreetingHeader - Personalized greeting from Ambient Insights
 * 
 * Displays dynamic greetings from Convex data (not hardcoded text):
 * 1. Primary: Random greeting from Ambient Insights (api.ambientInsights.getMostRecentByUserId)
 * 2. Fallback: Time-based greeting with user's name (from api.userQueries.getUserInfo)
 * 3. Default: Translated "What can I help you with?"
 * 
 * Follows convex-frontend-data-display.md pattern: all data from Convex queries, no hardcoded values.
 * 
 * @param insights - Ambient insights data from Convex query (may include greetings array)
 * @param userName - User's name from userInfo query for personalized fallback greeting
 */
export function GreetingHeader({ insights, userName }: GreetingHeaderProps) {
  const [selectedGreeting, setSelectedGreeting] = useState<string>("What can I help you with?")
  
  // Translate the fallback greeting
  const { text: fallbackGreeting } = useTranslation("What can I help you with?", {
    context: 'dashboard.home.greeting.fallback'
  })

  // Update greeting when insights change
  useEffect(() => {
    if (insights?.greetings && insights.greetings.length > 0) {
      // Select a random greeting when insights are loaded
      const randomIndex = Math.floor(Math.random() * insights.greetings.length)
      setSelectedGreeting(insights.greetings[randomIndex])
    } else if (insights !== undefined && (!insights || !insights.greetings || insights.greetings.length === 0)) {
      // Fallback to time-based greeting with user's name
      const hour = new Date().getHours()
      const name = userName || 'there'
      if (hour >= 5 && hour < 12) {
        setSelectedGreeting(`May thou have a stupendous morning, ${name}`) // Translation handled by T component wrapper
      } else if (hour >= 12 && hour < 18) {
        setSelectedGreeting(`May thou have a delightful afternoon, ${name}`) // Translation handled by T component wrapper
      } else {
        setSelectedGreeting(`May thou have a stupendous evening, ${name}`) // Translation handled by T component wrapper
      }
    } else {
      // Use translated fallback
      setSelectedGreeting(fallbackGreeting)
    }
  }, [insights?._id, insights?.greetings, userName, fallbackGreeting])

  return (
    <h1 className="text-4xl font-light text-foreground text-center">
      <T context="dashboard.home.greeting">{selectedGreeting}</T>
    </h1>
  )
}


