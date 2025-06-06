import React from 'react';
import { MessageBubble } from '../message-bubble';
import { SuggestionChip } from './SuggestionChip';

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
}) => (
  <>
    {messages.map((message, index) => (
      <div
        key={message.id}
        id={`message-${message.id}`}
        className="transition-all duration-300"
      >
        <MessageBubble
          message={message}
          isLastMessage={index === messages.length - 1}
          onReference={handleMessageReference}
          showReferenceButton={!referencedMessage && message.status !== 'typing'}
          onReferenceClick={handleReferenceClick}
          onOptionClick={handleOptionClick}
          onFollowUpClick={handleFollowUpClick}
          userId={userId}
        />
        {message.role === 'assistant' && message.suggestions && (
          <div className="mt-3 flex flex-wrap gap-2 pl-12">
            {message.suggestions.map((suggestion: any, idx: number) => (
              <SuggestionChip
                key={idx}
                suggestion={suggestion}
                onClick={() => handleSuggestionClick(suggestion, handleSendMessage)}
              />
            ))}
          </div>
        )}
      </div>
    ))}
  </>
);

export default ChatMessagesList; 