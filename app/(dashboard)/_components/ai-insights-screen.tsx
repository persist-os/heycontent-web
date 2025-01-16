'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Brain, TrendingUp, Target, Share2, 
  ChevronRight, ArrowRight, Clock, MessageSquare,
  RefreshCw, AlertCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

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
  id: number | string;
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

const CACHE_VERSION = 1;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
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
    
    // Validate cache version and TTL
    if (!parsed.metadata?.version || parsed.metadata.version !== CACHE_VERSION) {
      return null;
    }

    const cacheAge = new Date().getTime() - new Date(parsed.metadata.timestamp).getTime();
    if (cacheAge > CACHE_TTL) {
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

// Add these at the top level, outside the component
let isRequestInProgress = false;
let debounceTimer: NodeJS.Timeout | null = null;

export function AIInsightsScreen() {
  const [insights, setInsights] = useState<AIActionableInsight[]>([])
  const [selectedInsight, setSelectedInsight] = useState<string | number | null>(null)
  const [isFirstVisit, setIsFirstVisit] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [retryAttempts, setRetryAttempts] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()

  // Background fetch without loading state
  const backgroundFetch = async () => {
    if (isRequestInProgress) {
      console.log('Request already in progress, skipping...');
      return;
    }

    try {
      isRequestInProgress = true;
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
        const transformedInsights = data.insights.map((insight: any, index: number) => {
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
          const dealValues = insight.data?.emails?.map((e: InsightEmail) => e.dealValue).filter(Boolean) || [];
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
            if (hasConsistentValues) {
              return `Consistent deal values around $${Math.max(...dealValues).toLocaleString()}`;
            }
            return `Deal values ranging from $${Math.min(...dealValues).toLocaleString()} to $${Math.max(...dealValues).toLocaleString()}`;
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
                  ? `Partnership history shows ${hasConsistentValues ? 'consistent' : 'varied'} deal values ${hasConsistentValues ? `around $${Math.max(...dealValues).toLocaleString()}` : `from $${Math.min(...dealValues).toLocaleString()} to $${Math.max(...dealValues).toLocaleString()}`}`
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
              emails: insight.data?.emails?.map((email: any) => ({
                subject: email.subject,
                from: email.from,
                date: email.date,
                dealValue: email.dealValue,
                dealType: email.dealType
              })) || [],
              videos: insight.data?.videos?.map((video: any) => ({
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
      isRequestInProgress = false;
    }
  };

  useEffect(() => {
    const checkAndRefresh = async () => {
      // Clear any existing timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Load cached insights first
      const cachedData = getInsightsCache();
      if (cachedData) {
        console.log('Found cached insights:', cachedData);
        setInsights(cachedData.insights);
        setLastUpdated(new Date(cachedData.metadata.timestamp));
      }

      // Check quota cooldown
      const quotaCooldown = localStorage.getItem('quotaCooldown');
      const isInQuotaCooldown = quotaCooldown && 
        (Date.now() - parseInt(quotaCooldown) < QUOTA_COOLDOWN);
      
      if (isInQuotaCooldown) {
        const remainingCooldown = Math.ceil((QUOTA_COOLDOWN - (Date.now() - parseInt(quotaCooldown))) / 60000);
        console.log(`In quota cooldown period... (${remainingCooldown} minutes remaining)`);
        setError(`Service quota reached. Using cached insights. Try again in ${remainingCooldown} minutes.`);
        return;
      }

      const lastRefresh = localStorage.getItem('lastInsightsRefresh');
      const shouldRefresh = !lastRefresh || isNextDay(new Date(lastRefresh));

      if (shouldRefresh && !isRefreshing) {
        // Debounce the fetch request
        debounceTimer = setTimeout(() => {
          backgroundFetch();
        }, 1000); // 1 second delay
      }
    };

    if (session?.user) {
      checkAndRefresh();
    }

    // Cleanup
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [session]);

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

  function discussWithAI(insight: AIActionableInsight) {
    router.push(`/chat?context=${insight.id}`)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Fixed Header - Simplified */}
      <div className="shrink-0 px-6 py-4 border-b bg-white dark:bg-gray-900 dark:border-gray-800">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-semibold mb-1 dark:text-white">AI Insights</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Personalized recommendations for your content strategy
              {lastUpdated && (
                <span className="ml-2 text-sm">
                  Updated {lastUpdated.toLocaleDateString()}
                </span>
              )}
            </p>
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
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {error ? 'Unable to load insights' : 'Loading insights...'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {error || "We're analyzing your content and partnerships."}
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {insights.map((insight) => (
                  <Card key={insight.id} className="overflow-hidden">
                    {/* Clickable Header */}
                    <div 
                      onClick={() => setSelectedInsight(selectedInsight === insight.id ? null : insight.id)}
                      className={`p-4 cursor-pointer transition-all ${
                        selectedInsight === insight.id 
                          ? 'bg-blue-50 dark:bg-blue-900/20' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            insight.type === 'content' 
                              ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' 
                              : insight.type === 'platform' 
                              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                              : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {insight.type === 'content' ? <Brain className="w-4 h-4" /> :
                             insight.type === 'platform' ? <Share2 className="w-4 h-4" /> :
                             <Target className="w-4 h-4" />}
                          </div>
                          <div>
                            <h3 className="font-medium dark:text-white">{insight.opportunity.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Impact: {insight.opportunity.impact}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-600 dark:text-green-400">
                              {typeof insight.opportunity.confidence === 'number' ? `${insight.opportunity.confidence}%` : 'High'} Confidence
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {insight.action.timeToImplement}
                            </div>
                          </div>
                          <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform duration-200
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
                              <li key={`${insight.id}-why-${idx}`} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
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
                                className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                              >
                                <span className="text-sm dark:text-gray-300">{step}</span>
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Expected Outcome */}
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                          <h4 className="font-medium text-green-700 dark:text-green-400 mb-2">Expected Outcome</h4>
                          <p className="text-sm text-green-600 dark:text-green-400">{insight.action.expectedOutcome}</p>
                        </div>

                        {/* Source Details Section */}
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                          <h4 className="font-medium dark:text-white mb-2">Source Details</h4>
                          {insight.context.sourceDetails?.map((detail: string, idx: number) => (
                            <p key={idx} className="text-sm text-gray-600 dark:text-gray-400 mb-1">{detail}</p>
                          ))}
                          {insight.context.emails && insight.context.emails.length > 0 && (
                            <div className="mt-2">
                              <h5 className="text-sm font-medium dark:text-white mb-1">Related Emails</h5>
                              <div className="max-h-32 overflow-y-auto">
                                {insight.context.emails.map((email, idx) => (
                                  <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 mb-1">
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
                                  <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                    • {video.title} (Views: {video.views}, Engagement: {video.engagement})
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Discuss with IRIS */}
                        <button
                          onClick={() => discussWithAI(insight)}
                          className="flex items-center gap-2 text-sm text-purple-500 dark:text-purple-400"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Discuss with IRIS
                        </button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 