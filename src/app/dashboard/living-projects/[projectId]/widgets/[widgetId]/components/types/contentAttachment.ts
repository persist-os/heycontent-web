import { Id } from '@/convex/_generated/dataModel';

export type ContentType = 'note' | 'artifact' | 'stardust' | 'shard';

export type AttachmentMode = 'widget' | 'project';

// Removed - defined in main component file to avoid circular dependencies

export interface BaseMetadata {
  projectId?: Id<"projects"> | string;
  widgetId?: string | Id<"widgets">;
}

export interface NoteMetadata extends BaseMetadata {
  type: string;
  tags: string[];
  platform: string;
  important: boolean;
  isWidgetOutput: boolean;
}

export interface ConversationMetadata extends BaseMetadata {
  messageCount: number;
  conversationType: string;
  starred: boolean;
}

export interface CrystalMetadata extends BaseMetadata {
  dimension: string;
  crystalType: string;
  confidenceScore: string | number;
  shardCount: number;
  usageCount: number;
  supportingQuotes: string[];
  hasQuotes: boolean;
}

export interface ShardMetadata extends BaseMetadata {
  dimension: string;
  confidenceLevel: string;
  sourceType: string;
  usedInCrystal: string | null;
  shardStatus: string;
  conversationId?: string;
}

export type ItemMetadata = NoteMetadata | ConversationMetadata | CrystalMetadata | ShardMetadata;

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  preview: string;
  fullContent: string;
  timestamp: number;
  createdAt: number;
  isAttached: boolean;
  metadata: ItemMetadata;
}
