"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Batch generate embeddings for existing content (Node.js needed for Google Cloud)
export const batchGenerateEmbeddings = action({
  args: {
    userId: v.string(),
    contentTypes: v.optional(v.array(v.union(
      v.literal("instagram_post"),
      v.literal("youtube_video"), 
      v.literal("gmail_message"),
      v.literal("gmail_thread"),
      v.literal("persona"),
      v.literal("note"),
      v.literal("conversation"),
      v.literal("ambient_insight")
    ))),
    batchSize: v.optional(v.number()),
    delayMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 5; // Process 5 items at a time
    const delay = args.delayMs || 1000; // 1 second between batches
    const contentTypes = args.contentTypes || ["instagram_post", "persona", "note", "conversation"];

    console.log(`Starting batch embedding generation for user ${args.userId}`);
    console.log(`Content types: ${contentTypes.join(", ")}`);
    console.log(`Batch size: ${batchSize}, Delay: ${delay}ms`);

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[],
      startTime: Date.now(),
    };

    // Check Google Cloud credentials
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    if (!projectId) {
      throw new Error("GOOGLE_CLOUD_PROJECT_ID environment variable is required for batch processing");
    }

    for (const contentType of contentTypes) {
      try {
        const batchResult = await ctx.runAction(api.batchEmbedding.processContentType, {
          userId: args.userId,
          contentType: contentType,
          batchSize: batchSize,
          delayMs: delay,
        });

        results.processed += batchResult.processed;
        results.succeeded += batchResult.succeeded;
        results.failed += batchResult.failed;
        results.errors.push(...batchResult.errors);

        console.log(`Completed ${contentType}: ${batchResult.succeeded}/${batchResult.processed} succeeded`);

        // Delay between content types
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }

      } catch (error) {
        console.error(`Error processing ${contentType}:`, error);
        results.errors.push(`${contentType}: ${error.message}`);
      }
    }

    results.startTime = Date.now() - results.startTime; // Convert to duration

    console.log(`Batch processing completed in ${results.startTime}ms`);
    console.log(`Total: ${results.succeeded}/${results.processed} succeeded, ${results.failed} failed`);

    return results;
  },
});

// Process a specific content type (Node.js needed for Google Cloud)
export const processContentType = action({
  args: {
    userId: v.string(),
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
    batchSize: v.optional(v.number()),
    delayMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 5;
    const delay = args.delayMs || 500; // Shorter delay for individual items

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[],
    };

    try {
      // Get content IDs based on content type
      let contentIds: string[] = [];

      switch (args.contentType) {
        case "instagram_post":
          const instagramPosts = await ctx.runQuery(api.instagramQueries.getInstagramPosts, {
            userId: args.userId,
          });
          contentIds = instagramPosts.map(post => post._id);
          break;

        case "persona":
          const personas = await ctx.runQuery(api.personaQueries.getUserPersonas, {
            userId: args.userId,
          });
          contentIds = personas.map(persona => persona._id);
          break;

        case "note":
          const notes = await ctx.runQuery(api.noteQueries.getUserNotes, {
            userId: args.userId,
          });
          contentIds = notes.map(note => note._id);
          break;

        case "conversation":
          const conversations = await ctx.runQuery(api.conversationQueries.getUserConversations, {
            userId: args.userId,
          });
          contentIds = conversations.map(conv => conv._id);
          break;

        // Add other content types as needed
        default:
          console.log(`Content type ${args.contentType} not implemented yet`);
          return results;
      }

      console.log(`Found ${contentIds.length} ${args.contentType} items to process`);

      // Process in batches
      for (let i = 0; i < contentIds.length; i += batchSize) {
        const batch = contentIds.slice(i, i + batchSize);
        
        for (const contentId of batch) {
          try {
            // Generate embedding based on content type
            switch (args.contentType) {
              case "instagram_post":
                await ctx.runAction(api.embeddingActions.generateInstagramEmbedding, {
                  userId: args.userId,
                  postId: contentId,
                });
                break;

              case "persona":
                await ctx.runAction(api.embeddingActions.generatePersonaEmbedding, {
                  userId: args.userId,
                  personaId: contentId as any, // Type assertion needed here
                });
                break;

              case "note":
                await ctx.runAction(api.embeddingActions.generateNoteEmbedding, {
                  userId: args.userId,
                  noteId: contentId as any,
                });
                break;

              case "conversation":
                await ctx.runAction(api.embeddingActions.generateConversationEmbedding, {
                  userId: args.userId,
                  conversationId: contentId as any,
                });
                break;

              // Add other cases as needed
            }

            results.processed++;
            results.succeeded++;

            // Short delay between individual items
            if (delay > 0) {
              await new Promise(resolve => setTimeout(resolve, delay));
            }

          } catch (error) {
            results.processed++;
            results.failed++;
            results.errors.push(`${contentId}: ${error.message}`);
            console.error(`Failed to process ${args.contentType} ${contentId}:`, error);
          }
        }

        console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(contentIds.length / batchSize)} for ${args.contentType}`);
      }

    } catch (error) {
      console.error(`Error in processContentType for ${args.contentType}:`, error);
      results.errors.push(error.message);
    }

    return results;
  },
});

// Delete all embeddings for a user (cleanup)
export const deleteAllEmbeddings = action({
  args: { 
    userId: v.string(),
    confirm: v.optional(v.boolean()) // Safety check
  },
  handler: async (ctx, args) => {
    if (!args.confirm) {
      throw new Error("Must set confirm=true to delete all embeddings");
    }

    try {
      const embeddings = await ctx.runQuery(api.vectorSearch.getUserEmbeddings, {
        userId: args.userId,
      });

      let deleted = 0;
      for (const embedding of embeddings) {
        await ctx.runMutation(api.vectorSearch.deleteEmbedding, {
          userId: args.userId,
          contentId: embedding.contentId,
        });
        deleted++;
      }

      return { deleted: deleted, message: `Deleted ${deleted} embeddings for user ${args.userId}` };
    } catch (error) {
      console.error("Error deleting embeddings:", error);
      throw new Error(`Failed to delete embeddings: ${error.message}`);
    }
  },
}); 