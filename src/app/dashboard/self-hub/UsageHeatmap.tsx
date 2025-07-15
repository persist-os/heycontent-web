'use client'

import React, { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import ActivityCalendar from 'react-activity-calendar';
import { 
  Calendar, 
  BarChart3, 
  ChevronDown, 
  ChevronUp, 
  Route, 
  Info,
  MessageCircle,
  FileText,
  Lightbulb,
  Instagram,
  Youtube,
  RefreshCw,
  Mail,
  Sparkles,
  Target,
  Settings
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface UsageHeatmapProps {
  userId: string;
}

// Function to convert technical endpoint paths to user-friendly accomplishments
const getCreativeAccomplishment = (path: string, usage: number): { icon: React.ComponentType<any>; title: string; description: string } => {
  const accomplishmentMap: { [key: string]: { icon: React.ComponentType<any>; title: string; description: string } } = {
    '/api/v1/chat': {
      icon: MessageCircle,
      title: `Had ${usage} creative conversations`,
      description: 'Brainstormed ideas and strategies with AI'
    },
    '/api/v1/smart-note/analyze': {
      icon: FileText,
      title: `Analyzed ${usage} notes for insights`,
      description: 'Discovered patterns in your content ideas'
    },
    '/api/v1/smart-note/ideas/generate': {
      icon: Lightbulb,
      title: `Generated ${usage} fresh content ideas`,
      description: 'Created new concepts for your content strategy'
    },
    '/api/v1/instagram/analyze': {
      icon: Instagram,
      title: `Analyzed ${usage} Instagram posts`,
      description: 'Gained insights into your social media performance'
    },
    '/api/v1/youtube/analyze': {
      icon: Youtube,
      title: `Analyzed ${usage} YouTube videos`,
      description: 'Discovered trends in your video content'
    },
    '/api/v1/youtube/refresh': {
      icon: RefreshCw,
      title: `Refreshed YouTube data ${usage} times`,
      description: 'Kept your video insights up to date'
    },
    '/api/v1/gmail/analyze-inbox': {
      icon: Mail,
      title: `Analyzed ${usage} email insights`,
      description: 'Found opportunities in your communications'
    },
    '/api/v1/ambient_insights/generate': {
      icon: Sparkles,
      title: `Discovered ${usage} ambient insights`,
      description: 'Uncovered hidden patterns in your content'
    },
    '/api/v1/content_hub/generate': {
      icon: Target,
      title: `Generated ${usage} content strategies`,
      description: 'Built comprehensive content plans'
    },
  };

  // Check for exact matches first
  if (accomplishmentMap[path]) {
    return accomplishmentMap[path];
  }

  // Check for partial matches (for paths with dynamic segments)
  for (const [endpoint, accomplishment] of Object.entries(accomplishmentMap)) {
    if (path.startsWith(endpoint)) {
      return accomplishment;
    }
  }

  // Fallback for unknown paths
  return {
    icon: Settings,
    title: `Used creative tools ${usage} times`,
    description: 'Explored various features to enhance your content'
  };
};

// Tooltip component for metric explanations
const MetricTooltip: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div className="relative">
      {children}
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-muted/80 hover:bg-muted flex items-center justify-center transition-colors"
        aria-label={`Information about ${title}`}
      >
        <Info className="w-2.5 h-2.5 text-muted-foreground" />
      </button>
      
      {showTooltip && (
        <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-popover text-popover-foreground border rounded-lg shadow-lg z-10">
          <div className="text-sm font-medium mb-1">{title}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      )}
    </div>
  );
};

export const UsageHeatmap: React.FC<UsageHeatmapProps> = ({ userId }) => {
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '365d'>('365d');
  const [showEndpoints, setShowEndpoints] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number; x: number; y: number } | null>(null);
  
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
    if (!calendarData.length) return { streak: 0, totalDays: 0, mostActiveDay: 0, maxStreak: 0 };
    
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

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Show loading state
  if (usageEvents === undefined || usageSummary === undefined) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <BarChart3 className="w-5 h-5" />
              Creative Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-4 gap-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-productivity-insights>
      {/* Main Activity Card - Heatmap Left, Top Features Right */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-3 text-lg">
                <BarChart3 className={cn("w-5 h-5", isDark ? "text-yellow-400" : "text-purple-600")} />
                Creative Activity
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {stats.totalRequests.toLocaleString()} creative sessions in {timeRange === '365d' ? 'the last year' : `the last ${timeRange.replace('d', ' days')}`}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-background/80 rounded-lg px-3 py-2 border">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '30d' | '90d' | '365d')}
                className="text-sm border-none bg-transparent focus:ring-0 cursor-pointer font-medium"
                aria-label="Select time range for creative activity"
              >
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="365d">Last year</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Heatmap - Full Width */}
          <div className="w-full overflow-hidden">
            <div className="overflow-x-auto py-3">
              <div 
                className="min-w-fit relative"
                onMouseMove={(e) => {
                  const rect = (e.target as HTMLElement).closest('rect');
                  if (rect) {
                    // Find the corresponding data for this rect
                    const rects = document.querySelectorAll('.react-activity-calendar rect');
                    const index = Array.from(rects).indexOf(rect);
                    if (index >= 0 && index < calendarData.length) {
                      const activity = calendarData[index];
                      const clientRect = rect.getBoundingClientRect();
                      setHoveredDay({
                        date: activity.date,
                        count: activity.count,
                        x: clientRect.left + clientRect.width / 2,
                        y: clientRect.top
                      });
                    }
                  }
                }}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <ActivityCalendar
                  data={calendarData}
                  theme={{
                    light: ['hsl(var(--muted))', 'hsl(262.1 83.3% 57.8%)'], // Purple for light mode
                    dark: ['hsl(var(--muted))', 'hsl(47.9 95.8% 67.1%)'] // Yellow for dark mode
                  }}
                  colorScheme={isDark ? 'dark' : 'light'}
                  labels={{
                    totalCount: `{{count}} creative sessions in ${timeRange === '365d' ? 'the last year' : `the last ${timeRange.replace('d', ' days')}`}`,
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
                
                {/* Custom Tooltip Overlay */}
                {hoveredDay && (
                  <div
                    className="fixed z-50 pointer-events-none"
                    style={{
                      left: hoveredDay.x,
                      top: hoveredDay.y - 10,
                      transform: 'translate(-50%, -100%)'
                    }}
                  >
                    <div className="bg-popover text-popover-foreground border rounded-lg shadow-lg p-2 text-sm whitespace-nowrap">
                      {hoveredDay.count === 0
                        ? `No creative sessions on ${new Date(hoveredDay.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}`
                        : `${hoveredDay.count} creative session${hoveredDay.count === 1 ? '' : 's'} on ${new Date(hoveredDay.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}`
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Row - Clean and unique metrics only */}
          <div className="grid grid-cols-4 gap-3">
            <MetricTooltip
              title="Creative Sessions"
              description="Each time you use a feature like chat, content analysis, idea generation, or insights. Every action that helps you create better content counts as a creative session."
            >
              <div className="text-center p-3 bg-muted/30 rounded-lg border">
                <div className="text-lg font-bold text-foreground">{stats.totalRequests.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Creative Sessions</div>
              </div>
            </MetricTooltip>

            <MetricTooltip
              title="Current Streak"
              description="Your current streak of consecutive days with creative activity. Building a streak shows consistency and helps develop productive content creation habits."
            >
              <div className={cn(
                "text-center p-3 rounded-lg border",
                isDark 
                  ? "bg-yellow-500/5 border-yellow-500/10"
                  : "bg-purple-500/5 border-purple-500/10"
              )}>
                <div className={cn(
                  "text-lg font-bold",
                  isDark ? "text-yellow-400" : "text-purple-600"
                )}>
                  {activitySummary.streak}
                </div>
                <div className={cn(
                  "text-xs",
                  isDark ? "text-yellow-400/80" : "text-purple-600/80"
                )}>
                  Current Streak
                </div>
              </div>
            </MetricTooltip>

            <MetricTooltip
              title="Daily Creativity"
              description="Your average number of creative sessions per day. This shows how consistently you're engaging with content creation tools and building productive habits."
            >
              <div className="text-center p-3 bg-muted/30 rounded-lg border">
                <div className="text-lg font-bold text-foreground">{stats.avgDaily}</div>
                <div className="text-xs text-muted-foreground">Daily Creativity</div>
              </div>
            </MetricTooltip>

            <MetricTooltip
              title="Productive Days"
              description="Days when you actively created content or used creative tools. The more productive days you have, the more consistent your content creation journey becomes."
            >
              <div className="text-center p-3 bg-muted/30 rounded-lg border">
                <div className="text-lg font-bold text-foreground">{stats.activeDays}</div>
                <div className="text-xs text-muted-foreground">Productive Days</div>
              </div>
            </MetricTooltip>
          </div>

          {/* Creative Tools Section - Below heatmap */}
          {topPaths.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Route className={cn("w-4 h-4", isDark ? "text-yellow-400" : "text-purple-600")} />
                  <h3 className="text-sm font-semibold text-foreground">Creative Tools</h3>
                </div>
                <button
                  onClick={() => setShowEndpoints(!showEndpoints)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                >
                  {showEndpoints ? (
                    <>Hide <ChevronUp className="w-3 h-3" /></>
                  ) : (
                    <>Show <ChevronDown className="w-3 h-3" /></>
                  )}
                </button>
              </div>

              {showEndpoints && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {topPaths.slice(0, 6).map((pathData, index) => {
                    const accomplishment = getCreativeAccomplishment(pathData.path, pathData.totalUsage);
                    const IconComponent = accomplishment.icon;

                    return (
                      <div 
                        key={pathData.path}
                        className="bg-background/50 rounded-lg p-3 hover:bg-background/70 transition-colors cursor-pointer border border-border/50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                              index === 0 ? "bg-yellow-400/20 text-yellow-600 dark:bg-yellow-400/10 dark:text-yellow-400" : 
                              index === 1 ? "bg-gray-400/20 text-gray-600 dark:bg-gray-400/10 dark:text-gray-400" : 
                              index === 2 ? "bg-amber-600/20 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400" :
                              isDark ? "bg-purple-400/10 text-purple-400" : "bg-purple-600/20 text-purple-600"
                            )}>
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-foreground leading-tight">
                                {accomplishment.title}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 leading-tight">
                                {accomplishment.description}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <span className="text-lg font-bold text-foreground">
                              {pathData.totalUsage}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 