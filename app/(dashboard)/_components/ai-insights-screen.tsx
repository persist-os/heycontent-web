'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { 
  Brain, TrendingUp, Target, Share2, 
  ChevronRight, ArrowRight, Clock, MessageSquare,
  RefreshCw, AlertCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { auth } from '@/app/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'

interface QuotaError {
  service: string;
  error: string;
}

interface InsightEmail {
  subject: string;
  from: string;
  date: string;
  dealValue?: number;
  dealType?: string;
}

interface InsightVideo {
  title: string;
  views: string | number;
  engagement: string | number;
}

interface ExtendedInsightContext {
  why: string[];
  data: string[];
  source?: string;
  sourceDetails?: string[];
  emails?: InsightEmail[];
  videos?: InsightVideo[];
}

interface AIActionableInsight {
  id: string | number;
  type: 'partnership' | 'content' | 'platform';
  opportunity: {
      title: string;
      description: string;
      impact: string;
      timing: string;
      confidence: number;
  };
  action: {
      steps: string[];
      timeToImplement: string;
      expectedOutcome: string;
      requirements: string[];
      type?: string;
      priority?: 'high' | 'medium' | 'low';
  };
  context: ExtendedInsightContext;
}

interface CacheMetadata {
  timestamp: string;
  version: number;
  partial: boolean;
}

interface CachedInsights {
  insights: AIActionableInsight[];
  metadata: CacheMetadata;
}

interface APIInsightResponse {
  title: string;
  type: 'partnership' | 'content' | 'platform';
  description: string;
  confidence: number;
  source?: string;
  action?: {
      steps: string[];
      timeToImplement: string;
      requirements: string[];
      type?: string;
      priority?: 'high' | 'medium' | 'low';
  };
  data?: {
      emails?: InsightEmail[];
      videos?: InsightVideo[];
      sourceDetails?: string[];
      data?: string[];
      engagementPotential?: string;
  };
}


const CACHE_VERSION = 1;
const QUOTA_COOLDOWN = 30 * 60 * 1000; // 30 minutes
const REQUEST_LOCK_TIMEOUT = 10000; // 10 seconds

// Improved request locking with timestamp validation
function getRequestLock(): boolean {
  try {
    const lockTimestamp = localStorage.getItem('insightsRequestLock');
    const now = Date.now();
    
    if (!lockTimestamp) {
      localStorage.setItem('insightsRequestLock', now.toString());
      return true;
    }

    const lockTime = parseInt(lockTimestamp);
    if (isNaN(lockTime) || now - lockTime > REQUEST_LOCK_TIMEOUT) {
      localStorage.setItem('insightsRequestLock', now.toString());
      return true;
    }

    console.log('Request lock active, time remaining:', REQUEST_LOCK_TIMEOUT - (now - lockTime));
    return false;
  } catch (error) {
    console.warn('Error managing request lock:', error);
    return false;
  }
}

function releaseRequestLock() {
  try {
    localStorage.removeItem('insightsRequestLock');
  } catch (error) {
    console.warn('Error releasing request lock:', error);
  }
}

function getInsightsCache(): CachedInsights | null {
  try {
    const cachedData = localStorage.getItem('cachedInsights');
    if (!cachedData) return null;

    const parsed = JSON.parse(cachedData);
    
    // Only validate cache version, not TTL
    if (!parsed.metadata?.version || parsed.metadata.version !== CACHE_VERSION) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn('Failed to parse cached insights:', error);
    return null;
  }
}

function setInsightsCache(insights: AIActionableInsight[], partial: boolean = false) {
  try {
    const cacheData: CachedInsights = {
      insights,
      metadata: {
        timestamp: new Date().toISOString(),
        version: CACHE_VERSION,
        partial
      }
    };
    localStorage.setItem('cachedInsights', JSON.stringify(cacheData));
    localStorage.setItem('lastInsightsRefresh', new Date().toISOString());
  } catch (error) {
    console.warn('Failed to cache insights:', error);
  }
}

export function AIInsightsScreen() {
  const [insights, setInsights] = useState<AIActionableInsight[]>([])
  const [selectedInsight, setSelectedInsight] = useState<string | number | null>(null)
  const [isFirstVisit, setIsFirstVisit] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [retryAttempts, setRetryAttempts] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('content')
  const [canRefresh, setCanRefresh] = useState(true)
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  // Add these inside the component
  const isRequestInProgress = useRef(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!auth) {
      console.error('Firebase auth not initialized')
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
    })

    return () => unsubscribe()
  }, [])

  // Background fetch without loading state
  const backgroundFetch = async () => {
    if (isRequestInProgress.current) {
      console.log('Request already in progress, skipping...');
      return;
    }

    try {
      isRequestInProgress.current = true;
      console.log('Starting background fetch...');
      const response = await fetch('/api/insights');
      const data = await response.json();
      console.log('Fetched data:', data);

      if (!response.ok) {
        console.error('Background fetch error:', data.error);
        setError('Failed to fetch insights. Please try again later.');
        return;
      }

      // Check for quota limit errors
      const hasQuotaError = data.errors?.some((error: QuotaError) => 
        error.error?.toLowerCase().includes('quota limit'));

      if (hasQuotaError) {
        console.log('Quota limit reached, using cached data if available');
        
        // Set quota cooldown
        localStorage.setItem('quotaCooldown', Date.now().toString());
        
        const cachedData = getInsightsCache();
        if (cachedData) {
          console.log('Using cached insights:', cachedData);
          setInsights(cachedData.insights);
          setLastUpdated(new Date(cachedData.metadata.timestamp));
          setError('Some services are temporarily unavailable. Showing cached insights.');
        } else {
          setError('Unable to fetch insights. Please try again later.');
        }
        return;
      }

      // Reset error on successful fetch
      setError(null);

      if (data.insights) {
        const transformedInsights = data.insights.map((insight: APIInsightResponse, index: number) => {
          // Extract partner name from title
          const partnerName = insight.type === 'partnership' 
            ? (insight.title.includes(' with ') 
              ? insight.title.split(' with ')[1]
              : insight.title
                  .replace('Potential High-Value Partnership with ', '')
                  .replace('Partnership with ', '')
                  .replace('Maximizing ', '')
                  .replace('Leverage ', '')
                  .replace('High-Value ', '')
                  .replace(' Collaboration Value', '')
                  .replace(' Collaboration', '')
                  .replace(' Partnerships', '')
                  .replace(' Partnership', ''))
            : '';

          // Analyze deal values and communication patterns
          const dealValues = (insight.data?.emails?.map((e: InsightEmail) => e.dealValue).filter(Boolean) || []) as number[];
          const hasConsistentValues = dealValues.length > 0 && new Set(dealValues).size <= 2;
          const communicationCount = insight.data?.emails?.length || 0;
          const recentCommunication = insight.data?.emails?.[0]?.date ? new Date(insight.data.emails[0].date) : null;
          const isRecentlyActive = recentCommunication && (new Date().getTime() - recentCommunication.getTime() < 7 * 24 * 60 * 60 * 1000);

          // Determine partnership value description
          const getValueDescription = () => {
            if (dealValues.length === 0) {
              return communicationCount > 3 
                ? "Active communication - value to be discussed"
                : "Initial contact - explore partnership value";
            }
            const maxValue = Math.max(...dealValues);
            const minValue = Math.min(...dealValues);
            if (hasConsistentValues) {
              return `Consistent deal values around $${maxValue.toLocaleString()}`;
            }
            return `Deal values ranging from $${minValue.toLocaleString()} to $${maxValue.toLocaleString()}`;
          };

          // Generate strategic action steps
          const getStrategicSteps = () => {
            const steps = [];
            if (dealValues.length === 0) {
              steps.push(
                "Research partner's typical collaboration values",
                "Prepare value proposition based on your audience engagement",
                "Initiate value discussion highlighting mutual benefits"
              );
            } else if (!hasConsistentValues) {
              steps.push(
                "Analyze value variations to identify optimal partnership structure",
                "Propose standardized collaboration framework",
                "Highlight success metrics from higher-value collaborations"
              );
            } else {
              steps.push(
                "Build on established partnership framework",
                "Explore opportunities for expanded collaboration",
                "Document success metrics for future negotiations"
              );
            }
            return steps;
          };

          return {
            id: `insight-${index}-${Date.now()}`,
            type: insight.type || 'content',
            opportunity: {
              title: insight.type === 'partnership' 
                ? `Maximize ${partnerName} Partnership`
                : insight.title,
              description: insight.type === 'partnership'
                ? `${communicationCount} communications show ${isRecentlyActive ? 'active' : 'ongoing'} engagement${hasConsistentValues ? ' with consistent deal structure' : ''}`
                : insight.description,
              impact: insight.type === 'partnership'
                ? getValueDescription()
                : (insight.data?.engagementPotential || 'High engagement potential'),
              timing: isRecentlyActive ? "Active opportunity" : "Current opportunity",
              confidence: Math.round((insight.confidence || 0.85) * 100)
            },
            action: {
              steps: insight.type === 'partnership' ? getStrategicSteps() : (insight.action?.steps || []),
              timeToImplement: insight.action?.timeToImplement || "1-2 weeks",
              expectedOutcome: insight.type === 'partnership'
                ? dealValues.length === 0
                  ? `Establish strategic partnership with ${partnerName} focusing on ${communicationCount > 3 ? 'deepening' : 'building'} relationship and defining mutual value proposition`
                  : `Optimize partnership with ${partnerName} based on ${hasConsistentValues ? 'consistent' : 'varied'} deal values and strong communication history`
                : insight.type === 'content'
                ? `Increased audience engagement and growth through optimized content strategy`
                : `Enhanced platform presence and audience reach`,
              requirements: insight.action?.requirements || [],
              type: insight.action?.type,
              priority: insight.action?.priority || 'medium'
            },
            context: {
              why: [
                insight.type === 'partnership' 
                  ? `${communicationCount} recent communications show ${isRecentlyActive ? 'active' : 'sustained'} interest`
                  : insight.description,
                dealValues.length > 0
                  ? `Partnership history shows ${hasConsistentValues ? 'consistent' : 'varied'} deal values ${
                      hasConsistentValues 
                        ? `around $${Math.max(...dealValues).toLocaleString()}` 
                        : `from $${Math.min(...dealValues).toLocaleString()} to $${Math.max(...dealValues).toLocaleString()}`
                    }`
                  : communicationCount > 0
                  ? `${communicationCount} communications indicate promising partnership potential`
                  : null,
                isRecentlyActive
                  ? "Recent active communication suggests timely opportunity"
                  : null,
                ...(insight.data?.sourceDetails || []).filter((detail: string) => 
                  !detail.includes('Average deal value') && 
                  !detail.includes('partnership emails')
                )
              ].filter(Boolean),
              data: insight.data?.data || [],
              source: insight.source || 'combined',
              sourceDetails: insight.data?.sourceDetails || [],
              emails: insight.data?.emails?.map((email: InsightEmail) => ({
                subject: email.subject,
                from: email.from,
                date: email.date,
                dealValue: email.dealValue,
                dealType: email.dealType
              })) || [],
              videos: insight.data?.videos?.map((video: InsightVideo) => ({
                title: video.title,
                views: video.views || 'No views yet',
                engagement: video.engagement || 'No engagement data'
              })) || []
            }
          };
        });

        console.log('Transformed insights:', transformedInsights);
        setInsights(transformedInsights);
        setLastUpdated(new Date());
        
        // Cache the transformed insights
        setInsightsCache(transformedInsights, false);
      }
    } catch (error) {
      console.error('Background fetch error:', error);
      setError('Failed to fetch insights. Please try again later.');
    } finally {
      isRequestInProgress.current = false;
    }
  };

  // Add manual refresh function
  const handleRefresh = async () => {
    const lastRefresh = localStorage.getItem('lastInsightsRefresh');
    if (lastRefresh) {
      const lastRefreshDate = new Date(lastRefresh);
      if (!isNextDay(lastRefreshDate)) {
        setError('Insights can only be refreshed once per day');
        return;
      }
    }

    setIsRefreshing(true);
    try {
      await backgroundFetch();
      setCanRefresh(false);
    } catch (error) {
      console.error('Refresh error:', error);
      setError('Failed to refresh insights');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Update useEffect to only load cache and not auto-refresh
  useEffect(() => {
    const loadCache = () => {
      const cachedData = getInsightsCache();
      if (cachedData) {
        console.log('Found cached insights:', cachedData);
        setInsights(cachedData.insights);
        setLastUpdated(new Date(cachedData.metadata.timestamp));
      } else {
        // Only fetch if there's no cache at all
        backgroundFetch();
      }

      // Check if refresh is available
      const lastRefresh = localStorage.getItem('lastInsightsRefresh');
      if (lastRefresh) {
        const lastRefreshDate = new Date(lastRefresh);
        setCanRefresh(isNextDay(lastRefreshDate));
      }
    };

    if (user) {
      loadCache();
    }
  }, [user]);

  // Helper to check if it's the next day
  const isNextDay = (lastRefresh: Date) => {
    const now = new Date();
    const last = new Date(lastRefresh);
    return (
      now.getDate() !== last.getDate() ||
      now.getMonth() !== last.getMonth() ||
      now.getFullYear() !== last.getFullYear()
    );
  };

  function discussWithContent(insight: AIActionableInsight) {
    // Prepare complete context object
    const contextData = {
      insightType: insight.type,
      title: insight.opportunity.title,
      description: insight.opportunity.description,
      impact: insight.opportunity.impact,
      confidence: insight.opportunity.confidence,
      timing: insight.opportunity.timing,
      actionSteps: insight.action.steps,
      expectedOutcome: insight.action.expectedOutcome,
      requirements: insight.action.requirements,
      priority: insight.action.priority,
      context: {
        ...insight.context,
        // Ensure we pass complete email and video details
        emails: insight.context.emails?.map(email => ({
          ...email,
          date: new Date(email.date).toISOString()
        })),
        videos: insight.context.videos,
        sourceDetails: insight.context.sourceDetails,
        why: insight.context.why,
        data: insight.context.data
      }
    };

    // Encode and pass complete context
    const encodedContext = encodeURIComponent(JSON.stringify(contextData));
    router.push(`/chat?context=${encodedContext}&type=insight&id=${insight.id}`);
  }

  function handleActionStep(insight: AIActionableInsight, step: string, stepIndex: number) {
    // Prepare action-specific context
    const actionContext = {
      step: {
        content: step,
        index: stepIndex
      },
      insight: {
        type: insight.type,
        title: insight.opportunity.title,
        description: insight.opportunity.description,
        impact: insight.opportunity.impact,
        expectedOutcome: insight.action.expectedOutcome,
        requirements: insight.action.requirements,
        context: {
          why: insight.context.why,
          sourceDetails: insight.context.sourceDetails,
          // Include relevant source data
          emails: insight.context.emails?.map(email => ({
            ...email,
            date: new Date(email.date).toISOString()
          })),
          videos: insight.context.videos
        }
      }
    };

    // Encode and pass action-specific context
    const encodedContext = encodeURIComponent(JSON.stringify(actionContext));
    router.push(`/chat?context=${encodedContext}&type=action&id=${insight.id}&step=${stepIndex}`);
  }

  // Filter insights by type
  const contentInsights = insights.filter(insight => insight.type === 'content')
  const platformInsights = insights.filter(insight => insight.type === 'platform')
  const partnershipInsights = insights.filter(insight => insight.type === 'partnership')

  return (
    <div className="relative">
      {/* Fixed Header - Now with refresh button */}
      <div className="shrink-0 px-6 py-4 bg-white dark:bg-gray-900">
        <div className="flex justify-between items-center">
          <div className="w-[100px] sm:w-[24px]"></div>
          <div className="flex-1 flex justify-center sm:justify-start">
            <div className="text-center sm:text-left">
              <h1 className="text-base font-medium text-black dark:text-white">AI Insights</h1>
              <p className="text-text-gray dark:text-gray-400">
                <span className="hidden sm:inline">Personalized recommendations for your content strategy</span>
                {lastUpdated && (
                  <span className="ml-2 text-sm">
                    Updated {lastUpdated.toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="w-[100px] sm:w-auto flex justify-end">
            <button
              onClick={handleRefresh}
              disabled={!canRefresh || isRefreshing}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors ${
                canRefresh && !isRefreshing
                  ? 'bg-heycontent-light-yellow text-black hover:bg-heycontent-yellow/20 dark:bg-heycontent-yellow/30 dark:text-heycontent-yellow dark:hover:bg-heycontent-yellow/50'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isRefreshing ? 'Refreshing...' : 'Refresh Insights'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Content - Remove loading state */}
      <div className="flex-1 overflow-y-auto dark:bg-gray-900">
        <div className="p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Only show error if it's critical */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {insights.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="w-12 h-12 text-text-gray mx-auto mb-4" />
                <h3 className="text-lg font-medium text-text-dark dark:text-white mb-2">
                  {error ? 'Unable to load insights' : 'Loading insights...'}
                </h3>
                <p className="text-text-gray dark:text-gray-400">
                  {error || "We're analyzing your content and partnerships."}
                </p>
              </div>
            ) : (
              <Tabs defaultValue="content" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger 
                    value="content" 
                    className="flex items-center gap-2"
                  >
                    <Brain className="w-4 h-4" />
                    Content ({contentInsights.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="platform" 
                    className="flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Platform ({platformInsights.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="partnership" 
                    className="flex items-center gap-2"
                  >
                    <Target className="w-4 h-4" />
                    Partnership ({partnershipInsights.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="grid gap-6">
                  {contentInsights.map((insight) => (
                  <Card key={insight.id} className="overflow-hidden">
                    {/* Clickable Header */}
                    <div 
                      onClick={() => setSelectedInsight(selectedInsight === insight.id ? null : insight.id)}
                      className={`p-4 cursor-pointer transition-all ${
                        selectedInsight === insight.id 
                          ? 'bg-heycontent-light-yellow dark:bg-heycontent-yellow/20' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-heycontent-light-purple text-heycontent-purple dark:bg-heycontent-purple/30 dark:text-heycontent-purple">
                              <Brain className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-medium dark:text-white">{insight.opportunity.title}</h3>
                            <p className="text-sm text-text-gray dark:text-gray-400">
                              Impact: {insight.opportunity.impact}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-medium text-heycontent-green dark:text-heycontent-green">
                              {typeof insight.opportunity.confidence === 'number' ? `${insight.opportunity.confidence}%` : 'High'} Confidence
                            </div>
                            <div className="text-xs text-text-gray dark:text-gray-400">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {insight.action.timeToImplement}
                            </div>
                          </div>
                          <ChevronRight className={`w-5 h-5 text-text-gray transition-transform duration-200
                            ${selectedInsight === insight.id ? 'rotate-90' : ''}`} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content - Only show when selected */}
                    {selectedInsight === insight.id && (
                      <div className="p-4 space-y-6">
                        {/* Why Now Section */}
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                          <h4 className="font-medium dark:text-white">Why Now?</h4>
                          <ul className="space-y-2">
                            {insight.context.why?.map((reason: string, idx: number) => (
                              <li key={`${insight.id}-why-${idx}`} className="text-sm text-text-gray dark:text-gray-400 flex items-start gap-2">
                                <span className="mt-1">•</span>
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Action Steps */}
                        <div>
                          <h4 className="font-medium dark:text-white mb-3">Action Steps</h4>
                          <div className="space-y-2">
                            {insight.action.steps.map((step: string, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => handleActionStep(insight, step, idx)}
                                className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left group"
                              >
                                <span className="text-sm dark:text-gray-300 group-hover:text-heycontent-purple dark:group-hover:text-heycontent-purple transition-colors">{step}</span>
                                <ArrowRight className="w-4 h-4 text-text-gray group-hover:text-heycontent-purple dark:group-hover:text-heycontent-purple transition-colors" />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Expected Outcome */}
                        <div className="bg-heycontent-light-green dark:bg-heycontent-green/20 p-4 rounded-lg">
                          <h4 className="font-medium text-text-dark dark:text-heycontent-green mb-2">Expected Outcome</h4>
                          <p className="text-sm text-text-dark dark:text-heycontent-green">{insight.action.expectedOutcome}</p>
                        </div>

                        {/* Source Details Section */}
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                          <h4 className="font-medium dark:text-white mb-2">Source Details</h4>
                          {insight.context.sourceDetails?.map((detail: string, idx: number) => (
                            <p key={idx} className="text-sm text-text-gray dark:text-gray-400 mb-1">{detail}</p>
                          ))}
                          {insight.context.emails && insight.context.emails.length > 0 && (
                            <div className="mt-2">
                              <h5 className="text-sm font-medium dark:text-white mb-1">Related Emails</h5>
                              <div className="max-h-32 overflow-y-auto">
                                {insight.context.emails.map((email, idx) => (
                                  <div key={idx} className="text-xs text-text-gray dark:text-gray-400 mb-1">
                                    • {email.subject} ({new Date(email.date).toLocaleDateString()})
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {insight.context.videos && insight.context.videos.length > 0 && (
                            <div className="mt-2">
                              <h5 className="text-sm font-medium dark:text-white mb-1">Related Videos</h5>
                              <div className="max-h-32 overflow-y-auto">
                                {insight.context.videos.map((video, idx) => (
                                  <div key={idx} className="text-xs text-text-gray dark:text-gray-400 mb-1">
                                    • {video.title} (Views: {video.views}, Engagement: {video.engagement})
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Discuss with Content */}
                        <button
                          onClick={() => discussWithContent(insight)}
                          className="flex items-center gap-2 text-sm text-heycontent-purple dark:text-heycontent-purple"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Discuss with Content
                        </button>
                      </div>
                    )}
                  </Card>
                ))}
                </TabsContent>

                <TabsContent value="platform" className="grid gap-6">
                  {platformInsights.map((insight) => (
                    <Card key={insight.id} className="overflow-hidden">
                      {/* Clickable Header */}
                      <div 
                        onClick={() => setSelectedInsight(selectedInsight === insight.id ? null : insight.id)}
                        className={`p-4 cursor-pointer transition-all ${
                          selectedInsight === insight.id 
                            ? 'bg-heycontent-light-yellow dark:bg-heycontent-yellow/20' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-heycontent-light-yellow text-black dark:bg-heycontent-yellow/30 dark:text-heycontent-yellow">
                              <Share2 className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="font-medium dark:text-white">{insight.opportunity.title}</h3>
                              <p className="text-sm text-text-gray dark:text-gray-400">
                                Impact: {insight.opportunity.impact}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-sm font-medium text-heycontent-green dark:text-heycontent-green">
                                {typeof insight.opportunity.confidence === 'number' ? `${insight.opportunity.confidence}%` : 'High'} Confidence
                              </div>
                              <div className="text-xs text-text-gray dark:text-gray-400">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {insight.action.timeToImplement}
                              </div>
                            </div>
                            <ChevronRight className={`w-5 h-5 text-text-gray transition-transform ${
                              selectedInsight === insight.id ? 'rotate-90' : ''
                            }`} />
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content - Only show when selected */}
                      {selectedInsight === insight.id && (
                        <div className="p-4 space-y-6">
                          {/* Why Now Section */}
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                            <h4 className="font-medium dark:text-white">Why Now?</h4>
                            <ul className="space-y-2">
                              {insight.context.why?.map((reason: string, idx: number) => (
                                <li key={`${insight.id}-why-${idx}`} className="text-sm text-text-gray dark:text-gray-400 flex items-start gap-2">
                                  <span className="mt-1">•</span>
                                  {reason}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Action Steps */}
                          <div>
                            <h4 className="font-medium dark:text-white mb-3">Action Steps</h4>
                            <div className="space-y-2">
                              {insight.action.steps.map((step: string, idx: number) => (
                                <button
                                  key={idx}
                                  onClick={() => handleActionStep(insight, step, idx)}
                                  className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left group"
                                >
                                  <span className="text-sm dark:text-gray-300 group-hover:text-heycontent-purple dark:group-hover:text-heycontent-purple transition-colors">{step}</span>
                                  <ArrowRight className="w-4 h-4 text-text-gray group-hover:text-heycontent-purple dark:group-hover:text-heycontent-purple transition-colors" />
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Expected Outcome */}
                          <div className="bg-heycontent-light-green dark:bg-heycontent-green/20 p-4 rounded-lg">
                            <h4 className="font-medium text-text-dark dark:text-heycontent-green mb-2">Expected Outcome</h4>
                            <p className="text-sm text-text-dark dark:text-heycontent-green">{insight.action.expectedOutcome}</p>
                          </div>

                          {/* Source Details Section */}
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <h4 className="font-medium dark:text-white mb-2">Source Details</h4>
                            {insight.context.sourceDetails?.map((detail: string, idx: number) => (
                              <p key={idx} className="text-sm text-text-gray dark:text-gray-400 mb-1">{detail}</p>
                            ))}
                            {insight.context.emails && insight.context.emails.length > 0 && (
                              <div className="mt-2">
                                <h5 className="text-sm font-medium dark:text-white mb-1">Related Emails</h5>
                                <div className="max-h-32 overflow-y-auto">
                                  {insight.context.emails.map((email, idx) => (
                                    <div key={idx} className="text-xs text-text-gray dark:text-gray-400 mb-1">
                                      • {email.subject} ({new Date(email.date).toLocaleDateString()})
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {insight.context.videos && insight.context.videos.length > 0 && (
                              <div className="mt-2">
                                <h5 className="text-sm font-medium dark:text-white mb-1">Related Videos</h5>
                                <div className="max-h-32 overflow-y-auto">
                                  {insight.context.videos.map((video, idx) => (
                                    <div key={idx} className="text-xs text-text-gray dark:text-gray-400 mb-1">
                                      • {video.title} (Views: {video.views}, Engagement: {video.engagement})
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Discuss with Content */}
                          <button
                            onClick={() => discussWithContent(insight)}
                            className="flex items-center gap-2 text-sm text-heycontent-purple dark:text-heycontent-purple"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Discuss with Content
                          </button>
                        </div>
                      )}
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="partnership" className="grid gap-6">
                  {partnershipInsights.map((insight) => (
                    <Card key={insight.id} className="overflow-hidden">
                      {/* Clickable Header */}
                      <div 
                        onClick={() => setSelectedInsight(selectedInsight === insight.id ? null : insight.id)}
                        className={`p-4 cursor-pointer transition-all ${
                          selectedInsight === insight.id 
                            ? 'bg-heycontent-light-yellow dark:bg-heycontent-yellow/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-heycontent-light-green text-black dark:bg-heycontent-green/30 dark:text-heycontent-green">
                              <Target className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="font-medium dark:text-white">{insight.opportunity.title}</h3>
                              <p className="text-sm text-text-gray dark:text-gray-400">
                                Impact: {insight.opportunity.impact}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-sm font-medium text-heycontent-green dark:text-heycontent-green">
                                {typeof insight.opportunity.confidence === 'number' ? `${insight.opportunity.confidence}%` : 'High'} Confidence
                              </div>
                              <div className="text-xs text-text-gray dark:text-gray-400">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {insight.action.timeToImplement}
                              </div>
                            </div>
                            <ChevronRight className={`w-5 h-5 text-text-gray transition-transform ${
                              selectedInsight === insight.id ? 'rotate-90' : ''
                            }`} />
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content - Only show when selected */}
                      {selectedInsight === insight.id && (
                        <div className="p-4 space-y-6">
                          {/* Why Now Section */}
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                            <h4 className="font-medium dark:text-white">Why Now?</h4>
                            <ul className="space-y-2">
                              {insight.context.why?.map((reason: string, idx: number) => (
                                <li key={`${insight.id}-why-${idx}`} className="text-sm text-text-gray dark:text-gray-400 flex items-start gap-2">
                                  <span className="mt-1">•</span>
                                  {reason}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Action Steps */}
                          <div>
                            <h4 className="font-medium dark:text-white mb-3">Action Steps</h4>
                            <div className="space-y-2">
                              {insight.action.steps.map((step: string, idx: number) => (
                                <button
                                  key={idx}
                                  onClick={() => handleActionStep(insight, step, idx)}
                                  className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left group"
                                >
                                  <span className="text-sm dark:text-gray-300 group-hover:text-heycontent-purple dark:group-hover:text-heycontent-purple transition-colors">{step}</span>
                                  <ArrowRight className="w-4 h-4 text-text-gray group-hover:text-heycontent-purple dark:group-hover:text-heycontent-purple transition-colors" />
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Expected Outcome */}
                          <div className="bg-heycontent-light-green dark:bg-heycontent-green/20 p-4 rounded-lg">
                            <h4 className="font-medium text-text-dark dark:text-heycontent-green mb-2">Expected Outcome</h4>
                            <p className="text-sm text-text-dark dark:text-heycontent-green">{insight.action.expectedOutcome}</p>
                          </div>

                          {/* Source Details Section */}
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <h4 className="font-medium dark:text-white mb-2">Source Details</h4>
                            {insight.context.sourceDetails?.map((detail: string, idx: number) => (
                              <p key={idx} className="text-sm text-text-gray dark:text-gray-400 mb-1">{detail}</p>
                            ))}
                            {insight.context.emails && insight.context.emails.length > 0 && (
                              <div className="mt-2">
                                <h5 className="text-sm font-medium dark:text-white mb-1">Related Emails</h5>
                                <div className="max-h-32 overflow-y-auto">
                                  {insight.context.emails.map((email, idx) => (
                                    <div key={idx} className="text-xs text-text-gray dark:text-gray-400 mb-1">
                                      • {email.subject} ({new Date(email.date).toLocaleDateString()})
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {insight.context.videos && insight.context.videos.length > 0 && (
                              <div className="mt-2">
                                <h5 className="text-sm font-medium dark:text-white mb-1">Related Videos</h5>
                                <div className="max-h-32 overflow-y-auto">
                                  {insight.context.videos.map((video, idx) => (
                                    <div key={idx} className="text-xs text-text-gray dark:text-gray-400 mb-1">
                                      • {video.title} (Views: {video.views}, Engagement: {video.engagement})
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Discuss with Content */}
                          <button
                            onClick={() => discussWithContent(insight)}
                            className="flex items-center gap-2 text-sm text-heycontent-purple dark:text-heycontent-purple"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Discuss with Content
                          </button>
                        </div>
                      )}
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 