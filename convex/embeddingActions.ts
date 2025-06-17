"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Generate embedding using Google Cloud Vertex AI multimodal embeddings
export const generateEmbedding = action({
  args: {
    userId: v.string(),
    contentId: v.string(),
    contentType: v.union(
      v.literal("instagram_post"),
      v.literal("youtube_video"), 
      v.literal("gmail_message"),
      v.literal("gmail_thread"),
      v.literal("persona"),
      v.literal("note"),
      v.literal("conversation"),
      v.literal("ambient_insight")
    ),
    text: v.string(),
    imageUrl: v.optional(v.string()), // For multimodal content
    metadata: v.object({
      title: v.string(),
      platform: v.optional(v.string()),
      createdAt: v.number(),
      tags: v.optional(v.array(v.string())),
      snippet: v.optional(v.string()),
      url: v.optional(v.string()),
      from: v.optional(v.string()),
      subject: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      thumbnailUrl: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    // Validate text is not empty
    if (!args.text.trim()) {
      throw new Error("Cannot generate embedding for empty text");
    }

    // Get Google Cloud credentials from environment
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
    
    if (!projectId) {
      throw new Error("GOOGLE_CLOUD_PROJECT_ID environment variable is required");
    }

    // Construct the request payload for Google Cloud Vertex AI
    const instances = [{
      text: args.text,
      ...(args.imageUrl && {
        image: {
          gcsUri: args.imageUrl // Or use bytesBase64Encoded for base64
        }
      })
    }];

    // Call Google Cloud Vertex AI multimodal embeddings API
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/multimodalembedding@001:predict`;

    try {
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
          instances: instances,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Cloud Vertex AI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Extract the text embedding from the response
      // Google's multimodal API returns textEmbedding and optionally imageEmbedding
      const prediction = data.predictions[0];
      const embedding = prediction.textEmbedding || prediction.imageEmbedding;

      if (!embedding || !Array.isArray(embedding)) {
        throw new Error("Invalid embedding response from Google Cloud API");
      }

      // Store the embedding using the mutation (actions can't access ctx.db directly)
      const embeddingId = await ctx.runMutation(api.vectorSearch.storeEmbedding, {
        userId: args.userId,
        contentId: args.contentId,
        contentType: args.contentType,
        embedding: embedding,
        text: args.text,
        metadata: args.metadata,
      });

      return { 
        success: true, 
        embeddingId: embeddingId,
        textLength: args.text.length,
        embeddingDimensions: embedding.length,
        hasImage: !!args.imageUrl,
      };
    } catch (error) {
      console.error("Error calling Google Cloud Vertex AI:", error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  },
});

// Generate embedding for Instagram post (can include images)
export const generateInstagramEmbedding = action({
  args: { userId: v.string(), postId: v.string() },
  handler: async (ctx, args) => {
    // Extract text from the Instagram post using query
    const textData = await ctx.runQuery(api.vectorContent.extractInstagramText, {
      userId: args.userId,
      postId: args.postId,
    });
    
    if (!textData) {
      throw new Error(`Instagram post not found: ${args.postId}`);
    }

    // Get the post data to extract image URL
    const post = await ctx.runQuery(api.instagramQueries.getInstagramPost, {
      userId: args.userId,
      postId: args.postId,
    });

    const imageUrl = post?.data?.media_url || post?.data?.thumbnail_url;

    // Generate and store embedding with multimodal support
    return await ctx.runAction(api.embeddingActions.generateEmbedding, {
      userId: args.userId,
      contentId: textData.contentId,
      contentType: textData.contentType,
      text: textData.text,
      imageUrl: imageUrl,
      metadata: {
        ...textData.metadata,
        imageUrl: imageUrl,
        thumbnailUrl: post?.data?.thumbnail_url,
      },
    });
  },
});

// Generate embedding for YouTube video (can include thumbnails)
export const generateYouTubeEmbedding = action({
  args: { userId: v.string(), videoId: v.string() },
  handler: async (ctx, args) => {
    // Extract text from the YouTube video using query
    const textData = await ctx.runQuery(api.vectorContent.extractYouTubeText, {
      userId: args.userId,
      videoId: args.videoId,
    });
    
    if (!textData) {
      throw new Error(`YouTube video not found: ${args.videoId}`);
    }

    // Get the video data to extract thumbnail URL (we need a getYouTubeVideo query)
    const videos = await ctx.runQuery(api.youtubeQueries.getYouTubeVideos, {
      userId: args.userId,
    });
    
    const video = videos.find(v => v.videoId === args.videoId);
    const thumbnailUrl = video?.snippet?.thumbnails?.high?.url || 
                        video?.snippet?.thumbnails?.medium?.url ||
                        video?.snippet?.thumbnails?.default?.url;

    return await ctx.runAction(api.embeddingActions.generateEmbedding, {
      userId: args.userId,
      contentId: textData.contentId,
      contentType: textData.contentType,
      text: textData.text,
      imageUrl: thumbnailUrl, // Use thumbnail as image for multimodal
      metadata: {
        ...textData.metadata,
        thumbnailUrl: thumbnailUrl,
      },
    });
  },
});

// Generate embedding for Gmail message (text only)
export const generateGmailEmbedding = action({
  args: { userId: v.string(), messageId: v.string() },
  handler: async (ctx, args) => {
    // Extract text from the Gmail message using query
    const textData = await ctx.runQuery(api.vectorContent.extractGmailText, {
      userId: args.userId,
      messageId: args.messageId,
    });
    
    if (!textData) {
      throw new Error(`Gmail message not found: ${args.messageId}`);
    }

    return await ctx.runAction(api.embeddingActions.generateEmbedding, {
      userId: args.userId,
      contentId: textData.contentId,
      contentType: textData.contentType,
      text: textData.text,
      metadata: textData.metadata,
    });
  },
});

// Generate embedding for persona (text only)
export const generatePersonaEmbedding = action({
  args: { userId: v.string(), personaId: v.id("personas") },
  handler: async (ctx, args) => {
    // Extract text from the persona using query
    const textData = await ctx.runQuery(api.vectorContent.extractPersonaText, {
      userId: args.userId,
      personaId: args.personaId,
    });
    
    if (!textData) {
      throw new Error(`Persona not found: ${args.personaId}`);
    }

    return await ctx.runAction(api.embeddingActions.generateEmbedding, {
      userId: args.userId,
      contentId: textData.contentId,
      contentType: textData.contentType,
      text: textData.text,
      metadata: textData.metadata,
    });
  },
});

// Generate embedding for note (text only)
export const generateNoteEmbedding = action({
  args: { userId: v.string(), noteId: v.id("notes") },
  handler: async (ctx, args) => {
    // Extract text from the note using query
    const textData = await ctx.runQuery(api.vectorContent.extractNoteText, {
      userId: args.userId,
      noteId: args.noteId,
    });
    
    if (!textData) {
      throw new Error(`Note not found: ${args.noteId}`);
    }

    return await ctx.runAction(api.embeddingActions.generateEmbedding, {
      userId: args.userId,
      contentId: textData.contentId,
      contentType: textData.contentType,
      text: textData.text,
      metadata: textData.metadata,
    });
  },
});

// Generate embedding for conversation (text only)
export const generateConversationEmbedding = action({
  args: { userId: v.string(), conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    // Extract text from the conversation using query
    const textData = await ctx.runQuery(api.vectorContent.extractConversationText, {
      userId: args.userId,
      conversationId: args.conversationId,
    });
    
    if (!textData) {
      throw new Error(`Conversation not found: ${args.conversationId}`);
    }

    return await ctx.runAction(api.embeddingActions.generateEmbedding, {
      userId: args.userId,
      contentId: textData.contentId,
      contentType: textData.contentType,
      text: textData.text,
      metadata: textData.metadata,
    });
  },
}); 