import { v } from "convex/values";
import { api } from "../_generated/api";

// Types for LLM integration (simplified format)
export interface CrystallizedInsightForLLM {
  category: string;
  description: string;
  confidence: number;
  sources: string[];
  createdAt: number;
}

export interface FormattedPersonaInsights {
  insights: CrystallizedInsightForLLM[];
  totalConfidence: number;
  lastUpdated: number;
  formattedText: string;
}

/**
 * Get crystallized persona insights for a user, formatted for chat context
 */
export async function getCrystallizedPersonaForChat(
  ctx: any,
  userId: string,
  conversationContext?: string
): Promise<FormattedPersonaInsights> {
  try {
    // Call Agent 2's function to get crystallized insights
    const crystallizedData = await ctx.runQuery(api.personaCrystallizationQueries.getCrystallizedInsights, {
      userId
    });

    if (!crystallizedData || !crystallizedData.insights || crystallizedData.insights.length === 0) {
      return {
        insights: [],
        totalConfidence: 0,
        lastUpdated: 0,
        formattedText: ""
      };
    }

    // Filter insights by relevance if we have conversation context
    let relevantInsights = crystallizedData.insights;
    if (conversationContext) {
      relevantInsights = filterInsightsByRelevance(crystallizedData.insights, conversationContext);
    }

    // Sort by confidence and take top insights
    const sortedInsights = relevantInsights
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8); // Limit to top 8 insights

    const formattedText = formatInsightsForLLMContext(sortedInsights);
    const totalConfidence = sortedInsights.reduce((sum, insight) => sum + insight.confidence, 0) / sortedInsights.length;

    return {
      insights: sortedInsights,
      totalConfidence,
      lastUpdated: crystallizedData.lastUpdated || Date.now(),
      formattedText
    };
  } catch (error) {
    console.error('Error getting crystallized persona for chat:', error);
    return {
      insights: [],
      totalConfidence: 0,
      lastUpdated: 0,
      formattedText: ""
    };
  }
}

/**
 * Format insights into natural language for LLM injection
 */
export function formatInsightsForLLMContext(
  insights: CrystallizedInsightForLLM[],
  maxTokens: number = 500
): string {
  if (!insights || insights.length === 0) {
    return "";
  }

  const sections: string[] = [];
  let currentTokens = 0;
  const avgTokensPerChar = 0.25; // Rough estimate

  // Group insights by category
  const categoryGroups: { [key: string]: CrystallizedInsightForLLM[] } = {};
  for (const insight of insights) {
    if (!categoryGroups[insight.category]) {
      categoryGroups[insight.category] = [];
    }
    categoryGroups[insight.category].push(insight);
  }

  // Format each category
  for (const [category, categoryInsights] of Object.entries(categoryGroups)) {
    const categoryText = formatCategoryInsights(category, categoryInsights);
    const estimatedTokens = categoryText.length * avgTokensPerChar;
    
    if (currentTokens + estimatedTokens <= maxTokens) {
      sections.push(categoryText);
      currentTokens += estimatedTokens;
    } else {
      break;
    }
  }

  if (sections.length === 0) {
    return "";
  }

  return `User Persona Insights:\n${sections.join('\n')}\n`;
}

/**
 * Format insights for a specific category
 */
function formatCategoryInsights(category: string, insights: CrystallizedInsightForLLM[]): string {
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
  const descriptions = insights
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3) // Top 3 per category
    .map(insight => insight.description);
  
  return `${categoryName}: ${descriptions.join('. ')}.`;
}

/**
 * Filter insights by relevance to conversation context
 */
function filterInsightsByRelevance(insights: CrystallizedInsightForLLM[], context: string): CrystallizedInsightForLLM[] {
  const contextLower = context.toLowerCase();
  const relevanceKeywords = extractKeywords(contextLower);
  
  return insights.filter(insight => {
    const insightText = (insight.description + ' ' + insight.category).toLowerCase();
    return relevanceKeywords.some(keyword => insightText.includes(keyword));
  });
}

/**
 * Extract keywords from context for relevance filtering
 */
function extractKeywords(text: string): string[] {
  // Simple keyword extraction - remove common words and get meaningful terms
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
  return text
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word))
    .slice(0, 10); // Top 10 keywords
}

/**
 * Check if user has enough new activity to warrant crystallization
 */
export async function shouldTriggerCrystallization(
  ctx: any,
  userId: string
): Promise<boolean> {
  try {
    // Check when last crystallization occurred
    const lastCrystallization = await ctx.runQuery(api.personaCrystallizationQueries.getLastCrystallizationTime, {
      user_id: userId
    });

    const now = Date.now();
    const twelveHoursAgo = now - (12 * 60 * 60 * 1000);
    
    // Don't crystallize more than once every 12 hours
    if (lastCrystallization && lastCrystallization > twelveHoursAgo) {
      return false;
    }

    // Check if user has meaningful conversation activity in last 24 hours
    const recentConversations = await ctx.runQuery(api.chatQueries.getRecentConversations, {
      userId,
      hours: 24
    });

    if (!recentConversations || recentConversations.length === 0) {
      return false;
    }

    // Count total messages in recent conversations
    const totalMessages = recentConversations.reduce((count, conv) => {
      return count + (conv.messages?.length || 0);
    }, 0);

    // Trigger if user has at least 10 messages in recent conversations
    return totalMessages >= 10;
  } catch (error) {
    console.error('Error checking crystallization trigger:', error);
    return false;
  }
}

/**
 * Get contextual persona slice relevant to current conversation
 */
export async function getContextualPersonaSlice(
  ctx: any,
  userId: string,
  conversationContext: string,
  maxInsights: number = 5
): Promise<string> {
  try {
    const personaData = await getCrystallizedPersonaForChat(ctx, userId, conversationContext);
    
    if (!personaData.insights || personaData.insights.length === 0) {
      return "";
    }

    // Take top insights relevant to context
    const contextualInsights = personaData.insights.slice(0, maxInsights);
    return formatInsightsForLLMContext(contextualInsights, 300);
  } catch (error) {
    console.error('Error getting contextual persona slice:', error);
    return "";
  }
}
