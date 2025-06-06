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
    <div className="shrink-0 px-6 pb-4">
      <ContextBox 
        context={currentContext} 
        onRemove={onRemove}
        includeAnalysisInQuery={includeAnalysisInQuery}
        onToggleAnalysis={onToggleAnalysis}
      />
      {/* Context-aware suggestions */}
      {currentContext.analysis && messages.length === 0 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-600" />
            Ask about the analysis
          </h4>
          <div className="flex flex-wrap gap-2">
            {[
              "What are the key insights from this analysis?",
              "How can I improve based on these findings?",
              "What trends do you see in the performance data?",
              "What should I focus on next?",
              "Summarize the main recommendations"
            ].map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSendMessage(suggestion)}
                className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 text-gray-700 dark:text-gray-300 transition-colors"
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