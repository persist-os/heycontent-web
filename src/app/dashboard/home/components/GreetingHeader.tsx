'use client'

import React, { useState, useEffect } from 'react'

interface GreetingHeaderProps {
  insights: any
  userName?: string
}

/**
 * GreetingHeader - Personalized greeting from Ambient Insights
 * 
 * Uses greetings from the ambientInsights query, with fallback to time-based greeting
 */
export function GreetingHeader({ insights, userName }: GreetingHeaderProps) {
  const [selectedGreeting, setSelectedGreeting] = useState<string>("What can I help you with?")

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
        setSelectedGreeting(`May thou have a stupendous morning, ${name}`)
      } else if (hour >= 12 && hour < 18) {
        setSelectedGreeting(`May thou have a delightful afternoon, ${name}`)
      } else {
        setSelectedGreeting(`May thou have a stupendous evening, ${name}`)
      }
    }
  }, [insights?._id, insights?.greetings, userName])

  return (
    <h1 className="text-4xl font-light text-foreground text-center">
      {selectedGreeting}
    </h1>
  )
}


