import React, { useEffect, useMemo, useState, useRef } from 'react';
import { AmbientInsight } from '../../types';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getApiKey } from '@/app/lib/api-helpers';
import { Id } from '@/convex/_generated/dataModel';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, BarChart3, TrendingUp, Lightbulb, Target, Calendar, Zap } from 'lucide-react';

// Type for the Convex response
type ConvexInsight = {
  category: string;
  title: string;
  content: string;
  recommendation: string;
};

// Extend AmbientInsight to make icon optional
type InsightWithOptionalIcon = Omit<AmbientInsight, 'icon'> & { 
  icon?: React.ReactNode;
  id: string;
};

interface AmbientInsightsProps {
  userId: string | undefined | null;
  loading?: boolean;
  error?: string | null;
  onInsightClick?: (action: string, insight: InsightWithOptionalIcon) => void;
}

// Shared layout component for consistent styling
const InsightsContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="h-full flex flex-col">
    <div className="flex-1 flex flex-col justify-center px-6">
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex gap-4 justify-center">
          {children}
        </div>
      </div>
    </div>
  </div>
);

// Card skeleton to match new design
const InsightSkeleton = () => (
  <div className="bg-card/40 border border-border/50 rounded-lg p-4 h-64 flex flex-col animate-pulse">
    {/* Title skeleton */}
    <div className="mb-3">
      <Skeleton className="h-5 w-3/4 rounded" />
    </div>
    
    {/* Description skeleton - neat lines with proper spacing */}
    <div className="flex-1 space-y-2.5 mb-4">
      <Skeleton className="h-3 w-full rounded" />
      <Skeleton className="h-3 w-11/12 rounded" />
      <Skeleton className="h-3 w-5/6 rounded" />
      <Skeleton className="h-3 w-4/5 rounded" />
      <Skeleton className="h-3 w-3/4 rounded" />
    </div>

    {/* Icon skeleton */}
    <div className="flex justify-end">
      <Skeleton className="w-6 h-6 rounded-md" />
    </div>
  </div>
);

// Constants
const CARDS_PER_PAGE = 4;
const TOTAL_CARDS = 12; // Show 3 pages worth before querying backend

// Icon mapping for different insight types
const getIconForCategory = (category: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'audience': <Users className="w-6 h-6" />,
    'data_driven': <BarChart3 className="w-6 h-6" />,
    'engagement': <TrendingUp className="w-6 h-6" />,
    'strategy': <Target className="w-6 h-6" />,
    'content': <Lightbulb className="w-6 h-6" />,
    'timing': <Calendar className="w-6 h-6" />,
    'boost': <Zap className="w-6 h-6" />,
    'default': <Lightbulb className="w-6 h-6" />
  };
  return iconMap[category.toLowerCase()] || iconMap['default'];
};

// Shared skeleton grid component
const SkeletonGrid = () => (
  <div className="h-full flex flex-col">
    <div className="flex-1 flex flex-col justify-center px-6">
      <div className="w-full max-w-6xl mx-auto">
        
        {/* Header skeleton - clean and organized */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <Skeleton className="h-6 sm:h-7 lg:h-8 w-72 sm:w-80 lg:w-96 rounded-md" />
          </div>
          <div className="ml-4">
            <Skeleton className="h-9 w-20 sm:w-24 rounded-md" />
          </div>
        </div>

        {/* Cards grid skeleton - uniform and clean */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: CARDS_PER_PAGE }).map((_, index) => (
            <InsightSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
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
  
  // Page state for cycling through insights
  const [currentPage, setCurrentPage] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Always call useQuery, passing skip if userId is not available
  console.log('[CONVEX] AmbientInsights query called', {
    timestamp: Date.now(),
    userId
  })
  
  const convexInsights = useQuery(
    api.ambientInsights.getMostRecentByUserId,
    userId ? { userId } : "skip"
  );

  console.log('[CONVEX] AmbientInsights query result changed', {
    queryName: 'getMostRecentByUserId',
    data: convexInsights,
    timestamp: Date.now(),
    userId,
    hasData: !!convexInsights,
    dataLength: Array.isArray(convexInsights?.data) ? convexInsights.data.length : 0
  })

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

  // Map Convex data to insights format - ensure exactly 12 cards for 3 pages
  const allInsights = useMemo<InsightWithOptionalIcon[]>(() => {
    if (convexInsights && Array.isArray(convexInsights.data) && convexInsights.data.length > 0) {
      const mappedInsights = convexInsights.data.map((item: ConvexInsight, index: number) => ({
        type: item.category || 'auto_generated',
        title: item.title,
        description: item.content,
        action: item.recommendation || '',
        icon: getIconForCategory(item.category || 'default'),
        id: `${convexInsights._id}-${index}` // Use stable ID based on convex data
      }));
      
      // Ensure exactly 12 cards - repeat if necessary, or pad with placeholders
      if (mappedInsights.length >= TOTAL_CARDS) {
        return mappedInsights.slice(0, TOTAL_CARDS);
      } else {
        const padded = [...mappedInsights];
        while (padded.length < TOTAL_CARDS) {
          const originalIndex = (padded.length - mappedInsights.length) % mappedInsights.length;
          const original = mappedInsights[originalIndex];
          padded.push({
            ...original,
            id: `${original.id}-repeat-${padded.length}`
          });
        }
        return padded;
      }
    }
    return [];
  }, [convexInsights?._id, convexInsights?.data]);

  // Get current page of insights (4 cards)
  const currentPageInsights = useMemo(() => {
    const startIndex = currentPage * CARDS_PER_PAGE;
    return allInsights.slice(startIndex, startIndex + CARDS_PER_PAGE);
  }, [allInsights, currentPage]);

  // Calculate total pages available
  const totalPages = Math.ceil(allInsights.length / CARDS_PER_PAGE);

  // Refresh function - cycles through pages, queries backend when reaching the end
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // If we have more local pages, show the next one
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
      setIsRefreshing(false);
      return;
    }
    
    // If we've cycled through all pages, query the backend for new insights
    if (userId) {
      try {
        console.log('Requesting new ambient insights from backend');
        const apiKey = await getApiKey();
        if (!apiKey) {
          console.error('No API key found for ambient_insights request');
          setIsRefreshing(false);
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
          // Reset to first page after getting new data
          setCurrentPage(0);
        }
      } catch (error) {
        console.error('Exception requesting ambient insights:', error);
      }
    }
    
    setIsRefreshing(false);
  };

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
    return <SkeletonGrid />;
  }

  // Organic loading pattern
  if (isLoading && !error) {
    return <SkeletonGrid />;
  }

  // Show skeleton state if no insights
  if (currentPageInsights.length === 0) {
    return <SkeletonGrid />;
  }

  return (
    <div className="h-full flex flex-col" data-ambient-insights>
      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="w-full max-w-6xl mx-auto">
          
          {/* Header with "What can I help you with?" and Refresh button */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-light text-foreground">What can I help you with?</h2>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">↻</span>
            </Button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {currentPageInsights.map((insight) => (
              <div
                key={insight.id}
                className="group cursor-pointer"
                onClick={() => onInsightClick?.(insight.action, insight)}
                tabIndex={0}
                role="button"
                aria-label={`${insight.title}: ${insight.description}`}
              >
                <div className="bg-card/40 hover:bg-card/60 border border-border/50 rounded-lg p-4 h-64 flex flex-col transition-all duration-300 ease-out group-hover:shadow-lg group-hover:border-border">
                  
                  {/* Title */}
                  <h3 className="font-medium text-sm sm:text-base mb-3 text-foreground group-hover:text-primary leading-tight transition-colors duration-300 line-clamp-2">
                    {insight.title}
                  </h3>
                  
                  {/* Description */}
                  <div className="flex-1 overflow-hidden mb-3 min-h-0">
                    <p className="text-xs sm:text-sm text-muted-foreground/80 group-hover:text-muted-foreground leading-relaxed transition-all duration-300 break-words overflow-y-auto max-h-full">
                      {insight.description}
                    </p>
                  </div>

                  {/* Icon */}
                  <div className="flex justify-end mt-auto flex-shrink-0">
                    <div className="text-muted-foreground/60 group-hover:text-muted-foreground transition-colors duration-300">
                      {insight.icon}
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};