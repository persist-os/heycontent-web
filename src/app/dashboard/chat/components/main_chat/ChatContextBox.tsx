import React from 'react';
import { ContextBox } from '../main_chat/ContextBox';

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
  
  // For Gmail context, try to get enriched metadata from the latest assistant message
  let enrichedContext = currentContext;
  if (currentContext.platform === 'gmail' && messages.length > 0) {
    // Find the latest assistant message with Gmail metadata
    const latestGmailMessage = messages
      .filter(msg => msg.role === 'assistant' && msg.metadata?.platform_context === 'gmail')
      .slice(-1)[0]; // Get the most recent one
    
    if (latestGmailMessage?.metadata) {
      // Merge the metadata into the context for display
      enrichedContext = {
        ...currentContext,
        messageCount: latestGmailMessage.metadata.message_count,
        hasFullThread: latestGmailMessage.metadata.has_full_thread,
        threadId: latestGmailMessage.metadata.thread_id || currentContext.contentId,
      };
    }
  }

  
  return (
    <div className="shrink-0">
      <ContextBox 
        context={enrichedContext} 
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
                onClick={() => onSendMessage(suggestion)}
                className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors break-words"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Gmail-specific context-aware suggestions */}
      {currentContext.platform === 'gmail' && messages.length === 0 && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            {enrichedContext.hasFullThread && (enrichedContext.messageCount || 0) > 1 
              ? "Questions about this email thread" 
              : "Questions about this email"}
          </h4>
          <div className="flex flex-wrap gap-2">
            {(enrichedContext.hasFullThread && (enrichedContext.messageCount || 0) > 1 ? [
              "Analyze the conversation flow",
              "Who needs to respond next?",
              "What are the key discussion points?",
              "Are there any unresolved issues?",
              "Help me draft a reply",
              "Summarize the thread",
              "What's the current status?",
              "Track the decision timeline"
            ] : [
              "What are the key points?",
              "How urgent is this?",
              "Help me draft a response",
              "What's the sender asking for?",
              "Is this a business opportunity?",
              "Should I prioritize this?"
            ]).map((suggestion, index) => (
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