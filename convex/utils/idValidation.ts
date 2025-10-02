/**
 * Central ID Validation Utility
 * 
 * Provides consistent validation and type handling for both string IDs and Convex IDs
 * across the entire codebase. This utility standardizes ID validation patterns and
 * eliminates duplicate validation logic.
 * 
 * Usage Examples:
 * - validateConvexId(id, "users") // Validates and casts to Id<"users">
 * - isValidConvexId(id) // Boolean check
 * - normalizeId(id, "notes") // Handles both string and Convex IDs
 */

import { Id } from "../_generated/dataModel";

/**
 * Type union for IDs that can be either strings or Convex IDs
 */
export type FlexibleId<TableName extends string> = string | Id<TableName>;

/**
 * Result of ID validation operations
 */
export interface IdValidationResult<TableName extends string> {
  isValid: boolean;
  id?: Id<TableName>;
  error?: string;
  type: 'convex' | 'string' | 'invalid';
}

/**
 * Configuration for ID validation behavior
 */
export interface IdValidationConfig {
  allowStrings?: boolean;  // Whether to allow string IDs (default: false)
  strictConvexOnly?: boolean;  // Whether to only allow Convex IDs (default: true)
  customValidation?: (id: string) => boolean;  // Custom validation function
}

/**
 * Default validation configuration
 */
const DEFAULT_CONFIG: IdValidationConfig = {
  allowStrings: false,
  strictConvexOnly: true,
  customValidation: undefined
};

/**
 * Checks if a string is a valid Convex ID format
 * Convex IDs typically start with 'z' and are longer than 20 characters
 */
export function isValidConvexId(id: string): boolean {
  return typeof id === 'string' && 
         id.startsWith('z') && 
         id.length > 20 &&
         /^[a-zA-Z0-9_-]+$/.test(id);  // Valid Convex ID characters
}

/**
 * Checks if a value is already a Convex ID type
 */
export function isConvexIdType<TableName extends string>(
  id: any
): id is Id<TableName> {
  return typeof id === 'string' && isValidConvexId(id);
}

/**
 * Validates and converts an ID to a proper Convex ID
 * 
 * @param id - The ID to validate (string or Convex ID)
 * @param tableName - The table name for type safety
 * @param config - Validation configuration
 * @returns Validation result with typed ID if successful
 */
export function validateId<TableName extends string>(
  id: FlexibleId<TableName> | null | undefined,
  tableName: TableName,
  config: IdValidationConfig = DEFAULT_CONFIG
): IdValidationResult<TableName> {
  
  // Handle null/undefined
  if (!id) {
    return {
      isValid: false,
      error: `ID is required for table ${tableName}`,
      type: 'invalid'
    };
  }

  // Convert to string for validation
  const idStr = String(id);
  
  // Check if it's a valid Convex ID
  if (isValidConvexId(idStr)) {
    return {
      isValid: true,
      id: idStr as Id<TableName>,
      type: 'convex'
    };
  }
  
  // Handle string IDs if allowed
  if (config.allowStrings && !config.strictConvexOnly) {
    // Apply custom validation if provided
    if (config.customValidation && !config.customValidation(idStr)) {
      return {
        isValid: false,
        error: `ID failed custom validation for table ${tableName}: ${idStr}`,
        type: 'invalid'
      };
    }
    
    return {
      isValid: true,
      id: idStr as Id<TableName>,  // Cast string to Convex ID type
      type: 'string'
    };
  }
  
  // Invalid ID format
  return {
    isValid: false,
    error: `Invalid ID format for table ${tableName}: ${idStr}. Expected Convex ID format (starts with 'z', length > 20).`,
    type: 'invalid'
  };
}

/**
 * Validates and returns a Convex ID, throwing an error if invalid
 * 
 * @param id - The ID to validate
 * @param tableName - The table name for type safety
 * @param config - Validation configuration
 * @returns Typed Convex ID
 * @throws Error if validation fails
 */
export function validateConvexId<TableName extends string>(
  id: FlexibleId<TableName> | null | undefined,
  tableName: TableName,
  config: IdValidationConfig = DEFAULT_CONFIG
): Id<TableName> {
  const result = validateId(id, tableName, config);
  
  if (!result.isValid || !result.id) {
    throw new Error(result.error || `Invalid ID for table ${tableName}`);
  }
  
  return result.id;
}

/**
 * Normalizes an ID to a Convex ID format, with flexible handling
 * This is useful for migration scenarios where both formats might exist
 * 
 * @param id - The ID to normalize
 * @param tableName - The table name for type safety
 * @returns Normalized Convex ID or null if invalid
 */
export function normalizeId<TableName extends string>(
  id: FlexibleId<TableName> | null | undefined,
  tableName: TableName
): Id<TableName> | null {
  const result = validateId(id, tableName, { 
    allowStrings: true, 
    strictConvexOnly: false 
  });
  
  return result.isValid ? result.id! : null;
}

/**
 * Batch validates multiple IDs
 * 
 * @param ids - Array of IDs to validate
 * @param tableName - The table name for type safety
 * @param config - Validation configuration
 * @returns Array of validation results
 */
export function validateIds<TableName extends string>(
  ids: (FlexibleId<TableName> | null | undefined)[],
  tableName: TableName,
  config: IdValidationConfig = DEFAULT_CONFIG
): IdValidationResult<TableName>[] {
  return ids.map(id => validateId(id, tableName, config));
}

/**
 * Filters an array to only valid Convex IDs
 * 
 * @param ids - Array of IDs to filter
 * @param tableName - The table name for type safety
 * @param config - Validation configuration
 * @returns Array of valid Convex IDs
 */
export function filterValidIds<TableName extends string>(
  ids: (FlexibleId<TableName> | null | undefined)[],
  tableName: TableName,
  config: IdValidationConfig = DEFAULT_CONFIG
): Id<TableName>[] {
  return validateIds(ids, tableName, config)
    .filter(result => result.isValid && result.id)
    .map(result => result.id!);
}

/**
 * Type guard to check if an ID is valid for a specific table
 * 
 * @param id - The ID to check
 * @param tableName - The table name for type safety
 * @returns Type predicate indicating if ID is valid
 */
export function isValidIdForTable<TableName extends string>(
  id: any,
  tableName: TableName
): id is Id<TableName> {
  const result = validateId(id, tableName);
  return result.isValid;
}

/**
 * Utility for handling legacy string IDs during migration
 * Provides a warning when string IDs are encountered
 * 
 * @param id - The ID to handle
 * @param tableName - The table name for type safety
 * @param context - Context for logging (e.g., function name)
 * @returns Convex ID or throws error
 */
export function handleLegacyId<TableName extends string>(
  id: FlexibleId<TableName> | null | undefined,
  tableName: TableName,
  context?: string
): Id<TableName> {
  const result = validateId(id, tableName, { 
    allowStrings: true, 
    strictConvexOnly: false 
  });
  
  if (!result.isValid || !result.id) {
    throw new Error(`${context ? `[${context}] ` : ''}Invalid ID for table ${tableName}: ${result.error}`);
  }
  
  // Log warning for string IDs
  if (result.type === 'string') {
    console.warn(`${context ? `[${context}] ` : ''}Legacy string ID detected for table ${tableName}: ${id}. Consider migrating to Convex IDs.`);
  }
  
  return result.id;
}

/**
 * Creates a type-safe ID validator for a specific table
 * Useful for creating reusable validators for specific tables
 * 
 * @param tableName - The table name
 * @param config - Default validation configuration
 * @returns Validator function for the specific table
 */
export function createTableValidator<TableName extends string>(
  tableName: TableName,
  config: IdValidationConfig = DEFAULT_CONFIG
) {
  return {
    validate: (id: FlexibleId<TableName> | null | undefined) => 
      validateId(id, tableName, config),
    
    validateStrict: (id: FlexibleId<TableName> | null | undefined) => 
      validateConvexId(id, tableName, config),
    
    normalize: (id: FlexibleId<TableName> | null | undefined) => 
      normalizeId(id, tableName),
    
    isValid: (id: any): id is Id<TableName> => 
      isValidIdForTable(id, tableName),
    
    handleLegacy: (id: FlexibleId<TableName> | null | undefined, context?: string) => 
      handleLegacyId(id, tableName, context)
  };
}

// Pre-created validators for common tables
export const userIdValidator = createTableValidator("users");
export const noteIdValidator = createTableValidator("notes");
export const projectIdValidator = createTableValidator("projects");
export const crystalIdValidator = createTableValidator("crystals");
export const shardIdValidator = createTableValidator("crystal_shards");
export const formationRunIdValidator = createTableValidator("crystal_formation_runs");

/**
 * Common validation patterns for specific use cases
 */
export const ValidationPatterns = {
  /**
   * Strict Convex-only validation (recommended for new code)
   */
  STRICT_CONVEX: {
    allowStrings: false,
    strictConvexOnly: true
  } as IdValidationConfig,
  
  /**
   * Migration-friendly validation (allows both formats)
   */
  MIGRATION_FRIENDLY: {
    allowStrings: true,
    strictConvexOnly: false
  } as IdValidationConfig,
  
  /**
   * Legacy support with warnings
   */
  LEGACY_WITH_WARNINGS: {
    allowStrings: true,
    strictConvexOnly: false,
    customValidation: (id: string) => {
      if (!isValidConvexId(id)) {
        console.warn(`Legacy string ID detected: ${id}. Consider migrating to Convex IDs.`);
      }
      return true;
    }
  } as IdValidationConfig
};
