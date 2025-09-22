import React, { useEffect, useMemo, useState } from 'react';
import { AmbientInsight } from '../../types';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getApiKey } from '@/app/lib/api-helpers';
import { Button } from '@/components/ui/button';
import { InsightCard } from '@/components/ui/insight-card';
import { LoadingGrid } from '@/components/ui/loading-grid';
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

// Layout wrapper for consistent styling
const InsightsContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="h-full flex items-center justify-center">
    <div className="w-full max-w-6xl mx-auto px-6">
      {children}
    </div>
  </div>
);

// Constants
const CARDS_PER_PAGE = 4;
const BACKEND_INSIGHTS_COUNT = 10; // Backend generates 10 insights per call

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
  const [shownInsightIds, setShownInsightIds] = useState<Set<string>>(new Set());

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
      // Reset tracking when new insights are loaded
      setCurrentPage(0);
      setShownInsightIds(new Set());
    }
  }, [convexInsights?._id, userId, lastLoggedInsights]);

  // Map Convex data to insights format - use the 10 insights from backend
  const allInsights = useMemo<InsightWithOptionalIcon[]>(() => {
    if (convexInsights && Array.isArray(convexInsights.data) && convexInsights.data.length > 0) {
      return convexInsights.data.map((item: ConvexInsight, index: number) => ({
        type: item.category || 'auto_generated',
        title: item.title,
        description: item.content,
        action: item.recommendation || '',
        icon: getIconForCategory(item.category || 'default'),
        id: `${convexInsights._id}-${index}` // Use stable ID based on convex data
      }));
    }
    return [];
  }, [convexInsights?._id, convexInsights?.data]);

  // Get current page of insights with smart pagination logic
  const currentPageInsights = useMemo(() => {
    if (allInsights.length === 0) return [];

    if (currentPage === 0) {
      // First page: show first 4 insights (0-3)
      return allInsights.slice(0, CARDS_PER_PAGE);
    } else if (currentPage === 1) {
      // Second page: show next 4 insights (4-7)
      return allInsights.slice(4, 8);
    } else if (currentPage === 2 && allInsights.length >= 8) {
      // Third page: show last 2 insights (8-9) + 2 random from first 8
      const lastTwo = allInsights.slice(8, 10);
      const firstEight = allInsights.slice(0, 8);
      
      // Pick 2 random from first 8
      const shuffled = [...firstEight].sort(() => Math.random() - 0.5);
      const randomTwo = shuffled.slice(0, 2);
      
      return [...lastTwo, ...randomTwo];
    }
    
    // Fallback: return first 4
    return allInsights.slice(0, CARDS_PER_PAGE);
  }, [allInsights, currentPage]);

  // Track shown insights in a separate effect
  useEffect(() => {
    if (currentPageInsights.length > 0) {
      setShownInsightIds(prev => new Set([...prev, ...currentPageInsights.map(i => i.id)]));
    }
  }, [currentPageInsights]);

  // Determine if we need to call backend (after showing all available insights)
  const needsBackendCall = useMemo(() => {
    return currentPage >= 2 && allInsights.length > 0;
  }, [currentPage, allInsights.length]);

  // Refresh function with smart pagination logic
  const handleRefresh = async () => {
    if (!userId) return;
    
    setIsRefreshing(true);
    
    try {
      // If we haven't exhausted local insights, just show next page
      if (!needsBackendCall) {
        setCurrentPage(prev => prev + 1);
        setIsRefreshing(false);
        return;
      }
      
      // We need fresh insights from backend
      const apiKey = await getApiKey();
      if (!apiKey) {
        console.error('No API key found for ambient_insights request');
        setIsRefreshing(false);
        return;
      }
      
      // First, remove existing insights to force regeneration
      await fetch('/api/ambient_insights/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ userId }),
      });
      
      // Then generate new insights
      const response = await fetch('/api/ambient_insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          context_type: 'manual_refresh',
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
        setShownInsightIds(new Set());
      }
    } catch (error) {
      console.error('Exception requesting ambient insights:', error);
    } finally {
      setIsRefreshing(false);
    }
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
    return <LoadingGrid items={CARDS_PER_PAGE} columns={4} />;
  }

  // Organic loading pattern
  if (isLoading && !error) {
    return <LoadingGrid items={CARDS_PER_PAGE} columns={4} />;
  }

  // Show skeleton state if no insights
  if (currentPageInsights.length === 0) {
    return <LoadingGrid items={CARDS_PER_PAGE} columns={4} />;
  }

  return (
    <InsightsContainer>
      {/* Header with "What can I help you with?" and Refresh button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-light text-foreground">
          What can I help you with?
        </h2>
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
          <InsightCard
            key={insight.id}
            title={insight.title}
            description={insight.description}
            icon={insight.icon}
            onClick={() => onInsightClick?.(insight.action, insight)}
          />
        ))}
      </div>
    </InsightsContainer>
  );
};