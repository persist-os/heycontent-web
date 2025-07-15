'use client';

import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FolderModalProps } from './types';
import { MessageCircle, Users, Clock } from 'lucide-react';

export const ChatFolderModal: React.FC<FolderModalProps & { onChatClick?: (chatId: string) => void }> = ({
  isOpen,
  onClose,
  folderData,
  onChatClick,
}) => {
  // Transform real conversation data into display format
  const chatItems = useMemo(() => {
    if (!folderData.items || !Array.isArray(folderData.items)) return [];
    
    return folderData.items.map((conversation: any) => ({
      id: conversation._id,
      title: conversation.title || 'Untitled Conversation',
      date: new Date(conversation.createdAt),
      messageCount: conversation.messages?.length || 0,
      lastMessage: conversation.messages?.length > 0 
        ? conversation.messages[conversation.messages.length - 1].content.slice(0, 50) + '...'
        : 'No messages yet',
      preview: conversation.messages?.length > 0 
        ? conversation.messages[0].content.slice(0, 100) + '...'
        : 'Conversation started...',
      starred: conversation.starred || false
    }));
  }, [folderData.items]);

  // Prevent scroll propagation to timeline - following TimelineScroller.tsx pattern
  const handleWheel = (e: React.WheelEvent) => {
    // Only prevent propagation for non-zoom scroll events
    if (!e.ctrlKey && !e.metaKey) {
      e.stopPropagation();
    }
  };

  const handleScroll = (e: React.UIEvent) => {
    e.stopPropagation();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-primary-foreground" />
            </div>
            Chat Conversations
            <span className="text-sm text-muted-foreground">({folderData.count} items)</span>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] custom-scrollbar">
          <div 
            className="space-y-4 pr-4"
            onWheel={handleWheel}
            onScroll={handleScroll}
            style={{ overscrollBehavior: 'contain' }}
          >
            {chatItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No conversations found for this time period</p>
              </div>
            ) :
              chatItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                  tabIndex={0}
                  role="button"
                  aria-label={`Open chat: ${item.title}`}
                  onClick={() => onChatClick && onChatClick(item.id)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && onChatClick) {
                      e.preventDefault();
                      onChatClick(item.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {item.date.toLocaleDateString()}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {item.preview}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MessageCircle className="w-3 h-3" />
                        {item.messageCount} messages
                      </div>
                      {item.starred && (
                        <div className="flex items-center gap-1 text-accent-foreground">
                          <span className="text-xs">⭐ Starred</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-muted-foreground">
                    <strong>Last:</strong> "{item.lastMessage}"
                  </div>
                  
                  <div className="mt-2">
                    <span className="inline-block bg-accent/20 text-accent-foreground px-2 py-1 rounded-full text-xs">
                      Chat Conversation
                    </span>
                  </div>
                </div>
              ))
            }
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}; 