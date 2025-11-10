import { v } from "convex/values";

export const sharedContentTypeValidator = v.union(
  v.literal("note"),
  v.literal("project"),
  v.literal("widget"),
  v.literal("conversation")
);

export const sharedContentPermissionValidator = v.union(
  v.literal("read"),
  v.literal("edit")
);

export const sharedContentSchemaFields = {
  contentType: sharedContentTypeValidator,
  contentId: v.string(),
  ownerId: v.string(),
  sharedWithUserId: v.string(),
  permission: sharedContentPermissionValidator,
  sharedBy: v.string(),
  sharedAt: v.number(),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const sharedContentValidator = v.object(sharedContentSchemaFields);

