/**
 * Message Handlers
 *
 * Utility functions for processing, sending, and managing message interactions.
 * Pure functions that work with message data - UI components call these.
 */

// =============================================================================
// MESSAGE PROCESSING UTILITIES
// =============================================================================

/**
 * Validates message content before sending
 */
export function validateMessageContent(content: string): {
    isValid: boolean
    error?: string
    cleanContent?: string
} {
    const trimmed = content.trim()
    
    if (!trimmed) {
        return { isValid: false, error: 'Message cannot be empty' }
    }
    
    if (trimmed.length > 4000) {
        return { isValid: false, error: 'Message too long (max 4000 characters)' }
    }
    
    return { isValid: true, cleanContent: trimmed }
}

/**
 * Formats user message for sending
 */
export function formatUserMessage(content: string, sessionId: string) {
    return {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type: 'user',
        sender: 'user',
        content: content.trim(),
        timestamp: Date.now(),
        sessionId,
        metadata: {
            wordCount: content.trim().split(/\s+/).length,
            characterCount: content.length
        }
    }
}

/**
 * Formats assistant response for display
 */
export function formatAssistantMessage(responseData: any, sessionId: string) {
    return {
        id: `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type: 'assistant',
        sender: 'assistant',
        content: responseData.response_content || responseData.content || '',
        timestamp: Date.now(),
        sessionId,
        metadata: {
            suggestions: responseData.suggestions || [],
            rawResponse: responseData
        }
    }
}

// =============================================================================
// MESSAGE INTERACTION UTILITIES
// =============================================================================

/**
 * Prepares message content for quoting in reflection
 */
export function prepareMessageQuote(message: any, includeContext: boolean = true) {
    const content = message.content || message.text || ''
    const sender = message.sender || message.type || 'unknown'
    const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleString() : 'Unknown time'
    
    if (!includeContext) {
        return content
    }
    
    return {
        text: content,
        source: `${sender} - ${timestamp}`,
        formattedQuote: `> ${content}\n> — *${sender}, ${timestamp}*`,
        originalMessage: message
    }
}

/**
 * Extracts relevant context from message for search
 */
export function extractMessageContext(message: any) {
    const content = message.content || message.text || ''
    
    // Extract key phrases and terms
    const words = content.toLowerCase().split(/\s+/)
    const keyPhrases = words
        .filter(word => word.length > 3)
        .filter(word => !['this', 'that', 'with', 'from', 'they', 'were', 'been', 'have'].includes(word))
        .slice(0, 10) // Top 10 relevant words
    
    return {
        messageId: message.id,
        content,
        keyPhrases,
        wordCount: words.length,
        hasQuestions: content.includes('?'),
        hasCode: content.includes('```') || content.includes('`'),
        urgency: content.toLowerCase().includes('urgent') || content.includes('!!')
    }
}

// =============================================================================
// MESSAGE STATUS UTILITIES
// =============================================================================

/**
 * Determines message sending status
 */
export function getMessageStatus(isLoading: boolean, error?: string) {
    if (error) return { status: 'error', message: error }
    if (isLoading) return { status: 'sending', message: 'Sending message...' }
    return { status: 'ready', message: 'Ready to send' }
}

/**
 * Formats error messages for user display
 */
export function formatMessageError(error: string | Error): string {
    if (typeof error === 'string') return error
    
    // Convert technical errors to user-friendly messages
    const message = error.message || 'Unknown error occurred'
    
    if (message.includes('network')) {
        return 'Network connection issue. Please check your internet and try again.'
    }
    
    if (message.includes('timeout')) {
        return 'Request timed out. Please try again.'
    }
    
    if (message.includes('rate limit')) {
        return 'Too many requests. Please wait a moment and try again.'
    }
    
    return 'Something went wrong. Please try again.'
}

// =============================================================================
// MESSAGE HISTORY UTILITIES
// =============================================================================

/**
 * Filters messages for display based on criteria
 */
export function filterMessages(messages: any[], criteria: {
    type?: 'user' | 'assistant'
    timeRange?: { start: number, end: number }
    searchTerm?: string
}) {
    return messages.filter(message => {
        // Filter by type
        if (criteria.type && (message.type !== criteria.type && message.sender !== criteria.type)) {
            return false
        }
        
        // Filter by time range
        if (criteria.timeRange) {
            const timestamp = message.timestamp || 0
            if (timestamp < criteria.timeRange.start || timestamp > criteria.timeRange.end) {
                return false
            }
        }
        
        // Filter by search term
        if (criteria.searchTerm) {
            const content = (message.content || message.text || '').toLowerCase()
            if (!content.includes(criteria.searchTerm.toLowerCase())) {
                return false
            }
        }
        
        return true
    })
}

/**
 * Groups messages by conversation session
 */
export function groupMessagesBySession(messages: any[]) {
    const sessions = new Map()
    
    messages.forEach(message => {
        const sessionId = message.sessionId || 'default'
        if (!sessions.has(sessionId)) {
            sessions.set(sessionId, [])
        }
        sessions.get(sessionId).push(message)
    })
    
    return sessions
}