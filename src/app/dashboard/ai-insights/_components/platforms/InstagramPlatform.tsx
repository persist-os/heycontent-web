'use client'

import React, { useState, useEffect } from 'react'
import { InsightCard } from '@/components/content/InsightCard'
import { useInstagramInsights } from '../hooks/useInstagramInsights'
import { useInsightNavigation } from '../hooks/useInsightNavigation'
import { useActionStepDiscussion } from '../hooks/useActionStepDiscussion'
import { RefreshState } from '@/components/ui/refresh-state'
import { Skeleton } from '@/components/ui/skeleton'
import { AnalysisDepthPicker } from '../AnalysisDepthPicker'
import { Instagram } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlatformConnectionPrompt } from '../../../_components/content-hub/PlatformConnectionPrompt'
import { useInstagramBreakdowns } from '../hooks/useInstagramBreakdowns'
import InstagramDemographics from '../../../content-analytics/components/InstagramDemographics'



interface InstagramPlatformProps {
  userId?: string
  currentQuote: string
  loading: boolean
}

export function InstagramPlatform({ userId, currentQuote, loading }: InstagramPlatformProps) {
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null)
  const [breakdownCollapsed, setBreakdownCollapsed] = useState(false);
  const { navigateWithInsight } = useInsightNavigation()
  const { discussActionStep } = useActionStepDiscussion()
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
  } = useInstagramInsights(userId)

  const breakdowns = useInstagramBreakdowns(userId);

  // Transform AI Insights breakdowns data to match InstagramDemographics component format
  const transformedDemographicsData = React.useMemo(() => {
    if (!breakdowns) return null;
    
    // Create a function to convert breakdown data to the expected format
    const transformBreakdownData = (breakdownKey: string) => {
      const data = breakdowns[breakdownKey];
      if (!data || !Array.isArray(data)) return [];
      
      // Each breakdown item should have a metric and values array
      return data.map(item => ({
        metric: item.metric || "engaged_audience_demographics",
        values: item.values || []
      }));
    };

    return {
      age_breakdown: transformBreakdownData('age_breakdown'),
      gender_breakdown: transformBreakdownData('gender_breakdown'),
      city_breakdown: transformBreakdownData('city_breakdown'),
      country_breakdown: transformBreakdownData('country_breakdown'),
      follow_type_breakdown: transformBreakdownData('follow_type_breakdown'),
      media_product_type_breakdown: transformBreakdownData('media_product_type_breakdown'),
      profileData: (breakdowns as any)?.profileData || {},
      updatedAt: (breakdowns as any)?.updatedAt || Date.now()
    };
  }, [breakdowns]);

  // Check if we have any demographic data
  const hasAnyDemographicData = transformedDemographicsData && (
    transformedDemographicsData.age_breakdown.length > 0 ||
    transformedDemographicsData.gender_breakdown.length > 0 ||
    transformedDemographicsData.city_breakdown.length > 0 ||
    transformedDemographicsData.country_breakdown.length > 0 ||
    transformedDemographicsData.follow_type_breakdown.length > 0 ||
    transformedDemographicsData.media_product_type_breakdown.length > 0
  );

  const handleRefreshOrConnect = () => {
    if (!isConnected) {
      window.location.href = '/settings?tab=integrations';
    } else {
      refresh();
    }
  };

  // Handle Instagram not connected state
  if (!isConnected) {
    return (
      <PlatformConnectionPrompt
        platformName="Instagram"
        platformIcon={
          <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
            <Instagram className="w-full h-full text-pink-500" />
          </div>
        }
        description="Connect your Instagram account to view detailed analytics, track post performance, and get insights on your content strategy."
        buttonColor="bg-pink-600"
        buttonHoverColor="hover:bg-pink-700"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Only show demographics if data exists and not collapsed */}
      {hasAnyDemographicData && !breakdownCollapsed && (
        <InstagramDemographics demographicsData={transformedDemographicsData} />
      )}

      {/* No data message */}
      {breakdowns && !hasAnyDemographicData && (
        <div className="text-center text-muted-foreground py-8">
          No breakdown data available yet. Keep growing your audience!
        </div>
      )}

      {/* Analysis Depth Picker and Insights remain unchanged */}
      {!refreshing && (
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
          <div className="flex-1">
            <AnalysisDepthPicker
              platform="Instagram"
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
          </div>
          {/* Demographics Toggle Button - next to refresh controls */}
          {hasAnyDemographicData && (
            <div className="flex-shrink-0">
              <button
                onClick={() => setBreakdownCollapsed((prev) => !prev)}
                className="px-3 py-2 rounded-lg border border-border hover:bg-muted/50 text-muted-foreground text-sm font-medium transition-colors"
                aria-label={breakdownCollapsed ? 'Show demographics' : 'Hide demographics'}
              >
                {breakdownCollapsed ? 'Show Demographics' : 'Hide Demographics'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Insights and loading states remain unchanged */}
      {!refreshing && (
        loading ? (
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
              <div className="text-center text-gray-400">
                Looks like you're blazing a new trail—no Instagram insights here yet, but that just means you're ahead of the curve! Keep creating amazing content! 🚀
              </div>
            )}
            {(insights || []).map((insight, idx) => (
              <InsightCard
                key={idx}
                title={insight.title}
                platform="instagram"
                impact={insight.impact}
                whyNow={insight.whyNow}
                actionSteps={insight.actionSteps}
                expectedOutcome={insight.expectedOutcome}
                sourceDetails={insight.sourceDetails}
                relatedItems={insight.relatedItems}
                expanded={expandedInsight === idx}
                onExpand={() => setExpandedInsight(expandedInsight === idx ? null : idx)}
                onActionStepClick={(actionStep, insightData) => {
                  console.log('🔍 [INSTAGRAM PLATFORM] Action step clicked:', actionStep);
                  console.log('🔍 [INSTAGRAM PLATFORM] Full insight data:', insightData);
                  // Create additional context for the action step
                  const additionalContext = [
                    `Platform: INSTAGRAM`,
                    `Insight: ${insightData.title}`,
                    `Impact: ${insightData.impact}`,
                    `Why Now: ${insightData.whyNow.join(', ')}`,
                    `Expected Outcome: ${insightData.expectedOutcome}`,
                    `Source: Instagram Insights Dashboard`
                  ].join('\n');
                  // Use the default action step discussion
                  discussActionStep(actionStep, insightData, 'instagram', additionalContext);
                }}
              />
            ))}
          </div>
        )
      )}
    </div>
  )
} 