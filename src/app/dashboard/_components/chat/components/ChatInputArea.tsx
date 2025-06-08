import React from 'react';
import { ChatInput } from '../chat-input';
import { AmbientInsights } from './AmbientInsights';
import { BottomBarActions } from './BottomBarActions';

interface ChatInputAreaProps {
  showAmbient: boolean;
  currentContext: any;
  ambientInsights: any[];
  ambientLoading: boolean;
  error: string | null;
  handleInsightClick: (action: string, insight: any) => void;
  handleActionClick: (action: string) => void;
  handleSendMessage: (msg: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  isLoading: boolean;
  referencedMessage: any;
  handleClearReference: () => void;
  includeAnalysisInQuery: boolean;
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  showAmbient,
  currentContext,
  ambientInsights,
  ambientLoading,
  error,
  handleInsightClick,
  handleActionClick,
  handleSendMessage,
  inputRef,
  isLoading,
  referencedMessage,
  handleClearReference,
  includeAnalysisInQuery,
}) => {
  // Only show ambient insights and bottom actions when there are no messages
  const showAmbientContent = showAmbient && !currentContext && ambientInsights.length > 0;
  
  return (
    <div className={`bg-white border-t border-gray-200 ${showAmbientContent ? 'h-full flex flex-col' : ''}`}>
      <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
        {/* Show ambient insights when there are no messages */}
        {showAmbientContent && (
          <div className="w-full bg-white flex-1 flex flex-col">
            <div className="px-4 pt-6 pb-2 flex-shrink-0">
    
            </div>
            
            {/* Insights container - takes all available space */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <AmbientInsights 
                insights={ambientInsights} 
                loading={ambientLoading}
                error={error}
                onInsightClick={handleInsightClick}
              />
            </div>

            {/* Bottom bar actions */}
            <div className="border-t border-gray-100 flex-shrink-0">
              <div className="px-4 py-3">
                <BottomBarActions onActionClick={handleActionClick} />
              </div>
            </div>
          </div>
        )}

        {/* Chat input area - always show */}
        <div className="px-4 py-4">
          <div className="w-full max-w-4xl mx-auto">
            <ChatInput
              inputRef={inputRef}
              onSend={handleSendMessage}
              isLoading={isLoading}
              referencedMessage={referencedMessage}
              onClearReference={handleClearReference}
              hasContext={!!currentContext}
              contextPlatform={currentContext?.platform}
              hasAnalysis={
                includeAnalysisInQuery && (
                  !!currentContext?.analysis || 
                  (currentContext?.platform === 'ai-insights' && (
                    !!currentContext?.actionStep || 
                    !!currentContext?.title || 
                    !!currentContext?.additionalContext
                  ))
                )
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInputArea;