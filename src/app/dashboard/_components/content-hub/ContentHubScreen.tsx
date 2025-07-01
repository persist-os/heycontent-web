'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Instagram, Mail, BarChart3, Brain, Settings, Sparkles, RefreshCw, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/app/context/auth-context'
import { RefreshState } from '@/components/ui/refresh-state'
import { ProgressInsightsState } from '@/components/ui/progress-insights-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { YouTubeBrandIcon } from '@/lib/YoutubeBrandIcon'
import { useYouTubeRefresh } from '@/app/hooks/useYouTubeRefresh'
import { toast } from 'react-hot-toast'

// Analytics components and hooks
import { YouTubePlatform as YouTubeAnalyticsPlatform } from '../../content-analytics/platforms/YouTubePlatform'
import { InstagramPlatform as InstagramAnalyticsPlatform } from '../../content-analytics/platforms/InstagramPlatform'
import { GmailPlatform as GmailAnalyticsPlatform } from '../../content-analytics/platforms/GmailPlatform'
import { useYouTubeAnalytics } from '../../content-analytics/hooks/useYouTubeAnalytics'
import { useInstagramAnalytics } from '../../content-analytics/hooks/useInstagramAnalytics'
import { useGmailAnalytics } from '../../content-analytics/hooks/useGmailAnalytics'
import { YouTubeCard } from '../../content-analytics/cards/YouTubeCard'
import { InstagramCard } from '../../content-analytics/cards/InstagramCard'
import { GmailCard } from '../../content-analytics/cards/GmailCard'
import { GmailModal } from '../../content-analytics/modals/GmailModal'
import { InstagramModal } from '../../content-analytics/modals/InstagramModal'
import { YoutubeModal } from '../../content-analytics/modals/YoutubeModal'
import { AnyContentItem, YouTubeContentItem, InstagramContentItem, GmailContentItem } from '../../content-analytics/types'
import { sortContent } from '../../content-analytics/utils'

// Insights components and hooks
import { YouTubePlatform as YouTubeInsightsPlatform } from '../../ai-insights/_components/platforms/YouTubePlatform'
import { InstagramPlatform as InstagramInsightsPlatform } from '../../ai-insights/_components/platforms/InstagramPlatform'
import { GmailPlatform as GmailInsightsPlatform } from '../../ai-insights/_components/platforms/GmailPlatform'
import { useYouTubeInsights } from '../../ai-insights/_components/hooks/useYouTubeInsights'
import { useInstagramInsights } from '../../ai-insights/_components/hooks/useInstagramInsights'
import { useGmailInsights } from '../../ai-insights/_components/hooks/useGmailInsights'
import { InsightCard } from '../../ai-insights/_components/InsightCard'
import { ContentCardSkeleton } from './ContentCardSkeleton'
import { InsightCardSkeleton } from '../../ai-insights/_components/InsightCardSkeleton'

import { useRouter, useSearchParams } from 'next/navigation'
import { ContentHubInsights } from './ContentHubInsights'

type PlatformType = 'all' | 'youtube' | 'instagram' | 'gmail'
type ViewType = 'hub-insights' | 'all' | 'youtube' | 'instagram' | 'gmail'
type DataType = 'posts' | 'ai-insights'

const platformOptions = [
  { value: 'hub-insights', label: 'Content Hub Insights', icon: <Sparkles className="w-4 h-4" /> },
  { value: 'all', label: 'All Platforms', icon: <BarChart3 className="w-4 h-4" /> },
  { value: 'youtube', label: 'YouTube', icon: <YouTubeBrandIcon href="https://youtube.com/" className="w-4 h-4" /> },
  { value: 'instagram', label: 'Instagram', icon: <Instagram className="w-4 h-4" /> },
  { value: 'gmail', label: 'Gmail', icon: <Mail className="w-4 h-4" /> },
];

export function ContentHubScreen() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const contentIdParam = searchParams.get('contentId')
  const analyticsIdParam = searchParams.get('analyticsId')
  const platformParam = searchParams.get('platform')
  const insightParam = searchParams.get('insight') // e.g., ?insight=open
  const fromChat = searchParams.get('fromChat') === 'true'
  
  const [selectedView, setSelectedView] = useState<ViewType>(
    analyticsIdParam && platformParam ? (platformParam as ViewType) :
    tabParam === 'posts' ? 'all' : 
    tabParam === 'analytics' ? 'all' : // Legacy support
    tabParam === 'ai-insights' ? 'all' :
    tabParam === 'hub-insights' ? 'hub-insights' : // Support direct navigation
    'hub-insights' // Default to Content Hub Insights as home
  )
  const [selectedDataType, setSelectedDataType] = useState<DataType>(
    // Set to posts when coming from analytics
    analyticsIdParam ? 'posts' : 'posts'
  )
  const [selectedContent, setSelectedContent] = useState<AnyContentItem | null>(null)
  const [currentQuote, setCurrentQuote] = useState<string>('')
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const [expandHubInsight, setExpandHubInsight] = useState(false);
  const { refreshAll: refreshAllYouTube, loading: refreshingYouTube, error: refreshYouTubeError, success: refreshYouTubeSuccess } = useYouTubeRefresh();
  
  const { firebaseUser, authLoading } = useAuth()
  const userId = firebaseUser?.uid
  const router = useRouter()

  // Analytics hooks
  const youtubeAnalytics = useYouTubeAnalytics(userId)
  const instagramAnalytics = useInstagramAnalytics(userId)
  const gmailAnalytics = useGmailAnalytics(userId)

  // Insights hooks
  const youtubeInsights = useYouTubeInsights(userId)
  const instagramInsights = useInstagramInsights(userId)
  const gmailInsights = useGmailInsights(userId)

  // Motivational quotes for insights
  const motivationalQuotes = [
    "Create because it's fun. Create because it helps people. Create because it gives you a sense of accomplishment. Create like nobody's watching and you might be surprised how many do. — Matt D'Avella",
    "When creating content, be the best answer on the internet. — Andy Crestodina",
    "We need to stop interrupting what people are interested in and be what people are interested in. — Craig Davis",
    "I don't create content for a specific type of audience; I just share my life and whatever resonates with people is what draws them to me. — Nara Smith",
    "The artists today that are making it realize that it's about creating a continuous engagement with their fans. — Daniel Ek",
    "Without big data, you are blind and deaf and in the middle of a freeway. — Geoffrey Moore",
    "Data is the new oil. — Clive Humby",
    "Data helps solve problems. — Anne Wojcicki",
    "Data visualization is language. It's a means to convey an opinion or argument. — Kim Rees"
  ]

  useEffect(() => {
    // Set initial quote
    setCurrentQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)])
    
    // Change quote every 4 seconds
    const interval = setInterval(() => {
      setCurrentQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)])
    }, 4000)
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [])

  // Global refresh state management
  const isAnyPlatformRefreshing = useMemo(() => {
    return youtubeInsights.refreshing || instagramInsights.refreshing || gmailInsights.refreshing;
  }, [youtubeInsights.refreshing, instagramInsights.refreshing, gmailInsights.refreshing]);

  // Get all platforms that are currently refreshing for better messaging
  const getRefreshingPlatforms = useCallback(() => {
    const refreshing = []
    if (youtubeInsights.refreshing) refreshing.push('YouTube')
    if (instagramInsights.refreshing) refreshing.push('Instagram')
    if (gmailInsights.refreshing) refreshing.push('Gmail')
    
    if (refreshing.length === 0) return 'platforms'
    if (refreshing.length === 1) return refreshing[0]
    if (refreshing.length === 2) return `${refreshing[0]} and ${refreshing[1]}`
    return `${refreshing.slice(0, -1).join(', ')}, and ${refreshing[refreshing.length - 1]}`
  }, [youtubeInsights.refreshing, instagramInsights.refreshing, gmailInsights.refreshing])



  // Combined data for "all" tab analytics
  const allContentItems = useMemo(() => {
    if (!userId) return []
    return [
      ...(youtubeAnalytics.items || []),
      ...(gmailAnalytics.gmailItems || []),
      ...(instagramAnalytics.items || []),
    ]
  }, [userId, youtubeAnalytics.items, gmailAnalytics.gmailItems, instagramAnalytics.items])

  // Sort items by date for "all" tab
  const allDisplayItems = useMemo(() => {
    return sortContent(allContentItems, 'date')
  }, [allContentItems])

  // Combined insights for "all" tab
  const allInsights = useMemo(() => {
    // Hooks return insights as direct arrays
    const youtubeInsightsArray = Array.isArray(youtubeInsights.insights) ? youtubeInsights.insights : [];
    const instagramInsightsArray = Array.isArray(instagramInsights.insights) ? instagramInsights.insights : [];
    const gmailInsightsArray = Array.isArray(gmailInsights.insights) ? gmailInsights.insights : [];
    
    const combined = [
      ...youtubeInsightsArray,
      ...instagramInsightsArray,
      ...gmailInsightsArray,
    ];
    
    return combined;
  }, [youtubeInsights.insights, instagramInsights.insights, gmailInsights.insights])

  const isAnalyticsLoading = youtubeAnalytics.loading || instagramAnalytics.loading || gmailAnalytics.loading
  const isInsightsLoading = youtubeInsights.loading || instagramInsights.loading || gmailInsights.loading

  // Open content modal if contentId is present in query
  useEffect(() => {
    if (contentIdParam && allDisplayItems.length > 0) {
      const found = allDisplayItems.find(item => String(item.id) === String(contentIdParam));
      if (found) {
        setSelectedView('all');
        setSelectedDataType('posts');
        setSelectedContent(found);
      }
    }
  }, [contentIdParam, allDisplayItems]);

  // Helper to clear contentId from URL
  const clearContentIdFromUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    params.delete('contentId');
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newUrl);
  }, [router]);

  // Helper to clear analytics parameters from URL
  const clearAnalyticsFromUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    params.delete('analyticsId');
    params.delete('platform');
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newUrl);
  }, [router]);

  // Handle analytics navigation - show notification or highlight when coming from timeline
  useEffect(() => {
    if (analyticsIdParam && platformParam) {
      // Clear analytics params after a short delay to clean up URL
      const timeout = setTimeout(() => {
        clearAnalyticsFromUrl();
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [analyticsIdParam, platformParam, clearAnalyticsFromUrl]);

  // Open Content Hub Insights tab and expand if ?tab=hub-insights or ?insight=open
  useEffect(() => {
    if (tabParam === 'hub-insights' || insightParam === 'open') {
      setSelectedView('hub-insights');
      setExpandHubInsight(true);
    }
  }, [tabParam, insightParam]);

  // Always show the main layout, even if not authenticated or loading
  // If not authenticated, pass empty userId and show empty data
  const safeUserId = userId || '';

  const discussContent = async (item: AnyContentItem) => {
    try {
      // Create a compact context object to avoid URL length issues
      const context = {
        platform: item.platform,
        contentId: item.id,
        analysis: (item as any).aiAnalysis || null,
        title: item.platform === 'youtube'
          ? (item as YouTubeContentItem).content.title
          : item.platform === 'instagram'
            ? (item as InstagramContentItem).content?.text
            : (item as GmailContentItem).content?.data?.subject || 'Email Thread',
        thumbnailUrl: item.platform === 'youtube'
          ? (item as YouTubeContentItem).content?.thumbnailUrl
          : item.platform === 'instagram'
            ? (item as InstagramContentItem).content?.mediaUrl
            : undefined,
        publishedAt: item.publishedAt,
        metrics: item.metrics,
        // For Gmail, create a compact content object with only essential fields
        content: item.platform === 'gmail' ? {
          data: {
            subject: (item as GmailContentItem).content?.data?.subject || 'No Subject',
            from: (item as GmailContentItem).content?.data?.from || 'Unknown Sender',
            snippet: (item as GmailContentItem).content?.data?.snippet || 'No preview available',
            threadId: (item as GmailContentItem).content?.data?.threadId || (item as GmailContentItem).id,
            emailId: (item as GmailContentItem).content?.data?.emailId || (item as GmailContentItem).id,
            // Don't include the full payload to avoid URL length issues
          }
        } : item.content
      }
      
      const encodedContext = encodeURIComponent(JSON.stringify(context))
      
      // Check if the URL would be too long (browsers typically limit to ~2000 chars)
      const baseUrl = `/dashboard/chat?contentContext=`
      const fullUrl = baseUrl + encodedContext
      
      if (fullUrl.length > 1900) {
        // If URL is too long, create a minimal context
        const minimalContext = {
          platform: item.platform,
          contentId: item.id,
          title: context.title,
          publishedAt: item.publishedAt,
        }
        const minimalEncoded = encodeURIComponent(JSON.stringify(minimalContext))
        router.push(`/dashboard/chat?contentContext=${minimalEncoded}`)
      } else {
        router.push(fullUrl)
      }
    } catch (error) {
      router.push('/dashboard/chat')
    }
  }

  // Check if any platforms are connected for "all platforms" view
  const hasAnyPlatformConnected = youtubeAnalytics.isConnected || instagramAnalytics.isConnected || gmailAnalytics.hasConnectedAccounts;

  const renderAllPlatformsAnalytics = () => {
    // If no platforms are connected, show connection prompt
    if (!hasAnyPlatformConnected) {
      return (
        <div className="flex items-center justify-center min-h-[400px] px-4">
          <Card className="p-6 sm:p-8 max-w-md w-full bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl text-center">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
            
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
              Connect Your Platforms
            </h3>
            
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm leading-relaxed">
              Connect your YouTube, Instagram, and Gmail accounts to view detailed analytics, track content performance, and get insights on your content strategy.
            </p>
            
            <Button 
              onClick={() => router.push('/settings?tab=integrations')}
              className="w-full py-3 px-4 sm:px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Settings className="w-4 h-4" />
              Go to Integrations
            </Button>
            
            <div className="mt-3 sm:mt-4 text-xs text-gray-500">
              You can connect platforms in Settings → Integrations
            </div>
          </Card>
        </div>
      )
    }

    if (isAnalyticsLoading && allDisplayItems.length === 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <ContentCardSkeleton key={index} />
          ))}
        </div>
      )
    }

    if (allDisplayItems.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {allDisplayItems.map((item, index) => {
            const uniqueKey = `${item.platform}-${item.id}-${index}`
            const commonProps = {
              onDiscussContent: () => discussContent(item),
              onViewDetailedAnalytics: () => setSelectedContent(item)
            }
            
            if (item.platform === 'instagram') {
              return <InstagramCard key={item.id} {...commonProps} item={item as InstagramContentItem} userId={firebaseUser.uid} />
            }
            if (item.platform === 'youtube') {
              return <YouTubeCard key={uniqueKey} {...commonProps} item={item as YouTubeContentItem} />
            }
            if (item.platform === 'gmail') {
              return <GmailCard key={uniqueKey} {...commonProps} item={item as GmailContentItem} />
            }
            return null
          })}
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <Card className="p-6 sm:p-8 max-w-md w-full bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>
          
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
            No Content Found
          </h3>
          
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm leading-relaxed">
            We couldn't find any content in your connected platforms. Create new content to see your analytics here.
          </p>
        </Card>
      </div>
    )
  }

  const renderAllPlatformsInsights = () => {
    // If no platforms are connected, show connection prompt
    if (!hasAnyPlatformConnected) {
      return (
        <div className="flex items-center justify-center min-h-[400px] px-4">
          <Card className="p-6 sm:p-8 max-w-md w-full bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl text-center">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
            
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
              Connect Your Platforms
            </h3>
            
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm leading-relaxed">
              Connect your YouTube, Instagram, and Gmail accounts to receive AI-powered insights, strategic recommendations, and content performance analysis.
            </p>
            
            <Button 
              onClick={() => router.push('/settings?tab=integrations')}
              className="w-full py-3 px-4 sm:px-6 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Settings className="w-4 h-4" />
              Go to Integrations
            </Button>
            
            <div className="mt-3 sm:mt-4 text-xs text-gray-500">
              You can connect platforms in Settings → Integrations
            </div>
          </Card>
        </div>
      )
    }

    if (isInsightsLoading && allInsights.length === 0) {
      return (
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <InsightCardSkeleton key={index} />
          ))}
        </div>
      )
    }

    if (allInsights.length > 0) {
      return (
        <div className="grid gap-6">
          {allInsights.map((insight, idx) => {
            const insightId = `${insight.platform}-${idx}`;
            return (
              <InsightCard
                key={insightId}
                {...insight}
                expanded={expandedInsight === insightId}
                onExpand={() => setExpandedInsight(expandedInsight === insightId ? null : insightId)}
              />
            );
          })}
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <Card className="p-6 sm:p-8 max-w-md w-full bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
              <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>
          
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
            No Insights Available
          </h3>
          
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm leading-relaxed">
            We couldn't find any insights from your connected platforms. Create new content to receive AI-powered insights and recommendations.
          </p>
        </Card>
      </div>
    )
  }

  // Handler for Refresh All YouTube
  const handleRefreshAllYouTube = async () => {
    if (!userId) return;
    await refreshAllYouTube(userId);
  };

  // Show toast for refresh success/error
  useEffect(() => {
    if (refreshYouTubeSuccess) {
      toast.success('YouTube refresh started! Navigate freely while we process your data');
    }
  }, [refreshYouTubeSuccess]);

  useEffect(() => {
    if (refreshYouTubeError) {
      toast.error(refreshYouTubeError);
    }
  }, [refreshYouTubeError]);

  return (
    <div className="relative bg-background">
      {/* Fixed Header */}
      <div className="shrink-0 px-6 py-4 bg-background border-b border-border">
        <div className="flex justify-between items-center">
          <div className="w-[100px] sm:w-[24px] flex items-center">
            {fromChat && (
              <Button variant="ghost" onClick={() => router.push('/dashboard/chat')} className="p-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Chat
              </Button>
            )}
          </div>
          <div className="flex-1 flex justify-center">
            <div className="text-center">
              <h1 className="text-base font-medium text-purple-600 dark:text-accent">Content Hub</h1>
              <p className="text-muted-foreground">
                <span className="hidden sm:inline">Your unified content analytics and AI insights dashboard</span>
              </p>
            </div>
          </div>
          <div className="w-[100px] sm:w-auto"></div>
        </div>
      </div>

      {/* Refresh Notification Banner */}
      {isAnyPlatformRefreshing && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-purple-200 dark:border-purple-800">
          <div className="px-6 py-3">
            <div className="flex items-center justify-center gap-3 text-sm">
              <RefreshCw className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-spin" />
              <span className="text-purple-700 dark:text-purple-300 font-medium">
                Refreshing {getRefreshingPlatforms()} insights...
              </span>
              <span className="text-purple-600 dark:text-purple-400">
                Navigate freely while we process your data
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Main Navigation - Content Hub Insights + Platform Selection */}
            <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as ViewType)} className="w-full">
              {/* Mobile Select */}
              <div className="sm:hidden px-1 mb-4">
                <Select value={selectedView} onValueChange={(value) => setSelectedView(value as ViewType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        {platformOptions.find(p => p.value === selectedView)?.icon}
                        <span>{platformOptions.find(p => p.value === selectedView)?.label}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {platformOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          {option.icon}
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop Tabs */}
              <TabsList className="hidden sm:grid w-full grid-cols-5 mb-0">
                {platformOptions.map(option => (
                  <TabsTrigger key={option.value} value={option.value} className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Content Hub Insights - Home Screen */}
              <TabsContent value="hub-insights" className="space-y-6">
                <ContentHubInsights userId={safeUserId} forceExpand={expandHubInsight} />
              </TabsContent>

              {/* Platform-based content - Posts and AI Insights */}
              {(selectedView === 'all' || selectedView === 'youtube' || selectedView === 'instagram' || selectedView === 'gmail') && (
                <div className="space-y-0">
                  <Tabs value={selectedDataType} onValueChange={(value) => setSelectedDataType(value as DataType)} className="w-full">
                    <TabsList className="mb-6 flex w-full flex-row sm:grid sm:grid-cols-2">
                      <TabsTrigger value="posts" className="flex flex-1 items-center justify-center gap-2 sm:flex-initial">
                        <BarChart3 className="w-4 h-4" />
                        Posts ({
                          selectedView === 'all' ? allDisplayItems.length :
                          selectedView === 'youtube' ? youtubeAnalytics.items.length :
                          selectedView === 'instagram' ? instagramAnalytics.items.length :
                          gmailAnalytics.gmailItems.length
                        })
                      </TabsTrigger>
                      <TabsTrigger value="ai-insights" className="flex flex-1 items-center justify-center gap-2 sm:flex-initial">
                        <Brain className="w-4 h-4" />
                        AI Insights ({
                          selectedView === 'all' ? allInsights.length :
                          selectedView === 'youtube' ? (youtubeInsights.insights || []).length :
                          selectedView === 'instagram' ? (instagramInsights.insights || []).length :
                          (gmailInsights.insights || []).length
                        })
                      </TabsTrigger>
                    </TabsList>

                    {/* Posts Screen */}
                    <TabsContent value="posts" className="space-y-6">
                      {selectedView === 'all' && renderAllPlatformsAnalytics()}
                      {selectedView === 'youtube' && selectedDataType === 'posts' && (
                        <>
                          <div className="mb-4 flex items-center gap-4">
                            <Button
                              onClick={handleRefreshAllYouTube}
                              disabled={refreshingYouTube}
                              className="bg-gradient-to-r from-red-500 to-yellow-500 text-white font-semibold px-4 py-2 rounded-lg shadow hover:from-red-600 hover:to-yellow-600 transition"
                            >
                              {refreshingYouTube ? 'Refreshing...' : 'Refresh All YouTube'}
                            </Button>
                          </div>
                          <YouTubeAnalyticsPlatform userId={userId} isConnected={youtubeAnalytics.isConnected} error={youtubeAnalytics.error} />
                        </>
                      )}
                      {selectedView === 'instagram' && (
                        <InstagramAnalyticsPlatform 
                          userId={userId} 
                          {...instagramAnalytics}
                        />
                      )}
                      {selectedView === 'gmail' && (
                        <GmailAnalyticsPlatform 
                          userId={userId}
                          {...gmailAnalytics}
                        />
                      )}
                    </TabsContent>

                    {/* AI Insights Screen */}
                    <TabsContent value="ai-insights" className="space-y-6">
                      {selectedView === 'all' && renderAllPlatformsInsights()}
                      {selectedView === 'youtube' && (
                        <>
                          {youtubeInsights.refreshing && (
                            <div className="mb-4">
                              <ProgressInsightsState
                                title="Analyzing YouTube content..."
                                quote={currentQuote}
                                subtitle="Navigating freely while we process your data"
                                progress={youtubeInsights.status?.progress || 0}
                                platform="youtube"
                              />
                            </div>
                          )}
                          <YouTubeInsightsPlatform 
                            userId={userId} 
                            currentQuote={currentQuote} 
                            loading={youtubeInsights.loading} 
                          />
                        </>
                      )}
                      {selectedView === 'instagram' && (
                        <>
                          {instagramInsights.refreshing && (
                            <div className="mb-4">
                              <ProgressInsightsState
                                title="Analyzing Instagram content..."
                                quote={currentQuote}
                                subtitle="Navigating freely while we process your data"
                                progress={instagramInsights.status?.progress || 0}
                                platform="instagram"
                              />
                            </div>
                          )}
                          <InstagramInsightsPlatform 
                            userId={userId} 
                            currentQuote={currentQuote} 
                            loading={instagramInsights.loading} 
                          />
                        </>
                      )}
                      {selectedView === 'gmail' && (
                        <>
                          {gmailInsights.refreshing && (
                            <div className="mb-4">
                              <ProgressInsightsState
                                title="Analyzing Gmail content..."
                                quote={currentQuote}
                                subtitle="Navigating freely while we process your data"
                                progress={gmailInsights.status?.progress || 0}
                                platform="gmail"
                              />
                            </div>
                          )}
                          <GmailInsightsPlatform 
                            userId={userId} 
                            currentQuote={currentQuote} 
                            loading={gmailInsights.loading} 
                          />
                        </>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </Tabs>
          </div>
        </div>
      </div>

      {/* Modals for "all" tab posts */}
      {selectedContent && selectedView === 'all' && selectedDataType === 'posts' && (
        <>
          {selectedContent.platform === 'gmail' && (
            <GmailModal
              selectedContent={selectedContent as GmailContentItem}
              onClose={() => {
                setSelectedContent(null);
                clearContentIdFromUrl();
              }}
            />
          )}
          {selectedContent.platform === 'instagram' && (
            <InstagramModal
              selectedContent={selectedContent as InstagramContentItem}
              onClose={() => {
                setSelectedContent(null);
                clearContentIdFromUrl();
              }}
              onDiscussContent={() => discussContent(selectedContent)}
            />
          )}
          {selectedContent.platform === 'youtube' && (
            <YoutubeModal
              selectedContent={selectedContent as YouTubeContentItem}
              onClose={() => {
                setSelectedContent(null);
                clearContentIdFromUrl();
              }}
              onDiscussContent={() => discussContent(selectedContent)}
            />
          )}
        </>
      )}
    </div>
  )
} 