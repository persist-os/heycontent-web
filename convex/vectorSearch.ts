// @ts-nocheck
import { action, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { contentTypesArrayValidator } from "./types/embeddings";

/**
 * Vector Search System
 * 
 * ⚠️ IMPORTANT: Embedding generation is handled automatically in the BACKEND:
 * - Notes: backend-new/app/agents/smart_notes/note_processor.py
 * - Conversations: backend-new/app/agents/chat_engine/services/chat_api_service.py
 * - Crystals: backend-new/app/agents/persona_crystallization/crystal_dam/
 * 
 * This file ONLY handles:
 * - Reading existing embeddings
 * - Vector similarity search
 * - Hybrid search (vector + keyword)
 */

const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";

/**
 * Hybrid search that combines vector similarity with keyword matching and content type quotas
 */
export const hybridSearchContentWithQuotas = action({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
    contentTypes: contentTypesArrayValidator,
    minSimilarity: v.optional(v.number()),
  },
  returns: v.array(v.object({
    contentId: v.string(),
    contentType: v.string(),
    title: v.string(),
    content: v.string(),
    embedding: v.array(v.float64()),
    score: v.number(),
  })),
  handler: async (ctx, args) => {
    console.log('🔀 [HYBRID QUOTA SEARCH] Starting hybrid search with quotas');
    console.log('🔀 [HYBRID QUOTA SEARCH] Query:', args.query);
    
    try {
      // Validate query before processing
      if (!args.query || typeof args.query !== 'string' || args.query.trim().length === 0) {
        console.error('❌ [HYBRID QUOTA SEARCH] Query is empty or invalid');
        return [];
      }

      // Generate embedding for the query using internal function
      let queryEmbedding: number[];
      try {
        const trimmedQuery = args.query.trim();
        
        // Use the internal embedding generation logic directly
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
          throw new Error("GOOGLE_API_KEY environment variable is required");
        }

        const requestBody = {
          model: "models/text-embedding-004",
          content: {
            parts: [{ text: trimmedQuery }],
          },
          taskType: "RETRIEVAL_QUERY",
        };

        const response = await fetch(`${GOOGLE_API_URL}?key=${apiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Google API error: ${response.status} ${response.statusText}. ${errorText}`);
        }

        const data = await response.json();
        if (!data.embedding || !data.embedding.values) {
          throw new Error('Invalid embedding response structure');
        }

        queryEmbedding = data.embedding.values;
        console.log('✅ [HYBRID QUOTA SEARCH] Generated query embedding with dimension:', queryEmbedding.length);
      } catch (error) {
        console.error('❌ [HYBRID QUOTA SEARCH] Failed to generate embedding:', error);
        throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Get user embeddings using internal query (actions can't directly access ctx.db)
      console.log('🔄 [HYBRID QUOTA SEARCH] Fetching user embeddings for userId:', args.userId);
      console.log('🔄 [HYBRID QUOTA SEARCH] Requested content types:', args.contentTypes);
      console.log('🔄 [HYBRID QUOTA SEARCH] Query parameters:', {
        userId: args.userId,
        limit: args.limit,
        minSimilarity: args.minSimilarity,
        contentTypesLength: args.contentTypes?.length,
        query: args.query.substring(0, 100) + (args.query.length > 100 ? '...' : '')
      });
      
      let userEmbeddings;
      try {
        // Use internal query to get embeddings
        console.log('🔍 [HYBRID QUOTA SEARCH] About to call getUserEmbeddings with:', {
          userId: args.userId,
          contentTypes: args.contentTypes,
          hasContentTypes: !!args.contentTypes,
          contentTypesArray: args.contentTypes || []
        });
        
        userEmbeddings = await ctx.runQuery(internal.vectorSearch.getUserEmbeddings, {
          userId: args.userId,
          contentTypes: args.contentTypes
        });
        
        console.log('✅ [HYBRID QUOTA SEARCH] Retrieved', userEmbeddings.length, 'user embeddings');
        console.log('📊 [HYBRID QUOTA SEARCH] Raw embeddings response length:', userEmbeddings.length);
        
        // Log breakdown by content type
        const embeddingsByType = userEmbeddings.reduce((acc, embedding) => {
          acc[embedding.contentType] = (acc[embedding.contentType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        console.log('✅ [HYBRID QUOTA SEARCH] Embeddings by type:', embeddingsByType);
        
        // Detailed logging for crystal embeddings specifically
        const crystalEmbeddings = userEmbeddings.filter(e => e.contentType === 'crystal');
        console.log('💎 [HYBRID QUOTA SEARCH] Crystal embeddings details:', {
          count: crystalEmbeddings.length,
          crystalIds: crystalEmbeddings.map(c => c.contentId),
          crystalTitles: crystalEmbeddings.map(c => c.title),
          embeddingDimensions: crystalEmbeddings.map(c => c.embedding?.length || 0),
          sampleCrystal: crystalEmbeddings[0] ? {
            id: crystalEmbeddings[0].contentId,
            title: crystalEmbeddings[0].title,
            hasEmbedding: !!crystalEmbeddings[0].embedding,
            embeddingLength: crystalEmbeddings[0].embedding?.length || 0,
            contentLength: crystalEmbeddings[0].content?.length || 0
          } : 'No crystals found'
        });
        
        // Log all content types present
        const allContentTypes = [...new Set(userEmbeddings.map(e => e.contentType))];
        console.log('🏷️ [HYBRID QUOTA SEARCH] All content types in response:', allContentTypes);
        
        // Validate embedding structures
        const invalidEmbeddings = userEmbeddings.filter(e => !e.embedding || !Array.isArray(e.embedding) || e.embedding.length === 0);
        if (invalidEmbeddings.length > 0) {
          console.warn('⚠️ [HYBRID QUOTA SEARCH] Found invalid embeddings:', {
            count: invalidEmbeddings.length,
            invalidItems: invalidEmbeddings.map(e => ({
              contentId: e.contentId,
              contentType: e.contentType,
              hasEmbedding: !!e.embedding,
              embeddingType: typeof e.embedding,
              embeddingLength: e.embedding?.length || 0
            }))
          });
        }
        
      } catch (error) {
        console.error('❌ [HYBRID QUOTA SEARCH] Failed to fetch user embeddings:', error);
        console.error('❌ [HYBRID QUOTA SEARCH] Error details:', {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : 'No stack',
          userId: args.userId,
          contentTypes: args.contentTypes
        });
        throw new Error(`Failed to fetch user embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Calculate similarities using inline cosine similarity
      console.log('🔢 [HYBRID QUOTA SEARCH] Starting similarity calculation for', userEmbeddings.length, 'embeddings');
      console.log('🔢 [HYBRID QUOTA SEARCH] Query embedding dimension:', queryEmbedding.length);
      
      // Pre-similarity calculation logging for crystals
      const crystalsToProcess = userEmbeddings.filter(e => e.contentType === 'crystal');
      console.log('💎 [HYBRID QUOTA SEARCH] About to process', crystalsToProcess.length, 'crystals for similarity');
      if (crystalsToProcess.length > 0) {
        console.log('💎 [HYBRID QUOTA SEARCH] Crystal embedding dimensions:', crystalsToProcess.map(c => ({
          id: c.contentId,
          title: c.title,
          embeddingLength: c.embedding?.length || 0,
          queryEmbeddingLength: queryEmbedding.length,
          dimensionMatch: (c.embedding?.length || 0) === queryEmbedding.length
        })));
      }
      
      const similarities = userEmbeddings.map((doc, index) => {
        try {
          // Enhanced logging for crystal documents
          if (doc.contentType === 'crystal') {
            console.log(`💎 [HYBRID QUOTA SEARCH] Processing crystal ${index + 1}:`, {
              contentId: doc.contentId,
              title: doc.title,
              embeddingLength: doc.embedding?.length || 0,
              queryEmbeddingLength: queryEmbedding.length,
              hasValidEmbedding: !!doc.embedding && Array.isArray(doc.embedding) && doc.embedding.length > 0
            });
          }
          
          // Validate embedding dimensions
          if (!doc.embedding || !Array.isArray(doc.embedding) || doc.embedding.length !== queryEmbedding.length) {
            console.warn(`⚠️ [HYBRID QUOTA SEARCH] Dimension mismatch for ${doc.contentType} ${doc.contentId}:`, {
              docEmbeddingLength: doc.embedding?.length || 0,
              queryEmbeddingLength: queryEmbedding.length,
              embeddingExists: !!doc.embedding,
              embeddingIsArray: Array.isArray(doc.embedding)
            });
            return {
              contentId: doc.contentId,
              contentType: doc.contentType,
              title: doc.title,
              content: doc.content,
              embedding: doc.embedding,
              score: 0,
            };
          }
          
          // Inline cosine similarity calculation
          let dotProduct = 0;
          let normA = 0;
          let normB = 0;
          
          for (let i = 0; i < queryEmbedding.length; i++) {
            const queryVal = queryEmbedding[i];
            const docVal = doc.embedding[i];
            
            if (typeof queryVal !== 'number' || typeof docVal !== 'number' || isNaN(queryVal) || isNaN(docVal)) {
              console.warn(`⚠️ [HYBRID QUOTA SEARCH] Invalid values at index ${i} for ${doc.contentType} ${doc.contentId}:`, {
                queryVal,
                docVal,
                queryType: typeof queryVal,
                docType: typeof docVal
              });
              continue;
            }
            
            dotProduct += queryVal * docVal;
            normA += queryVal * queryVal;
            normB += docVal * docVal;
          }
          
          const score = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
          const finalScore = isNaN(score) || !isFinite(score) ? 0 : score;
          
          // Enhanced logging for crystal scores
          if (doc.contentType === 'crystal') {
            console.log(`💎 [HYBRID QUOTA SEARCH] Crystal similarity calculated:`, {
              contentId: doc.contentId,
              title: doc.title,
              dotProduct,
              normA,
              normB,
              rawScore: score,
              finalScore,
              isValidScore: !isNaN(score) && isFinite(score)
            });
          }
          
          return {
            contentId: doc.contentId,
            contentType: doc.contentType,
            title: doc.title,
            content: doc.content,
            embedding: doc.embedding,
            score: finalScore,
          };
        } catch (error) {
          console.warn(`⚠️ [HYBRID QUOTA SEARCH] Failed to calculate similarity for ${doc.contentType} doc:`, doc.contentId, error);
          console.warn(`⚠️ [HYBRID QUOTA SEARCH] Error details:`, {
            contentId: doc.contentId,
            contentType: doc.contentType,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            hasEmbedding: !!doc.embedding,
            embeddingLength: doc.embedding?.length || 0
          });
          return {
            contentId: doc.contentId,
            contentType: doc.contentType,
            title: doc.title,
            content: doc.content,
            embedding: doc.embedding,
            score: 0,
          };
        }
      });

      // Log similarity calculation results
      console.log('🔢 [HYBRID QUOTA SEARCH] Similarity calculation completed');
      
      const preFilterCounts = similarities.reduce((acc, item) => {
        acc[item.contentType] = (acc[item.contentType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Detailed crystal analysis before filtering
      const crystalSimilarities = similarities.filter(s => s.contentType === 'crystal');
      const crystalScoreDistribution = {
        zero: crystalSimilarities.filter(s => s.score === 0).length,
        low: crystalSimilarities.filter(s => s.score > 0 && s.score < 0.3).length,
        medium: crystalSimilarities.filter(s => s.score >= 0.3 && s.score < 0.6).length,
        high: crystalSimilarities.filter(s => s.score >= 0.6).length,
      };
      
      console.log('🔢 [HYBRID QUOTA SEARCH] Pre-filter similarity results:', {
        total: similarities.length,
        byType: preFilterCounts,
        crystalDetails: {
          total: crystalSimilarities.length,
          scoreDistribution: crystalScoreDistribution,
          allCrystalScores: crystalSimilarities.map(s => ({ 
            contentId: s.contentId, 
            title: s.title.substring(0, 50) + (s.title.length > 50 ? '...' : ''), 
            score: s.score,
            scoreRounded: Math.round(s.score * 1000) / 1000
          })).sort((a, b) => b.score - a.score),
          topCrystals: crystalSimilarities
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(s => ({ contentId: s.contentId, title: s.title, score: s.score }))
        }
      });

      // Apply similarity threshold and filtering
      const minThreshold = args.minSimilarity || 0.35;
      console.log('🎯 [HYBRID QUOTA SEARCH] Applying similarity threshold:', minThreshold);
      console.log('🎯 [HYBRID QUOTA SEARCH] Crystal scores before threshold filtering:', {
        totalCrystals: crystalSimilarities.length,
        aboveThreshold: crystalSimilarities.filter(s => s.score >= minThreshold).length,
        belowThreshold: crystalSimilarities.filter(s => s.score < minThreshold).length,
        thresholdValue: minThreshold
      });
      
      const filteredSimilarities = similarities.filter(item => {
        const passesThreshold = item.score >= minThreshold;
        if (item.contentType === 'crystal' && !passesThreshold) {
          console.log(`💎 [HYBRID QUOTA SEARCH] Crystal filtered out by threshold:`, {
            contentId: item.contentId,
            title: item.title,
            score: item.score,
            threshold: minThreshold,
            scoreDiff: item.score - minThreshold
          });
        }
        return passesThreshold;
      });
      
      const postFilterCounts = filteredSimilarities.reduce((acc, item) => {
        acc[item.contentType] = (acc[item.contentType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const postFilterCrystals = filteredSimilarities.filter(s => s.contentType === 'crystal');
      
      console.log('🎯 [HYBRID QUOTA SEARCH] Post-filter results:', {
        total: filteredSimilarities.length,
        byType: postFilterCounts,
        crystalDetails: {
          remaining: postFilterCrystals.length,
          filtered: crystalSimilarities.length - postFilterCrystals.length,
          survivingCrystals: postFilterCrystals.map(s => ({ 
            contentId: s.contentId, 
            title: s.title, 
            score: s.score 
          })).sort((a, b) => b.score - a.score)
        }
      });
      
      // Sort by similarity score (highest first)
      filteredSimilarities.sort((a, b) => b.score - a.score);
      
      // Group by content type for quota application
      const contentByType = {
        conversation: filteredSimilarities.filter(item => item.contentType === 'conversation'),
        note: filteredSimilarities.filter(item => item.contentType === 'note'),
        crystal: filteredSimilarities.filter(item => item.contentType === 'crystal'),
      };
      
      console.log('🔀 [HYBRID QUOTA SEARCH] Content distribution before quota application:', {
        conversations: contentByType.conversation.length,
        notes: contentByType.note.length,
        crystals: contentByType.crystal.length,
        crystalDetails: contentByType.crystal.map(c => ({
          contentId: c.contentId,
          title: c.title,
          score: c.score
        })).sort((a, b) => b.score - a.score)
      });
      
      // Apply content type quotas
      const selectedResults: Array<{
        contentId: string;
        contentType: string;
        title: string;
        content: string;
        embedding: number[];
        score: number;
      }> = [];
      
      // Add crystals (max 5)
      console.log('💎 [HYBRID QUOTA SEARCH] Selecting crystals for final results');
      const topCrystals = contentByType.crystal.slice(0, 5);
      console.log('💎 [HYBRID QUOTA SEARCH] Selected crystals:', {
        requested: 5,
        available: contentByType.crystal.length,
        selected: topCrystals.length,
        crystals: topCrystals.map(c => ({
          contentId: c.contentId,
          title: c.title,
          score: c.score
        }))
      });
      selectedResults.push(...topCrystals);
      
      // Add conversations (max 4)
      console.log('💬 [HYBRID QUOTA SEARCH] Selecting conversations for final results');
      const topConversations = contentByType.conversation.slice(0, 4);
      console.log('💬 [HYBRID QUOTA SEARCH] Selected conversations:', {
        requested: 4,
        available: contentByType.conversation.length,
        selected: topConversations.length
      });
      selectedResults.push(...topConversations);
      
      // Add notes (max 3)
      console.log('📝 [HYBRID QUOTA SEARCH] Selecting notes for final results');
      const topNotes = contentByType.note.slice(0, 3);
      console.log('📝 [HYBRID QUOTA SEARCH] Selected notes:', {
        requested: 3,
        available: contentByType.note.length,
        selected: topNotes.length
      });
      selectedResults.push(...topNotes);
      
      // Fill remaining slots while respecting quotas
      const targetTotal = args.limit || 10;
      const remainingSlots = targetTotal - selectedResults.length;
      
      console.log('🔄 [HYBRID QUOTA SEARCH] Filling remaining slots:', {
        targetTotal,
        currentSelected: selectedResults.length,
        remainingSlots,
        currentByType: {
          conversations: selectedResults.filter(item => item.contentType === 'conversation').length,
          crystals: selectedResults.filter(item => item.contentType === 'crystal').length,
          notes: selectedResults.filter(item => item.contentType === 'note').length,
        }
      });
      
      if (remainingSlots > 0) {
        const usedIds = new Set(selectedResults.map(item => item.contentId));
        const unusedContent = filteredSimilarities.filter(item => !usedIds.has(item.contentId));
        
        console.log('🔄 [HYBRID QUOTA SEARCH] Unused content available for fill:', {
          total: unusedContent.length,
          byType: {
            conversations: unusedContent.filter(item => item.contentType === 'conversation').length,
            crystals: unusedContent.filter(item => item.contentType === 'crystal').length,
            notes: unusedContent.filter(item => item.contentType === 'note').length,
          }
        });
        
        // Count current content by type
        const currentCounts = {
          conversation: selectedResults.filter(item => item.contentType === 'conversation').length,
          crystal: selectedResults.filter(item => item.contentType === 'crystal').length,
          note: selectedResults.filter(item => item.contentType === 'note').length,
        };
        
        const quotaLimits = { conversation: 4, crystal: 5, note: 3 };
        
        console.log('🔄 [HYBRID QUOTA SEARCH] Current counts vs quotas:', {
          currentCounts,
          quotaLimits,
          canAddMore: {
            conversations: currentCounts.conversation < quotaLimits.conversation,
            crystals: currentCounts.crystal < quotaLimits.crystal,
            notes: currentCounts.note < quotaLimits.note
          }
        });
        
        for (const item of unusedContent) {
          if (selectedResults.length >= targetTotal) break;
          
          const currentCount = currentCounts[item.contentType as keyof typeof currentCounts] || 0;
          const quota = quotaLimits[item.contentType as keyof typeof quotaLimits];
          
          if (quota && currentCount < quota) {
            console.log(`➕ [HYBRID QUOTA SEARCH] Adding ${item.contentType} to fill remaining slots:`, {
              contentId: item.contentId,
              title: item.title,
              score: item.score,
              currentCount,
              quota,
              remainingInQuota: quota - currentCount
            });
            selectedResults.push(item);
            currentCounts[item.contentType as keyof typeof currentCounts] = currentCount + 1;
          } else {
            console.log(`❌ [HYBRID QUOTA SEARCH] Cannot add ${item.contentType} - quota exceeded:`, {
              contentId: item.contentId,
              currentCount,
              quota,
              quotaExceeded: currentCount >= quota
            });
          }
        }
      }
      
      // Final sort and limit
      selectedResults.sort((a, b) => b.score - a.score);
      const finalResults = selectedResults.slice(0, targetTotal);
      
      const finalCrystals = finalResults.filter(item => item.contentType === 'crystal');
      
      console.log('✅ [HYBRID QUOTA SEARCH] Final results summary:', {
        total: finalResults.length,
        targetTotal,
        conversations: finalResults.filter(item => item.contentType === 'conversation').length,
        crystals: finalCrystals.length,
        notes: finalResults.filter(item => item.contentType === 'note').length,
        finalCrystalDetails: finalCrystals.map(c => ({
          contentId: c.contentId,
          title: c.title,
          score: c.score,
          position: finalResults.findIndex(r => r.contentId === c.contentId) + 1
        }))
      });
      
      return finalResults;
      
    } catch (error) {
      console.error("❌ [HYBRID QUOTA SEARCH] Error:", error);
      console.error("❌ [HYBRID QUOTA SEARCH] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      // Return empty results instead of throwing to prevent cascading failures
      return [];
    }
  },
});

/**
 * Internal query to get user embeddings (used by actions)
 */
export const getUserEmbeddings = internalQuery({
  args: {
    userId: v.string(),
    contentTypes: contentTypesArrayValidator,
  },
  handler: async (ctx, args) => {
    try {
      console.log('🔍 [GET USER EMBEDDINGS] Starting query for user:', args.userId);
      console.log('🔍 [GET USER EMBEDDINGS] Content types filter:', args.contentTypes);
      
      const query = ctx.db
        .query("contentEmbeddings")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId));
      
      let results;
      // Apply content type filter if specified
      if (args.contentTypes && args.contentTypes.length > 0) {
        console.log('🔍 [GET USER EMBEDDINGS] Applying content type filter for:', args.contentTypes);
        results = await query
          .filter((q) => {
            let filter = q.eq(q.field("contentType"), args.contentTypes![0]);
            for (let i = 1; i < args.contentTypes!.length; i++) {
              filter = q.or(filter, q.eq(q.field("contentType"), args.contentTypes![i]));
            }
            return filter;
          })
          .collect();
      } else {
        console.log('🔍 [GET USER EMBEDDINGS] No content type filter, getting all embeddings');
        results = await query.collect();
      }
      
      // Log detailed breakdown of what we found
      const contentTypeCounts = results.reduce((acc, embedding) => {
        acc[embedding.contentType] = (acc[embedding.contentType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('🔍 [GET USER EMBEDDINGS] Found embeddings:', {
        total: results.length,
        byType: contentTypeCounts
      });
      
      return results;
    } catch (error) {
      console.error('❌ [GET USER EMBEDDINGS] Error fetching embeddings:', error);
      console.error('❌ [GET USER EMBEDDINGS] Error details:', {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack',
        userId: args.userId,
        contentTypes: args.contentTypes
      });
      // Return empty array to prevent cascading failures
      return [];
    }
  },
});
