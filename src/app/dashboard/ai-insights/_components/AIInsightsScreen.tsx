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
  const [expandedGmail, setExpandedGmail] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState('youtube')
  
  // Separate state for each platform
  const [youtubeRefreshing, setYoutubeRefreshing] = useState(false)
  const [instagramRefreshing, setInstagramRefreshing] = useState(false)
  const [gmailRefreshing, setGmailRefreshing] = useState(false)
  
  const [youtubeError, setYoutubeError] = useState<string | null>(null)
  const [instagramError, setInstagramError] = useState<string | null>(null)
  const [gmailError, setGmailError] = useState<string | null>(null)
  
  const { firebaseUser } = useAuth()

  // Fetch YouTube channel data
  const youtubeChannel = useQuery(
    api.youtubeQueries.getYouTubeChannelData,
    firebaseUser ? { userId: firebaseUser.uid } : "skip"
  )

  // Fetch YouTube insights
  const youtubeInsights = useQuery(
    api.youtubeQueries.getChannelAnalysis,
    youtubeChannel?.id ? { userId: firebaseUser?.uid, channelId: youtubeChannel.id } : "skip"
  )

  // Store channel analysis mutation
  const storeChannelAnalysis = useMutation(api.youtubeMutations.storeChannelAnalysis)

  // Platform-specific insights
  const youtubeInsightsList = youtubeInsights?.analysis?.insights || []
  const instagramInsights = [] // TODO: Add Instagram insights when available
  const gmailInsights = [] // TODO: Add Gmail insights when available

  const handleYoutubeRefresh = async () => {
    if (!firebaseUser || !youtubeChannel?.id) {
      setYoutubeError('YouTube channel not connected')
      return
    }

    setYoutubeRefreshing(true)
    setYoutubeError(null)
    
    try {
      const apiKey = await getApiKey()
      if (!apiKey) {
        throw new Error('You are not authenticated. Please log in again.')
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      
      const response = await fetch(`${backendUrl}/api/v1/youtube/channel-insights`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          user_id: firebaseUser.uid,
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
        await storeChannelAnalysis({
          userId: firebaseUser.uid,
          channelId: youtubeChannel.id,
          analysisData: data.data
        })
        
        console.log('Successfully refreshed YouTube insights')
      } else {
        throw new Error(data.error || 'Failed to refresh YouTube insights')
      }
    } catch (error: any) {
      console.error('Error refreshing YouTube insights:', error)
      setYoutubeError(error.message || 'Failed to refresh YouTube insights')
    } finally {
      setYoutubeRefreshing(false)
    }
  }

  const handleInstagramRefresh = async () => {
    if (!firebaseUser) {
      setInstagramError('User not authenticated')
      return
    }

    setInstagramRefreshing(true)
    setInstagramError(null)
    
    try {
      // TODO: Implement Instagram insights refresh
      await new Promise(resolve => setTimeout(resolve, 1000)) // Placeholder
      console.log('Instagram refresh - Coming soon')
    } catch (error: any) {
      console.error('Error refreshing Instagram insights:', error)
      setInstagramError(error.message || 'Failed to refresh Instagram insights')
    } finally {
      setInstagramRefreshing(false)
    }
  }

  const handleGmailRefresh = async () => {
    if (!firebaseUser) {
      setGmailError('User not authenticated')
      return
    }

    setGmailRefreshing(true)
    setGmailError(null)
    
    try {
      // TODO: Implement Gmail insights refresh
      await new Promise(resolve => setTimeout(resolve, 1000)) // Placeholder
      console.log('Gmail refresh - Coming soon')
    } catch (error: any) {
      console.error('Error refreshing Gmail insights:', error)
      setGmailError(error.message || 'Failed to refresh Gmail insights')
    } finally {
      setGmailRefreshing(false)
    }
  }

  // Helper component for tab-specific refresh button and error display
  const TabRefreshControls = ({ 
    platform, 
    isRefreshing, 
    error, 
    onRefresh, 
    disabled = false 
  }: {
    platform: string
    isRefreshing: boolean
    error: string | null
    onRefresh: () => void
    disabled?: boolean
  }) => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={onRefresh}
          disabled={isRefreshing || disabled}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm ${
            isRefreshing || disabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
              : 'bg-heycontent-light-yellow hover:bg-heycontent-yellow text-black'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>
            {isRefreshing ? 'Refreshing...' : 
             disabled ? 'Coming Soon' :
             `Refresh ${platform}`}
          </span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
        </div>
      )}
    </div>
  )

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
          <div className="w-[100px] sm:w-auto">
            {/* Removed global refresh button - now each tab has its own */}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto dark:bg-gray-900">
        <div className="p-6">
          <div className="max-w-5xl mx-auto space-y-6">
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
                  Gmail ({gmailInsights.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="youtube" className="space-y-6">
                <TabRefreshControls
                  platform="YouTube"
                  isRefreshing={youtubeRefreshing}
                  error={youtubeError}
                  onRefresh={handleYoutubeRefresh}
                  disabled={!firebaseUser || !youtubeChannel?.id}
                />
                
                {youtubeRefreshing ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-12 h-12 text-text-gray animate-spin mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-text-dark dark:text-white mb-2">
                      Refreshing YouTube insights...
                    </h3>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {youtubeInsightsList.length === 0 && !youtubeError && (
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
                  </div>
                )}
              </TabsContent>

              <TabsContent value="instagram" className="space-y-6">
                <TabRefreshControls
                  platform="Instagram"
                  isRefreshing={instagramRefreshing}
                  error={instagramError}
                  onRefresh={handleInstagramRefresh}
                  disabled={true} // Disabled until implemented
                />
                
                {instagramRefreshing ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-12 h-12 text-text-gray animate-spin mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-text-dark dark:text-white mb-2">
                      Refreshing Instagram insights...
                    </h3>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {instagramInsights.length === 0 && !instagramError && (
                      <div className="text-center text-gray-400">Instagram insights coming soon.</div>
                    )}
                    {instagramInsights.map((insight, idx) => (
                      <InsightCard
                        key={idx}
                        {...insight}
                        expanded={expandedInstagram === idx}
                        onExpand={() => setExpandedInstagram(expandedInstagram === idx ? null : idx)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="gmail" className="space-y-6">
                <TabRefreshControls
                  platform="Gmail"
                  isRefreshing={gmailRefreshing}
                  error={gmailError}
                  onRefresh={handleGmailRefresh}
                  disabled={true} // Disabled until implemented
                />
                
                {gmailRefreshing ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-12 h-12 text-text-gray animate-spin mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-text-dark dark:text-white mb-2">
                      Refreshing Gmail insights...
                    </h3>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {gmailInsights.length === 0 && !gmailError && (
                      <div className="text-center text-gray-400">Gmail insights coming soon.</div>
                    )}
                    {gmailInsights.map((insight, idx) => (
                      <InsightCard
                        key={idx}
                        {...insight}
                        expanded={expandedGmail === idx}
                        onExpand={() => setExpandedGmail(expandedGmail === idx ? null : idx)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
} 