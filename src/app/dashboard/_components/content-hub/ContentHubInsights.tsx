'use client'

import React from 'react'
import { useContentHubInsights } from './hooks/useContentHubInsights'
import { useRouter } from 'next/navigation'
import { useContentContextActions } from '@/store/content-context-store'
import { ContentHubInsightsUI } from './ContentHubInsightsUI'
import { ContentHubInsightsSkeleton } from './ContentHubInsightsSkeleton'
import { mockContentHubInsight, mockDataBundle } from './contentHubInsightsMockData'

interface ContentHubInsightsProps {
  userId: string
  forceExpand?: boolean
}

export function ContentHubInsights({ userId, forceExpand }: ContentHubInsightsProps) {
  const router = useRouter()
  const { setAIInsightsContext } = useContentContextActions()
  const {
    latestInsight,
    refreshing,
    generateNewInsights,
    hasMinimumPlatforms,
    connectedPlatforms,
    error,
    dataBundle
  } = useContentHubInsights(userId)

  const isLoading = dataBundle === undefined

  const handleGenerateInsights = async () => {
    await generateNewInsights()
  }

  const discussInsight = (content: string, title: string) => {
    // Set the AI insights context in the store
    const insightContext = {
      title: title,
      content: content,
      insight: content, // Also set as insight for backwards compatibility
      source: 'Content Hub Insights',
      timestamp: Date.now(),
      type: 'content-hub-insight'
    }
    
    console.log('🔍 [CONTENT HUB] Setting AI insights context:', insightContext);
    setAIInsightsContext(insightContext)
    
    // Small delay to ensure context is set before navigation
    setTimeout(() => {
      console.log('🔍 [CONTENT HUB] Navigating to chat');
      router.push('/dashboard/chat')
    }, 100);
  }

  // Show skeleton while data is loading
  if (isLoading) {
    return <ContentHubInsightsSkeleton isLoading={true} />
  }

  return (
    <ContentHubInsightsUI
      insight={latestInsight?.insight || mockContentHubInsight}
      hasMinimumPlatforms={hasMinimumPlatforms ?? mockDataBundle.hasMinimumPlatforms}
      connectedPlatforms={connectedPlatforms || mockDataBundle.connectedPlatforms}
      refreshing={refreshing}
      disabled={!hasMinimumPlatforms}
      onRefresh={handleGenerateInsights}
      onDiscuss={discussInsight}
      onGenerate={handleGenerateInsights}
    />
  )
} 