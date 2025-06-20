'use client'

import React, { useState } from 'react'
import { Instagram } from 'lucide-react'
import { InsightCard } from '../InsightCard'
import { useInstagramInsights } from '../hooks/useInstagramInsights'
import { RefreshState } from '@/components/ui/refresh-state'
import { Skeleton } from '@/components/ui/skeleton'
import { AnalysisDepthPicker } from '../AnalysisDepthPicker'

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
      <div className="text-center py-12 px-4">
        <Instagram className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Instagram Not Connected
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
          Connect your Instagram account to get strategic insights about post performance, 
          audience engagement, and growth opportunities.
        </p>
        <button 
          onClick={() => window.location.href = '/settings?tab=integrations'}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-colors"
        >
          <Instagram className="w-4 h-4" />
          Connect Instagram
        </button>
      </div>
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
          {insights.length === 0 && !error && (
            <div className="text-center text-gray-400">No Instagram insights available.</div>
          )}
          {insights.map((insight, idx) => (
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