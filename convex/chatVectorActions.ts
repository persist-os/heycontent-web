"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Search for context to use in chat (RAG) - requires Node.js for Google Cloud APIs
export const searchForChatContext = action({
  args: {
    userId: v.string(),
    query: v.string(),
    contextTypes: v.optional(v.array(v.string())), // @ mentions or # hashtags
    limit: v.optional(v.number()),
    similarityThreshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const threshold = args.similarityThreshold || 0.7;

    // Get Google Cloud credentials
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
    
    if (!projectId) {
      throw new Error("GOOGLE_CLOUD_PROJECT_ID environment variable is required");
    }

    try {
      // Generate embedding for the query using Google Cloud
      const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/multimodalembedding@001:predict`;

      // Get Google Cloud access token
      const { GoogleAuth } = require('google-auth-library');
      const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      });
      const client = await auth.getClient();
      const accessToken = (await client.getAccessToken()).token;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instances: [{
            text: args.query
          }]
        }),
      });

      if (!response.ok) {
        throw new Error(`Google Cloud API error: ${response.status}`);
      }

      const data = await response.json();
      const queryEmbedding = data.predictions[0].textEmbedding;

      // Determine content types based on context
      let contentTypes = null;
      if (args.contextTypes && args.contextTypes.length > 0) {
        // Handle @ mentions (focus on personas and conversations)
        if (args.contextTypes.some(t => t.startsWith('@'))) {
          contentTypes = ["persona", "conversation"];
        }
        // Handle # hashtags (focus on content)
        else if (args.contextTypes.some(t => t.startsWith('#'))) {
          contentTypes = ["instagram_post", "youtube_video", "note"];
        }
      }

      // Search for similar embeddings
      const results = await ctx.runAction(api.vectorSearch.searchSimilar, {
        userId: args.userId,
        queryEmbedding: queryEmbedding,
        contentTypes: contentTypes,
        limit: limit,
        similarityThreshold: threshold,
      });

      return {
        results: results,
        query: args.query,
        totalResults: results.length,
        searchMetadata: {
          contextTypes: contentTypes,
          threshold: threshold,
          embeddingDimensions: queryEmbedding.length,
        }
      };

    } catch (error) {
      console.error("Error in chat context search:", error);
      
      // Determine content types again for fallback
      let fallbackContentTypes = null;
      if (args.contextTypes && args.contextTypes.length > 0) {
        // Handle @ mentions (focus on personas and conversations)
        if (args.contextTypes.some(t => t.startsWith('@'))) {
          fallbackContentTypes = ["persona", "conversation"];
        }
        // Handle # hashtags (focus on content)
        else if (args.contextTypes.some(t => t.startsWith('#'))) {
          fallbackContentTypes = ["instagram_post", "youtube_video", "note"];
        }
      }
      
      // Fallback to text-based search if embedding fails
      const fallbackResults = await ctx.runQuery(api.chatVectorSearch.searchSimilarText, {
        userId: args.userId,
        query: args.query,
        contentTypes: fallbackContentTypes,
        limit: limit,
      });

      return {
        results: fallbackResults,
        query: args.query,
        totalResults: fallbackResults.length,
        searchMetadata: {
          contextTypes: fallbackContentTypes,
          fallback: true,
          reason: "Embedding generation failed"
        }
      };
    }
  },
}); 