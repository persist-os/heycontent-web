'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Youtube, Instagram, Mail, 
  ChevronRight, ArrowRight, Clock, MessageSquare,
  RefreshCw, AlertCircle
} from 'lucide-react'
import { InsightCard } from './InsightCard'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAuth } from '@/app/context/auth-context'
import { getApiKey } from '@/app/lib/api-helpers'

export function AIInsightsScreen() {
  // Track expanded card index for each tab
  const [expandedYoutube, setExpandedYoutube] = useState<number | null>(null)
  const [expandedInstagram, setExpandedInstagram] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState('youtube')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const { user } = useAuth()

  // Fetch YouTube channel data
  const youtubeChannel = useQuery(
    api.youtubeQueries.getYouTubeChannelData,
    user ? { userId: user.uid } : "skip"
  )

  // Fetch YouTube insights
  const youtubeInsights = useQuery(
    api.youtubeQueries.getChannelAnalysis,
    youtubeChannel?.id ? { userId: user?.uid, channelId: youtubeChannel.id } : "skip"
  )

  // Store channel analysis mutation
  const storeChannelAnalysis = useMutation(api.youtubeMutations.storeChannelAnalysis)

  // Filter insights by platform
  const youtubeInsightsList = youtubeInsights?.analysis?.insights || []
  const instagramInsights = [] // TODO: Add Instagram insights when available
  // Gmail tab is empty for now

  const handleRefresh = async () => {
    if (!user || !youtubeChannel?.id) {
      setRefreshError('YouTube channel not connected')
      return
    }

    setIsRefreshing(true)
    setRefreshError(null)
    
    try {
      // Get API key for authentication
      const apiKey = await getApiKey()
      if (!apiKey) {
        throw new Error('You are not authenticated. Please log in again.')
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      
      // Call the channel insights API
      const response = await fetch(`${backendUrl}/api/v1/youtube/channel-insights`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          user_id: user.uid,
          channel_id: youtubeChannel.id,
          max_videos: 10,
          include_captions: true,
          include_comments: true,
          force_refresh: true
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }
      
      if (data.status === 'success') {
        // Store the updated analysis in Convex
        await storeChannelAnalysis({
          userId: user.uid,
          channelId: youtubeChannel.id,
          analysisData: data.data
        })
        
        // The Convex query will automatically refresh and update the UI
        console.log('Successfully refreshed YouTube insights')
      } else {
        throw new Error(data.error || 'Failed to refresh insights')
      }
    } catch (error: any) {
      console.error('Error refreshing insights:', error)
      setRefreshError(error.message || 'Failed to refresh insights')
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="relative">
      {/* Fixed Header */}
      <div className="shrink-0 px-6 py-4 bg-white dark:bg-gray-900">
        <div className="flex justify-between items-center">
          <div className="w-[100px] sm:w-[24px]"></div>
          <div className="flex-1 flex justify-center sm:justify-start">
            <div className="text-center sm:text-left">
              <h1 className="text-base font-medium text-black dark:text-white">AI Insights</h1>
              <p className="text-text-gray dark:text-gray-400">
                <span className="hidden sm:inline">Personalized recommendations for your content strategy</span>
              </p>
            </div>
          </div>
          <div className="w-[100px] sm:w-auto flex justify-end">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors ${
                isRefreshing 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
                  : 'bg-heycontent-light-yellow hover:bg-heycontent-yellow text-black'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isRefreshing ? 'Refreshing...' : 'Refresh Insights'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto dark:bg-gray-900">
        <div className="p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Error display */}
            {refreshError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Refresh Error</span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{refreshError}</p>
              </div>
            )}
            
            {/* Only show loading if isRefreshing is true */}
            {isRefreshing ? (
              <div className="text-center py-12">
                <RefreshCw className="w-12 h-12 text-text-gray animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-medium text-text-dark dark:text-white mb-2">
                  Refreshing insights...
                </h3>
              </div>
            ) : (
              <Tabs defaultValue="youtube" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger 
                    value="youtube" 
                    className="flex items-center gap-2"
                  >
                    <Youtube className="w-4 h-4" />
                    YouTube ({youtubeInsightsList.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="instagram" 
                    className="flex items-center gap-2"
                  >
                    <Instagram className="w-4 h-4" />
                    Instagram ({instagramInsights.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="gmail" 
                    className="flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Gmail (0)
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="youtube" className="grid gap-6">
                  {youtubeInsightsList.length === 0 && (
                    <div className="text-center text-gray-400">No YouTube insights available.</div>
                  )}
                  {youtubeInsightsList.map((insight, idx) => (
                    <InsightCard
                      key={idx}
                      {...insight}
                      expanded={expandedYoutube === idx}
                      onExpand={() => setExpandedYoutube(expandedYoutube === idx ? null : idx)}
                    />
                  ))}
                </TabsContent>

                <TabsContent value="instagram" className="grid gap-6">
                  {instagramInsights.length === 0 && (
                    <div className="text-center text-gray-400">No Instagram insights available.</div>
                  )}
                  {instagramInsights.map((insight, idx) => (
                    <InsightCard
                      key={idx}
                      {...insight}
                      expanded={expandedInstagram === idx}
                      onExpand={() => setExpandedInstagram(expandedInstagram === idx ? null : idx)}
                    />
                  ))}
                </TabsContent>

                <TabsContent value="gmail" className="grid gap-6">
                  <div className="text-center text-gray-400">No Gmail insights available.</div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 