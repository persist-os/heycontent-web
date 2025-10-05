'use client';

import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ConnectedNoteCard } from './ConnectedNoteCard';
import { ConversationCard } from './ConversationCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Calendar } from 'lucide-react';

interface ConnectedContentSectionProps {
  widgetId: string | Id<"widgets">;
  userId: string;
  onNoteClick: (noteId: string) => void;
  onConversationClick: (conversationId: string) => void;
  onAddContent: () => void;
}

type ContentTab = 'notes' | 'conversations' | 'crystals' | 'shards';

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

  const connectedCrystals = useQuery(
    api.crystalQueries.getCrystalsByWidgetId,
    userId && widgetId ? { widgetId, userId } : 'skip'
  ) as any[] | undefined;

  const connectedShards = useQuery(
    api.crystalQueries.getShardsByWidgetId,
    userId && widgetId ? { widgetId, userId } : 'skip'
  ) as any[] | undefined;

  const notesCount = connectedNotes?.length || 0;
  const conversationsCount = connectedConversations?.length || 0;
  const crystalsCount = connectedCrystals?.length || 0;
  const shardsCount = connectedShards?.length || 0;
  const totalContent = notesCount + conversationsCount + crystalsCount + shardsCount;

  // Handle loading states
  const isLoading = !connectedNotes || !connectedConversations || !connectedCrystals || !connectedShards;

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
            Link notes, conversations, crystals, and shards to this widget to build context and maintain connections across your work.
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

          <button
            onClick={() => setActiveTab('crystals')}
            className={`pb-4 px-1 text-base font-light transition-colors relative ${
              activeTab === 'crystals' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'
            }`}
          >
            Crystals
            <span className="ml-2 text-sm">
              {crystalsCount}
            </span>
            {activeTab === 'crystals' && (
              <div className="absolute bottom-0 left-0 right-0 h-px bg-foreground" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('shards')}
            className={`pb-4 px-1 text-base font-light transition-colors relative ${
              activeTab === 'shards' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'
            }`}
          >
            Shards
            <span className="ml-2 text-sm">
              {shardsCount}
            </span>
            {activeTab === 'shards' && (
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

        {activeTab === 'crystals' && (
          <>
            {crystalsCount > 0 ? (
              <div className="space-y-3">
                {connectedCrystals?.map((crystal) => (
                  <div
                    key={crystal._id}
                    className="border border-border/40 rounded-2xl p-5 hover:bg-muted/20 hover:border-border/60 transition-all duration-200 group cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/20 transition-colors">
                        <Sparkles className="w-6 h-6 text-purple-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground group-hover:text-foreground transition-colors truncate">
                          {crystal.name || 'Untitled Crystal'}
                        </h4>
                        <p className="text-sm text-muted-foreground/70 line-clamp-2 mt-1 font-light italic">
                          {crystal.supporting_quotes && crystal.supporting_quotes.length > 0 
                            ? `"${crystal.supporting_quotes[0]}"${crystal.supporting_quotes.length > 1 ? ` +${crystal.supporting_quotes.length - 1} more` : ''}`
                            : crystal.core_insight || crystal.description || 'No quotes'}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground/60">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(crystal.updatedAt).toLocaleDateString()}
                          </div>
                          {crystal.dimension && (
                            <Badge variant="outline" className="text-xs">
                              {crystal.dimension}
                            </Badge>
                          )}
                          {crystal.confidence_score && (
                            <Badge variant="outline" className="text-xs">
                              {crystal.confidence_score} confidence
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <p className="text-muted-foreground">No crystals connected yet</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'shards' && (
          <>
            {shardsCount > 0 ? (
              <div className="space-y-3">
                {connectedShards?.map((shard) => (
                  <div
                    key={shard._id}
                    className="border border-border/40 rounded-2xl p-5 hover:bg-muted/20 hover:border-border/60 transition-all duration-200 group cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                        <Zap className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground group-hover:text-foreground transition-colors line-clamp-2">
                          {shard.exact_quote || (shard.dimension ? `${shard.dimension} Insight` : 'Insight Shard')}
                        </h4>
                        <p className="text-sm text-muted-foreground/70 line-clamp-2 mt-1 font-light">
                          {shard.what_it_reveals || 'No revelation'}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground/60">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(shard.updatedAt).toLocaleDateString()}
                          </div>
                          {shard.confidence_level && (
                            <Badge variant="outline" className="text-xs">
                              {shard.confidence_level} confidence
                            </Badge>
                          )}
                          {shard.shard_status && (
                            <Badge variant="outline" className="text-xs">
                              {shard.shard_status.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <p className="text-muted-foreground">No shards connected yet</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
