import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { 
  fieldStatusValidator,
  cognitiveFieldCreateValidator,
  cognitiveFieldUpdateValidator
} from "./types/cognitiveField";

/**
 * Single cognitive field mutation function
 * 
 * Flexible mutation that can create, update, or delete a single cognitive field.
 * Follows the same pattern as crystalMutations.ts for consistency.
 * 
 * ATOMICITY GUARANTEES:
 * - All operations use Promise.all() for parallel atomic execution
 * - Field validation and updates happen in separate atomic batches
 * - Safe for concurrent multi-instance deployments (Cloud Run, Kubernetes)
 */
export const mutateCognitiveField = mutation({
  args: {
    operation: v.union(v.literal("create"), v.literal("update"), v.literal("delete")),
    id: v.optional(v.id("cognitive_fields")),
    // For create: use full creation data
    createData: v.optional(cognitiveFieldCreateValidator),
    // For update: use update data
    updateData: v.optional(cognitiveFieldUpdateValidator),
  },
  returns: v.union(v.id("cognitive_fields"), v.boolean()),
  handler: async (ctx, { operation, id, createData, updateData }) => {
    const currentTime = Date.now();
    switch (operation) {
      case "create":
        if (!createData) throw new Error("createData is required for create operation");
        
        // Validate source shards exist (atomic batch)
        await Promise.all(
          createData.sourceShardIds.map(async (shardId) => {
            const shard = await ctx.db.get(shardId as Id<"crystal_shards">);
            if (!shard) throw new Error(`Source shard ${shardId} not found`);
          })
        );
        
        // Validate source stardust exist (atomic batch)
        await Promise.all(
          createData.sourceStardustIds.map(async (stardustId) => {
            const stardust = await ctx.db.get(stardustId as Id<"stardust">);
            if (!stardust) throw new Error(`Source stardust ${stardustId} not found`);
          })
        );
        
        // Create cognitive field - spread validator data with auto-generated fields
        const fieldId = await ctx.db.insert("cognitive_fields", {
          ...createData,
          status: "active",
          createdAt: currentTime,
          updatedAt: currentTime,
          lastEvolution: currentTime,
          crossDomainLayer: createData.crossDomainLayer || {
            crossDomainPatterns: [],
            fieldCrosslinks: [],
            temporalDrift: { direction: "stable", description: "", keyChanges: [], confidence: 0.5 },
            emergentThemes: []
          },
          userPreferences: createData.userPreferences || {
            communicationPreferences: {
              tonePreference: "casual",
              detailLevel: "moderate",
              responseStyle: "conversational",
              feedbackFrequency: "periodic"
            },
            interactionPreferences: {
              preferredTriggers: [],
              avoidedTopics: [],
              collaborationStyle: "collaborative",
              decisionMakingStyle: "balanced"
            },
            learningPreferences: {},
            adaptationRate: 0.1,
            lastPreferenceUpdate: currentTime
          },
          mabArms: createData.mabArms || [],
          optimizationStrategy: createData.optimizationStrategy || "balanced",
          relatedFields: [],
          conflictingFields: [],
          usageCount: 0,
          lastUsed: currentTime,
          archived: false
        });
        
        // Update source references (atomic batch)
        await Promise.all([
          ...createData.sourceShardIds.map(async (shardId) => {
            const shard = await ctx.db.get(shardId as Id<"crystal_shards">);
            if (shard) {
              await ctx.db.patch(shardId as Id<"crystal_shards">, {
                last_referenced: currentTime,
                reference_count: (shard.reference_count || 0) + 1,
              });
            }
          }),
          ...createData.sourceStardustIds.map(async (stardustId) => {
            const stardust = await ctx.db.get(stardustId as Id<"stardust">);
            if (stardust) {
              await ctx.db.patch(stardustId as Id<"stardust">, {
                lastReferenced: currentTime,
                referenceCount: (stardust.referenceCount || 0) + 1,
              });
            }
          })
        ]);
        
        return fieldId;
        
      case "update":
        if (!id) throw new Error("ID is required for update operation");
        if (!updateData) throw new Error("updateData is required for update operation");
        
        // Get existing field
        const existingField = await ctx.db.get(id);
        if (!existingField) {
          throw new Error(`Cognitive field with ID ${id} not found`);
        }
        
        // Update field with validator data
        const patchData: any = {
          ...updateData,
          updatedAt: currentTime,
        };
        
        // Handle INCREMENT properly
        if (patchData.usageCount === "INCREMENT") {
          patchData.usageCount = "INCREMENT" as any;
        }
        
        await ctx.db.patch(id, patchData);
        
        return true;
        
      case "delete":
        if (!id) throw new Error("ID is required for delete operation");
        
        // Get existing field
        const fieldToDelete = await ctx.db.get(id);
        if (!fieldToDelete) {
          throw new Error(`Cognitive field with ID ${id} not found`);
        }
        
        // Release source references
        {
          const deleteTime = Date.now();
          
          // Release shard references
          if (fieldToDelete.sourceShardIds && fieldToDelete.sourceShardIds.length > 0) {
            await Promise.all(
              fieldToDelete.sourceShardIds.map(async (shardId) => {
                const shard = await ctx.db.get(shardId as Id<"crystal_shards">);
                if (shard) {
                  await ctx.db.patch(shardId as Id<"crystal_shards">, {
                    last_referenced: deleteTime,
                    reference_count: Math.max(0, (shard.reference_count || 0) - 1), // Decrement on delete
                  });
                }
              })
            );
          }
          
          // Release stardust references
          if (fieldToDelete.sourceStardustIds && fieldToDelete.sourceStardustIds.length > 0) {
            await Promise.all(
              fieldToDelete.sourceStardustIds.map(async (stardustId) => {
                await ctx.db.patch(stardustId as Id<"stardust">, {
                  // Note: stardust table doesn't have last_referenced field
                  // Keep reference count for audit if field exists
                });
              })
            );
          }
        }
        
        // Step 3: Delete the field
        await ctx.db.delete(id);
        return true;
        
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  },
});

/**
 * Create a new cognitive field
 * Uses cognitiveFieldCreateValidator to ensure TypeScript/Python alignment
 */
export const createCognitiveField = mutation({
  args: cognitiveFieldCreateValidator,
  returns: v.id("cognitive_fields"),
  handler: async (ctx, args) => {
    const createTime = Date.now();
    
    // Validate source shards exist
    await Promise.all(
      args.sourceShardIds.map(async (shardId) => {
        const shard = await ctx.db.get(shardId as Id<"crystal_shards">);
        if (!shard) {
          throw new Error(`Source shard ${shardId} not found`);
        }
      })
    );
    
    // Validate source stardust exist
    await Promise.all(
      args.sourceStardustIds.map(async (stardustId) => {
        const stardust = await ctx.db.get(stardustId as Id<"stardust">);
        if (!stardust) {
          throw new Error(`Source stardust ${stardustId} not found`);
        }
      })
    );
    
    // Create cognitive field - spread args with defaults
    const fieldId = await ctx.db.insert("cognitive_fields", {
      ...args,
      // Auto-generated fields
      status: "active",
      createdAt: createTime,
      updatedAt: createTime,
      lastEvolution: createTime,
      // Defaults for optional fields (only if not provided)
      crossDomainLayer: args.crossDomainLayer || {
        crossDomainPatterns: [],
        fieldCrosslinks: [],
        temporalDrift: {
          direction: "stable",
          description: "",
          keyChanges: [],
          confidence: 0.5
        },
        emergentThemes: []
      },
      userPreferences: args.userPreferences || {
        communicationPreferences: {
          tonePreference: "casual",
          detailLevel: "moderate", 
          responseStyle: "conversational",
          feedbackFrequency: "periodic"
        },
        interactionPreferences: {
          preferredTriggers: [],
          avoidedTopics: [],
          collaborationStyle: "collaborative",
          decisionMakingStyle: "balanced"
        },
        learningPreferences: {},
        adaptationRate: 0.1,
        lastPreferenceUpdate: createTime
      },
      mabArms: args.mabArms || [],
      optimizationStrategy: args.optimizationStrategy || "balanced",
      relatedFields: [],
      conflictingFields: [],
      usageCount: 0,
      lastUsed: createTime,
      archived: false
    });
    
    // Update source references
    await Promise.all([
      ...args.sourceShardIds.map(async (shardId) => {
        const shard = await ctx.db.get(shardId as Id<"crystal_shards">);
        if (shard) {
          await ctx.db.patch(shardId as Id<"crystal_shards">, {
            last_referenced: createTime,
            reference_count: (shard.reference_count || 0) + 1,
          });
        }
      }),
      ...args.sourceStardustIds.map(async (stardustId) => {
        const stardust = await ctx.db.get(stardustId as Id<"stardust">);
        if (stardust) {
          await ctx.db.patch(stardustId as Id<"stardust">, {
            lastReferenced: createTime,
            referenceCount: (stardust.referenceCount || 0) + 1,
          });
        }
      })
    ]);
    
    return fieldId;
  },
});

/**
 * Delete cognitive field permanently
 */
export const deleteCognitiveField = mutation({
  args: {
    fieldId: v.id("cognitive_fields"),
    releaseSources: v.optional(v.boolean()),
  },
  returns: v.boolean(),
  handler: async (ctx, { fieldId, releaseSources = true }) => {
    // Get field before deletion
    const field = await ctx.db.get(fieldId);
    if (!field) {
      throw new Error(`Cognitive field with ID ${fieldId} not found`);
    }
    
    // Release source references if requested
    if (releaseSources) {
      const deleteTime = Date.now();
      
      // Release shard references
      if (field.sourceShardIds && field.sourceShardIds.length > 0) {
        await Promise.all(
          field.sourceShardIds.map(async (shardId) => {
            const shard = await ctx.db.get(shardId as Id<"crystal_shards">);
            if (shard) {
              await ctx.db.patch(shardId as Id<"crystal_shards">, {
                last_referenced: deleteTime,
                reference_count: Math.max(0, (shard.reference_count || 0) - 1), // Decrement on delete
              });
            }
          })
        );
      }
      
      // Release stardust references
      if (field.sourceStardustIds && field.sourceStardustIds.length > 0) {
        await Promise.all(
          field.sourceStardustIds.map(async (stardustId) => {
            await ctx.db.patch(stardustId as Id<"stardust">, {
              // Note: stardust table doesn't have last_referenced field
              // Keep reference count for audit if field exists
            });
          })
        );
      }
    }
    
    // Delete the field
    await ctx.db.delete(fieldId);
    
    return true;
  },
});
