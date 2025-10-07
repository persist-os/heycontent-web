import { ContentItem, NoteMetadata, ConversationMetadata, CrystalMetadata, ShardMetadata } from '../types/contentAttachment';
import { truncatePreview } from './contentItemHelpers';

export function transformNoteToItem(note: any, attachedNoteIds: string[]): ContentItem {
  return {
    id: note._id,
    type: 'note',
    title: note.title || 'Untitled Note',
    preview: truncatePreview(note.content),
    fullContent: note.content || '',
    timestamp: note.updatedAt,
    createdAt: note.createdAt,
    isAttached: attachedNoteIds.includes(note._id),
    metadata: {
      type: note.type || 'idea_bank',
      tags: note.tags || [],
      platform: note.platform || '',
      important: note.important || false,
      isWidgetOutput: note.isWidgetOutput || false,
      projectId: note.projectId,
      widgetId: note.widgetId,
    } as NoteMetadata,
  };
}

export function transformConversationToItem(
  conversation: any,
  attachedConversationIds: string[]
): ContentItem {
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  
  return {
    id: conversation._id,
    type: 'conversation',
    title: conversation.title || 'Untitled Conversation',
    preview: truncatePreview(lastMessage?.content),
    fullContent: lastMessage?.content || '',
    timestamp: conversation.updatedAt,
    createdAt: conversation.createdAt,
    isAttached: attachedConversationIds.includes(conversation._id),
    metadata: {
      messageCount: conversation.messages?.length || 0,
      conversationType: conversation.conversationType || 'general',
      starred: conversation.starred || false,
      projectId: conversation.projectId,
      widgetId: conversation.widgetId,
    } as ConversationMetadata,
  };
}

export function transformCrystalToItem(
  crystal: any,
  attachedCrystalIds: string[]
): ContentItem {
  const quotePreview = crystal.supporting_quotes && crystal.supporting_quotes.length > 0
    ? `"${crystal.supporting_quotes[0]}"${
        crystal.supporting_quotes.length > 1 ? ` +${crystal.supporting_quotes.length - 1} more` : ''
      }`
    : truncatePreview(crystal.description || crystal.core_insight);

  return {
    id: crystal._id,
    type: 'crystal',
    title: crystal.name || 'Untitled Crystal',
    preview: quotePreview,
    fullContent: crystal.description || crystal.core_insight || '',
    timestamp: crystal.updatedAt,
    createdAt: crystal.createdAt,
    isAttached: attachedCrystalIds.includes(crystal._id),
    metadata: {
      dimension: crystal.dimension || 'unknown',
      crystalType: crystal.crystal_type || 'stable_trait',
      confidenceScore: crystal.confidence_score || 'unknown',
      shardCount: crystal.shardIds?.length || 0,
      usageCount: crystal.usage_count || 0,
      projectId: crystal.projectId,
      widgetId: crystal.widgetId,
      supportingQuotes: crystal.supporting_quotes || [],
      hasQuotes: crystal.supporting_quotes && crystal.supporting_quotes.length > 0,
    } as CrystalMetadata,
  };
}

export function transformShardToItem(
  shard: any,
  attachedShardIds: string[]
): ContentItem {
  return {
    id: shard._id,
    type: 'shard',
    title: shard.exact_quote || (shard.dimension ? `${shard.dimension} Insight` : 'Insight Shard'),
    preview: truncatePreview(shard.what_it_reveals),
    fullContent: shard.what_it_reveals || '',
    timestamp: shard.updatedAt,
    createdAt: shard.createdAt,
    isAttached: attachedShardIds.includes(shard._id),
    metadata: {
      dimension: shard.dimension || 'unknown',
      confidenceLevel: shard.confidence_level || 'unknown',
      sourceType: shard.source_type || 'unknown',
      usedInCrystal: shard.used_in_crystal_id || null,
      shardStatus: shard.shard_status || 'unprocessed',
      projectId: shard.projectId,
      widgetId: shard.widgetId,
      conversationId: shard.conversationId,
    } as ShardMetadata,
  };
}

export function transformAllItems(
  notes: any[],
  conversations: any[] | undefined,
  crystals: any[] | undefined,
  shards: any[] | undefined,
  attachedNoteIds: string[],
  attachedConversationIds: string[],
  attachedCrystalIds: string[],
  attachedShardIds: string[]
): ContentItem[] {
  const items: ContentItem[] = [];

  // Transform notes
  notes.forEach(note => {
    items.push(transformNoteToItem(note, attachedNoteIds));
  });

  // Transform conversations
  conversations?.forEach(conv => {
    items.push(transformConversationToItem(conv, attachedConversationIds));
  });

  // Transform crystals
  if (Array.isArray(crystals)) {
    crystals.forEach(crystal => {
      items.push(transformCrystalToItem(crystal, attachedCrystalIds));
    });
  }

  // Transform shards
  if (Array.isArray(shards)) {
    shards.forEach(shard => {
      items.push(transformShardToItem(shard, attachedShardIds));
    });
  }

  return items;
}
