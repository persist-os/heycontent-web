import { ContentItem, NoteMetadata, ShardMetadata } from '../types/contentAttachment';
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

export function transformArtifactToItem(
  artifact: any,
  attachedArtifactIds: string[]
): ContentItem {
  const artifactData = artifact.data || artifact.artifactData || {};
  return {
    id: artifact._id,
    type: 'artifact',
    title: artifact.title || artifact.type || 'Untitled Artifact',
    preview: JSON.stringify(artifactData).substring(0, 100),
    fullContent: JSON.stringify(artifactData),
    timestamp: artifact.updatedAt || artifact.createdAt,
    createdAt: artifact.createdAt,
    isAttached: attachedArtifactIds.includes(artifact._id),
    metadata: {
      type: artifact.type,
      projectId: artifact.projectId,
      widgetId: artifact.widgetId,
    } as any,
  };
}

export function transformStardustToItem(
  stardust: any,
  attachedStardustIds: string[]
): ContentItem {
  return {
    id: stardust._id,
    type: 'stardust',
    title: stardust.name || 'Untitled Stardust',
    preview: truncatePreview(stardust.description),
    fullContent: stardust.description || '',
    timestamp: stardust.updatedAt || stardust.createdAt,
    createdAt: stardust.createdAt,
    isAttached: attachedStardustIds.includes(stardust._id),
    metadata: {
      dimension: stardust.dimension || 'unknown',
      confidence: stardust.confidence || 0,
      lifecycleStage: stardust.lifecycleStage || 'unknown',
      projectId: stardust.projectId,
    } as any,
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
  artifacts: any[] | undefined,
  stardust: any[] | undefined,
  shards: any[] | undefined,
  attachedNoteIds: string[],
  attachedArtifactIds: string[],
  attachedStardustIds: string[],
  attachedShardIds: string[]
): ContentItem[] {
  const items: ContentItem[] = [];

  // Transform notes
  notes.forEach(note => {
    items.push(transformNoteToItem(note, attachedNoteIds));
  });

  // Transform artifacts
  if (Array.isArray(artifacts)) {
    artifacts.forEach(artifact => {
      items.push(transformArtifactToItem(artifact, attachedArtifactIds));
  });
  }

  // Transform stardust
  if (Array.isArray(stardust)) {
    stardust.forEach(sd => {
      items.push(transformStardustToItem(sd, attachedStardustIds));
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
