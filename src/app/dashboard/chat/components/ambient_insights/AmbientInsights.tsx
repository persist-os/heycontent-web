import React, { useEffect, useMemo, useState } from 'react';
import { AmbientInsight } from '../../types';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getApiKey } from '@/app/lib/api-helpers';
import { Id } from '@/convex/_generated/dataModel';
import { RefreshState } from '@/components/ui/refresh-state';
import { Skeleton } from '@/components/ui/skeleton';

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

// Skeleton component for loading state
const InsightSkeleton = () => (
  <div className="bg-card border border-border shadow-sm p-3 sm:p-4 rounded-xl">
    <div className="flex items-start gap-2 sm:gap-3">
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/2 mt-2" />
      </div>
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
      // Only request new insights if we have a userId and no insights from Convex
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

  // Show skeleton loading state
  if (isLoading && !error) {
    return (
      <div className="space-y-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:space-y-0">
        {Array.from({ length: 6 }).map((_, index) => (
          <InsightSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="space-y-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:space-y-0">
        <div className="col-span-full text-center text-muted-foreground">
          <p>Your insights are taking a creative break! 🎨</p>
          <p className="text-sm mt-2">No worries—great ideas take time to develop. Keep being awesome!</p>
        </div>
      </div>
    );
  }

  // Show skeleton state if no insights
  if (insights.length === 0) {
    return (
      <div className="space-y-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:space-y-0">
        {Array.from({ length: 6 }).map((_, index) => (
          <InsightSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:space-y-0 pt-2" data-ambient-insights>
      {insights.map((insight) => (
        <div
          key={insight.id}
          onClick={() => onInsightClick?.(insight.action, insight)}
          className="bg-card border border-border shadow-sm p-3 sm:p-4 rounded-xl cursor-pointer \
            hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-primary"
          tabIndex={0}
          role="button"
          aria-label={`${insight.title}: ${insight.description}`}
        >
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-card-foreground mb-1">{insight.title}</h3>
              <p className="text-sm text-muted-foreground">{insight.description}</p>
              {insight.action && (
                <p className="mt-2 text-sm text-primary font-medium">
                  {insight.action}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};