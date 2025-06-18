'use client'

import React, { useState } from 'react'
import { RefreshCw, AlertCircle, Settings, Zap } from 'lucide-react'
import { InsightCard } from '../InsightCard'
import { useInstagramInsights } from '../hooks/useInstagramInsights'

interface InstagramPlatformProps {
  userId?: string
  currentQuote: string
}

export function InstagramPlatform({ userId, currentQuote }: InstagramPlatformProps) {
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null)
  
  const { 
    insights, 
    loading, 
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

  // Tab-specific refresh controls component with post limit selector
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
  }) => {
    const presetOptions = [
      { value: 10, label: '10', time: '~1 min', icon: '⚡' },
      { value: 20, label: '20', time: '~2 min', icon: '🚀' },
      { value: 50, label: '50', time: '~5 min', icon: '💪' },
      { value: 100, label: '100', time: '~10 min', icon: '🔥' },
      { value: 'all' as const, label: 'All', time: 'varies', icon: '🌟' }
    ]

    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
          {/* Post limit selector */}
          <div className="flex-1 max-w-xl">
            <div className="mb-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Analysis Depth
              </h3>
            </div>
            
            {/* Preset Options - Liquid Glass inspired design */}
            <div className="grid grid-cols-5 gap-1.5 mb-3">
              {presetOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setPostLimit(option.value)
                    setShowCustomInput(false)
                  }}
                  disabled={isRefreshing}
                  className={`relative group p-2 rounded-lg border transition-all duration-200 ${
                    postLimit === option.value
                      ? 'border-heycontent-yellow bg-heycontent-light-yellow/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-heycontent-yellow/50'
                  } ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="text-center">
                    <div className="text-sm mb-0.5">{option.icon}</div>
                    <div className={`font-medium text-xs ${
                      postLimit === option.value 
                        ? 'text-gray-900 dark:text-white' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {option.label}
                    </div>
                  </div>
                  
                  {/* Selection indicator */}
                  {postLimit === option.value && (
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-heycontent-yellow rounded-full flex items-center justify-center">
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Custom Input Toggle */}
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setShowCustomInput(!showCustomInput)}
                disabled={isRefreshing}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                  showCustomInput
                    ? 'bg-heycontent-light-yellow text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                } ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Settings className="w-3 h-3" />
                Custom
              </button>

              {/* Current Selection Display */}
              <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                <Zap className="w-3 h-3 text-heycontent-yellow" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {postLimit === 'all' ? 'All items' : `${postLimit} items`}
                </span>
              </div>
            </div>

            {/* Custom Input Field */}
            {showCustomInput && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <input
                    id="custom-limit"
                    type="number"
                    min="1"
                    max="1000"
                    value={customPostLimit}
                    onChange={(e) => setCustomPostLimit(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomSubmit()}
                    placeholder="e.g., 75"
                    disabled={isRefreshing}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-1 focus:ring-heycontent-yellow focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={handleCustomSubmit}
                    disabled={!customPostLimit || isRefreshing || parseInt(customPostLimit) < 1 || parseInt(customPostLimit) > 1000}
                    className="px-3 py-1 bg-heycontent-yellow hover:bg-heycontent-yellow/90 text-black text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Refresh Button */}
          <div className="flex-shrink-0">
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
  }

  return (
    <div className="space-y-6">
      <TabRefreshControls
        platform="Instagram"
        isRefreshing={refreshing}
        error={error}
        onRefresh={refresh}
        disabled={!userId || !isConnected}
      />
      
      {refreshing ? (
        <div className="text-center py-12 px-4">
          <RefreshCw className="w-12 h-12 text-text-gray animate-spin mx-auto mb-6" />
          <h3 className="text-lg font-medium text-text-dark dark:text-white mb-2">
            Refreshing Instagram insights...
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