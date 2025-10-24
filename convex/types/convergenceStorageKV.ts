import { v } from "convex/values";

export const convergenceStorageKVSchemaFields = {
  key: v.string(),
  value: v.string(),
  timestamp: v.string(),
  serializer: v.string(),
  created_at: v.number(),
};

export const convergenceStorageKVValidator = v.object(convergenceStorageKVSchemaFields);

