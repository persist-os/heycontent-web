import { Id } from "@/convex/_generated/dataModel";
import { Note } from "./index";

export interface Project {
  _id: Id<"projects">;
  userId: string;
  name: string;
  description?: string;
  
  // Clean content arrays - aligned with schema
  noteIds: string[];
  conversationIds: string[];
  crystalIds: string[];
  shardIds: string[];
  analysisIds: string[];
  
  // Intelligence
  fingerprintId?: Id<"project_fingerprints">;
  
  // Metadata
  createdAt: number;
  updatedAt: number;
  
  // Computed fields from queries
  noteCount?: number;
  conversationCount?: number;
  crystalCount?: number;
  shardCount?: number;
  totalContent?: number;
  hasFingerprintId?: boolean;
}

export interface ProjectWithItems extends Project {
  attachedItems: {
    notes: Note[];
    conversations: Array<{
      _id: Id<"conversations">;
      userId: string;
      title: string;
      messages: Array<{
        content: string;
        role: string;
        timestamp?: number;
      }>;
      createdAt: number;
      updatedAt: number;
      starred: boolean;
    }>;
    crystals: Array<{
      _id: Id<"crystals">;
      userId: string;
      crystal_id: string;
      name: string;
      crystal_type: string;
      dimension: string;
      description?: string;
      createdAt: number;
      updatedAt: number;
    }>;
    shards: Array<{
      _id: Id<"crystal_shards">;
      userId: string;
      dimension?: string;
      exact_quote?: string;
      what_it_reveals?: string;
      situation_context?: string;
      createdAt: number;
      updatedAt: number;
    }>;
    analysisItems: Array<any>;
  };
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
}

// Updated content types - removed legacy social media, added crystals/shards
export type ContentType = "note" | "conversation" | "crystal" | "shard" | "analysis";

export interface ProjectItem {
  id: string;
  type: ContentType;
  title: string;
  preview?: string;
  date: number;
} 