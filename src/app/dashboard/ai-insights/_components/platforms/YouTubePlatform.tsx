'use client'

import React, { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, Settings } from 'lucide-react'
import { InsightCard } from '../InsightCard'
import { useYouTubeInsights } from '../hooks/useYouTubeInsights'
import { YouTubeBrandIcon } from '../../../_components/YoutubeBrandIcon'

interface YouTubePlatformProps {
  userId?: string
  currentQuote: string
}

export function YouTubePlatform({ userId, currentQuote }: YouTubePlatformProps) {
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null)
  
  const { insights, loading, refreshing, error, isConnected, refresh } = useYouTubeInsights(userId)

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
      <div className="text-center py-12 px-4">
        <div className="w-12 h-12 text-gray-300 mx-auto mb-4 flex items-center justify-center">
          <YouTubeBrandIcon href="https://youtube.com/" className="w-12 h-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          YouTube Not Connected
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
          Connect your YouTube channel to get strategic insights about content performance, 
          audience engagement, and growth opportunities.
        </p>
        <button 
          onClick={() => window.location.href = '/settings?tab=integrations'}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
        >
          <YouTubeBrandIcon href="https://youtube.com/" className="w-4 h-4" />
          Connect YouTube
        </button>
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
      
      {refreshing ? (
        <div className="text-center py-12 px-4">
          <RefreshCw className="w-12 h-12 text-text-gray animate-spin mx-auto mb-6" />
          <h3 className="text-lg font-medium text-text-dark dark:text-white mb-2">
            Refreshing YouTube insights...
          </h3>
          <p className="text-text-gray dark:text-gray-400 max-w-md mx-auto">
            {currentQuote}
          </p>
          <div className="mt-4 text-sm text-text-gray/60 dark:text-gray-500">
            This may take a few moments
          </div>
        </div>
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