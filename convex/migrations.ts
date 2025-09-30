import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

/**
 * Migration script to clean up database tables and fields
 * 
 * This migration performs the following operations:
 * 1. Clear contentEmbeddings table
 * 2. Clear embeddingUpdates table
 * 3. Remove social media fields from projects table (gmailIds, instagramPostIds, youtubeVideoIds)
 * 4. Remove lastGmailFetch field from users table
 */

// Helper function to get all documents from a table in batches
export const getAllDocuments = internalQuery({
  args: { 
    tableName: v.string(),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  returns: v.object({
    documents: v.array(v.any()),
    isDone: v.boolean(),
    continueCursor: v.optional(v.string())
  }),
  handler: async (ctx, args) => {
    const tableName = args.tableName as any;
    const limit = args.limit ?? 100;
    
    const results = await ctx.db.query(tableName)
      .order("desc")
      .paginate({
        cursor: args.cursor || null,
        numItems: limit
      });
    
    return {
      documents: results.page,
      isDone: results.isDone,
      continueCursor: results.continueCursor
    };
  },
});

// Migration 1: Clear contentEmbeddings table
export const clearContentEmbeddings = internalMutation({
  args: { 
    batchSize: v.optional(v.number()),
    dryRun: v.optional(v.boolean())
  },
  returns: v.object({
    deletedCount: v.number(),
    totalProcessed: v.number(),
    completed: v.boolean()
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 100;
    const dryRun = args.dryRun ?? false;
    
    console.log(`Starting contentEmbeddings cleanup (dryRun: ${dryRun}, batchSize: ${batchSize})`);
    
    let totalProcessed = 0;
    let deletedCount = 0;
    let cursor: string | undefined = undefined;
    
    while (true) {
      const result = await ctx.runQuery(internal.migrations.getAllDocuments, {
        tableName: "contentEmbeddings",
        cursor,
        limit: batchSize
      });
      
      if (result.documents.length === 0) {
        break;
      }
      
      for (const doc of result.documents) {
        totalProcessed++;
        
        if (!dryRun) {
          await ctx.db.delete(doc._id);
          deletedCount++;
        }
      }
      
      console.log(`Processed ${totalProcessed} contentEmbeddings documents${dryRun ? ' (dry run)' : ''}`);
      
      if (result.isDone) {
        break;
      }
      
      cursor = result.continueCursor || undefined;
    }
    
    console.log(`Completed contentEmbeddings cleanup. Total processed: ${totalProcessed}, Deleted: ${deletedCount}`);
    
    return {
      deletedCount,
      totalProcessed,
      completed: true
    };
  },
});

// Migration 2: Clear embeddingUpdates table
export const clearEmbeddingUpdates = internalMutation({
  args: { 
    batchSize: v.optional(v.number()),
    dryRun: v.optional(v.boolean())
  },
  returns: v.object({
    deletedCount: v.number(),
    totalProcessed: v.number(),
    completed: v.boolean()
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 100;
    const dryRun = args.dryRun ?? false;
    
    console.log(`Starting embeddingUpdates cleanup (dryRun: ${dryRun}, batchSize: ${batchSize})`);
    
    let totalProcessed = 0;
    let deletedCount = 0;
    let cursor: string | undefined = undefined;
    
    while (true) {
      const result = await ctx.runQuery(internal.migrations.getAllDocuments, {
        tableName: "embeddingUpdates",
        cursor,
        limit: batchSize
      });
      
      if (result.documents.length === 0) {
        break;
      }
      
      for (const doc of result.documents) {
        totalProcessed++;
        
        if (!dryRun) {
          await ctx.db.delete(doc._id);
          deletedCount++;
        }
      }
      
      console.log(`Processed ${totalProcessed} embeddingUpdates documents${dryRun ? ' (dry run)' : ''}`);
      
      if (result.isDone) {
        break;
      }
      
      cursor = result.continueCursor || undefined;
    }
    
    console.log(`Completed embeddingUpdates cleanup. Total processed: ${totalProcessed}, Deleted: ${deletedCount}`);
    
    return {
      deletedCount,
      totalProcessed,
      completed: true
    };
  },
});

// Migration 3: Remove social media fields from projects table
export const cleanupProjectsSocialMediaFields = internalMutation({
  args: { 
    batchSize: v.optional(v.number()),
    dryRun: v.optional(v.boolean())
  },
  returns: v.object({
    updatedCount: v.number(),
    totalProcessed: v.number(),
    completed: v.boolean()
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 100;
    const dryRun = args.dryRun ?? false;
    
    console.log(`Starting projects social media fields cleanup (dryRun: ${dryRun}, batchSize: ${batchSize})`);
    
    let totalProcessed = 0;
    let updatedCount = 0;
    let cursor: string | undefined = undefined;
    
    while (true) {
      const result = await ctx.runQuery(internal.migrations.getAllDocuments, {
        tableName: "projects",
        cursor,
        limit: batchSize
      });
      
      if (result.documents.length === 0) {
        break;
      }
      
      for (const doc of result.documents) {
        totalProcessed++;
        
        // Check if document has any of the social media fields
        const hasSocialMediaFields = 
          'gmailIds' in doc || 
          'instagramPostIds' in doc || 
          'youtubeVideoIds' in doc;
        
        if (hasSocialMediaFields) {
          if (!dryRun) {
            // Create a new object without the social media fields
            const updatedFields: any = {};
            
            // Copy all existing fields except the social media ones
            for (const [key, value] of Object.entries(doc)) {
              if (key !== 'gmailIds' && key !== 'instagramPostIds' && key !== 'youtubeVideoIds') {
                updatedFields[key] = value;
              }
            }
            
            // Replace the entire document (this removes the unwanted fields)
            await ctx.db.replace(doc._id, updatedFields);
            updatedCount++;
          } else {
            updatedCount++; // Count what would be updated in dry run
          }
        }
      }
      
      console.log(`Processed ${totalProcessed} projects documents, updated ${updatedCount}${dryRun ? ' (dry run)' : ''}`);
      
      if (result.isDone) {
        break;
      }
      
      cursor = result.continueCursor || undefined;
    }
    
    console.log(`Completed projects cleanup. Total processed: ${totalProcessed}, Updated: ${updatedCount}`);
    
    return {
      updatedCount,
      totalProcessed,
      completed: true
    };
  },
});

// Migration 4: Remove lastGmailFetch field from users table
export const cleanupUsersLastGmailFetch = internalMutation({
  args: { 
    batchSize: v.optional(v.number()),
    dryRun: v.optional(v.boolean())
  },
  returns: v.object({
    updatedCount: v.number(),
    totalProcessed: v.number(),
    completed: v.boolean()
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 100;
    const dryRun = args.dryRun ?? false;
    
    console.log(`Starting users lastGmailFetch field cleanup (dryRun: ${dryRun}, batchSize: ${batchSize})`);
    
    let totalProcessed = 0;
    let updatedCount = 0;
    let cursor: string | undefined = undefined;
    
    while (true) {
      const result = await ctx.runQuery(internal.migrations.getAllDocuments, {
        tableName: "users",
        cursor,
        limit: batchSize
      });
      
      if (result.documents.length === 0) {
        break;
      }
      
      for (const doc of result.documents) {
        totalProcessed++;
        
        // Check if document has the lastGmailFetch field
        if ('lastGmailFetch' in doc) {
          if (!dryRun) {
            // Create a new object without the lastGmailFetch field
            const updatedFields: any = {};
            
            // Copy all existing fields except lastGmailFetch
            for (const [key, value] of Object.entries(doc)) {
              if (key !== 'lastGmailFetch') {
                updatedFields[key] = value;
              }
            }
            
            // Replace the entire document (this removes the unwanted field)
            await ctx.db.replace(doc._id, updatedFields);
            updatedCount++;
          } else {
            updatedCount++; // Count what would be updated in dry run
          }
        }
      }
      
      console.log(`Processed ${totalProcessed} users documents, updated ${updatedCount}${dryRun ? ' (dry run)' : ''}`);
      
      if (result.isDone) {
        break;
      }
      
      cursor = result.continueCursor || undefined;
    }
    
    console.log(`Completed users cleanup. Total processed: ${totalProcessed}, Updated: ${updatedCount}`);
    
    return {
      updatedCount,
      totalProcessed,
      completed: true
    };
  },
});

// Master migration function that runs all migrations in sequence
export const runFullMigration = internalMutation({
  args: { 
    batchSize: v.optional(v.number()),
    dryRun: v.optional(v.boolean())
  },
  returns: v.object({
    contentEmbeddingsResult: v.object({
      deletedCount: v.number(),
      totalProcessed: v.number(),
      completed: v.boolean()
    }),
    embeddingUpdatesResult: v.object({
      deletedCount: v.number(),
      totalProcessed: v.number(),
      completed: v.boolean()
    }),
    projectsResult: v.object({
      updatedCount: v.number(),
      totalProcessed: v.number(),
      completed: v.boolean()
    }),
    usersResult: v.object({
      updatedCount: v.number(),
      totalProcessed: v.number(),
      completed: v.boolean()
    }),
    migrationCompleted: v.boolean()
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 100;
    const dryRun = args.dryRun ?? false;
    
    console.log(`Starting full migration (dryRun: ${dryRun}, batchSize: ${batchSize})`);
    
    // Run all migrations in sequence
    const contentEmbeddingsResult = await ctx.runMutation(internal.migrations.clearContentEmbeddings, {
      batchSize,
      dryRun
    });
    
    const embeddingUpdatesResult = await ctx.runMutation(internal.migrations.clearEmbeddingUpdates, {
      batchSize,
      dryRun
    });
    
    const projectsResult = await ctx.runMutation(internal.migrations.cleanupProjectsSocialMediaFields, {
      batchSize,
      dryRun
    });
    
    const usersResult = await ctx.runMutation(internal.migrations.cleanupUsersLastGmailFetch, {
      batchSize,
      dryRun
    });
    
    console.log(`Full migration completed${dryRun ? ' (dry run)' : ''}`);
    console.log(`Summary:
      - ContentEmbeddings: ${contentEmbeddingsResult.deletedCount} deleted
      - EmbeddingUpdates: ${embeddingUpdatesResult.deletedCount} deleted  
      - Projects: ${projectsResult.updatedCount} updated
      - Users: ${usersResult.updatedCount} updated
    `);
    
    return {
      contentEmbeddingsResult,
      embeddingUpdatesResult,
      projectsResult,
      usersResult,
      migrationCompleted: true
    };
  },
});

// Migration 5: Delete projects with deprecated social media fields
export const deleteProjectsWithSocialMediaFields = internalMutation({
  args: { 
    batchSize: v.optional(v.number()),
    dryRun: v.optional(v.boolean())
  },
  returns: v.object({
    deletedCount: v.number(),
    totalProcessed: v.number(),
    completed: v.boolean(),
    deletedProjects: v.array(v.object({
      _id: v.string(),
      name: v.string(),
      userId: v.string(),
      fields: v.array(v.string())
    }))
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 100;
    const dryRun = args.dryRun ?? false;
    
    console.log(`Starting deletion of projects with social media fields (dryRun: ${dryRun}, batchSize: ${batchSize})`);
    
    let totalProcessed = 0;
    let deletedCount = 0;
    let deletedProjects: Array<{_id: string, name: string, userId: string, fields: string[]}> = [];
    let cursor: string | undefined = undefined;
    
    while (true) {
      const result = await ctx.runQuery(internal.migrations.getAllDocuments, {
        tableName: "projects",
        cursor,
        limit: batchSize
      });
      
      if (result.documents.length === 0) {
        break;
      }
      
      for (const doc of result.documents) {
        totalProcessed++;
        
        // Check if document has any of the deprecated social media fields
        const deprecatedFields: string[] = [];
        if ('gmailIds' in doc) deprecatedFields.push('gmailIds');
        if ('instagramPostIds' in doc) deprecatedFields.push('instagramPostIds');
        if ('youtubeVideoIds' in doc) deprecatedFields.push('youtubeVideoIds');
        
        if (deprecatedFields.length > 0) {
          const projectInfo = {
            _id: doc._id,
            name: doc.name || 'Unnamed Project',
            userId: doc.userId || 'Unknown User',
            fields: deprecatedFields
          };
          
          deletedProjects.push(projectInfo);
          
          if (!dryRun) {
            await ctx.db.delete(doc._id);
            console.log(`Deleted project: ${projectInfo.name} (${projectInfo._id}) - had fields: ${deprecatedFields.join(', ')}`);
          } else {
            console.log(`Would delete project: ${projectInfo.name} (${projectInfo._id}) - has fields: ${deprecatedFields.join(', ')}`);
          }
          
          deletedCount++;
        }
      }
      
      console.log(`Processed ${totalProcessed} projects documents, ${dryRun ? 'would delete' : 'deleted'} ${deletedCount}`);
      
      if (result.isDone) {
        break;
      }
      
      cursor = result.continueCursor || undefined;
    }
    
    console.log(`Completed project deletion. Total processed: ${totalProcessed}, ${dryRun ? 'Would delete' : 'Deleted'}: ${deletedCount}`);
    
    if (deletedProjects.length > 0) {
      console.log('Projects affected:');
      deletedProjects.forEach(project => {
        console.log(`  - ${project.name} (${project._id}) - User: ${project.userId} - Fields: ${project.fields.join(', ')}`);
      });
    }
    
    return {
      deletedCount,
      totalProcessed,
      completed: true,
      deletedProjects
    };
  },
});

// Utility function to check migration status
export const getMigrationStatus = internalQuery({
  args: {},
  returns: v.object({
    contentEmbeddingsCount: v.number(),
    embeddingUpdatesCount: v.number(),
    projectsWithSocialMediaFields: v.number(),
    usersWithLastGmailFetch: v.number()
  }),
  handler: async (ctx, args) => {
    // Count remaining documents in each affected table/field
    
    // Count contentEmbeddings
    const contentEmbeddingsCount = (await ctx.db.query("contentEmbeddings").collect()).length;
    
    // Count embeddingUpdates  
    const embeddingUpdatesCount = (await ctx.db.query("embeddingUpdates").collect()).length;
    
    // Count projects with social media fields
    const allProjects = await ctx.db.query("projects").collect();
    const projectsWithSocialMediaFields = allProjects.filter(project => 
      'gmailIds' in project || 'instagramPostIds' in project || 'youtubeVideoIds' in project
    ).length;
    
    // Count users with lastGmailFetch field
    const allUsers = await ctx.db.query("users").collect();
    const usersWithLastGmailFetch = allUsers.filter(user => 
      'lastGmailFetch' in user
    ).length;
    
    return {
      contentEmbeddingsCount,
      embeddingUpdatesCount,
      projectsWithSocialMediaFields,
      usersWithLastGmailFetch
    };
  },
});
