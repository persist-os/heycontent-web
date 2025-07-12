'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateNoteButton } from '@/components/ui/CreateNoteButton'
import { RefreshCw, Instagram, Mail, Sparkles, MessageSquare, Plus } from 'lucide-react'
import { YouTubeBrandIcon } from '@/lib/YoutubeBrandIcon'
import { useContentHubInsights } from './hooks/useContentHubInsights'
import { useRouter } from 'next/navigation'
import { ContentHubInsight } from '@/convex/contentHub'
import { useContentContextActions } from '@/store/content-context-store'

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

          {/* Main Remix Insight */}
          <div className="space-y-4">
            {refreshing ? (
              <div className="flex flex-col items-center justify-center py-8 w-full">
                <div className="relative w-64 h-8 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-60 animate-pulse"></div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed text-center">
                  Generating cross-platform insights...
                </p>
              </div>
            ) : (
              <>
                <div className="border-2 border-transparent rounded-lg p-4 hover:shadow-xl hover:shadow-purple-500/25 hover:border-purple-500/30 transition-all duration-300">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Remix Opportunity</h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{insight.remix_insight}</p>
                  <div className="flex gap-2 mt-3">
                    <CreateNoteButton
                      content={insight.remix_insight}
                      className="text-xs"
                    />
                    <Button
                      onClick={() => discussInsight(insight.remix_insight, 'Content Remix Opportunity')}
                      size="sm"
                      variant="ghost"
                      className="text-xs hover:bg-heycontent-purple hover:text-white dark:hover:bg-gray-800 dark:hover:text-gray-100"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Discuss
                    </Button>
                  </div>
                </div>

                {/* Smart Note Summary */}
                {insight.smartnote_summary && (
                  <div className="border-2 border-transparent rounded-lg p-4 hover:shadow-xl hover:shadow-blue-500/25 hover:border-blue-500/30 transition-all duration-300">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Smart Note Summary</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{insight.smartnote_summary}</p>
                    <div className="flex gap-2 mt-3">
                      <CreateNoteButton
                        content={insight.smartnote_summary}
                        className="text-xs"
                      />
                      <Button
                        onClick={() => discussInsight(insight.smartnote_summary, 'Smart Note Summary')}
                        size="sm"
                        variant="ghost"
                        className="text-xs hover:bg-heycontent-purple hover:text-white dark:hover:bg-gray-800 dark:hover:text-gray-100"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Discuss
                      </Button>
                    </div>
                  </div>
                )}

                {/* Conversation Starter */}
                {insight.conversation_starter && (
                  <div className="border-2 border-transparent rounded-lg p-4 hover:shadow-xl hover:shadow-green-500/25 hover:border-green-500/30 transition-all duration-300">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      Conversation Starter
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">{insight.conversation_starter}</p>
                    <div className="flex gap-2">
                      <CreateNoteButton
                        content={insight.conversation_starter}
                        className="text-xs"
                      />
                      <Button
                        onClick={() => discussInsight(insight.conversation_starter, 'Conversation Starter')}
                        size="sm"
                        variant="ghost"
                        className="text-xs hover:bg-heycontent-purple hover:text-white dark:hover:bg-gray-800 dark:hover:text-gray-100"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Discuss
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Platform-Specific Sections - Always Expanded */}
        {!refreshing && (
          <div className="border-t border-border">
            <div className="px-6 py-3">
              <span className="text-sm font-medium text-foreground">Platform-Specific Hooks & Formats</span>
            </div>

            <div className="px-6 pb-6 space-y-4">
              {/* YouTube Section */}
              <PlatformInsightCard
                platform="YouTube"
                icon={<YouTubeBrandIcon href="https://youtube.com/" className="w-8 h-8" />}
                hook={insight.youtube_hook}
                format={insight.youtube_format}
                cta={insight.youtube_cta}
                onDiscuss={discussInsight}
                glowColor="hover:shadow-red-500/25 hover:border-red-500/30"
              />

              {/* Instagram Section */}
              <PlatformInsightCard
                platform="Instagram"
                icon={<Instagram className="w-4 h-4 text-gray-600" />}
                hook={insight.instagram_hook}
                format={insight.instagram_format}
                cta={insight.instagram_cta}
                onDiscuss={discussInsight}
                glowColor="hover:shadow-pink-500/25 hover:border-pink-500/30"
              />

              {/* Gmail Section */}
              <PlatformInsightCard
                platform="Gmail"
                icon={<Mail className="w-4 h-4 text-gray-600" />}
                hook={insight.gmail_hook}
                format={insight.gmail_format}
                cta={insight.gmail_cta}
                onDiscuss={discussInsight}
                glowColor="hover:shadow-blue-500/25 hover:border-blue-500/30"
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

interface PlatformInsightCardProps {
  platform: string
  icon: React.ReactNode
  hook: string
  format: string
  cta: string
  onDiscuss: (content: string, title: string) => void
  glowColor: string
}

function PlatformInsightCard({ platform, icon, hook, format, cta, onDiscuss, glowColor }: PlatformInsightCardProps) {
  return (
    <div className={`border-2 border-transparent rounded-lg p-4 space-y-3 hover:shadow-xl ${glowColor} transition-all duration-300`}>
      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        {icon}
        {platform}
      </h4>
      
      <div className="space-y-3">
        {hook && (
          <div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Hook</span>
            <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">{hook}</p>
          </div>
        )}
        
        {format && (
          <div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Format</span>
            <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">{format}</p>
          </div>
        )}
        
        {cta && (
          <div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Call to Action</span>
            <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">{cta}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-3 pt-3 border-t border-border">
        <CreateNoteButton
          content={`${platform} Content:\n\nHook: ${hook}\n\nFormat: ${format}\n\nCTA: ${cta}`}
          className="text-xs"
        />
        <Button
          onClick={() => onDiscuss(`${platform} Content:\n\nHook: ${hook}\n\nFormat: ${format}\n\nCTA: ${cta}`, `${platform} Content Strategy`)}
          size="sm"
          variant="ghost"
          className="text-xs hover:bg-heycontent-purple hover:text-white dark:hover:bg-gray-800 dark:hover:text-gray-100"
        >
          <MessageSquare className="w-3 h-3" />
          Discuss
        </Button>
      </div>
    </div>
  )
} 