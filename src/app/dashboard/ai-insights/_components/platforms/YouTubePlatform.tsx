'use client'

import React, { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, Settings } from 'lucide-react'
import { InsightCard } from '../InsightCard'
import { useYouTubeInsights } from '../hooks/useYouTubeInsights'
import { YouTubeBrandIcon } from '../../../../../lib/YoutubeBrandIcon'
import { RefreshState } from '@/components/ui/refresh-state'
import { Skeleton } from '@/components/ui/skeleton'

interface YouTubePlatformProps {
  userId?: string
  currentQuote: string
  loading: boolean
}

export function YouTubePlatform({ userId, currentQuote, loading }: YouTubePlatformProps) {
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null)
  
  const { insights, refreshing, error, isConnected, refresh } = useYouTubeInsights(userId)

  // Tab-specific refresh controls component
  const TabRefreshControls = ({ 
    platform, 
    isRefreshing, 
    error, 
    onRefresh, 
    disabled = false
  }: {
    platform: string
    isRefreshing: boolean
    error: string | null
    onRefresh: () => void
    disabled?: boolean
  }) => (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
        {/* Refresh Button */}
        <div className="flex-shrink-0 ml-auto">
          <button
            onClick={onRefresh}
            disabled={isRefreshing || disabled}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isRefreshing || disabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
                : 'bg-gray-100 hover:bg-heycontent-light-yellow text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>
              {isRefreshing ? 'Analyzing...' : 
               disabled ? 'Coming Soon' :
               `Refresh ${platform}`}
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
        </div>
      )}
    </div>
  )

  // Handle YouTube not connected state
  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
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
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <TabRefreshControls
        platform="YouTube"
        isRefreshing={refreshing}
        error={error}
        onRefresh={refresh}
        disabled={!userId || !isConnected}
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
          title="Refreshing YouTube insights..."
          quote={currentQuote}
        />
      ) : (
        <div className="grid gap-6">
          {insights.length === 0 && !error && (
            <div className="text-center text-gray-400">No YouTube insights available.</div>
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