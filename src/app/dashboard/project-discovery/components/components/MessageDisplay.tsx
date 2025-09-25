/**
 * Message Display Component
 * 
 * React component for displaying chat messages, message metadata,
 * and typing indicators in the project discovery system. Provides
 * visual representation of conversation history.
 * 
 * Used by: Main container component, conversation management components
 */

import React from 'react';
import { MessageData } from '../types/discoveryTypes';

/**
 * Props interface for the MessageDisplay component
 */
interface MessageDisplayProps {
  /** Array of messages to display */
  messages: MessageData[];
  /** Currently referenced message for highlighting */
  referencedMessage?: MessageData | null;
  /** Callback for handling message reference selection */
  onMessageReference?: (message: MessageData) => void;
  /** Callback for handling reference clicks */
  onReferenceClick?: (messageId: string) => void;
  /** User ID for message ownership determination */
  userId?: string;
  /** Whether to show typing indicators */
  showTypingIndicator?: boolean;
  /** Custom className for styling */
  className?: string;
}

/**
 * Formats timestamp for display
 */
const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

/**
 * MessageDisplay Component
 * 
 * Renders a list of chat messages with proper styling, status indicators,
 * and interactive elements for the project discovery conversation.
 */
const MessageDisplay: React.FC<MessageDisplayProps> = ({
  messages,
  referencedMessage,
  onMessageReference,
  onReferenceClick,
  userId,
  showTypingIndicator = false,
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {messages.map((message, index) => {
        const isUser = message.role === 'user';
        const isReferenced = referencedMessage?.id === message.id;
        const isTyping = message.status === 'typing';
        
        return (
          <div
            key={message.id}
            className={`transition-all duration-300 ${
              isReferenced ? 'ring-2 ring-blue-500/50 rounded-lg' : ''
            }`}
          >
            {/* Message Container */}
            <div
              className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-lg ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}
              >
                {/* Message Content */}
                <div className="text-sm leading-relaxed">
                  {isTyping ? (
                    <div className="flex items-center gap-2">
                      <span>Thinking...</span>
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-current rounded-full animate-bounce" />
                        <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:0.1s]" />
                        <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
                      </div>
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
                
                {/* Message Metadata */}
                <div
                  className={`flex items-center justify-between mt-2 text-xs ${
                    isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <span>{formatTimestamp(message.timestamp)}</span>
                  {message.status && message.status !== 'typing' && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        message.status === 'error'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          : message.status === 'sent'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}
                    >
                      {message.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Reference Button */}
            {!isUser && onMessageReference && message.status !== 'typing' && (
              <div className="flex justify-start">
                <button
                  onClick={() => onMessageReference(message)}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  Reference this message
                </button>
              </div>
            )}
          </div>
        );
      })}
      
      {/* Typing Indicator */}
      {showTypingIndicator && (
        <div className="flex justify-start">
          <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <span>Assistant is typing</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-current rounded-full animate-bounce" />
                <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:0.1s]" />
                <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageDisplay;
