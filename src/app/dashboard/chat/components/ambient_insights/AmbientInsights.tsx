import React, { useEffect, useMemo, useState } from 'react';
import { AmbientInsight } from '../../types';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getApiKey } from '@/app/lib/api-helpers';
import { Id } from '@/convex/_generated/dataModel';
import { RefreshState } from '@/components/ui/refresh-state';
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

  // Always call useQuery, passing undefined if userId is not available
  const convexInsights = useQuery(
    api.ambientInsights.getMostRecentByUserId,
    userId ? { userId } : undefined
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
      return convexInsights.data.slice(0, 5).map((item: ConvexInsight, index: number) => ({
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
      <div className="max-w-6xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="space-y-4">
              <InsightSkeleton />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show skeleton state if no insights
  if (insights.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="space-y-4">
              <InsightSkeleton />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Get insights for progressive reveal
  const primaryInsights = insights.slice(0, 2);
  const secondaryInsights = insights.slice(2, 5);

  return (
    <div className="max-w-6xl ml-auto px-8 py-16" data-ambient-insights>
      <div className="space-y-12">
        {/* Primary insights - always visible */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {primaryInsights.map((insight, index) => (
            <div
              key={insight.id}
              className="group cursor-pointer"
              onClick={() => onInsightClick?.(insight.action, insight)}
              tabIndex={0}
              role="button"
              aria-label={`${insight.title}: ${insight.description}`}
            >
              <div className="space-y-4 p-8 rounded-3xl bg-card/30 hover:bg-card/50 
                transition-all duration-500 hover:scale-[1.02]">
                
                <h3 className={`text-lg font-medium leading-snug transition-colors duration-300
                  ${index === 0 ? 'text-blue-600 dark:text-blue-400' : 'text-foreground group-hover:text-primary'}`}>
                  {insight.title}
                </h3>
                
                <p className="text-sm text-muted-foreground/60 group-hover:text-muted-foreground 
                  leading-relaxed transition-colors duration-300">
                  {insight.description}
                </p>
                
                {insight.action && (
                  <div className="pt-2">
                    <span className={`text-xs font-medium uppercase tracking-wide transition-colors duration-300
                      ${index === 0 ? 'text-blue-600/80 group-hover:text-blue-600' : 'text-primary/70 group-hover:text-primary'}`}>
                      {insight.action}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* See more button */}
        {!showSecondary && secondaryInsights.length > 0 && (
          <div className="flex justify-center">
            <Button 
              variant="ghost" 
              onClick={() => setShowSecondary(true)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              See more ({secondaryInsights.length})
            </Button>
          </div>
        )}

        {/* Secondary insights - show when button clicked, 3 smaller cards */}
        {showSecondary && secondaryInsights.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {secondaryInsights.map((insight) => (
              <div
                key={insight.id}
                className="group cursor-pointer"
                onClick={() => onInsightClick?.(insight.action, insight)}
                tabIndex={0}
                role="button"
                aria-label={`${insight.title}: ${insight.description}`}
              >
                <div className="space-y-3 p-5 rounded-xl bg-card/15 hover:bg-card/30 
                  transition-all duration-500">
                  
                  <h3 className="text-sm font-medium text-foreground group-hover:text-primary 
                    transition-colors duration-300 leading-snug">
                    {insight.title}
                  </h3>
                  
                  <p className="text-xs text-muted-foreground/40 group-hover:text-muted-foreground/70 
                    leading-relaxed transition-colors duration-300">
                    {insight.description}
                  </p>
                  
                  {insight.action && (
                    <div className="pt-1">
                      <span className="text-xs font-medium text-primary/50 group-hover:text-primary/70 
                        transition-colors duration-300 uppercase tracking-wide">
                        {insight.action}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};