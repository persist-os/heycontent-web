'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Instagram, Mail, BarChart3, Brain, Sparkles } from 'lucide-react'
import { useAuth } from '@/app/context/auth-context'
import { RefreshState } from '@/components/ui/refresh-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { YouTubeBrandIcon } from '@/lib/YoutubeBrandIcon'

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

import { useRouter, useSearchParams } from 'next/navigation'
import { ContentHubInsights } from './ContentHubInsights'

type PlatformType = 'all' | 'youtube' | 'instagram' | 'gmail'
type ViewType = 'hub-insights' | 'all' | 'youtube' | 'instagram' | 'gmail'
type DataType = 'posts' | 'ai-insights'

export function ContentHubScreen() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  
  const [selectedView, setSelectedView] = useState<ViewType>(
    tabParam === 'posts' ? 'all' : 
    tabParam === 'analytics' ? 'all' : // Legacy support
    tabParam === 'ai-insights' ? 'all' :
    'hub-insights' // Default to Content Hub Insights as home
  )
  const [selectedDataType, setSelectedDataType] = useState<DataType>('posts')
  const [selectedContent, setSelectedContent] = useState<AnyContentItem | null>(null)
  const [currentQuote, setCurrentQuote] = useState<string>('')
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  
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

  // Combined data for "all" tab analytics
  const allContentItems = useMemo(() => {
    if (!userId) return []
    return [
      ...youtubeAnalytics.items,
      ...gmailAnalytics.items,
      ...instagramAnalytics.items,
    ]
  }, [userId, youtubeAnalytics.items, gmailAnalytics.items, instagramAnalytics.items])

  // Sort items by date for "all" tab
  const allDisplayItems = useMemo(() => {
    return sortContent(allContentItems, 'date')
  }, [allContentItems])

  // Combined insights for "all" tab
  const allInsights = useMemo(() => {
    return [
      ...youtubeInsights.insights,
      ...instagramInsights.insights,
      ...gmailInsights.insights,
    ]
  }, [youtubeInsights.insights, instagramInsights.insights, gmailInsights.insights])

  const isAnalyticsLoading = youtubeAnalytics.loading || instagramAnalytics.loading || gmailAnalytics.loading
  const isInsightsLoading = youtubeInsights.loading || instagramInsights.loading || gmailInsights.loading

  if (!firebaseUser || !userId) {
    return (
      <RefreshState
        title="Authenticating..."
        quote="Verifying your credentials"
      />
    )
  }

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
      console.error('Error creating discussion context:', error)
      router.push('/dashboard/chat')
    }
  }

  const renderAllPlatformsAnalytics = () => {
    if (isAnalyticsLoading && allDisplayItems.length === 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col space-y-4">
              <Skeleton className="h-40 w-full rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            </div>
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
        <Card className="p-6 sm:p-8 max-w-md w-full bg-card shadow-lg rounded-2xl text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>
          
          <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">
            No Content Found
          </h3>
          
          <p className="text-muted-foreground mb-4 sm:mb-6 text-sm leading-relaxed">
            Connect your social accounts and email to start seeing content analytics here.
          </p>
          
          <div className="mt-3 sm:mt-4 text-xs text-muted-foreground">
            Connect YouTube, Instagram, and Gmail in Settings
          </div>
        </Card>
      </div>
    )
  }

  const renderAllPlatformsInsights = () => {
    if (isInsightsLoading && allInsights.length === 0) {
      return (
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col space-y-4">
              <Skeleton className="h-5 w-3/4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
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
        <Card className="p-6 sm:p-8 max-w-md w-full bg-card shadow-lg rounded-2xl text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
              <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>
          
          <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">
            No Insights Available
          </h3>
          
          <p className="text-muted-foreground mb-4 sm:mb-6 text-sm leading-relaxed">
            Connect your accounts and create content to start receiving AI-powered insights and recommendations.
          </p>
          
          <div className="mt-3 sm:mt-4 text-xs text-muted-foreground">
            AI insights are generated from your connected platforms
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative bg-background">
      {/* Fixed Header */}
      <div className="shrink-0 px-6 py-4 bg-background border-b border-border">
        <div className="flex justify-between items-center">
          <div className="w-[100px] sm:w-[24px]"></div>
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Main Navigation - Content Hub Insights + Platform Selection */}
            <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as ViewType)} className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-0">
                <TabsTrigger value="hub-insights" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Content Hub Insights
                </TabsTrigger>
                <TabsTrigger value="all" className="flex items-center gap-2">
                  All Platforms
                </TabsTrigger>
                <TabsTrigger value="youtube" className="flex items-center gap-2">
                  <YouTubeBrandIcon href="#" className="w-4 h-4" />
                  YouTube
                </TabsTrigger>
                <TabsTrigger value="instagram" className="flex items-center gap-2">
                  <Instagram className="w-4 h-4" />
                  Instagram
                </TabsTrigger>
                <TabsTrigger value="gmail" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Gmail
                </TabsTrigger>
              </TabsList>

              {/* Content Hub Insights - Home Screen */}
              <TabsContent value="hub-insights" className="space-y-6">
                <ContentHubInsights userId={userId} />
              </TabsContent>

              {/* Platform-based content - Posts and AI Insights */}
              {(selectedView === 'all' || selectedView === 'youtube' || selectedView === 'instagram' || selectedView === 'gmail') && (
                <div className="space-y-0">
                  <Tabs value={selectedDataType} onValueChange={(value) => setSelectedDataType(value as DataType)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="posts" className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Posts ({
                          selectedView === 'all' ? allDisplayItems.length :
                          selectedView === 'youtube' ? youtubeAnalytics.items.length :
                          selectedView === 'instagram' ? instagramAnalytics.items.length :
                          gmailAnalytics.items.length
                        })
                      </TabsTrigger>
                      <TabsTrigger value="ai-insights" className="flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        AI Insights ({
                          selectedView === 'all' ? allInsights.length :
                          selectedView === 'youtube' ? youtubeInsights.insights.length :
                          selectedView === 'instagram' ? instagramInsights.insights.length :
                          gmailInsights.insights.length
                        })
                      </TabsTrigger>
                    </TabsList>

                    {/* Posts Screen */}
                    <TabsContent value="posts" className="space-y-6">
                      {selectedView === 'all' && renderAllPlatformsAnalytics()}
                      
                      {selectedView === 'youtube' && (
                        <YouTubeAnalyticsPlatform 
                          userId={userId} 
                          {...youtubeAnalytics} 
                        />
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
                        <YouTubeInsightsPlatform 
                          userId={userId} 
                          currentQuote={currentQuote} 
                          loading={youtubeInsights.loading} 
                        />
                      )}
                      
                      {selectedView === 'instagram' && (
                        <InstagramInsightsPlatform 
                          userId={userId} 
                          currentQuote={currentQuote} 
                          loading={instagramInsights.loading} 
                        />
                      )}
                      
                      {selectedView === 'gmail' && (
                        <GmailInsightsPlatform 
                          userId={userId} 
                          currentQuote={currentQuote} 
                          loading={gmailInsights.loading} 
                        />
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
              onClose={() => setSelectedContent(null)}
              onDiscussContent={() => discussContent(selectedContent)}
            />
          )}
          {selectedContent.platform === 'instagram' && (
            <InstagramModal
              selectedContent={selectedContent as InstagramContentItem}
              onClose={() => setSelectedContent(null)}
              onDiscussContent={() => discussContent(selectedContent)}
            />
          )}
          {selectedContent.platform === 'youtube' && (
            <YoutubeModal
              selectedContent={selectedContent as YouTubeContentItem}
              onClose={() => setSelectedContent(null)}
              onDiscussContent={() => discussContent(selectedContent)}
            />
          )}
        </>
      )}
    </div>
  )
} 