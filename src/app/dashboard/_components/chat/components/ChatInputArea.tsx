import React from 'react';
import { AmbientInsights } from './AmbientInsights';
import { ChatInput } from '../chat-input';

interface ChatInputAreaProps {
  showAmbient: boolean;
  currentContext: any;
  ambientInsights: any[];
  ambientLoading: boolean;
  error: string | null;
  handleInsightClick: (action: string, insight: any) => void;
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
  handleSendMessage,
  inputRef,
  isLoading,
  referencedMessage,
  handleClearReference,
  includeAnalysisInQuery,
}) => (
  <div className="fixed bottom-0 right-0 left-0 z-10 bg-white">
    {/* Only show ambient insights at bottom when there's no context and no messages */}
    {showAmbient && !currentContext && (
      <div className="border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {ambientInsights.map((insight, index) => (
              <button
                key={index}
                onClick={() => handleInsightClick(insight.action, insight)}
                className="shrink-0 px-4 h-8 text-xs text-gray-600 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 
                  rounded-full flex items-center transition-colors"
              >
                {insight.action}
              </button>
            ))}
          </div>
        </div>
      </div>
    )}
    <div className="h-px bg-gray-200 w-full"></div>
    <div className="w-full flex justify-center">
      <div className="w-full max-w-5xl px-2 sm:px-4 pb-safe">
        <ChatInput
          inputRef={inputRef}
          onSend={(content) => {
            handleSendMessage(content)
          }}
          isLoading={isLoading}
          referencedMessage={referencedMessage}
          onClearReference={handleClearReference}
          hasContext={!!currentContext}
          contextPlatform={currentContext?.platform}
          hasAnalysis={!!currentContext?.analysis && includeAnalysisInQuery}
        />
      </div>
    </div>
  </div>
);

export default ChatInputArea; 