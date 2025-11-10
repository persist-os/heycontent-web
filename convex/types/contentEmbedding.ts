import { v } from "convex/values";
import { contentTypeValidator } from "./embeddings";

export const contentEmbeddingSchemaFields = {
  userId: v.string(),
  contentId: v.string(),
  contentType: contentTypeValidator,
  title: v.string(),
  content: v.string(),
  embedding: v.array(v.float64()),
  metadata: v.optional(v.any()),
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const contentEmbeddingValidator = v.object(contentEmbeddingSchemaFields);

