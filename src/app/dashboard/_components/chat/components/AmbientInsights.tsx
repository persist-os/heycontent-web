import React from 'react';
import { AmbientInsight } from '../types';
import { InsightIcon } from './InsightIcon';

interface AmbientInsightsProps {
  insights: AmbientInsight[];
  loading: boolean;
  error: string | null;
  onInsightClick: (action: string, insight: AmbientInsight) => void;
}

export const AmbientInsights = ({ 
  insights, 
  loading, 
  error, 
  onInsightClick 
}: AmbientInsightsProps) => {
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
      {insights.map((insight, index) => (
        <div
          key={index}
          onClick={() => onInsightClick(insight.action, insight)}
          className="bg-white border border-gray-200 shadow-sm p-4 rounded-xl cursor-pointer 
            hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gray-50">
              <InsightIcon icon={insight.icon} type={insight.type} />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm text-gray-900 mb-1">{insight.title}</h3>
              <p className="text-sm text-gray-600">{insight.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
