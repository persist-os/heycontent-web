import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useCallback, useState, useEffect } from 'react'
import { getApiKey } from '@/app/lib/api-helpers'

export function useContentHubInsights(userId: string | undefined) {
  const [refreshing, setRefreshing] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  
  // Get the latest content hub insight
  const latestInsight = useQuery(
    api.contentHub.getMostRecentByUserId,
    userId ? { userId } : 'skip'
  )
  
  // Get all content hub insights history
  const insights = useQuery(
    api.contentHub.getByUserId,
    userId ? { userId } : 'skip'
  )
  
  // Get content hub data bundle to check platform requirements
  const dataBundle = useQuery(
    api.contentHub.getContentHubDataBundle,
    userId ? { userId } : 'skip'
  )
  
  // Function to generate new insights by calling the API route
  const generateNewInsights = useCallback(async () => {
    if (!userId) return false
    
    setRefreshing(true)
    try {
      const apiKey = await getApiKey()
      if (!apiKey) {
        console.error('No API key found for content hub generation')
        setRefreshing(false)
        return false
      }
      
      const response = await fetch('/api/content_hub/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ userId })
      })
      
      if (!response.ok) {
        let errorData = {}
        try {
          errorData = await response.json()
        } catch (jsonError) {
          console.error('Failed to parse error response as JSON:', jsonError)
        }
        
        console.error('Content Hub API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        })
        
        const errorMessage = (errorData as any)?.error || 
                           (errorData as any)?.detail || 
                           `Request failed with status ${response.status}`
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      setRefreshing(false)
      return data.success || false
    } catch (error) {
      console.error('Error generating content hub insights:', error)
      setRefreshing(false)
      return false
    }
  }, [userId])
  
  // Set error if Convex query fails
  useEffect(() => {
    if (latestInsight === null && insights === null) {
      setFetchError('Failed to load content hub insights')
    }
  }, [latestInsight, insights])
  
  return {
    latestInsight,
    insights,
    dataBundle,
    refreshing,
    generateNewInsights,
    hasMinimumPlatforms: dataBundle?.minimumPlatformsConnected || false,
    connectedPlatforms: dataBundle?.connectedPlatforms || [],
    error: fetchError
  }
} 