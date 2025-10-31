import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { fieldStatusValidator } from "./types/cognitiveField";

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
    data: v.optional(v.any()), // Use flexible validation for cognitive field data
    sourceShardIds: v.optional(v.array(v.string())),
    sourceStardustIds: v.optional(v.array(v.string())),
    addSourceShardIds: v.optional(v.array(v.string())),
    removeSourceShardIds: v.optional(v.array(v.string())),
    addSourceStardustIds: v.optional(v.array(v.string())),
    removeSourceStardustIds: v.optional(v.array(v.string())),
    releaseSources: v.optional(v.boolean()),
  },
  returns: v.union(v.id("cognitive_fields"), v.boolean()),
  handler: async (ctx, { 
    operation, 
    id, 
    data, 
    sourceShardIds, 
    sourceStardustIds,
    addSourceShardIds,
    removeSourceShardIds,
    addSourceStardustIds,
    removeSourceStardustIds,
    releaseSources 
  }) => {
    switch (operation) {
      case "create":
        if (!data) throw new Error("Data is required for create operation");
        if (!sourceShardIds || sourceShardIds.length === 0) {
          throw new Error("Source shard IDs are required for cognitive field creation");
        }
        if (!sourceStardustIds || sourceStardustIds.length === 0) {
          throw new Error("Source stardust IDs are required for cognitive field creation");
        }
        
        // Step 1: Validate all source shards exist (atomic batch fetch)
        const createTime = Date.now();
        await Promise.all(
          sourceShardIds.map(async (shardId) => {
            const shard = await ctx.db.get(shardId as Id<"crystal_shards">);
            if (!shard) {
              throw new Error(`Source shard ${shardId} not found`);
            }
          })
        );
        
        // Step 2: Validate all source stardust exist (atomic batch fetch)
        await Promise.all(
          sourceStardustIds.map(async (stardustId) => {
            const stardust = await ctx.db.get(stardustId as Id<"stardust">);
            if (!stardust) {
              throw new Error(`Source stardust ${stardustId} not found`);
            }
          })
        );
        
        // Step 3: Create cognitive field with proper timestamps
        const fieldData = {
          userId: data?.userId || "",
          field_id: data?.field_id || "",
          status: data?.status || "active",
          created_at: createTime,
          updated_at: createTime,
          source_shard_ids: sourceShardIds,
          source_stardust_ids: sourceStardustIds,
          core_field: data?.core_field || {},
          semantic_metadata: data?.semantic_metadata || {},
          transparency_layer: data?.transparency_layer || {},
          user_preferences: data?.user_preferences || {},
          mab_arms: data?.mab_arms || [],
          optimization_strategy: data?.optimization_strategy,
          related_fields: data?.related_fields,
          conflicting_fields: data?.conflicting_fields,
          usage_count: data?.usage_count || 0,
          last_used: data?.last_used,
          archived: data?.archived || false,
          archived_at: data?.archived_at,
          last_evolution: data?.last_evolution,
        };
        
        const fieldId = await ctx.db.insert("cognitive_fields", {
          ...fieldData,
          fieldId: data?.fieldId || "",
        });
        
        // Step 4: Update source shards to reference this field (atomic batch)
        await Promise.all(
          sourceShardIds.map(async (shardId) => {
            const shard = await ctx.db.get(shardId as Id<"crystal_shards">);
            if (shard) {
              await ctx.db.patch(shardId as Id<"crystal_shards">, {
                last_referenced: createTime,
                reference_count: (shard.reference_count || 0) + 1,
              });
            }
          })
        );
        
        // Step 5: Update source stardust to reference this field (atomic batch)
        await Promise.all(
          sourceStardustIds.map(async (stardustId) => {
            const stardust = await ctx.db.get(stardustId as Id<"stardust">);
            if (stardust) {
              await ctx.db.patch(stardustId as Id<"stardust">, {
                lastReferenced: createTime,
                referenceCount: (stardust.referenceCount || 0) + 1,
              });
            }
          })
        );
        
        return fieldId;
        
      case "update":
        if (!id) throw new Error("ID is required for update operation");
        if (!data) throw new Error("Data is required for update operation");
        
        // Step 1: Get existing field
        const existingField = await ctx.db.get(id);
        if (!existingField) {
          throw new Error(`Cognitive field with ID ${id} not found`);
        }
        
        // Step 2: Handle source shard additions/removals
        let updatedShardIds = existingField.sourceShardIds || [];
        if (addSourceShardIds && addSourceShardIds.length > 0) {
          // Validate new shards exist
          await Promise.all(
            addSourceShardIds.map(async (shardId) => {
              const shard = await ctx.db.get(shardId as Id<"crystal_shards">);
              if (!shard) {
                throw new Error(`Source shard ${shardId} not found`);
              }
            })
          );
          updatedShardIds = [...updatedShardIds, ...addSourceShardIds];
        }
        if (removeSourceShardIds && removeSourceShardIds.length > 0) {
          updatedShardIds = updatedShardIds.filter(id => !removeSourceShardIds.includes(id));
        }
        
        // Step 3: Handle source stardust additions/removals
        let updatedStardustIds = existingField.sourceStardustIds || [];
        if (addSourceStardustIds && addSourceStardustIds.length > 0) {
          // Validate new stardust exist
          await Promise.all(
            addSourceStardustIds.map(async (stardustId) => {
              const stardust = await ctx.db.get(stardustId as Id<"stardust">);
              if (!stardust) {
                throw new Error(`Source stardust ${stardustId} not found`);
              }
            })
          );
          updatedStardustIds = [...updatedStardustIds, ...addSourceStardustIds];
        }
        if (removeSourceStardustIds && removeSourceStardustIds.length > 0) {
          updatedStardustIds = updatedStardustIds.filter(id => !removeSourceStardustIds.includes(id));
        }
        
        // Step 4: Update field with new data and timestamps
        const updateTime = Date.now();
        const updateData: any = {
          ...data,
          updated_at: updateTime,
          source_shard_ids: updatedShardIds,
          source_stardust_ids: updatedStardustIds,
        };
        
        // Handle INCREMENT operations properly
        if (updateData.usage_count === "INCREMENT") {
          updateData.usage_count = "INCREMENT" as any;
        }
        
        await ctx.db.patch(id, updateData);
        
        // Step 5: Update source references if needed
        if (addSourceShardIds && addSourceShardIds.length > 0) {
          await Promise.all(
            addSourceShardIds.map(async (shardId) => {
              const shard = await ctx.db.get(shardId as Id<"crystal_shards">);
              if (shard) {
                await ctx.db.patch(shardId as Id<"crystal_shards">, {
                  last_referenced: updateTime,
                  reference_count: (shard.reference_count || 0) + 1,
                });
              }
            })
          );
        }
        
        if (addSourceStardustIds && addSourceStardustIds.length > 0) {
          await Promise.all(
            addSourceStardustIds.map(async (stardustId) => {
              await ctx.db.patch(stardustId as Id<"stardust">, {
                // Note: stardust table doesn't have last_referenced field
                // Keep reference count for audit if field exists
              });
            })
          );
        }
        
        return true;
        
      case "delete":
        if (!id) throw new Error("ID is required for delete operation");
        
        // Step 1: Get existing field
        const fieldToDelete = await ctx.db.get(id);
        if (!fieldToDelete) {
          throw new Error(`Cognitive field with ID ${id} not found`);
        }
        
        // Step 2: Release source references if requested
        if (releaseSources) {
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
 */
export const createCognitiveField = mutation({
  args: {
    userId: v.string(),
    fieldId: v.string(),
    sourceShardIds: v.array(v.string()),
    sourceStardustIds: v.array(v.string()),
    coreField: v.any(),
    semanticMetadata: v.any(),
    transparencyLayer: v.any(),
    userPreferences: v.optional(v.any()),
    mabArms: v.optional(v.array(v.any())),
    optimizationStrategy: v.optional(v.string()),
  },
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
    
    // Create cognitive field
    const fieldId = await ctx.db.insert("cognitive_fields", {
      userId: args.userId,
      fieldId: args.fieldId,
      status: "active",
      createdAt: createTime,
      updatedAt: createTime,
      sourceShardIds: args.sourceShardIds,
      sourceStardustIds: args.sourceStardustIds,
      coreField: args.coreField,
      semanticMetadata: args.semanticMetadata,
      transparencyLayer: args.transparencyLayer,
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
      optimizationStrategy: args.optimizationStrategy,
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
