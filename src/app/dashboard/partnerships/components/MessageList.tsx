'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ChevronRight, ChevronDown, User, Clock, Reply } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Constants
const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
};

interface EmailMessage {
  readonly id: string;
  readonly from: string;
  readonly email: string;
  readonly subject: string;
  readonly body: string;
  readonly timestamp: number;
  readonly isReply: boolean;
  readonly isFromUser: boolean;
}

interface MessageListProps {
  readonly messages: readonly EmailMessage[];
  readonly userEmail?: string | null;
  readonly selectedMessageId?: string;
  readonly onMessageSelect?: (messageId: string) => void;
  readonly onStartDraft?: () => void;
  readonly themeColor?: string;
}

export function MessageList({
  messages,
  userEmail,
  selectedMessageId,
  onMessageSelect,
  onStartDraft,
  themeColor = 'blue'
}: MessageListProps) {
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  // Generate theme-based color classes
  const getThemeClasses = (color: string) => {
    const colors = {
      blue: {
        buttonBg: 'bg-blue-600 hover:bg-blue-700',
      },
      purple: {
        buttonBg: 'bg-purple-600 hover:bg-purple-700',
      }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const themeClasses = getThemeClasses(themeColor);

  // Auto-expand the most recent message when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Find the most recent message (highest timestamp)
      const mostRecentMessage = messages.reduce((latest, current) => 
        current.timestamp > latest.timestamp ? current : latest
      );
      
      // Expand the most recent message by default
      setExpandedMessages(new Set([mostRecentMessage.id]));
    }
  }, [messages]);

  const toggleMessageExpansion = useCallback((messageId: string) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedMessages(newExpanded);
  }, [expandedMessages]);

  const formatTimestamp = useCallback((timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', DATE_FORMAT_OPTIONS);
  }, []);

  const getSenderDisplay = useCallback((message: EmailMessage): string => {
    return message.isFromUser ? 'Me' : message.from;
  }, []);

  const getSenderEmail = useCallback((message: EmailMessage): string => {
    return message.isFromUser ? (userEmail || 'me@example.com') : message.email;
  }, [userEmail]);

  const getMessageBackground = useCallback((message: EmailMessage, isExpanded: boolean): string => {
    if (message.isFromUser) {
      return isExpanded 
        ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50' 
        : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-800/30';
    }
    return isExpanded 
      ? 'bg-muted/50 border-border' 
      : 'bg-muted/30 border-muted-foreground/20';
  }, []);

  const handleMessageClick = useCallback((messageId: string) => {
    toggleMessageExpansion(messageId);
    onMessageSelect?.(messageId);
  }, [toggleMessageExpansion, onMessageSelect]);

  if (messages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No messages to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Draft Reply Button */}
      {onStartDraft && (
        <div className="flex justify-end">
          <Button 
            size="sm" 
            onClick={onStartDraft}
            className={`${themeClasses.buttonBg} text-white`}
          >
            <Reply className="w-4 h-4 mr-2" />
            Draft Reply
          </Button>
        </div>
      )}

      {messages.map((message) => {
        const isExpanded = expandedMessages.has(message.id);
        const isSelected = selectedMessageId === message.id;
        
        return (
          <div 
            key={message.id} 
            className={`border rounded-lg transition-all duration-200 ${getMessageBackground(message, isExpanded)} ${
              isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
            }`}
          >
            {/* Message Header */}
            <div 
              className="p-3 cursor-pointer hover:bg-opacity-70 transition-colors"
              onClick={() => handleMessageClick(message.id)}
            >
                              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground truncate">
                          {getSenderDisplay(message)}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {getSenderEmail(message)}
                        </span>
                      </div>
                      
                      {!isExpanded && (
                        <p className="text-sm text-muted-foreground truncate">
                          {message.body || 'No content'}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground ml-4">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimestamp(message.timestamp)}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                </div>
            </div>

            {/* Expanded Message Content */}
            {isExpanded && (
              <div className="px-3 pb-3">
                <div className="border-t pt-3 mt-2">
                  <div className="mb-2">
                    <p className="text-sm font-medium text-foreground mb-1">Subject:</p>
                    <p className="text-sm text-muted-foreground">{message.subject || 'No subject'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Message:</p>
                    <div className="prose prose-sm max-w-none text-foreground">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.body || 'No content available'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
