'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreateNoteButton } from '@/components/ui/CreateNoteButton'
import { RefreshCw, Instagram, Mail, Sparkles, MessageSquare, Plus } from 'lucide-react'
import { YouTubeBrandIcon } from '@/lib/YoutubeBrandIcon'
import { ContentHubInsight } from '@/convex/contentHub'
import { ContentHubConnectionOverlay } from './ContentHubConnectionOverlay'
import { useRouter } from 'next/navigation'

interface ContentHubInsightsUIProps {
  // Data
  insight?: ContentHubInsight
  hasMinimumPlatforms: boolean
  connectedPlatforms: string[]
  
  // State
  refreshing?: boolean
  disabled?: boolean
  
  // Event handlers
  onRefresh?: () => void
  onDiscuss?: (content: string, title: string) => void
  onGenerate?: () => void
}

export function ContentHubInsightsUI({
  insight,
  hasMinimumPlatforms,
  connectedPlatforms,
  refreshing = false,
  disabled = false,
  onRefresh,
  onDiscuss,
  onGenerate
}: ContentHubInsightsUIProps) {
  const router = useRouter()
  const [showConnectionOverlay, setShowConnectionOverlay] = useState(!hasMinimumPlatforms)

  // Update overlay visibility when platform connection status changes
  useEffect(() => {
    if (!hasMinimumPlatforms) {
      setShowConnectionOverlay(true)
    }
  }, [hasMinimumPlatforms])
  
  const handleRefresh = () => {
    if (!disabled && onRefresh) {
      onRefresh()
    }
  }

  const handleGenerate = () => {
    if (!disabled && onGenerate) {
      onGenerate()
    }
  }

  const handleDiscuss = (content: string, title: string) => {
    if (!disabled && onDiscuss) {
      onDiscuss(content, title)
    }
  }

  const handleConnectPlatforms = () => {
    router.push('/settings?tab=integrations')
  }

  const handleDismissOverlay = () => {
    setShowConnectionOverlay(false)
  }



  // Show empty state if no insights yet (but NEVER in preview/disabled mode)
  if (!insight && !disabled) {
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
              onClick={handleGenerate}
              disabled={disabled || refreshing}
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

  return (
    <div className="mb-6 relative">
      <Card className={`border-2 border-transparent shadow-sm hover:shadow-lg hover:shadow-gray-500/10 transition-all duration-300 overflow-hidden ${showConnectionOverlay ? 'opacity-75 pointer-events-none' : ''}`}>
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                Content Hub Insights
                {!hasMinimumPlatforms && (
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                    Preview
                  </span>
                )}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Cross-platform remix opportunities from your recent activity
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={disabled || refreshing}
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
                      disabled={disabled}
                    />
                    <Button
                      onClick={() => handleDiscuss(insight.remix_insight, 'Content Remix Opportunity')}
                      size="sm"
                      variant="ghost"
                      disabled={disabled}
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
                        disabled={disabled}
                      />
                      <Button
                        onClick={() => handleDiscuss(insight.smartnote_summary, 'Smart Note Summary')}
                        size="sm"
                        variant="ghost"
                        disabled={disabled}
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
                        disabled={disabled}
                      />
                      <Button
                        onClick={() => handleDiscuss(insight.conversation_starter, 'Conversation Starter')}
                        size="sm"
                        variant="ghost"
                        disabled={disabled}
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
                onDiscuss={handleDiscuss}
                glowColor="hover:shadow-red-500/25 hover:border-red-500/30"
                disabled={disabled}
              />

              {/* Instagram Section */}
              <PlatformInsightCard
                platform="Instagram"
                icon={<Instagram className="w-4 h-4 text-gray-600" />}
                hook={insight.instagram_hook}
                format={insight.instagram_format}
                cta={insight.instagram_cta}
                onDiscuss={handleDiscuss}
                glowColor="hover:shadow-pink-500/25 hover:border-pink-500/30"
                disabled={disabled}
              />

              {/* Gmail Section */}
              <PlatformInsightCard
                platform="Gmail"
                icon={<Mail className="w-4 h-4 text-gray-600" />}
                hook={insight.gmail_hook}
                format={insight.gmail_format}
                cta={insight.gmail_cta}
                onDiscuss={handleDiscuss}
                glowColor="hover:shadow-blue-500/25 hover:border-blue-500/30"
                disabled={disabled}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Connection Overlay */}
      <ContentHubConnectionOverlay
        isVisible={showConnectionOverlay}
        onDismiss={handleDismissOverlay}
        onConnect={handleConnectPlatforms}
        connectedPlatforms={connectedPlatforms}
      />
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
  disabled?: boolean
}

function PlatformInsightCard({ platform, icon, hook, format, cta, onDiscuss, glowColor, disabled = false }: PlatformInsightCardProps) {
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
          content={`Hook: ${hook}\n\nFormat: ${format}\n\nCall to Action: ${cta}`}
          className="text-xs"
          disabled={disabled}
        />
        <Button
          onClick={() => onDiscuss(`Hook: ${hook}\n\nFormat: ${format}\n\nCall to Action: ${cta}`, `${platform} Content Strategy`)}
          size="sm"
          variant="ghost"
          disabled={disabled}
          className="text-xs hover:bg-heycontent-purple hover:text-white dark:hover:bg-gray-800 dark:hover:text-gray-100"
        >
          <MessageSquare className="w-3 h-3" />
          Discuss
        </Button>
      </div>
    </div>
  )
} 