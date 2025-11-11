import React, { useEffect, useMemo, useState } from 'react';
import { AmbientInsight } from '@/types/index';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getApiKey } from '@/app/lib/api-helpers';
import { Button } from '@/components/ui/button';
import { InsightCard } from '@/components/ui/insight-card';
import { LoadingGrid } from '@/components/ui/loading-grid';
import { Users, BarChart3, TrendingUp, Lightbulb, Target, Calendar, Zap, RefreshCw } from 'lucide-react';
import { T } from '@/components/translation';
import { cn } from '@/lib/utils';

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
  recommendation?: string;
};

interface AmbientInsightsProps {
  userId: string | undefined | null;
  loading?: boolean;
  error?: string | null;
  onInsightClick?: (action: string, insight: InsightWithOptionalIcon) => void;
}

// Layout wrapper for consistent styling
const InsightsContainer: React.FC<{ children: React.ReactNode; isMobile?: boolean }> = ({ children, isMobile }) => (
  <div className="w-full py-4 sm:py-6">
    <div className={cn(
      "mx-auto",
      isMobile ? "px-0" : "max-w-6xl px-3 sm:px-4 lg:px-6"
    )}>
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
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Page state for cycling through insights (desktop only)
  const [currentPage, setCurrentPage] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [shownInsightIds, setShownInsightIds] = useState<Set<string>>(new Set());
  
  // Random greeting selection (changes per session, not per render)
  const [selectedGreeting, setSelectedGreeting] = useState<string>("What can I help you with?");

  // Always call useQuery, passing skip if userId is not available
  const convexInsights = useQuery(
    api.ambientInsights.getMostRecentByUserId,
    userId ? { userId } : "skip"
  );

  // Update greeting and reset state when insights change
  useEffect(() => {
    const insightsId = convexInsights?._id;
    if (insightsId && insightsId !== lastLoggedInsights && userId) {
      setLastLoggedInsights(insightsId);
      // Reset tracking when new insights are loaded
      setCurrentPage(0);
      setShownInsightIds(new Set());
      
      // Select a random greeting when new insights are loaded
      if (convexInsights?.greetings && convexInsights.greetings.length > 0) {
        const randomIndex = Math.floor(Math.random() * convexInsights.greetings.length);
        setSelectedGreeting(convexInsights.greetings[randomIndex]);
      }
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
        recommendation: item.recommendation || '',
        icon: getIconForCategory(item.category || 'default'),
        id: `${convexInsights._id}-${index}` // Use stable ID based on convex data
      }));
    }
    return [];
  }, [convexInsights?._id, convexInsights?.data]);

  // Get current page of insights with smart pagination logic (desktop only)
  // On mobile, show all insights in horizontal scroll
  const currentPageInsights = useMemo(() => {
    if (allInsights.length === 0) return [];
    
    // Mobile: show all insights
    if (isMobile) {
      return allInsights;
    }

    // Desktop: paginated view
    if (currentPage === 0) {
      return allInsights.slice(0, CARDS_PER_PAGE);
    } else if (currentPage === 1) {
      return allInsights.slice(4, 8);
    } else if (currentPage === 2 && allInsights.length >= 8) {
      const lastTwo = allInsights.slice(8, 10);
      const firstEight = allInsights.slice(0, 8);
      const shuffled = [...firstEight].sort(() => Math.random() - 0.5);
      const randomTwo = shuffled.slice(0, 2);
      return [...lastTwo, ...randomTwo];
    }
    
    return allInsights.slice(0, CARDS_PER_PAGE);
  }, [allInsights, currentPage, isMobile]);

  // Track scroll position for mobile carousel indicators
  useEffect(() => {
    if (!isMobile || !scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.clientWidth;
      const newIndex = Math.round(scrollLeft / cardWidth);
      setActiveIndex(newIndex);
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isMobile, currentPageInsights.length]);

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

  // Refresh function - different behavior for mobile vs desktop
  const handleRefresh = async () => {
    if (!userId) return;
    
    setIsRefreshing(true);
    
    try {
      // Mobile: Always immediately refresh from backend
      if (isMobile) {
        const apiKey = await getApiKey();
        if (!apiKey) {
          console.error('No API key found for ambient_insights request');
          setIsRefreshing(false);
          return;
        }
        
        // Remove existing insights to force regeneration
        await fetch('/api/ambient_insights/remove', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ userId }),
        });
        
        // Generate new insights
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
          await response.json();
          setActiveIndex(0); // Reset to first card
        }
        setIsRefreshing(false);
        return;
      }
      
      // Desktop: Pagination logic (show next page, then refresh when exhausted)
      if (!needsBackendCall) {
        setCurrentPage(prev => prev + 1);
        setIsRefreshing(false);
        return;
      }
      
      // Desktop: We need fresh insights from backend
      const apiKey = await getApiKey();
      if (!apiKey) {
        console.error('No API key found for ambient_insights request');
        setIsRefreshing(false);
        return;
      }
      
      await fetch('/api/ambient_insights/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ userId }),
      });
      
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
        await response.json();
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
            await response.json();
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
    <InsightsContainer isMobile={isMobile}>
      {/* Header with greeting and Refresh button - Show on all screen sizes */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6 sm:mb-8">
        <h2 className="text-base sm:text-lg lg:text-xl font-light text-foreground pr-0 sm:pr-6 flex-1 leading-tight">
          <T context="ambient_insights.greeting">{selectedGreeting}</T>
        </h2>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="default"
          className="flex items-center gap-2 text-base sm:text-lg shrink-0"
        >
          <RefreshCw className={`w-5 h-5 sm:w-6 sm:h-6 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            <T context="button.refresh">Refresh</T>
          </span>
          <span className="sm:hidden">Refresh</span>
        </Button>
      </div>

      {/* Mobile: Horizontal swipeable carousel */}
      {isMobile ? (
        <div className="relative">
          <div 
            ref={scrollContainerRef}
            className="overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-2 -mx-3 px-3 touch-pan-x"
          >
            <div className="flex gap-4 w-max">
              {currentPageInsights.map((insight, index) => (
                <div
                  key={insight.id}
                  className="snap-start flex-shrink-0 w-[calc(100vw-2rem)]"
                >
                  <InsightCard
                    title={insight.title}
                    description={insight.description}
                    recommendation={insight.recommendation}
                    icon={insight.icon}
                    onClick={() => onInsightClick?.(insight.action, insight)}
                    titleSize="text-sm mb-3"
                    maxFontSize={14}
                    minFontSize={12}
                    responsive={false}
                  />
                </div>
              ))}
            </div>
          </div>
          {/* Scroll indicator dots */}
          {currentPageInsights.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {currentPageInsights.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    index === activeIndex 
                      ? "w-6 bg-primary" 
                      : "w-1.5 bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Desktop: Grid layout */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {currentPageInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              title={insight.title}
              description={insight.description}
              recommendation={insight.recommendation}
              icon={insight.icon}
              onClick={() => onInsightClick?.(insight.action, insight)}
              titleSize="text-sm sm:text-base mb-4"
              maxFontSize={14}
              minFontSize={12}
            />
          ))}
        </div>
      )}
    </InsightsContainer>
  );
};