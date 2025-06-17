'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { CopyButton } from '@/components/ui/copy-button'

interface ExpandableInsightsProps {
  message: {
    id: string;
    relatedInsights?: Array<{
      type: string;
      summary: string;
    }>;
    interactiveResponse?: {
      options?: Array<{
        text: string;
      }>;
    };
    suggestions?: string[];
  };
  onReferenceClick?: (messageId: string) => void;
  onOptionPress?: (option: { text: string }) => void;
  onSuggestionPress?: (suggestion: string) => void;
}

export function ExpandableInsights({ 
  message, 
  onReferenceClick, 
  onOptionPress, 
  onSuggestionPress 
}: ExpandableInsightsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Placeholder data in case the message doesn't have options or suggestions
  const placeholderOptions: Array<{ text: string }> = [];
  const placeholderSuggestions: string[] = [];

  return (
    <div className="w-full border-t border-gray-100">
      {/* Toggle Button */}
      <button 
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors py-2 w-full justify-center"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronUp size={20} className="text-gray-600" />
        ) : (
          <ChevronDown size={20} className="text-gray-600" />
        )}
        <span className="text-sm font-medium">
          {isExpanded ? 'Hide insights & actions' : 'Show insights & actions'}
        </span>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="mt-2 space-y-4 pt-2 bg-gray-50 p-4 rounded-lg">
          {/* Related Insights Section */}
          {message.relatedInsights && message.relatedInsights.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Related Insights</h4>
              <div className="flex flex-col gap-2">
                {message.relatedInsights.map((insight, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => onReferenceClick?.(message.id)}
                  >
                    <div className="text-xs font-medium text-heycontent-yellow">{insight.type}</div>
                    <div className="text-sm mt-1">{insight.summary}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Options Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Options</h4>
            <div className="flex flex-wrap gap-2">
              {(message.interactiveResponse?.options || placeholderOptions).map((option, index) => (
                <div key={index} className="group relative">
                  <button
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200 w-full"
                    onClick={() => onOptionPress?.(option)}
                  >
                    <span>{option.text}</span>
                  </button>
                  
                  {/* Copy button for option */}
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -mt-1 -mr-1">
                    <CopyButton
                      text={option.text}
                      className="bg-white shadow-sm border border-gray-200"
                      size="md"
                      variant="outline"
                      tooltipText="Copy option"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Smart Suggestions Section */}
          {(message.suggestions?.length ?? 0) > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Suggestions</h4>
              <div className="flex flex-wrap gap-2">
                {message.suggestions?.map((suggestion, index) => (
                  <div key={index} className="group relative">
                    <button
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200 w-full"
                      onClick={() => onSuggestionPress?.(suggestion)}
                    >
                      <span>{suggestion}</span>
                    </button>
                    
                    {/* Copy button for suggestion */}
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -mt-1 -mr-1">
                      <CopyButton
                        text={suggestion}
                        className="bg-white shadow-sm border border-gray-200"
                        size="md"
                        variant="outline"
                        tooltipText="Copy suggestion"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 