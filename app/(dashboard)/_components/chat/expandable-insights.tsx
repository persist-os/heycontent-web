'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, Save, Calendar, Zap, Brain, Target } from 'lucide-react'
import type { Message } from '@/app/types'
import type { InteractiveOption } from '@/app/lib/chat/interactive-response'

interface InsightType {
  type: string;
  summary: string;
  confidence?: number;
  source?: string;
}

interface SuggestionType {
  type: string;
  description: string;
}

interface ExpandableInsightsProps {
  message: {
    id: number;
    relatedInsights?: InsightType[];
    interactiveResponse?: {
      options?: InteractiveOption[];
    };
    metadata?: {
      suggestions?: SuggestionType[];
    };
  };
  onReferenceClick?: (messageId: number) => void;
  onOptionPress?: (option: InteractiveOption) => void;
  onSuggestionPress?: (suggestion: SuggestionType) => void;
}

export function ExpandableInsights({ 
  message, 
  onReferenceClick, 
  onOptionPress, 
  onSuggestionPress 
}: ExpandableInsightsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Placeholder data in case the message doesn't have options or suggestions
  const placeholderOptions: InteractiveOption[] = [];
  const placeholderSuggestions: SuggestionType[] = [];

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
                    <div className="text-sm mt-1">
                      {insight.summary}
                      {insight.confidence && <span className="text-gray-500 text-xs"> ({insight.confidence}% confidence)</span>}
                    </div>
                    {insight.source && (
                      <div className="text-xs text-gray-500 mt-1">Source: {insight.source}</div>
                    )}
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
                <button
                  key={index}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors
                    ${option.action === 'save_to_notes' ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : ''}
                    ${option.action === 'review_calendar' ? 'bg-heycontent-light-purple text-heycontent-purple hover:bg-heycontent-purple/20' : ''}
                    ${option.type === 'action' && !option.action?.includes('save_to_notes') && !option.action?.includes('review_calendar') ? 'bg-heycontent-light-yellow text-black hover:bg-heycontent-yellow/20' : ''}
                    ${option.type === 'detail' ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : ''}
                  `}
                  onClick={() => onOptionPress?.(option)}
                >
                  {option.action === 'save_to_notes' && <Save size={16} className="text-gray-600" />}
                  {option.action === 'review_calendar' && <Calendar size={16} className="text-heycontent-purple" />}
                  {option.type === 'action' && !option.action?.includes('save_to_notes') && !option.action?.includes('review_calendar') && <Zap size={16} className="text-black" />}
                  {option.type === 'detail' && <Brain size={16} className="text-gray-600" />}
                  <span>{option.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Smart Suggestions Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Suggestions</h4>
            <div className="flex flex-wrap gap-2">
              {(message.metadata?.suggestions || placeholderSuggestions).map((suggestion, index) => (
                <button
                  key={index}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors
                    ${suggestion.description.toLowerCase().includes('content calendar') ? 'bg-heycontent-light-purple text-heycontent-purple hover:bg-heycontent-purple/20' : ''}
                    ${suggestion.type === 'action' && !suggestion.description.toLowerCase().includes('content calendar') ? 'bg-heycontent-light-yellow text-black hover:bg-heycontent-yellow/20' : ''}
                    ${suggestion.type === 'strategic' ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : ''}
                    ${suggestion.type === 'explore' ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : ''}
                  `}
                  onClick={() => onSuggestionPress?.(suggestion)}
                >
                  {suggestion.type === 'explore' && <Brain size={16} className="text-gray-600" />}
                  {suggestion.description.toLowerCase().includes('content calendar') && <Calendar size={16} className="text-heycontent-purple" />}
                  {suggestion.type === 'action' && !suggestion.description.toLowerCase().includes('content calendar') && <Zap size={16} className="text-black" />}
                  {suggestion.type === 'strategic' && <Target size={16} className="text-gray-600" />}
                  <span>{suggestion.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 