'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw, Instagram, Mail, Sparkles, Plus } from 'lucide-react'
import { YouTubeBrandIcon } from '@/lib/YoutubeBrandIcon'
import { useContentHubInsights } from './hooks/useContentHubInsights'
import { useRouter } from 'next/navigation'
import { ContentHubInsight } from '@/convex/contentHub'
import { useContentContextActions } from '@/store/content-context-store'
import { InsightCard } from '@/components/content/InsightCard'

interface ContentHubInsightsProps {
  userId: string
  forceExpand?: boolean
}

export function ContentHubInsights({ userId, forceExpand }: ContentHubInsightsProps) {
  const router = useRouter()
  const { setAIInsightsContext } = useContentContextActions()
  const {
    latestInsight,
    refreshing,
    generateNewInsights,
    hasMinimumPlatforms,
    connectedPlatforms,
    error,
    dataBundle
  } = useContentHubInsights(userId)

  const isLoading = dataBundle === undefined

  const handleGenerateInsights = async () => {
    await generateNewInsights()
  }

  const discussInsight = (content: string, title: string) => {
    // Set the AI insights context in the store
    const insightContext = {
      title: title,
      content: content,
      insight: content, // Also set as insight for backwards compatibility
      source: 'Content Hub Insights',
      timestamp: Date.now(),
      type: 'content-hub-insight'
    }
    
    console.log('🔍 [CONTENT HUB] Setting AI insights context:', insightContext);
    setAIInsightsContext(insightContext)
    
    // Small delay to ensure context is set before navigation
    setTimeout(() => {
      console.log('🔍 [CONTENT HUB] Navigating to chat');
      router.push('/dashboard/chat')
    }, 100);
  }

  // Show skeleton while data is loading
  if (isLoading) {
    return (
      <div className="mb-6">
        <Card className="p-6 border-2 border-transparent shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-9 w-20" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </Card>
      </div>
    )
  }

  // Show connection prompt if minimum platforms not connected
  if (!hasMinimumPlatforms) {
    return (
      <div className="mb-6">
        <Card className="p-6 border-2 border-transparent shadow-sm">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Plus className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Connect Your Platforms
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 max-w-md mx-auto">
              Connect at least 2 platforms to unlock cross-platform content insights and remix opportunities.
            </p>
            <div className="flex justify-center gap-4 text-xs text-gray-500">
              <div className={`flex items-center gap-1 ${connectedPlatforms.includes('youtube') ? 'text-gray-900 dark:text-gray-100' : ''}`}>
                <YouTubeBrandIcon href="https://youtube.com/" className="w-5 h-5" />
                YouTube {connectedPlatforms.includes('youtube') ? '✓' : ''}
              </div>
              <div className={`flex items-center gap-1 ${connectedPlatforms.includes('instagram') ? 'text-gray-900 dark:text-gray-100' : ''}`}>
                <Instagram className="w-4 h-4" />
                Instagram {connectedPlatforms.includes('instagram') ? '✓' : ''}
              </div>
              <div className={`flex items-center gap-1 ${connectedPlatforms.includes('gmail') ? 'text-gray-900 dark:text-gray-100' : ''}`}>
                <Mail className="w-4 h-4" />
                Gmail {connectedPlatforms.includes('gmail') ? '✓' : ''}
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Show empty state if no insights yet
  if (!latestInsight) {
    return (
      <div className="mb-6">
        <Card className="p-6 border-2 border-transparent shadow-sm hover:shadow-lg hover:shadow-gray-500/10 transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                Content Hub Insights
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Generate cross-platform remix opportunities from your content
              </p>
            </div>
            <Button
              onClick={handleGenerateInsights}
              disabled={refreshing}
              size="sm"
              className="bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-black"
            >
              {refreshing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Generate
            </Button>
          </div>
          <div className="text-center py-8">
            <div className="w-16 h-16 border-2 border-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">
              Your first cross-platform insights will appear here
            </p>
          </div>
        </Card>
      </div>
    )
  }

  const insight = latestInsight.insight

  // Transform content hub insight data to InsightCard format
  const insightCardProps = {
    title: "Content Hub Insight",
    platform: 'content-hub' as const,
    remixInsight: insight.remix_insight,
    smartNoteSummary: insight.smartnote_summary,
    conversationStarter: insight.conversation_starter,
    youtubeHook: insight.youtube_hook,
    youtubeFormat: insight.youtube_format,
    youtubeCta: insight.youtube_cta,
    instagramHook: insight.instagram_hook,
    instagramFormat: insight.instagram_format,
    instagramCta: insight.instagram_cta,
    gmailHook: insight.gmail_hook,
    gmailFormat: insight.gmail_format,
    gmailCta: insight.gmail_cta,
    expanded: forceExpand || false,
    showPlatformSpecific: true,
    onDiscuss: discussInsight,
    onExpand: () => {
      // Handle expand/collapse if needed
    }
  };

  return (
    <div className="mb-6">
      <Card className="border-2 border-transparent shadow-sm hover:shadow-lg hover:shadow-gray-500/10 transition-all duration-300 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                Content Hub Insights
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Cross-platform remix opportunities from your recent activity
              </p>
            </div>
            <Button
              onClick={handleGenerateInsights}
              disabled={refreshing}
              size="sm"
              variant="ghost"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {refreshing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </Button>
          </div>

          {/* Insight Card */}
          <InsightCard {...insightCardProps} />
        </div>
      </Card>
    </div>
  )
} 