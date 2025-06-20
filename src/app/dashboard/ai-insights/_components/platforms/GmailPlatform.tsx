'use client'

import React, { useState } from 'react'
import { Mail } from 'lucide-react'
import { InsightCard } from '../InsightCard'
import { useGmailInsights } from '../hooks/useGmailInsights'
import { RefreshState } from '@/components/ui/refresh-state'
import { Skeleton } from '@/components/ui/skeleton'
import { AnalysisDepthPicker } from '../AnalysisDepthPicker'

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
      <div className="text-center py-12 px-4">
        <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Gmail Not Connected
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
          Connect your Gmail account to get strategic insights about brand partnerships, media opportunities, and business inquiries in your inbox.
        </p>
        <button 
          onClick={() => window.location.href = '/settings?tab=integrations'}
          className="inline-flex items-center gap-2 px-4 py-2 bg-heycontent-yellow hover:bg-heycontent-yellow/90 text-black rounded-lg font-medium transition-colors"
        >
          <Mail className="w-4 h-4" />
          Connect Gmail
        </button>
      </div>
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
          {insights.length === 0 && !error ? (
            <div className="text-center text-gray-400">No Gmail insights available.</div>
          ) : (
            insights.map((insight, idx) => (
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