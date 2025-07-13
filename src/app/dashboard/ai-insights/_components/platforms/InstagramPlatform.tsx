'use client'

import React, { useState, useEffect } from 'react'
import { InsightCard } from '@/components/content/InsightCard'
import { useInstagramInsights } from '../hooks/useInstagramInsights'
import { useInsightNavigation } from '../hooks/useInsightNavigation'
import { RefreshState } from '@/components/ui/refresh-state'
import { Skeleton } from '@/components/ui/skeleton'
import { AnalysisDepthPicker } from '../AnalysisDepthPicker'
import { Instagram } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlatformConnectionPrompt } from '../../../_components/content-hub/PlatformConnectionPrompt'
import { useInstagramBreakdowns } from '../hooks/useInstagramBreakdowns'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  getCountryNameFromCode,
  getGenderLabel,
  sortAgeGroups,
  groupBreakdownValues,
  getMetricLabel
} from '@/app/lib/utils/format-utils'
import { isLargeDataset, PerformanceTimer } from '@/app/lib/utils/performance-utils'
import { LargeDatasetLoading } from '@/components/ui/loading-states'

const BREAKDOWN_LABELS = {
  country_breakdown: "Country",
  city_breakdown: "City",
  age_breakdown: "Age",
  gender_breakdown: "Gender",
  follow_type_breakdown: "Follow Type",
  media_product_type_breakdown: "Media Product Type",
  contact_button_type_breakdown: "Contact Button Type",
};

interface InstagramPlatformProps {
  userId?: string
  currentQuote: string
  loading: boolean
}

export function InstagramPlatform({ userId, currentQuote, loading }: InstagramPlatformProps) {
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
  } = useInstagramInsights(userId)

  const breakdowns = useInstagramBreakdowns(userId);

  // Dynamically generate available breakdowns
  const availableBreakdowns = Object.entries(BREAKDOWN_LABELS)
    .filter(([key]) => breakdowns && Array.isArray(breakdowns[key]) && breakdowns[key].length > 0)
    .map(([key, label]) => ({ key, label }));

  const [selectedBreakdown, setSelectedBreakdown] = useState(
    availableBreakdowns[0]?.key || null
  );

  useEffect(() => {
    if (availableBreakdowns.length > 0 && !selectedBreakdown) {
      setSelectedBreakdown(availableBreakdowns[0].key);
    }
  }, [availableBreakdowns, selectedBreakdown]);

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
      {/* Breakdown Filter */}
      {breakdowns ? (
        availableBreakdowns.length > 0 ? (
          <Tabs value={selectedBreakdown || undefined} onValueChange={setSelectedBreakdown} className="w-full">
            <TabsList className="mb-4 flex flex-wrap gap-2">
              {availableBreakdowns.map(({ key, label }) => (
                <TabsTrigger key={key} value={key} className="capitalize">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            {availableBreakdowns.map(({ key, label }) => (
              <TabsContent key={key} value={key}>
                <BreakdownDisplay data={breakdowns[key]} label={label} />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No breakdown data available yet. Keep growing your audience!
          </div>
        )
      ) : (
        <div className="space-y-2">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6" />
        </div>
      )}

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

      {!refreshing && (
        !isConnected ? (
          <div className="text-center py-12 px-4">
            <Instagram className="w-16 h-16 mx-auto mb-4 text-pink-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Connect Your Instagram Account
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
              Connect your Instagram account to view detailed analytics, track post performance, 
              and get insights on your content strategy.
            </p>
            <Button 
              onClick={() => window.location.href = '/settings?tab=integrations'}
              className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition-colors"
            >
              <Instagram className="w-4 h-4" />
              Connect Instagram
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
                onDiscuss={() => {
                  navigateWithInsight(insight, 'instagram');
                }}
              />
            ))}
          </div>
        )
      )}
    </div>
  )
} 

// Creative breakdown display
function BreakdownDisplay({ data, label }) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  if (!data || data.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-6">
        No {label} data yet. Try a different filter!
      </div>
    );
  }

  // Performance optimization: Check if data is large and show loading state
  const isLargeDatasetFlag = isLargeDataset(data.length);
  const [processed, setProcessed] = React.useState(false);
  const [processingStartTime, setProcessingStartTime] = React.useState<number | null>(null);

  // Show top N for long lists (e.g., cities/countries) - moved outside useMemo
  const MAX_BARS = 7; // Reduced from 50 to 10 for cleaner display

  // Show loading state for large datasets
  if (isLargeDatasetFlag && !processed) {
    if (!processingStartTime) {
      setProcessingStartTime(performance.now());
    }
    
    return (
      <LargeDatasetLoading
        dataCount={data.length}
        operation={`Processing ${label} breakdown`}
        showProgress={false}
      />
    );
  }

  // Helper to pick formatter based on breakdown type
  function formatName(name, breakdownType) {
    if (breakdownType === 'country_breakdown') return getCountryNameFromCode(name);
    if (breakdownType === 'gender_breakdown') return getGenderLabel(name);
    return name;
  }

  // Helper to sort/group values based on breakdown type
  function processValues(values, breakdownType) {
    let grouped = groupBreakdownValues(values);
    if (breakdownType === 'age_breakdown') grouped = sortAgeGroups(grouped);
    if (breakdownType === 'gender_breakdown') grouped = grouped.sort((a, b) => b.value - a.value);
    if (breakdownType === 'country_breakdown' || breakdownType === 'city_breakdown') grouped = grouped.sort((a, b) => b.value - a.value);
    return grouped;
  }

  // Performance optimization: useMemo for expensive sorting operations
  const processedData = React.useMemo(() => {
    if (isLargeDatasetFlag && !processed) {
      return null; // Still processing
    }

    const timer = new PerformanceTimer(`Processing ${label} breakdown`);
    
    const result = data.map((metricObj, idx) => {
      const processed = processValues(metricObj.values, label.toLowerCase() + '_breakdown');
      const topValues = processed.slice(0, MAX_BARS); // Process only visible items
      const total = processed.reduce((sum, v) => sum + v.value, 0);
      
      return {
        processed,
        topValues,
        total,
        metricObj
      };
    });

    timer.endWithThreshold(100); // Warn if processing takes more than 100ms
    return result;
  }, [data, label, isLargeDatasetFlag, processed, MAX_BARS]);

  // Mark as processed after first render
  React.useEffect(() => {
    if (isLargeDatasetFlag && !processed && processedData) {
      setProcessed(true);
      if (processingStartTime) {
        console.log(`Processed ${label} breakdown in ${performance.now() - processingStartTime}ms`);
      }
    }
  }, [isLargeDatasetFlag, processed, processedData, label, processingStartTime]);

  if (!processedData) {
    return (
      <div className="bg-card rounded-lg p-4 shadow space-y-4">
        <h4 className="text-lg font-semibold mb-2">{label} Breakdown</h4>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-4 shadow space-y-4">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between w-full text-left hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
      >
        <h4 className="text-lg font-semibold">{label} Breakdown</h4>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {processedData.reduce((total, { processed }) => total + processed.length, 0)} items
          </span>
          <svg
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
              isCollapsed ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {!isCollapsed && (
        <div className="space-y-4">
          {processedData.map(({ processed, topValues, total, metricObj }, idx) => {
            return (
              <div key={idx} className="mb-4">
                <div className="font-medium mb-2 text-sm text-muted-foreground">{getMetricLabel(metricObj.metric)}</div>
                <ul className="space-y-2">
                  {topValues.map((item, i) => (
                    <li key={i} className="flex items-center gap-4">
                      <span className="font-medium min-w-[100px] truncate" title={item.name}>{formatName(item.name, label.toLowerCase() + '_breakdown')}</span>
                      <div className="flex-1 bg-muted rounded h-4 relative">
                        <div
                          className="bg-primary h-4 rounded"
                          style={{ width: total ? `${Math.round((item.value / total) * 100)}%` : '0%' }}
                        />
                        <span className="absolute right-2 text-xs text-muted-foreground">{item.value.toLocaleString()}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                {processed.length > MAX_BARS && (
                  <div className="text-xs text-muted-foreground mt-2">+{processed.length - MAX_BARS} more</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 