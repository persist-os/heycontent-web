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
}

const ChatContextBox: React.FC<ChatContextBoxProps> = ({
  currentContext,
  messages,
  onRemove,
  includeAnalysisInQuery,
  onToggleAnalysis,
  onSendMessage,
}) => {
  if (!currentContext) return null;
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
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Questions about the analysis
          </h4>
          <div className="flex flex-wrap gap-2">
            {[
              "What are the key takeaways?",
              "How can I improve performance?",
              "What trends should I focus on?",
              "What's my next priority?",
              "What are the main recommendations?"
            ].map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSendMessage(suggestion)}
                className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
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