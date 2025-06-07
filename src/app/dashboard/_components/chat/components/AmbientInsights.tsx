import React from 'react';
import { AmbientInsight } from '../types';
import { InsightIcon } from './InsightIcon';

interface AmbientInsightsProps {
  insights: AmbientInsight[];
  loading: boolean;
  error: string | null;
  onInsightClick?: (action: string, insight: AmbientInsight) => void;
  onInsightHover?: (insight: AmbientInsight) => void;
  onInsightFocus?: (insight: AmbientInsight) => void;
}

export const AmbientInsights: React.FC<AmbientInsightsProps> = ({ 
  insights, 
  loading, 
  error, 
  onInsightClick,
  onInsightHover,
  onInsightFocus
}) => {
  if (loading) {
    return <div className="text-center text-gray-500">Loading insights...</div>;
  }
  
  if (error) {
    return (
      <div className="text-center text-red-500">
        Failed to load insights. Please try again later.
      </div>
    );
  }
  
  if (insights.length === 0) {
    return (
      <div className="text-center text-gray-500">
        No insights available at the moment.
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 w-full">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <button
              key={index}
              onClick={() => onInsightClick?.(insight.action, insight)}
              onMouseEnter={() => onInsightHover?.(insight)}
              onFocus={() => onInsightFocus?.(insight)}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 h-full flex flex-col"
              tabIndex={0}
              aria-label={`${insight.title}: ${insight.description}`}
              type="button"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg text-blue-600">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm sm:text-base text-gray-900 text-left truncate">{insight.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 text-left mt-1 line-clamp-2">{insight.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
