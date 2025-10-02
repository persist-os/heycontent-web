/**
 * Common Type Definitions for ID Handling
 * 
 * Provides consistent type definitions across the Convex codebase
 * for ID-related operations and validation.
 */

import { Id } from "../_generated/dataModel";

/**
 * Flexible ID type that can accept both string and Convex ID formats
 * Used during migration periods and for backward compatibility
 */
export type FlexibleId<TableName extends string> = string | Id<TableName>;

/**
 * Common table names used throughout the application
 */
export type TableName = 
  | "users"
  | "notes" 
  | "projects"
  | "crystals"
  | "crystal_shards"
  | "crystal_formation_runs"
  | "folders"
  | "conversations"
  | "friendships"
  | "shared_content";

/**
 * Strongly typed ID types for common tables
 */
export type UserId = Id<"users">;
export type NoteId = Id<"notes">;
export type ProjectId = Id<"projects">;
export type CrystalId = Id<"crystals">;
export type ShardId = Id<"crystal_shards">;
export type FormationRunId = Id<"crystal_formation_runs">;
export type FolderId = Id<"folders">;
export type ConversationId = Id<"conversations">;
export type FriendshipId = Id<"friendships">;
export type SharedContentId = Id<"shared_content">;

/**
 * Flexible versions for migration scenarios
 */
export type FlexibleUserId = FlexibleId<"users">;
export type FlexibleNoteId = FlexibleId<"notes">;
export type FlexibleProjectId = FlexibleId<"projects">;
export type FlexibleCrystalId = FlexibleId<"crystals">;
export type FlexibleShardId = FlexibleId<"crystal_shards">;
export type FlexibleFormationRunId = FlexibleId<"crystal_formation_runs">;

/**
 * Result types for operations that may return IDs
 */
export interface IdResult<T extends TableName> {
  success: boolean;
  id?: Id<T>;
  error?: string;
}

/**
 * Batch operation result for multiple IDs
 */
export interface BatchIdResult<T extends TableName> {
  success: boolean;
  validIds: Id<T>[];
  invalidIds: string[];
  errors: string[];
}

/**
 * Configuration for ID-related operations
 */
export interface IdOperationConfig {
  strict?: boolean;           // Whether to enforce strict Convex ID format
  allowLegacy?: boolean;      // Whether to allow string IDs
  throwOnInvalid?: boolean;   // Whether to throw errors or return null
}

/**
 * Type guards for ID validation
 */
export function isUserId(id: any): id is UserId {
  return typeof id === 'string' && id.length > 20 && id.startsWith('z');
}

export function isNoteId(id: any): id is NoteId {
  return typeof id === 'string' && id.length > 20 && id.startsWith('z');
}

export function isProjectId(id: any): id is ProjectId {
  return typeof id === 'string' && id.length > 20 && id.startsWith('z');
}

/**
 * Utility type for functions that accept flexible IDs
 */
export type IdAcceptingFunction<T extends TableName, R> = (id: FlexibleId<T>) => R;

/**
 * Utility type for functions that return validated IDs
 */
export type IdReturningFunction<T extends TableName> = () => Id<T>;

/**
 * Common patterns for ID validation in function arguments
 */
export interface IdValidationArgs {
  strict?: boolean;
  tableName: TableName;
  context?: string;
}

/**
 * Standard error types for ID validation
 */
export class IdValidationError extends Error {
  constructor(
    message: string,
    public readonly tableName: TableName,
    public readonly invalidId: string,
    public readonly context?: string
  ) {
    super(message);
    this.name = 'IdValidationError';
  }
}

export class LegacyIdWarning extends Error {
  constructor(
    message: string,
    public readonly tableName: TableName,
    public readonly legacyId: string,
    public readonly context?: string
  ) {
    super(message);
    this.name = 'LegacyIdWarning';
  }
}

/**
 * Utility types for database operations
 */
export type DatabaseGetOperation<T extends TableName> = (id: Id<T>) => Promise<any>;
export type DatabaseInsertOperation<T extends TableName> = (data: any) => Promise<Id<T>>;
export type DatabaseUpdateOperation<T extends TableName> = (id: Id<T>, data: any) => Promise<void>;
export type DatabaseDeleteOperation<T extends TableName> = (id: Id<T>) => Promise<void>;

/**
 * Common validation patterns as type-safe constants
 */
export const ID_VALIDATION_PATTERNS = {
  STRICT: { strict: true, allowLegacy: false, throwOnInvalid: true },
  MIGRATION: { strict: false, allowLegacy: true, throwOnInvalid: false },
  LEGACY_WARNING: { strict: false, allowLegacy: true, throwOnInvalid: true }
} as const;

/**
 * Helper type for extracting table name from ID type
 */
export type ExtractTableName<T> = T extends Id<infer U> ? U : never;
