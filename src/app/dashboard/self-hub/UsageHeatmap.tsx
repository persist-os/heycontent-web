'use client'

import React, { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import ActivityCalendar from 'react-activity-calendar';
import { Calendar, BarChart3, ChevronDown, ChevronUp, Route } from 'lucide-react';
import { useTheme } from 'next-themes';

interface UsageHeatmapProps {
  userId: string;
}

// Function to convert technical endpoint paths to user-friendly names
const getEndpointDisplayName = (path: string): string => {
  const endpointMap: { [key: string]: string } = {
    '/api/v1/chat': 'Chat Conversations',
    '/api/v1/smart-note/analyze': 'Smart Note Analysis',
    '/api/v1/smart-note/ideas/generate': 'Idea Generation',
    '/api/v1/instagram/analyze': 'Instagram Insights',
    '/api/v1/youtube/analyze': 'YouTube Analysis',
    '/api/v1/youtube/refresh': 'YouTube Data Refresh',
    '/api/v1/gmail/analyze-inbox': 'Gmail Insights',
    '/api/v1/ambient_insights/generate': 'Ambient Insights',
    '/api/v1/content_hub/generate': 'Content Hub Insights',
  };

  // Check for exact matches first
  if (endpointMap[path]) {
    return endpointMap[path];
  }

  // Check for partial matches (for paths with dynamic segments)
  for (const [endpoint, displayName] of Object.entries(endpointMap)) {
    if (path.startsWith(endpoint)) {
      return displayName;
    }
  }

  // Fallback: clean up the path for display
  return path
    .replace('/api/v1/', '')
    .split('/')
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
    .replace(/-/g, ' ');
};

export const UsageHeatmap: React.FC<UsageHeatmapProps> = ({ userId }) => {
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '365d'>('30d');
  const [showEndpoints, setShowEndpoints] = useState(true);
  
  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const end = Date.now();
    const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const start = end - (days * 24 * 60 * 60 * 1000);
    return { startDate: start, endDate: end };
  }, [timeRange]);

  // Fetch usage data from same source as subscription overview
  const usageSummary = useQuery(api.usageEvents.getUsageSummary, userId ? { userId } : "skip");
  const usageEvents = useQuery(api.usageEvents.listUsageEvents, userId ? { 
    userId, 
    limit: 2000 // Get more events to ensure we have enough data
  } : "skip");

  // Process usage events into daily data for heatmap
  const { calendarData, topPaths, stats } = useMemo(() => {
    if (!usageEvents || !Array.isArray(usageEvents)) {
      return { 
        calendarData: [], 
        topPaths: [], 
        stats: { totalRequests: 0, avgDaily: 0, activeDays: 0 } 
      };
    }

    // Filter events to the selected time range
    // Convert timestamp to milliseconds if it's in seconds (< year 2000 in ms)
    const filteredEvents = usageEvents.filter(event => {
      let eventTime = event.timestamp;
      // If timestamp looks like seconds (less than year 2000 in milliseconds), convert to ms
      if (eventTime < 946684800000) {
        eventTime = eventTime * 1000;
      }
      return eventTime >= startDate && eventTime <= endDate;
    });

    // Group events by date and path
    const dailyUsage: { [date: string]: number } = {};
    const pathUsage: { [path: string]: number } = {};
    
    filteredEvents.forEach(event => {
      // Convert timestamp to milliseconds if needed
      let eventTime = event.timestamp;
      if (eventTime < 946684800000) {
        eventTime = eventTime * 1000;
      }
      
      const date = new Date(eventTime).toISOString().slice(0, 10); // YYYY-MM-DD
      const path = event.path || event.endpoint || 'unknown';
      const qty = event.qty || 1;
      
      dailyUsage[date] = (dailyUsage[date] || 0) + qty;
      pathUsage[path] = (pathUsage[path] || 0) + qty;
    });

    // Create calendar data for react-activity-calendar
    const calData: { date: string; count: number; level: number }[] = [];
    const dayCount = Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000));
    
    for (let i = 0; i < dayCount; i++) {
      const date = new Date(startDate + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().slice(0, 10);
      const count = dailyUsage[dateStr] || 0;
      
      calData.push({
        date: dateStr,
        count,
        level: Math.min(4, Math.ceil(count / 10)) // 0-4 levels
      });
    }

    // Get top paths from filtered events
    const topPathsData = Object.entries(pathUsage)
      .map(([path, usage]) => ({ path, totalUsage: usage }))
      .sort((a, b) => b.totalUsage - a.totalUsage)
      .slice(0, 5);

    // Calculate stats for the filtered period
    const totalRequests = filteredEvents.reduce((sum, event) => sum + (event.qty || 1), 0);
    const activeDays = Object.keys(dailyUsage).length;
    const avgDaily = totalRequests / dayCount;

    return {
      calendarData: calData,
      topPaths: topPathsData,
      stats: { 
        totalRequests, 
        avgDaily: Math.round(avgDaily * 10) / 10, 
        activeDays 
      }
    };
  }, [usageEvents, startDate, endDate]);

  // Responsive calendar settings based on time range
  const calendarSettings = useMemo(() => {
    switch (timeRange) {
      case '30d':
        return {
          fontSize: 12,
          blockSize: 16,
          blockMargin: 3,
          blockRadius: 3,
        };
      case '90d':
        return {
          fontSize: 11,
          blockSize: 12,
          blockMargin: 2,
          blockRadius: 2,
        };
      case '365d':
        return {
          fontSize: 10,
          blockSize: 8,
          blockMargin: 1,
          blockRadius: 2,
        };
      default:
        return {
          fontSize: 12,
          blockSize: 16,
          blockMargin: 3,
          blockRadius: 3,
        };
    }
  }, [timeRange]);

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Show loading state
  if (usageEvents === undefined || usageSummary === undefined) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Usage Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Heatmap Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />Activity
            </CardTitle>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '30d' | '90d' | '365d')}
                className="text-sm border-none bg-transparent focus:ring-0 cursor-pointer min-h-[44px] px-2 py-1"
                aria-label="Select time range for usage heatmap"
              >
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="365d">Last year</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Heatmap */}
          <div className="w-full overflow-hidden">
            <div className="overflow-x-auto py-4">
              <div className="min-w-fit flex justify-center">
                <div className="max-w-full">
                  <ActivityCalendar
                    data={calendarData}
                    theme={{
                      light: ['hsl(var(--muted))', 'hsl(262.1 83.3% 57.8%)'], // Purple for light mode
                      dark: ['hsl(var(--muted))', 'hsl(47.9 95.8% 67.1%)'] // Yellow for dark mode
                    }}
                    colorScheme={isDark ? 'dark' : 'light'}
                    labels={{
                      totalCount: `{{count}} requests in ${timeRange === '365d' ? 'the last year' : `the last ${timeRange.replace('d', ' days')}`}`,
                    }}
                    showWeekdayLabels
                    fontSize={calendarSettings.fontSize}
                    blockSize={calendarSettings.blockSize}
                    blockMargin={calendarSettings.blockMargin}
                    blockRadius={calendarSettings.blockRadius}
                    style={{ 
                      fontSize: `${calendarSettings.fontSize}px`,
                      maxWidth: '100%'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="text-center p-4 bg-muted/30 rounded-lg min-h-[80px] flex flex-col justify-center border">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{stats.totalRequests.toLocaleString()}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Period Total</div>
            </div>
            <div className={cn(
              "text-center p-4 rounded-lg min-h-[80px] flex flex-col justify-center border",
              isDark 
                ? "bg-yellow-500/5 border-yellow-500/10"
                : "bg-purple-500/5 border-purple-500/10"
            )}>
              <div className={cn(
                "text-lg sm:text-xl lg:text-2xl font-bold",
                isDark ? "text-yellow-400" : "text-purple-600"
              )}>
                {(usageSummary?.total || 0).toLocaleString()}
              </div>
              <div className={cn(
                "text-xs sm:text-sm mt-1",
                isDark ? "text-yellow-400/80" : "text-purple-600/80"
              )}>
                Billing Period
              </div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg min-h-[80px] flex flex-col justify-center border">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{stats.avgDaily}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Avg Daily</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg min-h-[80px] flex flex-col justify-center border">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{stats.activeDays}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Active Days</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Endpoints Card - Collapsible */}
      {topPaths.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Route className="w-5 h-5" />
                Top Features ({topPaths.length})
              </CardTitle>
              <button
                onClick={() => setShowEndpoints(!showEndpoints)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors min-h-[44px] px-3 py-2 rounded-md hover:bg-gray-50"
              >
                {showEndpoints ? (
                  <>
                    Hide <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Show <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </CardHeader>
          {showEndpoints && (
            <CardContent>
              <div className="space-y-4">
                {topPaths.map((pathData, index) => {
                  const percentage = stats.totalRequests > 0 
                    ? (pathData.totalUsage / stats.totalRequests) * 100 
                    : 0;
                  
                  return (
                    <div key={pathData.path} className="space-y-3">
                      <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-xs bg-muted text-foreground/80 px-2 py-1 rounded font-mono shrink-0">
                            #{index + 1}
                          </span>
                          <span className="text-sm text-foreground truncate min-w-0">
                            {getEndpointDisplayName(pathData.path)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground shrink-0">
                          {pathData.totalUsage.toLocaleString()} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div 
                          className={cn(
                            "h-full rounded-full",
                            isDark 
                              ? "bg-yellow-400" 
                              : "bg-purple-600"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Summary stats for endpoints */}
              <div className="mt-6 pt-4 border-t border-border">
                <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  <span className="font-medium">Top 5 features</span> account for{' '}
                  <span className="font-medium text-foreground">
                    {topPaths.reduce((sum, p) => sum + p.totalUsage, 0).toLocaleString()}
                  </span>{' '}
                  requests (
                  <span className="font-medium text-foreground">
                    {stats.totalRequests > 0 
                      ? ((topPaths.reduce((sum, p) => sum + p.totalUsage, 0) / stats.totalRequests) * 100).toFixed(1)
                      : 0}%
                    </span>
                  ) of total usage in this period.
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}; 