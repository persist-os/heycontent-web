import React from 'react';
import { ContextBox } from './ContextBox';

interface AIInsightsContextBoxProps {
  currentContext: any;
  messages: any[];
  onRemove: () => void;
  includeAnalysisInQuery: boolean;
  onToggleAnalysis: (val: boolean) => void;
  onSendMessage: (msg: string) => void;
  onInputPopulate?: (msg: string) => void;
}

const AIInsightsContextBox: React.FC<AIInsightsContextBoxProps> = ({
  currentContext,
  messages,
  onRemove,
  includeAnalysisInQuery,
  onToggleAnalysis,
  onSendMessage,
  onInputPopulate,
}) => {
  if (!currentContext || currentContext.platform !== 'ai-insights') return null;
  
  // Use onInputPopulate if available, otherwise fall back to onSendMessage
  const handleSuggestionClick = onInputPopulate || onSendMessage;
  
  return (
    <div className="shrink-0">
      <ContextBox 
        context={currentContext} 
        onRemove={onRemove}
        includeAnalysisInQuery={includeAnalysisInQuery}
        onToggleAnalysis={onToggleAnalysis}
      />
      
      {/* Full insight suggestions - when discussing the complete insight */}
      {currentContext.fullInsight && messages.length === 0 && (
        <div className="mt-3 p-3 bg-white rounded border border-[#D0ECFF] mx-3 sm:mx-0">
          <h4 className="text-sm font-semibold text-[#4E87E3] mb-2">
            Suggested questions
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {[
              "What should I prioritize first?",
              "How long will this strategy take?",
              "What's the expected ROI?",
              "What tools do I need?",
              "How do I measure success?",
              "What are the potential risks?"
            ].map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-white border border-[#D0ECFF] rounded text-[#4E87E3] hover:bg-[#D0ECFF] hover:text-[#4E87E3] transition-colors break-words"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Individual action step suggestions - when discussing a specific action */}
      {currentContext.actionStep && !currentContext.fullInsight && messages.length === 0 && (
        <div className="mt-3 p-3 bg-white rounded border border-[#D0ECFF] mx-3 sm:mx-0">
          <h4 className="text-sm font-semibold text-[#4E87E3] mb-2">
            Questions about this action
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {[
              "How do I get started?",
              "What's the time commitment?",
              "What tools do I need?",
              "How do I track progress?",
              "Common mistakes to avoid?",
              "Break into smaller steps?"
            ].map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-white border border-[#D0ECFF] rounded text-[#4E87E3] hover:bg-[#D0ECFF] hover:text-[#4E87E3] transition-colors break-words"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* General AI insights suggestions when no specific action step or full insight */}
      {currentContext.source === 'AI Insights Dashboard' && !currentContext.actionStep && !currentContext.fullInsight && messages.length === 0 && (
        <div className="mt-3 p-3 bg-white rounded border border-[#D0ECFF] mx-3 sm:mx-0">
          <h4 className="text-sm font-semibold text-[#4E87E3] mb-2">
            Learn more about this insight
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {[
              "What's the business impact?",
              "How urgent is this?",
              "What's the first step?",
              "How does this align with goals?",
              "What competitors are doing this?",
              "What's the market opportunity?"
            ].map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-white border border-[#D0ECFF] rounded text-[#4E87E3] hover:bg-[#D0ECFF] hover:text-[#4E87E3] transition-colors break-words"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsightsContextBox; 