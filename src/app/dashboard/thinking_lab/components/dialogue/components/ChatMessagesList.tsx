import React from 'react';
import { MessageBubble } from '@/app/dashboard/thinking_lab/components/dialogue/messages/message-bubble';
import { SuggestionChip } from './SuggestionChip';
import { HorizontalProgressiveThinking } from './HorizontalProgressiveThinking';
import { messagesWithThinking } from '@/app/dashboard/thinking_lab/utils/messagesWithThinking';
import type { Message } from '@/app/types/chat';

interface ChatMessagesListProps {
  messages: any[];
  referencedMessage: any;
  handleMessageReference: (msg: any) => void;
  handleReferenceClick: (id: string) => void;
  handleOptionClick: (option: any) => void;
  handleFollowUpClick: (choice: string) => void;
  userId: string | undefined;
  handleSuggestionClick: (suggestion: any, onSendMessage: (msg: string) => void) => void;
  handleSendMessage: (msg: string) => void;
  onInputPopulate?: (text: string) => void;
  notepadOpen?: boolean;
  onQuoteToNotepad?: (text: string) => void;
  onContentClick?: (contentType: string, contentId: string) => void;
  // Thinking component props
  shouldShowThinking?: boolean;
  a2aMessages?: Message[];
  isStreaming?: boolean;
  isLoading?: boolean;
  hasFinalArtifact?: boolean;
}

const ChatMessagesList: React.FC<ChatMessagesListProps> = ({
  messages,
  referencedMessage,
  handleMessageReference,
  handleReferenceClick,
  handleOptionClick,
  handleFollowUpClick,
  userId,
  handleSuggestionClick,
  handleSendMessage,
  onInputPopulate,
  notepadOpen,
  onQuoteToNotepad,
  onContentClick,
  shouldShowThinking = false,
  a2aMessages = [],
  isStreaming = false,
  isLoading = false,
  hasFinalArtifact = false,
}) => {
  // Insert thinking message into message list (if needed)
  const messagesToRender = messagesWithThinking(
    messages,
    shouldShowThinking,
    a2aMessages,
    isStreaming,
    isLoading,
    hasFinalArtifact
  )

  return (
    <>
      {messagesToRender.map((message, index) => {
        // Check if this is the thinking message
        if (message.role === 'thinking' && message.id === 'thinking') {
          const thinkingData = message.metadata?.thinkingData
          if (thinkingData) {
            return (
              <div key={message.id} className="mt-2">
                <HorizontalProgressiveThinking
                  messages={thinkingData.a2aMessages?.length > 0 ? thinkingData.a2aMessages : undefined}
                  isStreaming={thinkingData.isStreaming}
                  isLoading={thinkingData.isLoading}
                  hasFinalArtifact={thinkingData.hasFinalArtifact}
                />
              </div>
            )
          }
        }
        
        return (
          <React.Fragment key={message.id}>
            <div
              id={`message-${message.id}`}
              className="transition-all duration-300"
            >
              <MessageBubble
                message={message}
                isLastMessage={index === messagesToRender.length - 1}
                onReference={handleMessageReference}
                showReferenceButton={!referencedMessage && message.status !== 'typing'}
                onReferenceClick={handleReferenceClick}
                onOptionClick={handleOptionClick}
                onFollowUpClick={handleFollowUpClick}
                userId={userId}
                onInputPopulate={onInputPopulate}
                notepadOpen={notepadOpen}
                onQuoteToNotepad={onQuoteToNotepad}
                onContentClick={onContentClick}
              />
              {message.role === 'assistant' && message.suggestions && (
                <div className="mt-4 pr-4">
                  <div className="flex flex-wrap gap-x-6 gap-y-3 items-baseline">
                    {message.suggestions.slice(0, 4).map((suggestion: any, idx: number) => (
                      <SuggestionChip
                        key={idx}
                        suggestion={suggestion}
                        onClick={() => handleSuggestionClick(suggestion, handleSendMessage)}
                        onInputPopulate={onInputPopulate}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </React.Fragment>
        )
      })}
    </>
  )
};

export default ChatMessagesList; 