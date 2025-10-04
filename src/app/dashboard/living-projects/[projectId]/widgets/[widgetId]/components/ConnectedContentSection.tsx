'use client';

import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ConnectedNoteCard } from './ConnectedNoteCard';
import { ConversationCard } from './ConversationCard';
import { Button } from '@/components/ui/button';

interface ConnectedContentSectionProps {
  widgetId: string | Id<"widgets">;
  userId: string;
  onNoteClick: (noteId: string) => void;
  onConversationClick: (conversationId: string) => void;
  onAddContent: () => void;
}

type ContentTab = 'notes' | 'conversations';

export function ConnectedContentSection({
  widgetId,
  userId,
  onNoteClick,
  onConversationClick,
  onAddContent
}: ConnectedContentSectionProps) {
  const [activeTab, setActiveTab] = useState<ContentTab>('notes');

  // Fetch connected content using direct queries
  const connectedNotes = useQuery(
    api.noteQueries.getNotesByWidgetId,
    userId && widgetId ? { widgetId, userId } : 'skip'
  ) as any[] | undefined;

  const connectedConversations = useQuery(
    api.chatQueries.getConversationsByWidgetId,
    userId && widgetId ? { widgetId, userId } : 'skip'
  ) as any[] | undefined;

  const notesCount = connectedNotes?.length || 0;
  const conversationsCount = connectedConversations?.length || 0;
  const totalContent = notesCount + conversationsCount;

  // Handle loading states
  const isLoading = !connectedNotes || !connectedConversations;

  // Handle empty state
  if (totalContent === 0 && !isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-baseline gap-6">
          <h2 className="text-3xl font-light tracking-tight text-foreground">
            Connected Content
          </h2>
          <span className="text-sm text-muted-foreground">
            No content linked yet
          </span>
        </div>

        <div className="border border-dashed border-border/50 rounded p-16 text-center">
          <p className="text-base text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
            Link notes and conversations to this widget to build context and maintain connections across your work.
          </p>
          <Button
            onClick={onAddContent}
            variant="outline"
            className="hover:bg-muted/50 transition-colors duration-300"
          >
            Add Content
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Tab Navigation */}
      <div className="flex items-end justify-between border-b border-border/30 pb-0">
        <div className="flex items-center gap-8">
          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-4 px-1 text-base font-light transition-colors relative ${
              activeTab === 'notes' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'
            }`}
          >
            Notes
            <span className="ml-2 text-sm">
              {notesCount}
            </span>
            {activeTab === 'notes' && (
              <div className="absolute bottom-0 left-0 right-0 h-px bg-foreground" />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('conversations')}
            className={`pb-4 px-1 text-base font-light transition-colors relative ${
              activeTab === 'conversations' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'
            }`}
          >
            Conversations
            <span className="ml-2 text-sm">
              {conversationsCount}
            </span>
            {activeTab === 'conversations' && (
              <div className="absolute bottom-0 left-0 right-0 h-px bg-foreground" />
            )}
          </button>
        </div>

        <Button
          onClick={onAddContent}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground transition-colors duration-300 mb-3"
        >
          Add More
        </Button>
      </div>

      {/* Content Display */}
      <div className="space-y-4">
        {activeTab === 'notes' && (
          <>
            {notesCount > 0 ? (
              <div className="space-y-3">
                {connectedNotes?.map((note) => (
                  <ConnectedNoteCard
                    key={note._id}
                    note={note}
                    onNoteClick={onNoteClick}
                  />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <p className="text-muted-foreground">No notes connected yet</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'conversations' && (
          <>
            {conversationsCount > 0 ? (
              <div className="space-y-3">
                {connectedConversations?.map((conversation) => (
                  <ConversationCard
                    key={conversation._id}
                    conversation={conversation}
                    onClick={() => onConversationClick(conversation._id)}
                  />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <p className="text-muted-foreground">No conversations connected yet</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
