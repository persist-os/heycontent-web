import React, { useState } from 'react';
import { ChatInput } from '../chat-input';
import { AmbientInsights } from './AmbientInsights';
import { BottomBarActions } from './BottomBarActions';
import { Message } from '@/app/types/chat';

interface ChatInputAreaProps {
  showAmbient: boolean;
  currentContext: any;
  handleActionClick: (action: string) => void;
  handleSendMessage: (message: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  isLoading: boolean;
  referencedMessage: Message | null;
  handleClearReference: () => void;
  includeAnalysisInQuery: boolean;
  inputValue: string;
  onInputChange: (value: string) => void;
  onInputPopulate: (text: string) => void;
  useContextSearch: boolean;
  onToggleContextSearch: (enabled: boolean) => void;
  embeddingInfo: { hasEmbeddings: boolean; count: number };
  notepadOpen: boolean;
  openNotepad: () => void;
  quotedForNotepad: string | null;
  onClearQuoted: () => void;
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
  inputValue,
  onInputChange,
  onInputPopulate,
  useContextSearch,
  onToggleContextSearch,
  embeddingInfo,
  notepadOpen,
  openNotepad,
  quotedForNotepad,
  onClearQuoted,
}) => {
  // Only show ambient content when there are no messages
  const showAmbientContent = showAmbient && !currentContext;
  
  return (
    <div className={`bg-white ${showAmbientContent ? 'h-full flex flex-col' : ''}`}>
      <div className="max-w-3xl sm:max-w-4xl mx-auto w-full h-full flex flex-col">
        {/* Show ambient content when there are no messages */}
        {showAmbientContent && (
          <div className="w-full bg-white flex-1 flex flex-col">
            <div className="px-3 sm:px-4 pt-6 pb-2 flex-shrink-0">
              {/* Empty header for consistent spacing */}
            </div>
            
            {/* Ambient Insights component - handles its own data fetching */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 pb-4">
              <AmbientInsights
                onInsightClick={(action, insight) => handleSendMessage(action)}
              />
            </div>

            {/* Bottom bar actions */}
            <div className="border-t border-gray-100 flex-shrink-0">
              <div className="px-3 sm:px-4 py-3">
                <BottomBarActions onActionClick={handleActionClick} onInputPopulate={onInputPopulate} />
              </div>
            </div>
          </div>
        )}

        {/* Chat input area - always show */}
        <div className="px-2 sm:px-3 pt-1 pb-2">
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
            inputValue={inputValue}
            onInputChange={onInputChange}
            useContextSearch={useContextSearch}
            onToggleContextSearch={onToggleContextSearch}
            embeddingInfo={embeddingInfo}
            notepadOpen={notepadOpen}
            openNotepad={openNotepad}
            quotedForNotepad={quotedForNotepad}
            onClearQuoted={onClearQuoted}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatInputArea;