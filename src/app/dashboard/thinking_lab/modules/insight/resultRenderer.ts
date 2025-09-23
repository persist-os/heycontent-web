/**
 * Result Renderer
 *
 * Utility functions for rendering and formatting search results for display.
 * Pure functions that transform search result data into display-ready formats.
 */

// =============================================================================
// RESULT FORMATTING UTILITIES
// =============================================================================

/**
 * Formats a single search result for display
 */
export function formatSearchResult(result: any, options: {
    highlightQuery?: string
    showMetadata?: boolean
    truncateContent?: number
    dateFormat?: 'relative' | 'absolute'
} = {}) {
    const title = result.title || result.name || 'Untitled'
    const content = result.content || result.text || result.summary || ''
    const type = result.type || result.category || 'unknown'
    const timestamp = result.timestamp || result._creationTime || result.createdAt || Date.now()
    
    // Highlight query in title and content
    let displayTitle = title
    let displayContent = content
    
    if (options.highlightQuery) {
        displayTitle = highlightText(title, options.highlightQuery)
        displayContent = highlightText(content, options.highlightQuery)
    }
    
    // Truncate content if needed
    if (options.truncateContent && displayContent.length > options.truncateContent) {
        displayContent = displayContent.substring(0, options.truncateContent) + '...'
    }
    
    // Format timestamp
    const formattedDate = formatResultTimestamp(timestamp, options.dateFormat)
    
    return {
        id: result.id || result._id || `result_${Date.now()}`,
        title: displayTitle,
        content: displayContent,
        type,
        timestamp: formattedDate,
        relevanceScore: result.relevanceScore || result.score || 0,
        metadata: options.showMetadata ? extractResultMetadata(result) : undefined,
        originalResult: result
    }
}

/**
 * Highlights search query in text
 */
export function highlightText(text: string, query: string): string {
    if (!query || !text) return text
    
    const words = query.toLowerCase().split(/\s+/).filter(word => word.length > 1)
    let highlighted = text
    
    words.forEach(word => {
        const regex = new RegExp(`(${escapeRegExp(word)})`, 'gi')
        highlighted = highlighted.replace(regex, '<mark>$1</mark>')
    })
    
    return highlighted
}

/**
 * Escapes special regex characters
 */
function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Formats timestamp for result display
 */
export function formatResultTimestamp(
    timestamp: number | string, 
    format: 'relative' | 'absolute' = 'relative'
): string {
    const date = new Date(timestamp)
    const now = new Date()
    
    if (format === 'absolute') {
        return date.toLocaleDateString()
    }
    
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    
    return `${Math.floor(diffDays / 365)} years ago`
}

// =============================================================================
// RESULT GROUPING UTILITIES
// =============================================================================

/**
 * Groups search results by type
 */
export function groupResultsByType(results: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>()
    
    results.forEach(result => {
        const type = result.type || result.category || 'other'
        if (!groups.has(type)) {
            groups.set(type, [])
        }
        groups.get(type)!.push(result)
    })
    
    return groups
}

/**
 * Extracts useful metadata from search result
 */
export function extractResultMetadata(result: any): {
    wordCount?: number
    tags?: string[]
    importance?: 'high' | 'medium' | 'low'
    hasAttachments?: boolean
    lastModified?: string
    source?: string
} {
    const content = result.content || result.text || ''
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length
    
    return {
        wordCount,
        tags: result.tags || [],
        importance: determineImportance(result),
        hasAttachments: !!(result.attachments && result.attachments.length > 0),
        lastModified: result.lastModified || result.updatedAt,
        source: result.source || result.origin || 'unknown'
    }
}

/**
 * Determines importance level of result
 */
function determineImportance(result: any): 'high' | 'medium' | 'low' {
    if (result.important || result.isImportant || result.priority === 'high') {
        return 'high'
    }
    
    if (result.relevanceScore && result.relevanceScore > 0.8) {
        return 'high'
    }
    
    if (result.relevanceScore && result.relevanceScore > 0.5) {
        return 'medium'
    }
    
    return 'low'
}

/**
 * Generates action buttons for search result
 */
export function getResultActions(result: any, options: {
    allowQuote?: boolean
    allowOpen?: boolean
    allowPreview?: boolean
    allowCopy?: boolean
} = {}): Array<{
    id: string
    label: string
    icon: string
    action: string
    primary?: boolean
}> {
    const actions = []
    
    if (options.allowOpen !== false) {
        actions.push({
            id: 'open',
            label: 'Open',
            icon: '📖',
            action: 'open',
            primary: true
        })
    }
    
    if (options.allowQuote !== false) {
        actions.push({
            id: 'quote',
            label: 'Quote in Notes',
            icon: '📝',
            action: 'quote'
        })
    }
    
    if (options.allowPreview !== false) {
        actions.push({
            id: 'preview',
            label: 'Quick Preview',
            icon: '👁️',
            action: 'preview'
        })
    }
    
    if (options.allowCopy !== false) {
        actions.push({
            id: 'copy',
            label: 'Copy Content',
            icon: '📋',
            action: 'copy'
        })
    }
    
    return actions
}