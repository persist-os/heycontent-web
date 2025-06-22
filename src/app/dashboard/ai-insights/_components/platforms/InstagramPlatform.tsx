'use client'

import React, { useState } from 'react'
import { Instagram } from 'lucide-react'
import { InsightCard } from '../InsightCard'
import { useInstagramInsights } from '../hooks/useInstagramInsights'
import { RefreshState } from '@/components/ui/refresh-state'
import { Skeleton } from '@/components/ui/skeleton'
import { AnalysisDepthPicker } from '../AnalysisDepthPicker'
import { PlatformConnectionPrompt } from '../../../_components/content-hub/PlatformConnectionPrompt'

interface InstagramPlatformProps {
  userId?: string
  currentQuote: string
  loading: boolean
}

export function InstagramPlatform({ userId, currentQuote, loading }: InstagramPlatformProps) {
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null)
  
  const { 
    insights, 
    refreshing, 
    error, 
    isConnected, 
    refresh,
    // Post limit controls
    postLimit,
    setPostLimit,
    customPostLimit,
    setCustomPostLimit,
    showCustomInput,
    setShowCustomInput,
    handleCustomSubmit
  } = useInstagramInsights(userId)

  // Handle Instagram not connected state
  if (!isConnected) {
    return (
      <PlatformConnectionPrompt
        platformName="Instagram"
        platformIcon={
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <Instagram className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
        }
        description="Connect your Instagram account to view detailed analytics, track content performance, and get insights on your content strategy."
        buttonColor="bg-gradient-to-r from-purple-500 to-pink-500"
        buttonHoverColor="hover:from-purple-600 hover:to-pink-600"
      />
    )
  }

  return (
    <div className="space-y-6">
      <AnalysisDepthPicker
        platform="Instagram"
        isRefreshing={refreshing}
        error={error}
        onRefresh={refresh}
        disabled={!userId || !isConnected}
        postLimit={postLimit}
        setPostLimit={setPostLimit}
        customPostLimit={customPostLimit}
        setCustomPostLimit={setCustomPostLimit}
        showCustomInput={showCustomInput}
        setShowCustomInput={setShowCustomInput}
        handleCustomSubmit={handleCustomSubmit}
      />
      
      {loading ? (
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
          title="Refreshing Instagram insights..."
          quote={currentQuote}
        />
      ) : (
        <div className="grid gap-6">
          {(insights || []).length === 0 && !error && (
            <div className="text-center text-gray-400">No Instagram insights available.</div>
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