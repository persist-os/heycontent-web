import React, { useEffect, useMemo, useState } from 'react';
import { AmbientInsight } from '../../types';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getApiKey } from '@/app/lib/api-helpers';
import { Id } from '@/convex/_generated/dataModel';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

// Type for the Convex response
type ConvexInsight = {
  category: string;
  title: string;
  content: string;
  recommendation: string;
};

// Extend AmbientInsight to make icon optional
type InsightWithOptionalIcon = Omit<AmbientInsight, 'icon'> & { 
  icon?: AmbientInsight['icon'];
  id: string;
};

interface AmbientInsightsProps {
  userId: string | undefined | null;
  loading?: boolean;
  error?: string | null;
  onInsightClick?: (action: string, insight: InsightWithOptionalIcon) => void;
}

// Organic thought bubble skeleton
const InsightSkeleton = () => (
  <div className="group animate-pulse">
    <div className="space-y-3">
      <Skeleton className="h-5 w-3/4 rounded-full" />
      <Skeleton className="h-4 w-full rounded-full opacity-60" />
      <Skeleton className="h-4 w-2/3 rounded-full opacity-40" />
    </div>
  </div>
);

export const AmbientInsights: React.FC<AmbientInsightsProps> = ({ 
  userId,
  loading = false,
  error: propError, 
  onInsightClick
}) => {
  // All hooks must be at the top level
  const [fetchError, setFetchError] = useState<string | null>(propError || null);
  const [lastLoggedInsights, setLastLoggedInsights] = useState<string | null>(null);
  const [isRequestingInsights, setIsRequestingInsights] = useState(false);
  const requestedInsightsRef = React.useRef<string | null>(null);
  
  // Manual reveal state
  const [showSecondary, setShowSecondary] = useState(false);

  // Always call useQuery, passing skip if userId is not available
  const convexInsights = useQuery(
    api.ambientInsights.getMostRecentByUserId,
    userId ? { userId } : "skip"
  );

  // Only log once when insights actually change, not on every render
  useEffect(() => {
    const insightsId = convexInsights?._id;
    if (process.env.NODE_ENV === 'development' && insightsId && insightsId !== lastLoggedInsights && userId) {
      console.log('AmbientInsights: New insights loaded:', {
        id: insightsId,
        dataCount: convexInsights?.data?.length || 0,
        userId
      });
      setLastLoggedInsights(insightsId);
    }
  }, [convexInsights?._id, userId, lastLoggedInsights]);

  // Map Convex data to insights format - memoize with stable dependency
  const insights = useMemo<InsightWithOptionalIcon[]>(() => {
    if (convexInsights && Array.isArray(convexInsights.data) && convexInsights.data.length > 0) {
      return convexInsights.data.slice(0, 6).map((item: ConvexInsight, index: number) => ({
        type: item.category || 'auto_generated',
        title: item.title,
        description: item.content,
        action: item.recommendation || '',
        id: `${convexInsights._id}-${index}` // Use stable ID based on convex data
      }));
    }
    return [];
  }, [convexInsights?._id, convexInsights?.data]);

  // No auto-reveal - only manual button click

  // Combine prop error with fetch error
  const error = propError || fetchError;

  // Set error if Convex query fails
  useEffect(() => {
    if (userId && convexInsights === null) {
      setFetchError('Failed to load insights');
    }
  }, [userId, convexInsights]);

  useEffect(() => {
    const requestNewInsights = async () => {
      // Request new insights if we have a userId and no insights from Convex (removed time restrictions)
      if (
        userId &&
        typeof convexInsights !== 'string' &&
        convexInsights !== undefined &&
        (!convexInsights ||
          !Array.isArray(convexInsights?.data) ||
          convexInsights.data?.length === 0) &&
        !isRequestingInsights &&
        requestedInsightsRef.current !== userId
      ) {
        try {
          setIsRequestingInsights(true);
          requestedInsightsRef.current = userId;
          if (process.env.NODE_ENV === 'development') {
            console.log('Requesting new ambient insights');
          }
          const apiKey = await getApiKey();
          if (!apiKey) {
            if (process.env.NODE_ENV === 'development') {
              console.error('No API key found for ambient_insights request');
            }
            setIsRequestingInsights(false);
            return;
          }
          const response = await fetch('/api/ambient_insights', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              context_type: 'auto_generated',
              content: JSON.stringify({ user_id: userId })
            })
          });
          if (!response.ok) {
            const errorData = await response.json();
            if (process.env.NODE_ENV === 'development') {
              console.error('Error requesting ambient insights:', errorData);
            }
          } else {
            const data = await response.json();
            if (process.env.NODE_ENV === 'development') {
              console.log('Ambient insights requested successfully:', data);
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Exception requesting ambient insights:', error);
          }
        } finally {
          setIsRequestingInsights(false);
        }
      }
    };
    requestNewInsights();
  }, [userId, convexInsights, isRequestingInsights]);

  // Determine if we should show loading state
  const isLoading = loading || 
    !userId || 
    convexInsights === undefined || 
    isRequestingInsights;

  // Render loader until userId is available
  if (!userId) {
    return (
      <div className="space-y-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:space-y-0">
        {Array.from({ length: 6 }).map((_, index) => (
          <InsightSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Organic loading pattern
  if (isLoading && !error) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 flex flex-col justify-center py-4 min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="space-y-4">
                <InsightSkeleton />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show skeleton state if no insights
  if (insights.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 flex flex-col justify-center py-4 min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="space-y-4">
                <InsightSkeleton />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Get insights for progressive reveal
  const primaryInsights = insights.slice(0, 2);
  const secondaryInsights = insights.slice(2, 6);

  return (
    <div className="h-full flex flex-col px-4 sm:px-6 pt-6 pb-2 overflow-hidden" data-ambient-insights>
      <div className="w-full max-w-4xl mx-auto h-full flex flex-col">
        {/* Main insights grid - calculated height to fit content + button */}
        <div className={`grid gap-2 transition-all duration-400 ease-out ${
          showSecondary 
            ? 'grid-cols-2 lg:grid-cols-3 h-[calc(100%-4rem)]' 
            : 'grid-cols-2 gap-4 h-[calc(100%-3rem)]'
        }`}>
          {insights.map((insight, index) => {
            const isPrimary = index < 2;
            const isVisible = isPrimary || showSecondary;
            
            if (!isVisible) return null;
            
            return (
              <div
                key={insight.id}
                className="group cursor-pointer overflow-visible"
                onClick={() => onInsightClick?.(insight.action, insight)}
                tabIndex={0}
                role="button"
                aria-label={`${insight.title}: ${insight.description}`}
              >
                <div className={`rounded-lg flex flex-col relative z-10 group-hover:z-20 transition-all duration-500 ease-out h-full overflow-hidden ${
                  showSecondary 
                    ? 'p-2 group-hover:shadow-lg bg-card/30 hover:bg-card/50' 
                    : isPrimary 
                      ? 'p-4 group-hover:shadow-lg bg-card/30 hover:bg-card/50' 
                      : 'p-2 group-hover:shadow-lg bg-card/30 hover:bg-card/50'
                }`}>
                  
                  {/* Title */}
                  <h3 className={`font-medium leading-tight transition-colors duration-300 flex-shrink-0 ${
                    showSecondary 
                      ? 'text-xs mb-1 text-foreground group-hover:text-primary' 
                      : isPrimary && index === 0
                        ? 'text-base mb-2 text-blue-600 dark:text-blue-400 tracking-tight'
                        : isPrimary
                          ? 'text-base mb-2 text-foreground group-hover:text-primary tracking-tight'
                          : 'text-xs mb-1 text-foreground group-hover:text-primary'
                  }`}>
                    {insight.title}
                  </h3>
                  
                  {/* Description - full text visible */}
                  <div className="flex-1 overflow-auto">
                    <p className={`leading-snug transition-all duration-500 ease-out ${
                      showSecondary
                        ? 'text-xs text-muted-foreground/70 group-hover:text-muted-foreground'
                        : isPrimary
                          ? 'text-sm text-muted-foreground/70 group-hover:text-muted-foreground tracking-tight'
                          : 'text-xs text-muted-foreground/70 group-hover:text-muted-foreground'
                    }`}>
                      {insight.description}
                    </p>
                  </div>
                  
                  {/* Action text - appears on hover */}
                  {insight.action && (
                    <div className={`flex-shrink-0 ${
                      showSecondary ? 'mt-1' : isPrimary ? 'mt-1' : 'mt-1'
                    }`}>
                      <p className={`uppercase tracking-wide font-medium text-[10px] transition-all duration-500 ease-out ${
                        showSecondary
                          ? 'text-primary/0 group-hover:text-primary/70'
                          : isPrimary && index === 0
                            ? 'text-blue-600/0 group-hover:text-blue-600/80'
                            : isPrimary
                              ? 'text-primary/0 group-hover:text-primary/70'
                              : 'text-primary/0 group-hover:text-primary/70'
                      }`}>
                        {insight.action}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Toggle button - always accessible */}
        {secondaryInsights.length > 0 && (
          <div className="flex-shrink-0 text-center py-3 mt-2 bg-background/80 backdrop-blur-sm">
            <button 
              onClick={() => setShowSecondary(!showSecondary)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 px-4 py-2 rounded-full hover:bg-muted"
            >
              {showSecondary ? 'show less' : `show all ${insights.length}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};