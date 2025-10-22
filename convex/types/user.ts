/**
 * User Type Definitions
 * 
 * Defines types for user preferences, profile data, and related structures.
 * These types match the Convex schema and should be kept in sync.
 */

/**
 * User preferences stored in user_preferences table
 * Matches schema.ts user_preferences table
 */
export interface UserPreferences {
  showPersonaToFriends: boolean;
  allowFriendRequests: boolean;
  friendRequestNotifications: boolean;
  language?: string; // ISO 639-1 language code (e.g., "ko", "ja", "es")
}

/**
 * Partial user preferences for updates
 */
export interface UserPreferencesUpdate {
  showPersonaToFriends?: boolean;
  allowFriendRequests?: boolean;
  friendRequestNotifications?: boolean;
  language?: string;
}

/**
 * User profile information
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  image?: string;
  userId: string;
  username?: string;
  referralCode?: string;
  referredBy?: string;
  createdAt: string;
}

/**
 * User role types
 */
export type UserRole = 
  | "user"
  | "developer"
  | "admin"
  | "super_admin"
  | "ambassador"
  | "affiliate"
  | "partner";

