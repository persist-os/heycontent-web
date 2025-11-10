import { v } from "convex/values";

export const friendshipStatusValidator = v.union(
  v.literal("pending"),
  v.literal("accepted"),
  v.literal("blocked")
);

export const friendshipSchemaFields = {
  userId1: v.string(),
  userId2: v.string(),
  status: friendshipStatusValidator,
  requestedBy: v.string(),
  requestMessage: v.optional(v.string()),
  requestedAt: v.number(),
  acceptedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const friendshipValidator = v.object(friendshipSchemaFields);

