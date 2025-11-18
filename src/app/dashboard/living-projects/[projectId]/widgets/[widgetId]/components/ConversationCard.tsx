'use client';

import React, { useState } from 'react';
import { BaseCard } from '@/components/ui/base-card';
import { Button } from '@/components/ui/button';

interface ConversationCardProps {
  conversation: any;
  onClick: () => void;
}

export function ConversationCard({ conversation, onClick }: ConversationCardProps) {
  const [showMetadata, setShowMetadata] = useState(false)
  
  const createdDate = new Date(conversation.createdAt);
  const lastMessage = conversation.messages[conversation.messages.length - 1];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (!content) return 'No preview available'
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + '...'
  }

  return (
    <BaseCard
      variant="conversation"
      title={conversation.title || 'Untitled Conversation'}
      onClick={onClick}
      className="cursor-pointer group"
    >
      <div className="space-y-4">
        {/* Preview */}
        {lastMessage && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {truncateContent(lastMessage.content, 200)}
          </p>
        )}

        {/* Metadata Toggle */}
        <div className="flex items-center justify-between pt-3 border-t border-border/30">
          <div className="flex items-baseline gap-4 text-xs text-muted-foreground">
            <span>{formatDate(createdDate)}</span>
            <span>{conversation.messages.length} messages</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setShowMetadata(!showMetadata)
            }}
            className="text-xs text-muted-foreground hover:text-foreground h-auto py-1 px-2"
          >
            {showMetadata ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>

        {/* Expandable Metadata */}
        {showMetadata && (
          <div className="
            pt-4 space-y-3 border-t border-border/30
            bg-muted/10 backdrop-blur-sm
            rounded-xl p-4 -mx-2
          ">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Started</span>
                <p className="text-foreground font-light">{formatDate(createdDate)}</p>
              </div>
              
              <div>
                <span className="text-muted-foreground">Messages</span>
                <p className="text-foreground font-light">{conversation.messages.length}</p>
              </div>
              
              {conversation.conversationType && (
                <div>
                  <span className="text-muted-foreground">Type</span>
                  <p className="text-foreground font-light">{conversation.conversationType.replace(/_/g, ' ')}</p>
                </div>
              )}

              {conversation.lastMessageAt && (
                <div>
                  <span className="text-muted-foreground">Last Active</span>
                  <p className="text-foreground font-light">
                    {formatDate(new Date(conversation.lastMessageAt))}
                  </p>
                </div>
              )}
            </div>

            {conversation.participants && conversation.participants.length > 0 && (
              <div className="pt-2">
                <span className="text-sm text-muted-foreground">Participants</span>
                <p className="text-xs text-foreground mt-1">{conversation.participants.length} people</p>
              </div>
            )}
          </div>
        )}
      </div>
    </BaseCard>
  );
}
