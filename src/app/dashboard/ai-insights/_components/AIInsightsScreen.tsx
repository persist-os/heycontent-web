'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Instagram, Mail, 
  ChevronRight, ArrowRight, Clock, MessageSquare,
  RefreshCw, AlertCircle, Settings, Zap
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
  
  // Post limit selection state
  const [instagramPostLimit, setInstagramPostLimit] = useState<number | 'all'>(50)
  const [gmailThreadLimit, setGmailThreadLimit] = useState<number | 'all'>(50)
  const [customPostLimit, setCustomPostLimit] = useState<string>('')
  const [customGmailLimit, setCustomGmailLimit] = useState<string>('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [showGmailCustomInput, setShowGmailCustomInput] = useState(false)
  

  // Separate state for each platform
  const [youtubeRefreshing, setYoutubeRefreshing] = useState(false)
  const [instagramRefreshing, setInstagramRefreshing] = useState(false)
  const [gmailRefreshing, setGmailRefreshing] = useState(false)
  
  const [youtubeError, setYoutubeError] = useState<string | null>(null)
  const [instagramError, setInstagramError] = useState<string | null>(null)
  const [gmailError, setGmailError] = useState<string | null>(null)
  const [currentQuote, setCurrentQuote] = useState<string>('')
  
  const { firebaseUser } = useAuth()

  const motivationalQuotes = [
    "Create because it's fun. Create because it helps people. Create because it gives you a sense of accomplishment. Create like nobody's watching and you might be surprised how many do. — Matt D'Avella",
    "When creating content, be the best answer on the internet. — Andy Crestodina",
    "We need to stop interrupting what people are interested in and be what people are interested in. — Craig Davis",
    "I don't create content for a specific type of audience; I just share my life and whatever resonates with people is what draws them to me. — Nara Smith",
    "The artists today that are making it realize that it's about creating a continuous engagement with their fans. — Daniel Ek",
    "Without big data, you are blind and deaf and in the middle of a freeway. — Geoffrey Moore",
    "Data is the new oil. — Clive Humby",
    "Data are just summaries of thousands of stories—tell a few of those stories to help make the data meaningful. — Dan Heath",
    "Data helps solve problems. — Anne Wojcicki",
    "Data visualization is language. It's a means to convey an opinion or argument. — Kim Rees"
  ];  

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

  // Add Instagram-specific queries and mutations after YouTube ones
  const instagramAccount = useQuery(
    api.instagramQueries.getInstagramAccount,
    firebaseUser ? { userId: firebaseUser.uid } : "skip"
  )

  // Fetch Instagram insights
  const instagramInsights = useQuery(
    api.instagramQueries.getInstagramBatchAnalysis,
    instagramAccount && firebaseUser ? { 
      userId: firebaseUser.uid, 
      instagramAccountId: instagramAccount.instagramAccountId 
    } : "skip"
  )

  // Store Instagram analysis mutation
  const storeInstagramAnalysis = useMutation(api.instagramMutations.storeInstagramBatchAnalysis)

  // Add Gmail-specific queries and mutations after Instagram ones
  const gmailAccount = useQuery(
    api.gmailQueries.getGmailAccounts,
    firebaseUser ? { userId: firebaseUser.uid } : "skip"
  )

  // Fetch Gmail insights
  const gmailBatchInsights = useQuery(
    api.gmailQueries.getGmailBatchAnalysis,
    gmailAccount && gmailAccount.length > 0 && firebaseUser ? { 
      userId: firebaseUser.uid, 
      gmailAccountId: gmailAccount[0].email 
    } : "skip"
  )

  // Store Gmail analysis mutation
  const storeGmailBatchAnalysis = useMutation(api.gmailMutations.storeGmailBatchAnalysis)

  // Platform-specific insights
  const youtubeInsightsList = youtubeInsights?.analysis?.insights || []
  const instagramInsightsList = instagramInsights?.insights?.insights || []
  const gmailInsights = gmailBatchInsights?.insights?.insights || []

  // Debug logging for Gmail insights
  useEffect(() => {
    if (gmailBatchInsights) {
      console.log('🔍 Gmail Batch Insights Raw Data:', gmailBatchInsights)
      console.log('🔍 Gmail Insights Array:', gmailInsights)
      console.log('🔍 Gmail Insights Count:', gmailInsights.length)
      if (gmailInsights.length > 0) {
        console.log('🔍 Gmail Insight Titles:', gmailInsights.map(insight => insight.title))
      }
    }
  }, [gmailBatchInsights, gmailInsights])

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (youtubeRefreshing) {
      // Set initial quote
      setCurrentQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
      
      // Change quote every 5 seconds while refreshing
      interval = setInterval(() => {
        setCurrentQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
      }, 4000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [youtubeRefreshing]);

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
    if (!firebaseUser || !instagramAccount?.instagramAccountId) {
      setInstagramError('Instagram account not connected')
      return
    }

    setInstagramRefreshing(true)
    setInstagramError(null)
    
    try {
      const apiKey = await getApiKey()
      if (!apiKey) {
        throw new Error('You are not authenticated. Please log in again.')
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      
      const response = await fetch(`${backendUrl}/api/v1/instagram/account-insights`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          user_id: firebaseUser.uid,
          instagram_account_id: instagramAccount.instagramAccountId,
          max_posts: instagramPostLimit === 'all' ? 1000 : instagramPostLimit,
          include_stories: true,
          include_comments: true,
          force_refresh: true
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }
      
      if (data.status === 'success') {
        await storeInstagramAnalysis({
          userId: firebaseUser.uid,
          instagramAccountId: instagramAccount.instagramAccountId,
          insights: data.data
        })
      } else {
        throw new Error(data.error || 'Failed to refresh Instagram insights')
      }
    } catch (error: any) {
      console.error('Error refreshing Instagram insights:', error)
      setInstagramError(error.message || 'Failed to refresh Instagram insights')
    } finally {
      setInstagramRefreshing(false)
    }
  }

  const handleGmailRefresh = async () => {
    if (!firebaseUser || !gmailAccount || gmailAccount.length === 0) {
      setGmailError('Gmail account not connected')
      return
    }

    setGmailRefreshing(true)
    setGmailError(null)
    
    try {
      const apiKey = await getApiKey()
      if (!apiKey) {
        throw new Error('You are not authenticated. Please log in again.')
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      
      const response = await fetch(`${backendUrl}/api/v1/gmail/account-insights`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          user_id: firebaseUser.uid,
          gmail_account_id: gmailAccount[0].email,
          max_threads: gmailThreadLimit === 'all' ? 1000 : gmailThreadLimit,
          max_messages: 100,
          include_spam_analysis: true,
          force_refresh: true,
          analysis_mode: "individual"
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }
      
      if (data.status === 'success') {
        await storeGmailBatchAnalysis({
          userId: firebaseUser.uid,
          gmailAccountId: gmailAccount[0].email,
          insights: data.data
        })
      } else {
        throw new Error(data.error || 'Failed to refresh Gmail insights')
      }
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
    disabled = false,
    showPostLimitSelector = false,
    isGmail = false
  }: {
    platform: string
    isRefreshing: boolean
    error: string | null
    onRefresh: () => void
    disabled?: boolean
    showPostLimitSelector?: boolean
    isGmail?: boolean
  }) => {
    const presetOptions = [
      { value: 10, label: '10', time: '~1 min', icon: '⚡' },
      { value: 20, label: '20', time: '~2 min', icon: '🚀' },
      { value: 50, label: '50', time: '~5 min', icon: '💪' },
      { value: 100, label: '100', time: '~10 min', icon: '🔥' },
      { value: 'all' as const, label: 'All', time: 'varies', icon: '🌟' }
    ]

    // Use Gmail-specific state if it's Gmail platform
    const currentLimit = isGmail ? gmailThreadLimit : instagramPostLimit
    const setCurrentLimit = isGmail ? setGmailThreadLimit : setInstagramPostLimit
    const customLimit = isGmail ? customGmailLimit : customPostLimit
    const setCustomLimit = isGmail ? setCustomGmailLimit : setCustomPostLimit
    const showCustom = isGmail ? showGmailCustomInput : showCustomInput
    const setShowCustom = isGmail ? setShowGmailCustomInput : setShowCustomInput

    const handleCustomSubmit = () => {
      const customValue = parseInt(customLimit)
      if (customValue && customValue > 0 && customValue <= 1000) {
        setCurrentLimit(customValue)
        setShowCustom(false)
        setCustomLimit('')
      }
    }

    const getEstimatedTime = (limit: number | 'all') => {
      if (limit === 'all') return 'varies'
      if (typeof limit === 'number') {
        return `~${Math.ceil(limit / 10)} min`
      }
      return '~5 min'
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
          {/* Post limit selector for Instagram */}
          {showPostLimitSelector && (
            <div className="flex-1 max-w-xl">
              <div className="mb-2">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Analysis Depth
                </h3>
              </div>
              
              {/* Preset Options - Liquid Glass inspired design */}
              <div className="grid grid-cols-5 gap-1.5 mb-3">
                {presetOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setCurrentLimit(option.value)
                      setShowCustom(false)
                    }}
                    disabled={isRefreshing}
                    className={`relative group p-2 rounded-lg border transition-all duration-200 ${
                      currentLimit === option.value
                        ? 'border-heycontent-yellow bg-heycontent-light-yellow/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-heycontent-yellow/50'
                    } ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="text-center">
                      <div className="text-sm mb-0.5">{option.icon}</div>
                      <div className={`font-medium text-xs ${
                        currentLimit === option.value 
                          ? 'text-gray-900 dark:text-white' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {option.label}
                      </div>
                    </div>
                    
                    {/* Selection indicator */}
                    {currentLimit === option.value && (
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-heycontent-yellow rounded-full flex items-center justify-center">
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Input Toggle */}
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setShowCustom(!showCustom)}
                  disabled={isRefreshing}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                    showCustom
                      ? 'bg-heycontent-light-yellow text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  } ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Settings className="w-3 h-3" />
                  Custom
                </button>

                {/* Current Selection Display */}
                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                  <Zap className="w-3 h-3 text-heycontent-yellow" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {currentLimit === 'all' ? 'All items' : `${currentLimit} items`}
                  </span>
                </div>
              </div>

              {/* Custom Input Field */}
              {showCustom && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <input
                      id="custom-limit"
                      type="number"
                      min="1"
                      max="1000"
                      value={customLimit}
                      onChange={(e) => setCustomLimit(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCustomSubmit()}
                      placeholder="e.g., 75"
                      disabled={isRefreshing}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-1 focus:ring-heycontent-yellow focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      onClick={handleCustomSubmit}
                      disabled={!customLimit || isRefreshing || parseInt(customLimit) < 1 || parseInt(customLimit) > 1000}
                      className="px-3 py-1 bg-heycontent-yellow hover:bg-heycontent-yellow/90 text-black text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Refresh Button */}
          <div className="flex-shrink-0">
            <button
              onClick={onRefresh}
              disabled={isRefreshing || disabled}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isRefreshing || disabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
                  : 'bg-gray-100 hover:bg-heycontent-light-yellow text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>
                {isRefreshing ? 'Analyzing...' : 
                 disabled ? 'Coming Soon' :
                 `Refresh ${platform}`}
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
          </div>
        )}
      </div>
    )
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
                
                  YouTube ({youtubeInsightsList.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="instagram" 
                  className="flex items-center gap-2"
                >
                  <Instagram className="w-4 h-4" />
                  Instagram ({instagramInsightsList.length})
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
                  <div className="text-center py-12 px-4">
                    <RefreshCw className="w-12 h-12 text-text-gray animate-spin mx-auto mb-6" />
                    <h3 className="text-lg font-medium text-text-dark dark:text-white mb-2">
                      Refreshing YouTube insights...
                    </h3>
                    <p className="text-text-gray dark:text-gray-400 max-w-md mx-auto">
                      {currentQuote || motivationalQuotes[0]}
                    </p>
                    <div className="mt-4 text-sm text-text-gray/60 dark:text-gray-500">
                      This may take a few moments
                    </div>
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
                  disabled={!firebaseUser || !instagramAccount?.instagramAccountId}
                  showPostLimitSelector={true}
                />
                
                {instagramRefreshing ? (
                  <div className="text-center py-12 px-4">
                    <RefreshCw className="w-12 h-12 text-text-gray animate-spin mx-auto mb-6" />
                    <h3 className="text-lg font-medium text-text-dark dark:text-white mb-2">
                      Refreshing Instagram insights...
                    </h3>
                    <p className="text-text-gray dark:text-gray-400 max-w-md mx-auto">
                      {currentQuote || motivationalQuotes[0]}
                    </p>
                    <div className="mt-4 text-sm text-text-gray/60 dark:text-gray-500">
                      This may take a few moments
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {instagramInsightsList.length === 0 && !instagramError && (
                      <div className="text-center text-gray-400">No Instagram insights available.</div>
                    )}
                    {instagramInsightsList.map((insight, idx) => (
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
                  disabled={!firebaseUser || !gmailAccount || gmailAccount.length === 0}
                  showPostLimitSelector={true}
                  isGmail={true}
                />
                
                {gmailRefreshing ? (
                  <div className="text-center py-12 px-4">
                    <RefreshCw className="w-12 h-12 text-text-gray animate-spin mx-auto mb-6" />
                    <h3 className="text-lg font-medium text-text-dark dark:text-white mb-2">
                      Refreshing Gmail insights...
                    </h3>
                    <p className="text-text-gray dark:text-gray-400 max-w-md mx-auto">
                      {currentQuote || motivationalQuotes[0]}
                    </p>
                    <div className="mt-4 text-sm text-text-gray/60 dark:text-gray-500">
                      This may take a few moments
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {!gmailAccount || gmailAccount.length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Gmail Not Connected
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
                          Connect your Gmail account to get strategic insights about brand partnerships, media opportunities, and business inquiries in your inbox.
                        </p>
                        <button 
                          onClick={() => window.location.href = '/dashboard/settings/integrations'}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-heycontent-yellow hover:bg-heycontent-yellow/90 text-black rounded-lg font-medium transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          Connect Gmail
                        </button>
                      </div>
                    ) : gmailInsights.length === 0 && !gmailError ? (
                      <div className="text-center text-gray-400">No Gmail insights available.</div>
                    ) : (
                      gmailInsights.map((insight, idx) => (
                        <InsightCard
                          key={idx}
                          {...insight}
                          expanded={expandedGmail === idx}
                          onExpand={() => setExpandedGmail(expandedGmail === idx ? null : idx)}
                        />
                      ))
                    )}
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