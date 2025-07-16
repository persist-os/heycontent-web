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
import { toast } from 'sonner';
import { getApiKey, getCurrentUserId, fetchWithApiKey } from '@/app/lib/api-helpers';


interface InstagramPlatformProps {
  userId?: string
  currentQuote: string
  loading: boolean
}

export function InstagramPlatform({ userId: propUserId, currentQuote, loading }: InstagramPlatformProps) {
  const userId = propUserId || getCurrentUserId();
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null)
  const [breakdownCollapsed, setBreakdownCollapsed] = useState(false);
  const { navigateWithInsight } = useInsightNavigation()
  const { discussActionStep } = useActionStepDiscussion()
  const [refreshingDemographics, setRefreshingDemographics] = useState(false);

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
  } = useInstagramInsights(userId);

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

  const handleRefreshDemographics = async () => {
    setRefreshingDemographics(true);
    try {
      const res = await fetchWithApiKey('/api/social/instagram/refresh-demographics', {
        method: 'POST',
        body: JSON.stringify({}), // Optionally add expires_at, scope if needed
      });
      const data = await res.json();
      if (res.ok && (data.success || data.profile_stored)) {
        toast.success('Demographics refreshed!');
        // Optionally, trigger a refetch of breakdowns here if your hook supports it
      } else {
        toast.error(data.error || 'Failed to refresh demographics');
      }
    } catch (err) {
      toast.error('Failed to refresh demographics');
    } finally {
      setRefreshingDemographics(false);
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
    <div className="space-y-8">
      {/* DEMOGRAPHICS SECTION */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Audience Demographics</h2>
          <div className="flex gap-3 items-center">
            <button
              onClick={handleRefreshDemographics}
              className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-medium transition-colors disabled:opacity-60"
              disabled={refreshingDemographics || !userId}
            >
              {refreshingDemographics ? 'Refreshing...' : 'Refresh Demographics'}
            </button>
            {hasAnyDemographicData && (
              <button
                onClick={() => setBreakdownCollapsed((prev) => !prev)}
                className="px-3 py-2 rounded-lg border border-border hover:bg-muted/50 text-muted-foreground text-sm font-medium transition-colors"
                aria-label={breakdownCollapsed ? 'Show demographics' : 'Hide demographics'}
              >
                {breakdownCollapsed ? 'Hide Demographics' : 'Show Demographics'}
              </button>
            )}
          </div>
        </div>

        {/* Demographics Data */}
        {hasAnyDemographicData && !breakdownCollapsed && (
          <InstagramDemographics demographicsData={transformedDemographicsData} />
        )}

        {/* No demographics data message */}
        {breakdowns && !hasAnyDemographicData && (
          <div className="text-center text-muted-foreground py-8 border-2 border-dashed border-muted-foreground/20 rounded-lg">
            <p className="text-lg font-medium mb-2">Your audience insights are brewing! ☕</p>
            <p>We're working hard to fetch your demographic data—it might take a moment, or may not be available for newer accounts. Keep building that amazing community, and your audience insights will follow! 🌟</p>
            <p className="text-sm mt-3 font-medium">✨ <strong>Creator tip:</strong> The best demographics come from consistent, authentic content that resonates with your tribe!</p>
          </div>
        )}
      </div>

      {/* ANALYSIS SECTION */}
      <div className="space-y-4">
        <div className="border-t border-border pt-6">
          <h2 className="text-xl font-semibold mb-4">Content Analysis & Insights</h2>
          {!refreshing && (
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
          )}
        </div>

        {/* Analysis Results */}
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
                <div className="text-center text-muted-foreground py-8 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                  <p className="text-lg font-medium mb-2">No analysis insights available</p>
                  <p>Run an analysis above to get AI-powered insights about your content performance! 📊</p>
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
      </div>
  )
} 