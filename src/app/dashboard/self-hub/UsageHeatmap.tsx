'use client'

import React, { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import ActivityCalendar from 'react-activity-calendar';
import { Calendar, BarChart3, ChevronDown, ChevronUp, Route } from 'lucide-react';

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
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '365d'>('365d');
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

  // Enhanced calendar settings for larger, more modern look
  const calendarSettings = useMemo(() => {
    switch (timeRange) {
      case '30d':
        return {
          fontSize: 14,
          blockSize: 18,
          blockMargin: 4,
          blockRadius: 4,
        };
      case '90d':
        return {
          fontSize: 13,
          blockSize: 15,
          blockMargin: 3,
          blockRadius: 3,
        };
      case '365d':
        return {
          fontSize: 12,
          blockSize: 12,
          blockMargin: 2,
          blockRadius: 3,
        };
      default:
        return {
          fontSize: 14,
          blockSize: 18,
          blockMargin: 4,
          blockRadius: 4,
        };
    }
  }, [timeRange]);

  // Calculate streak and activity summary like GitHub
  const activitySummary = useMemo(() => {
    if (!calendarData.length) return { streak: 0, totalDays: 0, mostActiveDay: 0 };
    
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    const sortedData = [...calendarData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Calculate current streak from today backwards
    for (const day of sortedData) {
      if (day.count > 0) {
        tempStreak++;
      } else {
        break;
      }
    }
    currentStreak = tempStreak;
    
    // Calculate max streak
    tempStreak = 0;
    for (const day of calendarData) {
      if (day.count > 0) {
        tempStreak++;
        maxStreak = Math.max(maxStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    const totalActiveDays = calendarData.filter(d => d.count > 0).length;
    const mostActiveDay = Math.max(...calendarData.map(d => d.count));
    
    return { 
      streak: currentStreak, 
      maxStreak,
      totalDays: totalActiveDays, 
      mostActiveDay 
    };
  }, [calendarData]);

  // Show loading state
  if (usageEvents === undefined || usageSummary === undefined) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-xl">
              <BarChart3 className="w-6 h-6" />
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-6">
              <div className="h-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl"></div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="h-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl"></div>
                <div className="h-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl"></div>
                <div className="h-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl"></div>
                <div className="h-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Heatmap Card - Much Larger and Modern */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white via-gray-50/30 to-white">
        <CardHeader className="pb-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-3 text-xl">
                <BarChart3 className="w-6 h-6 text-[#5b36ff]" />
                Activity
              </CardTitle>
              <p className="text-sm text-gray-600">
                {stats.totalRequests.toLocaleString()} requests in {timeRange === '365d' ? 'the last year' : `the last ${timeRange.replace('d', ' days')}`}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/80 rounded-lg px-4 py-2 border border-gray-200/60">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '30d' | '90d' | '365d')}
                className="text-sm border-none bg-transparent focus:ring-0 cursor-pointer font-medium"
                aria-label="Select time range for usage heatmap"
              >
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="365d">Last year</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Large Heatmap with GitHub-style layout */}
          <div className="w-full">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="min-w-fit p-6 bg-white/60 rounded-2xl border border-gray-200/40">
                <ActivityCalendar
                  data={calendarData}
                  theme={{
                    light: [
                      '#f8fafc', // Very light gray (level 0)
                      '#e2e8f0', // Light gray (level 1) 
                      '#a855f7', // Medium purple (level 2)
                      '#7c3aed', // Darker purple (level 3)
                      '#5b21b6'  // Darkest purple (level 4)
                    ],
                    dark: [
                      '#1e293b',
                      '#334155', 
                      '#a855f7',
                      '#7c3aed',
                      '#5b21b6'
                    ]
                  }}
                  colorScheme="light"
                  labels={{
                    totalCount: `{{count}} requests in ${timeRange === '365d' ? 'the last year' : `the last ${timeRange.replace('d', ' days')}`}`,
                  }}
                  showWeekdayLabels={true}
                  fontSize={calendarSettings.fontSize}
                  blockSize={calendarSettings.blockSize}
                  blockMargin={calendarSettings.blockMargin}
                  blockRadius={calendarSettings.blockRadius}
                  style={{ 
                    fontSize: `${calendarSettings.fontSize}px`,
                    color: '#374151'
                  }}
                />
              </div>
            </div>
          </div>

          {/* GitHub-style activity summary */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 bg-gray-50/50 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-200 rounded-sm"></div>
              <span>Less</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-[#e2e8f0] rounded-sm"></div>
              <div className="w-3 h-3 bg-[#a855f7] rounded-sm"></div>
              <div className="w-3 h-3 bg-[#7c3aed] rounded-sm"></div>
              <div className="w-3 h-3 bg-[#5b21b6] rounded-sm"></div>
            </div>
            <div className="flex items-center gap-2">
              <span>More</span>
            </div>
            <div className="ml-auto flex items-center gap-6 text-xs">
              <span><strong>{activitySummary.streak}</strong> day streak</span>
              <span><strong>{activitySummary.totalDays}</strong> active days</span>
              <span><strong>{activitySummary.mostActiveDay}</strong> max daily</span>
            </div>
          </div>

          {/* Enhanced Usage Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200/40 shadow-sm">
              <div className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">{stats.totalRequests.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Period Total</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-200/40 shadow-sm">
              <div className="text-2xl lg:text-3xl font-bold text-purple-900 mb-1">{(usageSummary?.total || 0).toLocaleString()}</div>
              <div className="text-sm text-purple-600">Billing Period</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-200/40 shadow-sm">
              <div className="text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{stats.avgDaily}</div>
              <div className="text-sm text-blue-600">Avg Daily</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-white rounded-2xl border border-green-200/40 shadow-sm">
              <div className="text-2xl lg:text-3xl font-bold text-green-900 mb-1">{stats.activeDays}</div>
              <div className="text-sm text-green-600">Active Days</div>
            </div>
          </div>

          {/* Top Features Section - Integrated into main card */}
          {topPaths.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-t border-gray-200/60 pt-8">
                <div className="flex items-center gap-3">
                  <Route className="w-5 h-5 text-[#5b36ff]" />
                  <h3 className="text-lg font-semibold text-gray-900">Top Features ({topPaths.length})</h3>
                </div>
                <button
                  onClick={() => setShowEndpoints(!showEndpoints)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-all duration-200 min-h-[44px] px-4 py-2 rounded-lg hover:bg-gray-50 border border-gray-200/60"
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

              {showEndpoints && (
                <div className="space-y-6">
                  {topPaths.map((pathData, index) => {
                    const percentage = stats.totalRequests > 0 
                      ? (pathData.totalUsage / stats.totalRequests) * 100 
                      : 0;
                    
                    return (
                      <div key={pathData.path} className="space-y-3 p-4 bg-gray-50/50 rounded-xl">
                        <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="text-xs bg-[#5b36ff] text-white px-3 py-1 rounded-full font-mono font-medium shrink-0">
                              #{index + 1}
                            </span>
                            <span className="text-sm font-medium text-gray-900 truncate min-w-0">
                              {getEndpointDisplayName(pathData.path)}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-gray-700 shrink-0">
                            {pathData.totalUsage.toLocaleString()} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress 
                          value={percentage} 
                          className="h-3 bg-gray-200 [&>div]:bg-gradient-to-r [&>div]:from-[#5b36ff] [&>div]:to-[#7c3aed] [&>div]:rounded-full"
                        />
                      </div>
                    );
                  })}
                  
                  {/* Enhanced summary stats */}
                  <div className="mt-6 pt-4 border-t border-gray-200/40">
                    <div className="text-sm text-gray-600 leading-relaxed bg-gradient-to-r from-gray-50 to-transparent p-4 rounded-xl">
                      <span className="font-semibold text-gray-900">Top 5 features</span> account for{' '}
                      <span className="font-bold text-[#5b36ff]">
                        {topPaths.reduce((sum, p) => sum + p.totalUsage, 0).toLocaleString()}
                      </span>{' '}
                      requests (
                      <span className="font-bold text-[#5b36ff]">
                        {stats.totalRequests > 0 
                          ? ((topPaths.reduce((sum, p) => sum + p.totalUsage, 0) / stats.totalRequests) * 100).toFixed(1)
                          : 0}%
                      </span>
                      ) of total usage in this period.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 