import React from 'react';
import { ContextBox } from './ContextBox';
import { Brain } from 'lucide-react';

interface ChatContextBoxProps {
  currentContext: any;
  messages: any[];
  onRemove: () => void;
  includeAnalysisInQuery: boolean;
  onToggleAnalysis: (val: boolean) => void;
  onSendMessage: (msg: string) => void;
  onInputPopulate?: (msg: string) => void;
}

const ChatContextBox: React.FC<ChatContextBoxProps> = ({
  currentContext,
  messages,
  onRemove,
  includeAnalysisInQuery,
  onToggleAnalysis,
  onSendMessage,
  onInputPopulate,
}) => {
  if (!currentContext) return null;
  
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
      {/* Context-aware suggestions */}
      {currentContext.analysis && messages.length === 0 && (
        <div className="mt-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 mx-3 sm:mx-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Questions about the analysis
          </h4>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {[
              "What are the key takeaways?",
              "How can I improve performance?",
              "What trends should I focus on?",
              "What's my next priority?",
              "What are the main recommendations?"
            ].map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors break-words"
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

export default ChatContextBox; 