import { v } from "convex/values";

export const userPreferenceSchemaFields = {
  userId: v.string(),
  showPersonaToFriends: v.boolean(), // TODO: Rename to showCrystalsToFriends or remove entirely
  allowFriendRequests: v.boolean(),
  friendRequestNotifications: v.boolean(),
  language: v.optional(v.string()), // ISO 639-1 language code (e.g., "ko", "ja", "es")
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const userPreferenceValidator = v.object(userPreferenceSchemaFields);

