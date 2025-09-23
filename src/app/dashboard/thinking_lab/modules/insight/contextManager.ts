/**
 * Context Manager
 *
 * Utility functions for managing search context, filtering, and context injection.
 * Pure functions that work with context data and search results.
 */

import type { WorkspaceContext } from '../../types'

// =============================================================================
// CONTEXT FILTERING UTILITIES
// =============================================================================

/**
 * Filters context based on search criteria
 */
export function filterContextByType(
    contexts: any[], 
    allowedTypes: ('projects' | 'notes' | 'conversations' | 'crystals')[]
): any[] {
    return contexts.filter(context => {
        const type = context.type || context.category || 'unknown'
        return allowedTypes.includes(type)
    })
}

/**
 * Filters context by relevance score
 */
export function filterContextByRelevance(
    contexts: any[], 
    minScore: number = 0.3
): any[] {
    return contexts.filter(context => {
        const score = context.relevanceScore || context.score || 0
        return score >= minScore
    })
}

/**
 * Filters context by recency
 */
export function filterContextByRecency(
    contexts: any[], 
    maxAgeMs: number = 30 * 24 * 60 * 60 * 1000 // 30 days
): any[] {
    const cutoffTime = Date.now() - maxAgeMs
    
    return contexts.filter(context => {
        const timestamp = context.timestamp || context._creationTime || context.createdAt || 0
        return timestamp >= cutoffTime
    })
}

// =============================================================================
// CONTEXT RANKING UTILITIES
// =============================================================================

/**
 * Calculates context relevance score
 */
export function calculateContextRelevance(
    context: any, 
    searchQuery: string, 
    userPreferences?: any
): number {
    let score = 0
    const queryWords = searchQuery.toLowerCase().split(/\s+/)
    const contextText = (
        context.title + ' ' + 
        context.content + ' ' + 
        (context.tags || []).join(' ')
    ).toLowerCase()
    
    // Text matching score (0-0.4)
    const matchingWords = queryWords.filter(word => contextText.includes(word))
    score += (matchingWords.length / queryWords.length) * 0.4
    
    // Recency score (0-0.2)
    const ageMs = Date.now() - (context.timestamp || context._creationTime || 0)
    const ageDays = ageMs / (24 * 60 * 60 * 1000)
    score += Math.max(0, (30 - ageDays) / 30) * 0.2
    
    // Type preference score (0-0.2)
    if (userPreferences?.preferredTypes) {
        const contextType = context.type || context.category
        if (userPreferences.preferredTypes.includes(contextType)) {
            score += 0.2
        }
    }
    
    // Importance score (0-0.2)
    if (context.important || context.isImportant || context.priority === 'high') {
        score += 0.2
    }
    
    return Math.min(score, 1.0)
}

/**
 * Sorts context by combined relevance and importance
 */
export function rankContextResults(
    contexts: any[], 
    searchQuery: string, 
    options: {
        userPreferences?: any
        maxResults?: number
        boostRecent?: boolean
    } = {}
): any[] {
    // Calculate scores for all contexts
    const scoredContexts = contexts.map(context => ({
        ...context,
        relevanceScore: calculateContextRelevance(context, searchQuery, options.userPreferences)
    }))
    
    // Sort by relevance score
    let ranked = scoredContexts.sort((a, b) => b.relevanceScore - a.relevanceScore)
    
    // Boost recent items if requested
    if (options.boostRecent) {
        ranked = ranked.sort((a, b) => {
            const scoreDiff = b.relevanceScore - a.relevanceScore
            if (Math.abs(scoreDiff) < 0.1) { // Similar scores
                return (b.timestamp || 0) - (a.timestamp || 0)
            }
            return scoreDiff
        })
    }
    
    // Limit results
    if (options.maxResults) {
        ranked = ranked.slice(0, options.maxResults)
    }
    
    return ranked
}

// =============================================================================
// CONTEXT INJECTION UTILITIES
// =============================================================================

/**
 * Prepares context for injection into conversation
 */
export function prepareContextForInjection(
    context: any, 
    injectionType: 'summary' | 'full' | 'reference' = 'summary'
): {
    title: string
    content: string
    source: string
    metadata: any
} {
    const title = context.title || context.name || 'Untitled'
    const source = context.type || context.category || 'Unknown'
    
    let content = ''
    
    switch (injectionType) {
        case 'summary':
            content = context.summary || 
                     (context.content || '').substring(0, 200) + '...' ||
                     'No summary available'
            break
        case 'full':
            content = context.content || context.text || 'No content available'
            break
        case 'reference':
            content = `Reference: ${title} (${source})`
            break
    }
    
    return {
        title,
        content,
        source,
        metadata: {
            id: context.id || context._id,
            type: context.type || context.category,
            relevanceScore: context.relevanceScore,
            timestamp: context.timestamp || context._creationTime,
            originalContext: context
        }
    }
}

/**
 * Formats multiple contexts for batch injection
 */
export function formatContextBatch(
    contexts: any[], 
    options: {
        format: 'list' | 'sections' | 'inline'
        maxLength?: number
        includeMetadata?: boolean
    } = { format: 'list' }
): string {
    if (contexts.length === 0) return ''
    
    const prepared = contexts.map(context => 
        prepareContextForInjection(context, 'summary')
    )
    
    let formatted = ''
    
    switch (options.format) {
        case 'list':
            formatted = prepared.map((ctx, i) => 
                `${i + 1}. **${ctx.title}** (${ctx.source})\n   ${ctx.content}`
            ).join('\n\n')
            break
            
        case 'sections':
            formatted = prepared.map(ctx => 
                `### ${ctx.title}\n**Source:** ${ctx.source}\n\n${ctx.content}`
            ).join('\n\n---\n\n')
            break
            
        case 'inline':
            formatted = prepared.map(ctx => 
                `${ctx.title}: ${ctx.content}`
            ).join(' | ')
            break
    }
    
    // Trim if too long
    if (options.maxLength && formatted.length > options.maxLength) {
        formatted = formatted.substring(0, options.maxLength - 3) + '...'
    }
    
    // Add metadata if requested
    if (options.includeMetadata) {
        const metadata = `\n\n*Context includes ${contexts.length} items from: ${
            [...new Set(prepared.map(ctx => ctx.source))].join(', ')
        }*`
        formatted += metadata
    }
    
    return formatted
}

// =============================================================================
// CONTEXT VALIDATION UTILITIES
// =============================================================================

/**
 * Validates context data structure
 */
export function validateContext(context: any): {
    isValid: boolean
    errors: string[]
    warnings: string[]
} {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Required fields
    if (!context.id && !context._id) {
        errors.push('Context missing required ID field')
    }
    
    if (!context.title && !context.name) {
        warnings.push('Context missing title/name field')
    }
    
    if (!context.content && !context.text) {
        warnings.push('Context missing content field')
    }
    
    // Type validation
    if (!context.type && !context.category) {
        warnings.push('Context missing type/category field')
    }
    
    // Timestamp validation
    if (!context.timestamp && !context._creationTime && !context.createdAt) {
        warnings.push('Context missing timestamp field')
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    }
}

/**
 * Normalizes context data to standard format
 */
export function normalizeContext(context: any): WorkspaceContext {
    return {
        resourceId: context.id || context._id || `generated_${Date.now()}`,
        contentId: context.contentId || context.id || context._id,
        title: context.title || context.name || 'Untitled',
        content: {
            text: context.content || context.text || '',
            summary: context.summary || '',
            tags: context.tags || [],
            type: context.type || context.category || 'unknown'
        },
        publishedAt: context.timestamp || context._creationTime || context.createdAt || Date.now().toString(),
        additionalContext: {
            originalContext: context,
            relevanceScore: context.relevanceScore || 0,
            important: context.important || context.isImportant || false,
            source: context.source || 'unknown'
        }
    }
}

// =============================================================================
// CONTEXT ANALYTICS UTILITIES
// =============================================================================

/**
 * Analyzes context distribution and quality
 */
export function analyzeContextDistribution(contexts: any[]) {
    const types = new Map<string, number>()
    const sources = new Map<string, number>()
    let totalRelevance = 0
    let recentCount = 0
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    
    contexts.forEach(context => {
        // Count types
        const type = context.type || context.category || 'unknown'
        types.set(type, (types.get(type) || 0) + 1)
        
        // Count sources
        const source = context.source || 'unknown'
        sources.set(source, (sources.get(source) || 0) + 1)
        
        // Sum relevance
        totalRelevance += context.relevanceScore || 0
        
        // Count recent items
        const timestamp = context.timestamp || context._creationTime || 0
        if (timestamp > oneWeekAgo) recentCount++
    })
    
    return {
        totalContexts: contexts.length,
        typeDistribution: Object.fromEntries(types),
        sourceDistribution: Object.fromEntries(sources),
        averageRelevance: contexts.length > 0 ? totalRelevance / contexts.length : 0,
        recentPercentage: contexts.length > 0 ? (recentCount / contexts.length) * 100 : 0,
        qualityScore: calculateContextQualityScore(contexts)
    }
}

/**
 * Calculates overall context quality score
 */
function calculateContextQualityScore(contexts: any[]): number {
    if (contexts.length === 0) return 0
    
    let score = 0
    
    contexts.forEach(context => {
        // Completeness score
        let completeness = 0
        if (context.title || context.name) completeness += 0.25
        if (context.content || context.text) completeness += 0.5
        if (context.type || context.category) completeness += 0.15
        if (context.timestamp || context._creationTime) completeness += 0.1
        
        score += completeness
    })
    
    return score / contexts.length
}