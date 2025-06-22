'use client'

import React, { useState, useEffect } from 'react'
import { InsightCard } from '../InsightCard'
import { useYouTubeInsights } from '../hooks/useYouTubeInsights'
import { RefreshState } from '@/components/ui/refresh-state'
import { Skeleton } from '@/components/ui/skeleton'
import { AnalysisDepthPicker } from '../AnalysisDepthPicker'
import { YouTubeBrandIcon } from '../../../../../lib/YoutubeBrandIcon'
import { Button } from '@/components/ui/button'
import { PlatformConnectionPrompt } from '../../../_components/content-hub/PlatformConnectionPrompt'

interface YouTubePlatformProps {
  userId?: string
  currentQuote: string
  loading: boolean
}

export function YouTubePlatform({ userId, currentQuote, loading }: YouTubePlatformProps) {
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null)
  
  const { 
    insights, 
    refreshing, 
    error, 
    isConnected, 
    refresh,
    postLimit,
    setPostLimit,
    customPostLimit,
    setCustomPostLimit,
    showCustomInput,
    setShowCustomInput,
    handleCustomSubmit
  } = useYouTubeInsights(userId)

  const handleRefreshOrConnect = () => {
    if (!isConnected) {
      window.location.href = '/settings?tab=integrations';
    } else {
      refresh();
    }
  };

  // Tab-specific refresh controls component
  

  // Handle YouTube not connected state
  if (!isConnected) {
    return (
      <PlatformConnectionPrompt
        platformName="YouTube"
        platformIcon={
          <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
            <YouTubeBrandIcon href="https://youtube.com/" className="w-full h-full" />
          </div>
        }
        description="Connect your YouTube account to view detailed analytics, track video performance, and get insights on your content strategy."
        buttonColor="bg-red-600"
        buttonHoverColor="hover:bg-red-700"
      />
    )
  }

  return (
    <div className="space-y-6">
      <AnalysisDepthPicker
        platform="YouTube"
        isRefreshing={refreshing}
        error={error}
        onRefresh={handleRefreshOrConnect}
        disabled={!userId}
        postLimit={postLimit}
        setPostLimit={setPostLimit}
        customPostLimit={customPostLimit}
        setCustomPostLimit={setCustomPostLimit}
        showCustomInput={showCustomInput}
        setShowCustomInput={setShowCustomInput}
        handleCustomSubmit={handleCustomSubmit}
      />
      
      {!isConnected ? (
        <div className="text-center py-12 px-4">
          <YouTubeBrandIcon href="https://youtube.com/" className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Connect Your YouTube Channel
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
            Connect your YouTube channel to view detailed analytics, track video performance, 
            and get insights on your content strategy.
          </p>
          <Button 
            onClick={() => window.location.href = '/settings?tab=integrations'}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            <YouTubeBrandIcon href="https://youtube.com/" className="w-4 h-4" />
            Connect YouTube
          </Button>
        </div>
      ) : loading ? (
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
      ) : refreshing ? (
        <RefreshState
          title="Refreshing YouTube insights..."
          quote={currentQuote}
        />
      ) : (
        <div className="grid gap-6">
          {(insights || []).length === 0 && !error && (
            <div className="text-center text-gray-400">No YouTube insights available.</div>
          )}
          {(insights || []).map((insight, idx) => (
            <InsightCard
              key={idx}
              {...insight}
              expanded={expandedInsight === idx}
              onExpand={() => setExpandedInsight(expandedInsight === idx ? null : idx)}
            />
          ))}
        </div>
      )}
    </div>
  )
} 