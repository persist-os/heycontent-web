'use client'

import React, { useState, useEffect } from 'react'
import { InsightCard } from '@/components/content/InsightCard'
import { useGmailInsights } from '../hooks/useGmailInsights'
import { useInsightNavigation } from '../hooks/useInsightNavigation'
import { RefreshState } from '@/components/ui/refresh-state'
import { Skeleton } from '@/components/ui/skeleton'
import { AnalysisDepthPicker } from '../AnalysisDepthPicker'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlatformConnectionPrompt } from '../../../_components/content-hub/PlatformConnectionPrompt'

interface GmailPlatformProps {
  userId?: string
  currentQuote: string
  loading: boolean
}

export function GmailPlatform({ userId, currentQuote, loading }: GmailPlatformProps) {
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null)
  const { navigateWithInsight } = useInsightNavigation()
  
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
  } = useGmailInsights(userId)

  const handleRefreshOrConnect = () => {
    if (!isConnected) {
      window.location.href = '/settings?tab=integrations';
    } else {
      refresh();
    }
  };

  // Handle Gmail not connected state
  if (!isConnected) {
    return (
      <PlatformConnectionPrompt
        platformName="Gmail"
        platformIcon={
          <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
            <Mail className="w-full h-full text-blue-500" />
          </div>
        }
        description="Connect your Gmail account to view detailed analytics, track email performance, and get insights on your communication strategy."
        buttonColor="bg-blue-600"
        buttonHoverColor="hover:bg-blue-700"
      />
    )
  }

  return (
    <div className="space-y-6">
      {!refreshing && (
        <AnalysisDepthPicker
          platform="Gmail"
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
      )}
      
      {!refreshing && (
        !isConnected ? (
          <div className="text-center py-12 px-4">
            <Mail className="w-16 h-16 mx-auto mb-4 text-blue-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Connect Your Gmail Account
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
              Connect your Gmail account to view detailed analytics, track email performance, 
              and get insights on your communication strategy.
            </p>
            <Button 
              onClick={() => window.location.href = '/settings?tab=integrations'}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Mail className="w-4 h-4" />
              Connect Gmail
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
        ) : (
          <div className="grid gap-6">
            {(insights || []).length === 0 && !error && (
              <div className="text-center text-gray-400">No Gmail insights available.</div>
            )}
            {(insights || []).map((insight, idx) => (
              <InsightCard
                key={idx}
                title={insight.title}
                platform="gmail"
                impact={insight.impact}
                whyNow={insight.whyNow}
                actionSteps={insight.actionSteps}
                expectedOutcome={insight.expectedOutcome}
                sourceDetails={insight.sourceDetails}
                relatedItems={insight.relatedItems}
                expanded={expandedInsight === idx}
                onExpand={() => setExpandedInsight(expandedInsight === idx ? null : idx)}
                onDiscuss={() => {
                  navigateWithInsight(insight, 'gmail');
                }}
              />
            ))}
          </div>
        )
      )}
    </div>
  )
} 