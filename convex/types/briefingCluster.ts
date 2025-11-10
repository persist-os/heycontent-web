import { v } from "convex/values";

export const briefingClusterSchemaFields = {
  userId: v.string(),
  brieferIds: v.array(v.string()),
  centerPosition: v.object({
    x: v.number(),
    y: v.number(),
    z: v.number()
  }),
  reason: v.string(), // Why they clustered
  confidence: v.number(), // How confident clustering algorithm is
  formed: v.number(),
  dissolved: v.optional(v.number()),
  active: v.boolean(),
  
  createdAt: v.number(),
  updatedAt: v.number()
};

export const briefingClusterValidator = v.object(briefingClusterSchemaFields);

