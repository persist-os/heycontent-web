import React, { useEffect, useMemo, useState } from 'react';
import { AmbientInsight } from '../types';
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
  loading = false,
  error: propError, 
  onInsightClick
}) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(propError || null);

  // Get user ID from API key
  useEffect(() => {
    async function fetchUserId() {
      try {
        const apiKey = await getApiKey();
        if (apiKey) {
          const parts = apiKey.split('_');
          if (parts.length >= 3) {
            setUserId(parts[1]);
          } else {
            setFetchError('Invalid API key format');
          }
        } else {
          setFetchError('No API key found');
        }
      } catch (error) {
        setFetchError(error instanceof Error ? error.message : 'Failed to get user ID');
      }
    }
    fetchUserId();
  }, []);

  // Fetch insights from Convex
  const convexInsights = useQuery(
    api.ambientInsights.getMostRecentByUserId,
    userId ? { userId } : "skip"
  );

  console.log('AmbientInsights: Convex query result:', convexInsights);
  console.log('AmbientInsights: Current userId:', userId);

  // Map Convex data to insights format
  const insights = useMemo<InsightWithOptionalIcon[]>(() => {
    console.log('AmbientInsights: Mapping insights. Convex data:', convexInsights);

    if (convexInsights && Array.isArray(convexInsights.data) && convexInsights.data.length > 0) {
      console.log('AmbientInsights: Using Convex data array, length:', convexInsights.data.length);
      return convexInsights.data.slice(0, 6).map((item: ConvexInsight) => ({
        type: item.category || 'auto_generated',
        title: item.title,
        description: item.content,
        action: item.recommendation || '',
        id: Math.random().toString()
      }));
    }

    // Return empty array if no insights from Convex
    return [];
  }, [convexInsights]);

  // Combine prop error with fetch error
  const error = propError || fetchError;

  // Set error if Convex query fails
  useEffect(() => {
    if (convexInsights === null) {
      setFetchError('Failed to load insights');
    }
  }, [convexInsights]);

  // Log errors
  useEffect(() => {
    const error = propError || fetchError;
    if (error) {
      console.error('Error loading insights:', error);
    }
  }, [propError, fetchError]);
  
  // Request new insights if none are available from Convex
  const [isRequestingInsights, setIsRequestingInsights] = useState(false);
  
  useEffect(() => {
    const requestNewInsights = async () => {
      // Only request new insights if we have a userId and no insights from Convex
      if (userId && 
          typeof convexInsights !== 'string' &&
          convexInsights !== undefined && 
          (!convexInsights || 
           !Array.isArray(convexInsights?.data) || 
           convexInsights.data?.length === 0) && 
          !isRequestingInsights) {
        
        try {
          setIsRequestingInsights(true);
          console.log('Requesting new ambient insights');
          
          const apiKey = await getApiKey();
          if (!apiKey) {
            console.error('No API key found for ambient_insights request');
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
            console.error('Error requesting ambient insights:', errorData);
          } else {
            const data = await response.json();
            console.log('Ambient insights requested successfully:', data);
          }
        } catch (error) {
          console.error('Exception requesting ambient insights:', error);
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
          <p>Failed to load insights: {error}</p>
        </div>
      </div>
    );
  }

  // Show empty state if no insights
  if (insights.length === 0) {
    return (
      <div className="space-y-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:space-y-0">
        <div className="col-span-full text-center text-muted-foreground">
          <p>No insights available yet. Check back soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:space-y-0">
      {insights.map((insight) => (
        <div
          key={insight.id}
          onClick={() => onInsightClick?.(insight.action, insight)}
          className="bg-card border border-border shadow-sm p-3 sm:p-4 rounded-xl cursor-pointer \
            hover:shadow-md transition-all duration-200 hover:scale-[1.02] hover:border-primary/20"
          tabIndex={0}
          role="button"
          aria-label={`${insight.title}: ${insight.description}`}
        >
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-card-foreground mb-1">{insight.title}</h3>
              <p className="text-sm text-muted-foreground">{insight.description}</p>
              {insight.action && (
                <p className="mt-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
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