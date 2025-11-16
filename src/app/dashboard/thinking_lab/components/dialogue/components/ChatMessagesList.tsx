import React from 'react';
import { MessageBubble } from '@/app/dashboard/thinking_lab/components/dialogue/messages/message-bubble';
import { SuggestionChip } from './SuggestionChip';
import { HorizontalProgressiveThinking } from './HorizontalProgressiveThinking';
import type { Message } from '@/app/types/chat';

interface ThinkingState {
  shouldShow: boolean;
  showLoadingIndicator: boolean;
  showExpandableList: boolean;
  a2aMessages: Message[];
  isLoading: boolean;
}

interface ChatMessagesListProps {
  messages: any[];
  conversationData?: {
    messages: Message[];
    thinkingState?: ThinkingState;
  };
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
  // Legacy props (kept for backward compatibility during transition)
  shouldShowThinking?: boolean;
  a2aMessages?: Message[];
  isLoading?: boolean;
  hasFinalArtifact?: boolean;
}

const ChatMessagesList: React.FC<ChatMessagesListProps> = ({
  messages,
  conversationData,
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
  // Legacy props (fallback if conversationData not provided)
  shouldShowThinking = false,
  a2aMessages = [],
  isLoading = false,
}) => {
  // Extract thinkingState from conversationData (preferred) or use legacy props
  const thinkingState = conversationData?.thinkingState
  // Use messages prop (which includes optimistic updates) - conversationData.messages is raw Convex data
  const displayMessages = messages
  const allA2aMsgs = thinkingState?.a2aMessages ?? a2aMessages

  // Compute per-message thinking state (pure derived state, no useEffect)
  // For each user message, determine if we should show thinking component
  const getThinkingStateForMessage = React.useCallback((message: any, index: number): ThinkingState | null => {
    // A2A message types (from Convex query logic)
    const A2A_MESSAGE_TYPES = ['a2a_announcement', 'widget_agent_announcement', 'widget_introduction', 'artifact_created', 'widget_status']
    
    // Helper to check if message is an A2A message
    const isA2AMessage = (msg: any): boolean => {
      return msg.contentType && A2A_MESSAGE_TYPES.includes(msg.contentType)
    }

    // Helper to check if message is a user-facing assistant response (not A2A)
    const isUserFacingAssistantMessage = (msg: any): boolean => {
      return msg.role === 'assistant' && !isA2AMessage(msg)
    }

    // Only show thinking after user messages
    if (message.role !== 'user') {
      return null
    }

    // Find the next user-facing assistant message (skip A2A messages)
    let hasAssistantResponse = false
    for (let i = index + 1; i < displayMessages.length; i++) {
      const nextMsg = displayMessages[i]
      if (isUserFacingAssistantMessage(nextMsg)) {
        hasAssistantResponse = true
        break
      }
      // If we hit another user message before finding assistant response, stop
      if (nextMsg.role === 'user') {
        break
      }
    }
    
    // Show thinking only if no assistant response found (still waiting for AI response)
    // Hide it once the assistant response arrives
    if (hasAssistantResponse) {
      return null
    }

    // Filter A2A messages to only those that occurred after this user message
    const messageTimestamp = message.timestamp || 0
    const relevantA2aMessages = allA2aMsgs.filter((a2aMsg: any) => {
      const a2aTimestamp = a2aMsg.timestamp || 0
      return a2aTimestamp > messageTimestamp
    })

    const hasA2aMessages = relevantA2aMessages.length > 0

    // Compute thinking state for this specific user message
    const isLoading = !hasAssistantResponse // Still waiting for response
    const shouldShow = isLoading || hasA2aMessages
    const showLoadingIndicator = shouldShow && isLoading && !hasA2aMessages
    const showExpandableList = shouldShow && hasA2aMessages

    return {
      shouldShow,
      showLoadingIndicator,
      showExpandableList,
      a2aMessages: relevantA2aMessages,
      isLoading,
    }
  }, [displayMessages, allA2aMsgs])

  return (
    <>
      {displayMessages.map((message, index) => {
        // Compute thinking state for this message position
        const messageThinkingState = getThinkingStateForMessage(message, index)

        return (
          <React.Fragment key={message.id || message._id || index}>
            <div
              id={`message-${message.id || message._id || index}`}
              className="transition-all duration-300"
            >
              <MessageBubble
                message={message}
                isLastMessage={index === displayMessages.length - 1}
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
            
            {/* Thinking component - rendered after each user message that needs it */}
            {messageThinkingState && messageThinkingState.shouldShow && (
              <div className="mt-2">
                <HorizontalProgressiveThinking thinkingState={messageThinkingState} />
              </div>
            )}
          </React.Fragment>
        )
      })}
    </>
  )
};

export default ChatMessagesList; 