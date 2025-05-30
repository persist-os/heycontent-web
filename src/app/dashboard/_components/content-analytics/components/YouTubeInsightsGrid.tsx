import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getApiKey } from '@/app/lib/api-helpers';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface Insight {
  insight: string;
  explanation: string;
}

interface InsightsByCategory {
  [category: string]: Insight[];
}

interface Props {
  userId: string;
  channelId: string;
}

export const YouTubeInsightsGrid: React.FC<Props> = ({ userId, channelId }) => {
  const [insights, setInsights] = useState<InsightsByCategory>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const MAX_REFRESH_RETRIES = 3;
  const [refreshRetryCount, setRefreshRetryCount] = useState(0);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const storeChannelAnalysis = useMutation(api.youtubeMutations.storeChannelAnalysis);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  // Load existing insights from the database
  const existingInsights = useQuery(api.youtubeQueries.getChannelAnalysis, {
    userId,
    channelId,
  });

  useEffect(() => {
    if (existingInsights) {
      // Ensure we have valid analysis data
      const analysisData = existingInsights.analysis || {};
      if (typeof analysisData === 'object' && Object.keys(analysisData).length > 0) {
        setInsights(analysisData);
      }
      setLoading(false);
    }
  }, [existingInsights]);

  const fetchNewInsights = async () => {
    if (refreshRetryCount >= MAX_REFRESH_RETRIES) {
      setError('Maximum refresh attempts reached. Please try again later.');
      return;
    }

    console.log('Starting insights fetch with:', { userId, channelId });
    setRefreshing(true);
    setError(null);
    try {
      // Get API key for authentication
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('You are not authenticated. Please log in again.');
      }

      console.log('Making API request to backend...');
      const res = await fetch(`${backendUrl}/api/v1/youtube/batch-analyze`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          user_id: userId,
          max_videos: 10,
          include_captions: true,
          include_comments: true,
          force_refresh: refreshRetryCount > 0
        }),
      });

      const data = await res.json();
      console.log('Backend API response:', data);

      if (!res.ok) {
        // Check if it's a quota exceeded error
        if (data.error?.includes('quota') || data.error?.includes('quotaExceeded')) {
          setQuotaExceeded(true);
          setError('YouTube API quota exceeded. Please try again later.');
          return;
        }
        throw new Error(data.error || `HTTP error! status: ${res.status}`);
      }
      
      if (data.status === 'success') {
        console.log('Successfully received insights from backend');
        setInsights(data.data);
        setRefreshRetryCount(0); // Reset refresh retry count on success
        setQuotaExceeded(false); // Reset quota exceeded state on success
        
        // Store the analysis in Convex
        console.log('Attempting to store analysis in Convex with:', {
          userId,
          channelId,
          dataKeys: Object.keys(data.data || {})
        });
        try {
          const convexResult = await storeChannelAnalysis({
            userId,
            channelId,
            analysisData: data.data
          });
          console.log('Convex storage result:', convexResult);
        } catch (convexError) {
          console.error('Error storing in Convex:', convexError);
          setError(`Failed to store insights: ${convexError instanceof Error ? convexError.message : 'Unknown error'}`);
        }
      } else {
        console.error('Backend API error:', data.error);
        setError(data.error || 'Failed to fetch insights');
        setRefreshRetryCount(prev => prev + 1);
      }
    } catch (e: any) {
      console.error('Fetch error:', e);
      setError(e.message || 'Failed to fetch insights');
      setRefreshRetryCount(prev => prev + 1);
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggle = (category: string, idx: number) => {
    setExpanded((prev) => ({
      ...prev,
      [`${category}-${idx}`]: !prev[`${category}-${idx}`],
    }));
  };

  if (loading) {
    return <div className="p-4 text-center">Loading AI insights...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={fetchNewInsights}
          disabled={refreshing || refreshRetryCount >= MAX_REFRESH_RETRIES || quotaExceeded}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 
           refreshRetryCount >= MAX_REFRESH_RETRIES ? 'Max Retries Reached' : 
           quotaExceeded ? 'Quota Exceeded' :
           'Refresh Insights'}
        </Button>
      </div>

      {error && (
        <div className="p-4 text-center">
          <div className="text-red-500 mb-2">{error}</div>
          {quotaExceeded && (
            <div className="text-sm text-gray-600">
              The YouTube API quota has been exceeded. This usually resets after 24 hours.
              Please try again later.
            </div>
          )}
        </div>
      )}

      {!error && (!insights || Object.keys(insights).length === 0) && (
        <div className="p-4 text-center">
          <div className="mb-4">No AI insights available.</div>
          <Button
            onClick={fetchNewInsights}
            disabled={refreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Generate Insights'}
          </Button>
        </div>
      )}

      {!error && insights && Object.keys(insights).length > 0 && (
        <div className="space-y-8">
          {Object.entries(insights).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-bold text-lg mb-4 capitalize">
                {category.replace(/_/g, ' ')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item, idx) => (
                  <Card
                    key={idx}
                    className="cursor-pointer transition-shadow border border-gray-200 hover:shadow-lg"
                    onClick={() => handleToggle(category, idx)}
                  >
                    <div className="p-4">
                      <div className="font-semibold text-base mb-2">
                        {item.insight}
                      </div>
                      {expanded[`${category}-${idx}`] && (
                        <div className="mt-2 text-sm text-gray-700">
                          {item.explanation}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};