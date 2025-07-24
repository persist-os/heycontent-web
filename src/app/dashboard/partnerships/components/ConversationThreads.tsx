'use client'

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  ChevronDown, 
  Mail,
  User,
  Clock
} from 'lucide-react';

interface EmailMessage {
  id: string;
  from: string;
  email: string;
  subject: string;
  body: string;
  timestamp: number;
  isReply: boolean;
  isFromUser: boolean;
}

interface ConversationThreadsProps {
  messages: EmailMessage[];
  userEmail?: string | null;
  onMessageSelect?: (messageId: string) => void;
  selectedMessageId?: string;
}

export function ConversationThreads({ 
  messages, 
  userEmail, 
  onMessageSelect,
  selectedMessageId 
}: ConversationThreadsProps) {
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  const toggleMessageExpansion = (messageId: string) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedMessages(newExpanded);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getSenderDisplay = (message: EmailMessage) => {
    if (message.isFromUser) {
      return 'Me';
    }
    return message.from;
  };

  const getSenderEmail = (message: EmailMessage) => {
    if (message.isFromUser) {
      return userEmail || 'me@example.com';
    }
    return message.email;
  };

  const getMessageBackground = (message: EmailMessage, isSelected: boolean) => {
    if (isSelected) {
      return 'bg-primary/20 border-primary/30';
    }
    if (message.isFromUser) {
      return 'bg-primary/10 border-primary/20';
    }
    return 'bg-muted/50 border-border';
  };

  if (messages.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground text-lg">Conversation Threads</h3>
        <Card className="p-6 text-center">
          <Mail className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No conversation threads available</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground text-lg">Conversation Threads</h3>
      
      <div className="space-y-2">
        {messages.map((message, index) => {
          const isExpanded = expandedMessages.has(message.id);
          const isSelected = selectedMessageId === message.id;
          
          return (
            <div key={message.id} className="space-y-1">
              {/* Single Card with Header and Optional Body */}
              <div 
                className={`rounded-xl border transition-colors cursor-pointer ${getMessageBackground(message, isSelected)}`}
                onClick={() => {
                  toggleMessageExpansion(message.id);
                  onMessageSelect?.(message.id);
                }}
              >
                {/* Header Section - Always Purple Background */}
                <div className="flex items-center justify-between p-3 bg-primary/10 border-b border-primary/20 rounded-t-xl">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {message.isFromUser ? (
                        <User className="w-4 h-4 text-primary" />
                      ) : (
                        <Mail className="w-4 h-4 text-primary" />
                      )}
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground text-sm truncate">
                            {getSenderDisplay(message)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            &lt;{getSenderEmail(message)}&gt;
                          </span>
                        </div>
                        {message.subject && (
                          <p className="text-xs text-muted-foreground truncate">
                            {message.subject}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(message.timestamp)}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded Message Content - Card Background */}
                {isExpanded && (
                  <div className="p-4 bg-card rounded-b-xl">
                    <div className="prose prose-sm max-w-none text-card-foreground">
                      <div className="text-sm leading-relaxed break-words overflow-wrap-anywhere whitespace-pre-wrap text-card-foreground">
                        {message.body}
                      </div>
                    </div>
                    
                    {/* Message Actions */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimestamp(message.timestamp)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {message.isReply && (
                          <Badge variant="outline" className="text-xs">
                            Reply
                          </Badge>
                        )}
                        {message.isFromUser && (
                          <Badge variant="outline" className="text-xs">
                            Sent
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 