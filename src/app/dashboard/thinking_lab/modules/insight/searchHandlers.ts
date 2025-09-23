/**
 * Search Handlers
 *
 * Utility functions for handling search queries, debouncing, and search optimization.
 * Pure functions that process search input and manage search state.
 */

// =============================================================================
// SEARCH QUERY UTILITIES
// =============================================================================

/**
 * Validates and normalizes search query
 */
export function validateSearchQuery(query: string): {
    isValid: boolean
    normalizedQuery: string
    error?: string
    suggestions?: string[]
} {
    const trimmed = query.trim()
    
    if (!trimmed) {
        return { 
            isValid: false, 
            normalizedQuery: '', 
            error: 'Search query cannot be empty' 
        }
    }
    
    if (trimmed.length < 2) {
        return { 
            isValid: false, 
            normalizedQuery: trimmed, 
            error: 'Search query must be at least 2 characters' 
        }
    }
    
    if (trimmed.length > 200) {
        return { 
            isValid: false, 
            normalizedQuery: trimmed.substring(0, 200), 
            error: 'Search query too long (max 200 characters)' 
        }
    }
    
    return {
        isValid: true,
        normalizedQuery: trimmed.toLowerCase(),
        suggestions: generateSearchSuggestions(trimmed)
    }
}

/**
 * Generates search suggestions based on input
 */
export function generateSearchSuggestions(query: string): string[] {
    const normalized = query.toLowerCase().trim()
    
    // Common search patterns and suggestions
    const suggestions = []
    
    if (normalized.includes('how')) {
        suggestions.push('how to implement', 'how does it work', 'how can I')
    }
    
    if (normalized.includes('what')) {
        suggestions.push('what is', 'what are the benefits', 'what should I')
    }
    
    if (normalized.includes('why')) {
        suggestions.push('why does this happen', 'why is this important', 'why should I')
    }
    
    // Technical suggestions
    if (/code|function|api|debug/.test(normalized)) {
        suggestions.push('code examples', 'function documentation', 'API reference', 'debugging tips')
    }
    
    return suggestions.slice(0, 3) // Limit to 3 suggestions
}

// =============================================================================
// SEARCH DEBOUNCING UTILITIES
// =============================================================================

/**
 * Debounce configuration for different search contexts
 */
export const SEARCH_DEBOUNCE_CONFIG = {
    instant: 100,      // For autocomplete
    normal: 300,       // For regular search
    expensive: 800,    // For complex/API searches
    typing: 150        // While user is typing
}

/**
 * Creates a debounced search function
 */
export function createDebouncedSearch(
    searchFn: (query: string) => Promise<any>,
    delay: number = SEARCH_DEBOUNCE_CONFIG.normal
) {
    let timeoutId: NodeJS.Timeout | null = null
    let currentQuery = ''
    
    return {
        search: (query: string) => {
            currentQuery = query
            
            if (timeoutId) {
                clearTimeout(timeoutId)
            }
            
            return new Promise((resolve, reject) => {
                timeoutId = setTimeout(async () => {
                    try {
                        // Only execute if query hasn't changed
                        if (query === currentQuery) {
                            const result = await searchFn(query)
                            resolve(result)
                        }
                    } catch (error) {
                        reject(error)
                    }
                }, delay)
            })
        },
        cancel: () => {
            if (timeoutId) {
                clearTimeout(timeoutId)
                timeoutId = null
            }
        },
        getCurrentQuery: () => currentQuery
    }
}

// =============================================================================
// SEARCH OPTIMIZATION UTILITIES
// =============================================================================

/**
 * Optimizes search query for better results
 */
export function optimizeSearchQuery(query: string, searchType: 'projects' | 'notes' | 'conversations' | 'crystals'): string {
    let optimized = query.trim()
    
    // Remove common stop words for better matching
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
    const words = optimized.split(/\s+/)
    const filtered = words.filter(word => !stopWords.includes(word.toLowerCase()))
    
    // Keep original if filtering removes too much
    if (filtered.length < words.length * 0.5) {
        optimized = query.trim()
    } else {
        optimized = filtered.join(' ')
    }
    
    // Add search type specific optimizations
    switch (searchType) {
        case 'projects':
            // Emphasize project-related terms
            if (!optimized.includes('project')) {
                optimized = `project ${optimized}`
            }
            break
        case 'notes':
            // Emphasize note content matching
            optimized = optimized.replace(/note(s)?/gi, 'content')
            break
        case 'conversations':
            // Emphasize dialogue matching
            if (!optimized.includes('chat') && !optimized.includes('conversation')) {
                optimized = `conversation ${optimized}`
            }
            break
        case 'crystals':
            // Emphasize insight matching
            optimized = `insight ${optimized}`
            break
    }
    
    return optimized
}

/**
 * Determines search priority based on query characteristics
 */
export function getSearchPriority(query: string): {
    priority: 'high' | 'medium' | 'low'
    reasoning: string
    estimatedTime: number
} {
    const length = query.length
    const words = query.split(/\s+/).length
    const hasSpecialChars = /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/.test(query)
    
    // High priority: Short, specific queries
    if (length < 50 && words <= 5 && !hasSpecialChars) {
        return {
            priority: 'high',
            reasoning: 'Short, specific query',
            estimatedTime: 200
        }
    }
    
    // Low priority: Complex, long queries
    if (length > 150 || words > 15 || hasSpecialChars) {
        return {
            priority: 'low',
            reasoning: 'Complex or long query requiring extensive processing',
            estimatedTime: 1000
        }
    }
    
    // Medium priority: Everything else
    return {
        priority: 'medium',
        reasoning: 'Standard query complexity',
        estimatedTime: 500
    }
}

// =============================================================================
// SEARCH CACHING UTILITIES
// =============================================================================

/**
 * Simple in-memory search cache
 */
export class SearchCache {
    private cache = new Map<string, { result: any, timestamp: number }>()
    private maxSize = 50
    private ttl = 5 * 60 * 1000 // 5 minutes

    get(query: string): any | null {
        const cached = this.cache.get(query)
        if (!cached) return null
        
        // Check if expired
        if (Date.now() - cached.timestamp > this.ttl) {
            this.cache.delete(query)
            return null
        }
        
        return cached.result
    }

    set(query: string, result: any): void {
        // Clean old entries if cache is full
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value
            this.cache.delete(oldestKey)
        }
        
        this.cache.set(query, {
            result,
            timestamp: Date.now()
        })
    }

    clear(): void {
        this.cache.clear()
    }
    
    size(): number {
        return this.cache.size
    }
}

// =============================================================================
// SEARCH STATUS UTILITIES
// =============================================================================

/**
 * Formats search status messages
 */
export function formatSearchStatus(
    isSearching: boolean, 
    error?: string, 
    resultsCount?: number
): {
    status: 'idle' | 'searching' | 'success' | 'error'
    message: string
    showSpinner: boolean
} {
    if (error) {
        return {
            status: 'error',
            message: `Search failed: ${error}`,
            showSpinner: false
        }
    }
    
    if (isSearching) {
        return {
            status: 'searching',
            message: 'Searching...',
            showSpinner: true
        }
    }
    
    if (resultsCount !== undefined) {
        const message = resultsCount === 0 
            ? 'No results found' 
            : `Found ${resultsCount} result${resultsCount === 1 ? '' : 's'}`
        
        return {
            status: 'success',
            message,
            showSpinner: false
        }
    }
    
    return {
        status: 'idle',
        message: 'Enter a search term',
        showSpinner: false
    }
}