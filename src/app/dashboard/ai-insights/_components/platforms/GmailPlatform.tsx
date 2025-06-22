'use client'

import React, { useState } from 'react'
import { Mail } from 'lucide-react'
import { InsightCard } from '../InsightCard'
import { useGmailInsights } from '../hooks/useGmailInsights'
import { RefreshState } from '@/components/ui/refresh-state'
import { Skeleton } from '@/components/ui/skeleton'
import { AnalysisDepthPicker } from '../AnalysisDepthPicker'
import { PlatformConnectionPrompt } from '../../../_components/content-hub/PlatformConnectionPrompt'

interface GmailPlatformProps {
  userId?: string
  currentQuote: string
  loading: boolean
}

export function GmailPlatform({ userId, currentQuote, loading }: GmailPlatformProps) {
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null)
  
  const { 
    insights, 
    refreshing, 
    error, 
    isConnected, 
    refresh,
    account,
    // Thread limit controls
    threadLimit,
    setThreadLimit,
    customGmailLimit,
    setCustomGmailLimit,
    showGmailCustomInput,
    setShowGmailCustomInput,
    handleCustomSubmit
  } = useGmailInsights(userId)

  // Handle Gmail not connected state
  if (!isConnected) {
    return (
      <PlatformConnectionPrompt
        platformName="Gmail"
        platformIcon={
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-500 flex items-center justify-center">
            <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
        }
        description="Connect your Gmail account to view detailed analytics, track content performance, and get insights on your content strategy."
        buttonColor="bg-red-500"
        buttonHoverColor="hover:bg-red-600"
      />
    )
  }

  return (
    <div className="space-y-6">
      <AnalysisDepthPicker
        platform="Gmail"
        isRefreshing={refreshing}
        error={error}
        onRefresh={refresh}
        disabled={!userId || !isConnected}
        postLimit={threadLimit}
        setPostLimit={setThreadLimit}
        customPostLimit={customGmailLimit}
        setCustomPostLimit={setCustomGmailLimit}
        showCustomInput={showGmailCustomInput}
        setShowCustomInput={setShowGmailCustomInput}
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
          title="Refreshing Gmail insights..."
          quote={currentQuote}
        />
      ) : (
        <div className="grid gap-6">
          {(insights || []).length === 0 && !error ? (
            <div className="text-center text-gray-400">No Gmail insights available.</div>
          ) : (
            (insights || []).map((insight, idx) => (
              <InsightCard
                key={idx}
                {...insight}
                expanded={expandedInsight === idx}
                onExpand={() => setExpandedInsight(expandedInsight === idx ? null : idx)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
} 