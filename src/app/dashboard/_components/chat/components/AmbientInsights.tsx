import React, { useEffect, useMemo, useState } from 'react';
import { AmbientInsight } from '../types';
import { InsightIcon } from './InsightIcon';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getApiKey } from '@/app/lib/api-helpers';
import { Id } from '@/convex/_generated/dataModel';
import { ambientInsights as hardcodedInsights } from '../data/ambient-insights';
import { Lightbulb } from 'lucide-react';

// Type for the Convex response
type ConvexInsight = {
  category: string;
  title: string;
  content: string;
  recommendation: string;
};



interface AmbientInsightsProps {
  loading?: boolean;
  error?: string | null;
  onInsightClick?: (action: string, insight: AmbientInsight) => void;
}

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
  const insights = useMemo<Array<AmbientInsight & { id: string }>>(() => {
    console.log('AmbientInsights: Mapping insights. Convex data:', convexInsights);

    if (convexInsights && Array.isArray(convexInsights.data)) {
      console.log('AmbientInsights: Using Convex data array, length:', convexInsights.data.length);
      return convexInsights.data.map((item: ConvexInsight) => ({
        type: item.category || 'auto_generated',
        title: item.title,
        description: item.content,
        action: item.recommendation || '',
        icon: Lightbulb,
        id: Math.random().toString()
      }));
    }

    // fallback
    return hardcodedInsights.map(insight => ({
      ...insight,
      id: Math.random().toString()
    }));
  }, [convexInsights]);

  // Combine prop error with fetch error
  const error = propError || fetchError;

  // Set error if Convex query fails
  useEffect(() => {
    if (convexInsights === null) {
      setFetchError('Failed to load insights');
    }
  }, [convexInsights]);

  // Log errors but continue showing the hardcoded insights
  useEffect(() => {
    const error = propError || fetchError;
    if (error) {
      console.error('Error loading insights:', error);
    }
  }, [propError, fetchError]);

  // Show loading state only if we don't have any insights yet
  if (!insights || insights.length === 0) {
    console.log('AmbientInsights: No insights available, falling back to hardcoded insights');
    // Always render fallback insights even if no Convex data
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
        {hardcodedInsights.map((insight, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 shadow-sm p-4 rounded-xl cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
            tabIndex={0}
            role="button"
            aria-label={`${insight.title}: ${insight.description}`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gray-50">
                <InsightIcon icon={insight.icon} type={insight.type} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm text-gray-900 mb-1">{insight.title}</h3>
                <p className="text-sm text-gray-600">{insight.description}</p>
                {insight.action && (
                  <button
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      onInsightClick?.(insight.action, insight);
                    }}
                  >
                    {insight.action}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
      {insights.map((insight) => (
        <div
          key={insight.id}
          onClick={() => onInsightClick?.(insight.action, insight)}
          className="bg-white border border-gray-200 shadow-sm p-4 rounded-xl cursor-pointer \
            hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
          tabIndex={0}
          role="button"
          aria-label={`${insight.title}: ${insight.description}`}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gray-50">
              <InsightIcon icon={insight.icon} type={insight.type} />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm text-gray-900 mb-1">{insight.title}</h3>
              <p className="text-sm text-gray-600">{insight.description}</p>
              {insight.action && (
                <button 
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInsightClick?.(insight.action, insight);
                  }}
                >
                  {insight.action}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};