'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Instagram, BarChart3, Brain, Settings, Sparkles, RefreshCw, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/app/context/auth-context'
import { RefreshState } from '@/components/ui/refresh-state'
import { ProgressInsightsState } from '@/components/ui/progress-insights-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { YouTubeBrandIcon } from '@/lib/YoutubeBrandIcon'
import { useYouTubeRefresh } from '@/app/hooks/useYouTubeRefresh'
import { toast } from 'react-hot-toast'

// Help system imports
import { HelpModal } from '@/components/ui/help-modal'
import { HelpIconButton } from '@/components/ui/help-icon-button'
import { contentHubHelp } from '@/helpContent'

// Analytics components and hooks
import { YouTubePlatform as YouTubeAnalyticsPlatform } from '../../content-analytics/platforms/YouTubePlatform'
import { InstagramPlatform as InstagramAnalyticsPlatform } from '../../content-analytics/platforms/InstagramPlatform'
import { useYouTubeAnalytics } from '../../content-analytics/hooks/useYouTubeAnalytics'
import { useInstagramAnalytics } from '../../content-analytics/hooks/useInstagramAnalytics'
import { YouTubeCard } from '../../content-analytics/cards/YouTubeCard'
import { InstagramCard } from '../../content-analytics/cards/InstagramCard'
import { InstagramModal } from '../../content-analytics/modals/InstagramModal'
import { YouTubeOverlay } from '@/components/content/overlays/YouTubeOverlay'
import { AnyContentItem, YouTubeContentItem, InstagramContentItem } from '../../content-analytics/types'
import { sortContent } from '../../content-analytics/utils'

// Insights components and hooks
import { YouTubePlatform as YouTubeInsightsPlatform } from '../../ai-insights/_components/platforms/YouTubePlatform'
import { InstagramPlatform as InstagramInsightsPlatform } from '../../ai-insights/_components/platforms/InstagramPlatform'
import { useYouTubeInsights } from '../../ai-insights/_components/hooks/useYouTubeInsights'
import { useInstagramInsights } from '../../ai-insights/_components/hooks/useInstagramInsights'
import { InsightCard } from '../../ai-insights/_components/InsightCard'
import { ContentCardSkeleton } from './ContentCardSkeleton'
import { InsightCardSkeleton } from '../../ai-insights/_components/InsightCardSkeleton'

import { useRouter, useSearchParams } from 'next/navigation'
import { ContentHubInsights } from './ContentHubInsights'

type PlatformType = 'all' | 'youtube' | 'instagram'
type ViewType = 'hub-insights' | 'all' | 'youtube' | 'instagram'
type DataType = 'posts' | 'ai-insights'

const platformOptions = [
  { value: 'hub-insights', label: 'Content Hub Insights', icon: <Sparkles className="w-4 h-4" /> },
  { value: 'all', label: 'All Platforms', icon: <BarChart3 className="w-4 h-4" /> },
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
];

export function ContentHubScreen() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const contentIdParam = searchParams.get('contentId')
  const analyticsIdParam = searchParams.get('analyticsId')
  const platformParam = searchParams.get('platform')
  const insightParam = searchParams.get('insight') // e.g., ?insight=open
  const fromChat = searchParams.get('fromChat') === 'true'
  const chatId = searchParams.get('chatId')
  
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
  const [helpOpen, setHelpOpen] = useState(false);
  const { refreshAll: refreshAllYouTube, loading: refreshingYouTube, error: refreshYouTubeError, success: refreshYouTubeSuccess } = useYouTubeRefresh();
  
  const { firebaseUser, authLoading } = useAuth()
  const userId = firebaseUser?.uid
  const router = useRouter()

  // Analytics hooks
  const youtubeAnalytics = useYouTubeAnalytics(userId)
  const instagramAnalytics = useInstagramAnalytics(userId)

  // Insights hooks
  const youtubeInsights = useYouTubeInsights(userId)
  const instagramInsights = useInstagramInsights(userId)

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
    return youtubeInsights.refreshing || instagramInsights.refreshing;
  }, [youtubeInsights.refreshing, instagramInsights.refreshing]);

  // Get all platforms that are currently refreshing for better messaging
  const getRefreshingPlatforms = useCallback(() => {
    const refreshing = []
    if (youtubeInsights.refreshing) refreshing.push('YouTube')
    if (instagramInsights.refreshing) refreshing.push('Instagram')
    
    if (refreshing.length === 0) return 'platforms'
    if (refreshing.length === 1) return refreshing[0]
    return `${refreshing[0]} and ${refreshing[1]}`
  }, [youtubeInsights.refreshing, instagramInsights.refreshing])

  // Combined data for "all" tab analytics
  const allContentItems = useMemo(() => {
    if (!userId) return []
    return [
      ...(youtubeAnalytics.items || []),
      ...(instagramAnalytics.items || []),
    ]
  }, [userId, youtubeAnalytics.items, instagramAnalytics.items])

  // Sort items by date for "all" tab
  const allDisplayItems = useMemo(() => {
    return sortContent(allContentItems, 'date')
  }, [allContentItems])

  // Combined insights for "all" tab
  const allInsights = useMemo(() => {
    // Hooks return insights as direct arrays
    const youtubeInsightsArray = Array.isArray(youtubeInsights.insights) ? youtubeInsights.insights : [];
    const instagramInsightsArray = Array.isArray(instagramInsights.insights) ? instagramInsights.insights : [];
    
    const combined = [
      ...youtubeInsightsArray,
      ...instagramInsightsArray,
    ];
    
    return combined;
  }, [youtubeInsights.insights, instagramInsights.insights])

  const isAnalyticsLoading = youtubeAnalytics.loading || instagramAnalytics.loading
  const isInsightsLoading = youtubeInsights.loading || instagramInsights.loading

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
  const clearContentIdFromUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('contentId');
    url.searchParams.delete('platform');
    window.history.replaceState({}, '', url.toString());
  };

  // Safe userId that defaults to empty string
  const safeUserId = userId || ""

  const discussContent = async (item: AnyContentItem) => {
    try {
      // Create a compact context object to avoid URL length issues
      const context = {
        platform: item.platform,
        contentId: item.id,
        analysis: (item as any).aiAnalysis || null,
        title: (item as YouTubeContentItem).content?.title || (item as InstagramContentItem).content?.text || 'Content',
        thumbnailUrl: (item as YouTubeContentItem).content?.thumbnailUrl || (item as InstagramContentItem).content?.mediaUrl,
        publishedAt: item.publishedAt,
        metrics: item.metrics,
        content: {
          title: (item as YouTubeContentItem).content?.title,
          description: (item as YouTubeContentItem).content?.description,
          text: (item as InstagramContentItem).content?.text,
          mediaUrl: (item as InstagramContentItem).content?.mediaUrl,
          thumbnailUrl: (item as YouTubeContentItem).content?.thumbnailUrl || (item as InstagramContentItem).content?.thumbnailUrl,
        }
      };
      
      const encodedContext = encodeURIComponent(JSON.stringify(context));
      
      // Check if the URL would be too long (browsers typically limit to ~2000 chars)
      const baseUrl = `/dashboard/chat?contentContext=`;
      const fullUrl = baseUrl + encodedContext;
      
      if (fullUrl.length > 1900) {
        // If URL is too long, use a more minimal context
        const minimalContext = {
          platform: item.platform,
          contentId: item.id,
          title: (item as YouTubeContentItem).content?.title || (item as InstagramContentItem).content?.text || 'Content',
          publishedAt: item.publishedAt,
        };
        const minimalEncoded = encodeURIComponent(JSON.stringify(minimalContext));
        router.push(`/dashboard/chat?contentContext=${minimalEncoded}`);
      } else {
        router.push(fullUrl);
      }
    } catch (error) {
      console.error('Error creating discussion context:', error);
      // Fallback: navigate to chat without context
      router.push('/dashboard/chat');
    }
  };

  const renderAllPlatformsAnalytics = () => {
    if (isAnalyticsLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <ContentCardSkeleton key={index} />
          ))}
        </div>
      );
    }

    if (allDisplayItems.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-[400px] px-4">
          <Card className="p-6 sm:p-8 max-w-md w-full bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl text-center">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
            
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
              Ready to Analyze Your Content?
            </h3>
            
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm leading-relaxed">
              Connect your social media accounts to see detailed analytics and insights about your content performance across platforms.
            </p>
            
            <Button 
              onClick={() => router.push('/settings?tab=platform-connect')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Settings className="w-4 h-4 mr-2" />
              Connect Platforms
            </Button>
          </Card>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {allDisplayItems.map((item, index) => {
          const uniqueKey = `${item.platform}-${item.id}-${index}`;
          
          if (item.platform === 'youtube') {
            return (
              <YouTubeCard
                key={uniqueKey}
                item={item as YouTubeContentItem}
                onDiscussContent={() => discussContent(item)}
                onViewDetailedAnalytics={() => setSelectedContent(item)}
              />
            );
          } else if (item.platform === 'instagram') {
            return (
              <InstagramCard
                key={uniqueKey}
                item={item as InstagramContentItem}
                onDiscussContent={() => discussContent(item)}
                onViewDetailedAnalytics={() => setSelectedContent(item)}
              />
            );
          }
          
          return null;
        })}
      </div>
    );
  };

  const renderAllPlatformsInsights = () => {
    if (isInsightsLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <InsightCardSkeleton key={index} />
          ))}
        </div>
      );
    }

    if (allInsights.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-[400px] px-4">
          <Card className="p-6 sm:p-8 max-w-md w-full bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl text-center">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
            
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
              No AI Insights Yet
            </h3>
            
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm leading-relaxed">
              Connect your platforms and create some content first. Our AI will analyze your content and provide personalized insights to help you grow.
            </p>
            
            <Button 
              onClick={() => router.push('/settings?tab=platform-connect')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Settings className="w-4 h-4 mr-2" />
              Get Started
            </Button>
          </Card>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allInsights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            isExpanded={expandedInsight === insight.id}
            onToggleExpanded={() => {
              setExpandedInsight(expandedInsight === insight.id ? null : insight.id);
            }}
          />
        ))}
      </div>
    );
  };

  const handleRefreshAllYouTube = async () => {
    if (refreshingYouTube) return;
    await refreshAllYouTube();
  };

  // Show error toast when refresh fails
  useEffect(() => {
    if (refreshYouTubeError) {
      const friendlyError = refreshYouTubeError.includes("401") || refreshYouTubeError.includes("unauthorized")
        ? "We need to refresh your YouTube connection. Please check your account settings and try again!"
        : `Oops! We hit a snag: ${refreshYouTubeError}. Your content is safe - please try again in a moment!`;
      
      toast.error(friendlyError);
    }
  }, [refreshYouTubeError]);

  return (
    <div className="relative bg-background">
      {/* Fixed Header */}
      <div className="shrink-0 px-6 py-4 bg-background border-b border-border">
        <div className="flex justify-between items-center">
          <div className="w-[100px] sm:w-[24px] flex items-center">
            {fromChat && (
              <Button variant="ghost" onClick={() => router.push(chatId ? `/dashboard/chat?id=${chatId}` : '/dashboard/chat')} className="p-2">
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
          <div className="w-[100px] sm:w-auto flex justify-end">
            <HelpIconButton onClick={() => setHelpOpen(true)} />
          </div>
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
                        {/* Only show icon for hub-insights and all, otherwise just label */}
                        {platformOptions.find(p => p.value === selectedView)?.icon &&
                          platformOptions.find(p => p.value === selectedView)?.icon}
                        <span>{platformOptions.find(p => p.value === selectedView)?.label}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {platformOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          {/* Only show icon for hub-insights and all, otherwise just label */}
                          {option.icon && option.icon}
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop Tabs */}
              <TabsList className="hidden sm:grid w-full grid-cols-4 mb-0">
                {platformOptions.map(option => (
                  <TabsTrigger key={option.value} value={option.value} className="flex items-center gap-2">
                    {/* Only show icon for hub-insights and all, otherwise just label */}
                    {option.icon && option.icon}
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Content Hub Insights - Home Screen */}
              <TabsContent value="hub-insights" className="space-y-6">
                <ContentHubInsights userId={safeUserId} forceExpand={expandHubInsight} />
              </TabsContent>

              {/* Platform-based content - Posts and AI Insights */}
              {(selectedView === 'all' || selectedView === 'youtube' || selectedView === 'instagram') && (
                <div className="space-y-0">
                  <Tabs value={selectedDataType} onValueChange={(value) => setSelectedDataType(value as DataType)} className="w-full">
                    <TabsList className="mb-6 flex w-full flex-row sm:grid sm:grid-cols-2">
                      <TabsTrigger value="posts" className="flex flex-1 items-center justify-center gap-2 sm:flex-initial">
                        <BarChart3 className="w-4 h-4" />
                        Posts ({
                          selectedView === 'all' ? allDisplayItems.length :
                          selectedView === 'youtube' ? youtubeAnalytics.items.length :
                          instagramAnalytics.items.length
                        })
                      </TabsTrigger>
                      <TabsTrigger value="ai-insights" className="flex flex-1 items-center justify-center gap-2 sm:flex-initial">
                        <Brain className="w-4 h-4" />
                        AI Insights ({
                          selectedView === 'all' ? allInsights.length :
                          selectedView === 'youtube' ? (youtubeInsights.insights || []).length :
                          (instagramInsights.insights || []).length
                        })
                      </TabsTrigger>
                    </TabsList>

                    {/* Posts Screen */}
                    <TabsContent value="posts" className="space-y-6">
                      {selectedView === 'all' && renderAllPlatformsAnalytics()}
                      {selectedView === 'youtube' && selectedDataType === 'posts' && (
                        <>
                          {/* Debug logging before error display */}
                          {(() => {
                            console.log('🐛 DEBUG - YouTube Error Display:', {
                              refreshYouTubeError,
                              refreshYouTubeSuccess,
                              youtubeAnalyticsError: youtubeAnalytics.error,
                              shouldShowError: !!(refreshYouTubeError && !refreshYouTubeSuccess)
                            });
                            return null;
                          })()}
                          {/* Only show error if there is an error and the last refresh was not successful */}
                          {refreshYouTubeError && !refreshYouTubeSuccess && (
                            <div className="text-red-500 text-sm mb-2 text-center">{refreshYouTubeError}</div>
                          )}
                          <YouTubeAnalyticsPlatform userId={userId} isConnected={youtubeAnalytics.isConnected} error={youtubeAnalytics.error} />
                        </>
                      )}
                      {selectedView === 'instagram' && (
                        <InstagramAnalyticsPlatform 
                          userId={userId} 
                          {...instagramAnalytics}
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
          {selectedContent.platform === 'instagram' && (
            <InstagramModal
              selectedContent={selectedContent as InstagramContentItem}
              onClose={() => {
                setSelectedContent(null);
                clearContentIdFromUrl();
              }}
            />
          )}
          {selectedContent.platform === 'youtube' && (
            <YouTubeOverlay
              videoId={selectedContent.id}
              onClose={() => {
                setSelectedContent(null);
                clearContentIdFromUrl();
              }}
              showAnalysis={true}
            />
          )}
        </>
      )}

      {/* Help Modal */}
      <HelpModal 
        open={helpOpen} 
        onClose={() => setHelpOpen(false)} 
        pages={contentHubHelp} 
      />
    </div>
  )
} 