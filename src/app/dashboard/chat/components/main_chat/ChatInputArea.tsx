import React, { useState } from 'react';
import { ChatInput } from '../../chat-input';
import { AmbientInsights } from '../ambient_insights/AmbientInsights';
import { BottomBarActions } from './BottomBarActions';
import { Message } from '@/app/types/chat';

interface ChatInputAreaProps {
  showAmbient: boolean;
  currentContext?: any;
  handleActionClick: (action: string) => void;
  handleSendMessage: (message: string, fileAttachments?: any[]) => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  isLoading: boolean;
  referencedMessage: Message | null;
  handleClearReference: () => void;
  includeAnalysisInQuery: boolean;
  inputValue: string;
  onInputChange: (value: string) => void;
  onInputPopulate: (text: string) => void;
  notepadOpen: boolean;
  openNotepad: () => void;
  quotedForNotepad: string | null;
  onClearQuoted: () => void;
  isAuthenticated?: boolean;
  currentTab?: string; // Add currentTab prop for tab-specific @ linking
  // Mobile props
  isMobile?: boolean;
  activeTab?: 'chat' | 'notes';
  // New anti-corporate controls
  embeddingInfo?: { hasEmbeddings: boolean; count: number };
  useContextSearch?: boolean;
  onToggleContextSearch?: (enabled: boolean) => void;
  includeNotepadInMessages?: boolean;
  onToggleNotepadInMessages?: (enabled: boolean) => void;
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
  isAuthenticated = true,
  currentTab = 'all',
  isMobile = false,
  activeTab = 'chat',
  includeNotepadInMessages,
  onToggleNotepadInMessages
}) => {
  
  // Wrap handleSendMessage to add debug logging
  const wrappedHandleSendMessage = (message: string, fileAttachments?: any[]) => {
    console.log('🔗 [CHAT INPUT AREA] wrappedHandleSendMessage called with:', {
      message: message.substring(0, 50) + '...',
      fileAttachments: fileAttachments,
      fileAttachmentsCount: fileAttachments?.length || 0
    });
    handleSendMessage(message, fileAttachments);
  };

  // Only show ambient content when there are no messages
  const showAmbientContent = showAmbient && !currentContext;
  
  return (
    <div className={`bg-background ${showAmbientContent ? 'h-full flex flex-col' : ''}`}>
      <div className="max-w-3xl sm:max-w-4xl mx-auto w-full h-full flex flex-col">
        {/* Show ambient content when there are no messages */}
        {showAmbientContent && (
          <div className="w-full bg-background flex-1 flex flex-col">
            <div className="px-3 sm:px-4 pt-6 pb-2 flex-shrink-0">
              {/* Empty header for consistent spacing */}
            </div>
            
            {/* Ambient Insights component - handles its own data fetching */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 pb-4">
              <AmbientInsights
                userId={undefined}
                onInsightClick={(action, insight) => handleSendMessage(action)}
              />
            </div>

            {/* Bottom bar actions */}
            <div className="border-t border-border flex-shrink-0">
              <div className="px-3 sm:px-4 py-3">
                <BottomBarActions onActionClick={handleActionClick} onInputPopulate={onInputPopulate} />
              </div>
            </div>
          </div>
        )}

        {/* Chat input area - always show */}
        <div className="px-2 sm:px-3 pt-1 pb-2">
          {/* Chat controls - positioned above input for visibility */}
          <div className="flex items-center justify-end gap-3 pb-3 px-2">
            {/* Smart Search Control */}
            <button
              onClick={() => onToggleContextSearch?.(!useContextSearch)}
              title={useContextSearch 
                ? `Context search active - using ${embeddingInfo?.count || 0} content items`
                : 'Enable context search to reference your content'
              }
              className={`px-3 py-1.5 text-xs font-light transition-colors duration-300 border-b ${
                useContextSearch 
                  ? 'text-foreground border-current' 
                  : 'text-muted-foreground border-transparent hover:text-foreground hover:border-current'
              }`}
            >
              Smart Search {useContextSearch ? 'on' : 'off'}
            </button>
            
            {/* Notepad Inclusion Control */}
            <button
              onClick={() => onToggleNotepadInMessages?.(!includeNotepadInMessages)}
              title={includeNotepadInMessages 
                ? 'Notes are included in messages - AI can see your notepad content'
                : 'Include notepad content in messages for AI reference'
              }
              className={`px-3 py-1.5 text-xs font-light transition-colors duration-300 border-b ${
                includeNotepadInMessages 
                  ? 'text-foreground border-current' 
                  : 'text-muted-foreground border-transparent hover:text-foreground hover:border-current'
              }`}
            >
              Notepad {includeNotepadInMessages ? 'on' : 'off'}
            </button>
          </div>
          
          <ChatInput
            inputRef={inputRef}
            onSend={wrappedHandleSendMessage}
            isLoading={isLoading || !isAuthenticated}
            disabled={!isAuthenticated}
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
            notepadOpen={notepadOpen}
            openNotepad={openNotepad}
            quotedForNotepad={quotedForNotepad}
            onClearQuoted={onClearQuoted}
            currentTab={currentTab}
            isMobile={isMobile}
            activeTab={activeTab}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatInputArea;