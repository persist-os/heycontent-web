import React, { useState } from 'react';
import { ChatInput } from './chat-input';
import { AmbientInsights } from '@/app/dashboard/ambient_insights/AmbientInsights';
import { BottomBarActions } from '../components/BottomBarActions';
import { Message } from '@/app/types/chat';
import { getCurrentUserIdSync } from '@/app/lib/api-helpers';

interface ChatInputAreaProps {
  showAmbient: boolean;
  currentContext?: any;
  handleActionClick: (action: string) => void;
  handleSendMessage: (message: string, fileAttachments?: any[]) => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  isLoading: boolean;
  isOrchestratorRunning?: boolean;
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
  // Notepad control
  embeddingInfo?: { hasEmbeddings: boolean; count: number };
  includeNotepadInMessages?: boolean;
  onToggleNotepadInMessages?: (enabled: boolean) => void;
  // Thread selection props
  userId?: string;
  activeThreadId?: string;
  onThreadSelect?: (threadId: string) => void;
  // Question handling - allow input when questions are asked
  messages?: Message[];
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  showAmbient,
  currentContext,
  handleActionClick,
  handleSendMessage,
  inputRef,
  isLoading,
  isOrchestratorRunning = false,
  referencedMessage,
  handleClearReference,
  includeAnalysisInQuery,
  inputValue,
  onInputChange,
  onInputPopulate,
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
  onToggleNotepadInMessages,
  userId,
  activeThreadId,
  onThreadSelect,
  messages = []
}) => {
  // Only show ambient content when there are no messages
  const showAmbientContent = showAmbient && !currentContext;
  
  // Check if last assistant message has questions - if so, allow input even if orchestrator is running
  const lastAssistantMessage = messages
    .filter(msg => msg.role === 'assistant')
    .slice(-1)[0];
  const hasQuestionsAsked = lastAssistantMessage?.hasQuestions === true;
  
  // Allow input when questions are asked, even if orchestrator is running
  const shouldDisableInput = !isAuthenticated || isLoading || (isOrchestratorRunning && !hasQuestionsAsked);
  
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
            <div className="flex-1 overflow-y-auto pb-4 scrollbar-hide">
              <AmbientInsights
                userId={getCurrentUserIdSync()}
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
          <ChatInput
            inputRef={inputRef}
            onSend={handleSendMessage}
            isLoading={isLoading || !isAuthenticated}
            disabled={shouldDisableInput}
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
            includeNotepadInMessages={includeNotepadInMessages}
            onToggleNotepadInMessages={onToggleNotepadInMessages}
            userId={userId || getCurrentUserIdSync()}
            activeThreadId={activeThreadId}
            onThreadSelect={onThreadSelect}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatInputArea;