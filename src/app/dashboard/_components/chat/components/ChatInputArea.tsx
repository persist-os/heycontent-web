import React from 'react';
import { ChatInput } from '../chat-input';
import { AmbientInsights } from './AmbientInsights';
import { BottomBarActions } from './BottomBarActions';

interface ChatInputAreaProps {
  showAmbient: boolean;
  currentContext: any;
  handleActionClick: (action: string) => void;
  handleSendMessage: (msg: string, mentions?: Array<{id: string, type: 'platform' | 'content', subtype: string, title: string}>) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  isLoading: boolean;
  referencedMessage: any;
  handleClearReference: () => void;
  includeAnalysisInQuery: boolean;
  userId?: string;
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  showAmbient,
  currentContext,
  handleActionClick,
  handleSendMessage,
  inputRef,
  isLoading,
  referencedMessage,
  handleClearReference,
  includeAnalysisInQuery,
  userId,
}) => {
  // Only show ambient content when there are no messages
  const showAmbientContent = showAmbient && !currentContext;
  
  return (
    <div className={`bg-white border-t border-gray-200 ${showAmbientContent ? 'h-full flex flex-col' : ''}`}>
      <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
        {/* Show ambient content when there are no messages */}
        {showAmbientContent && (
          <div className="w-full bg-white flex-1 flex flex-col">
            <div className="px-4 pt-6 pb-2 flex-shrink-0">
              {/* Empty header for consistent spacing */}
            </div>
            
            {/* Ambient Insights component - handles its own data fetching */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <AmbientInsights
                onInsightClick={(action, insight) => handleSendMessage(action)}
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
            userId={userId}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatInputArea;