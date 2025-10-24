import { v } from "convex/values";

export const sharedNotePermissionValidator = v.union(
  v.literal("read"),
  v.literal("edit")
);

export const sharedNoteSchemaFields = {
  noteId: v.id("notes"),
  ownerId: v.string(), // Original note owner
  sharedWithUserId: v.string(), // User who has access
  permission: sharedNotePermissionValidator,
  sharedAt: v.number(),
  sharedBy: v.string(), // Who shared it (could be owner or another editor)
  isActive: v.boolean(), // for soft deletion
};

export const sharedNoteValidator = v.object(sharedNoteSchemaFields);

