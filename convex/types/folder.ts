import { v } from "convex/values";

export const folderSchemaFields = {
  userId: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  parentFolderId: v.optional(v.id("folders")), // For nested folders
  color: v.optional(v.string()), // Optional color for visual organization
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const folderValidator = v.object(folderSchemaFields);

