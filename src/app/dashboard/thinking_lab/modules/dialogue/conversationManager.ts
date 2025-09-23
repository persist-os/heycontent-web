/**
 * Conversation Manager
 *
 * Utility functions for managing conversation state and loading.
 * Pure functions that work with store state - no direct store mutations.
 */

import type { LabResponseData } from '../../types'

// =============================================================================
// CONVERSATION LOADING UTILITIES
// =============================================================================

/**
 * Generates a new session ID for conversations
 */
export function generateSessionId(): string {
    return `lab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Formats conversation ID for storage/retrieval
 */
export function formatConversationId(chatId?: string): string {
    if (!chatId) return generateSessionId()
    return chatId.startsWith('lab_') ? chatId : `lab_${chatId}`
}

/**
 * Validates conversation data structure
 */
export function validateConversationData(data: any): data is LabResponseData {
    return (
        data &&
        typeof data.response_content === 'string' &&
        typeof data.session_identifier === 'string' &&
        typeof data.user_input === 'string'
    )
}

// =============================================================================
// CONVERSATION STATE UTILITIES
// =============================================================================

/**
 * Determines if conversation is ready for new messages
 */
export function isConversationReady(isLoading: boolean, error?: string): boolean {
    return !isLoading && !error
}

/**
 * Calculates conversation statistics
 */
export function getConversationStats(messages: any[]) {
    const userMessages = messages.filter(msg => msg.type === 'user' || msg.sender === 'user')
    const assistantMessages = messages.filter(msg => msg.type === 'assistant' || msg.sender === 'assistant')
    
    return {
        totalMessages: messages.length,
        userMessages: userMessages.length,
        assistantMessages: assistantMessages.length,
        lastActivity: messages.length > 0 ? messages[messages.length - 1].timestamp : null
    }
}

/**
 * Formats conversation metadata for display
 */
export function formatConversationMeta(sessionId: string, messages: any[]) {
    const stats = getConversationStats(messages)
    
    return {
        sessionId,
        messageCount: stats.totalMessages,
        lastActivity: stats.lastActivity,
        summary: `${stats.userMessages} questions, ${stats.assistantMessages} responses`
    }
}

// =============================================================================
// CONVERSATION SEARCH UTILITIES
// =============================================================================

/**
 * Searches messages for specific content
 */
export function searchMessages(messages: any[], query: string) {
    const normalizedQuery = query.toLowerCase().trim()
    if (!normalizedQuery) return []
    
    return messages.filter(message => {
        const content = (message.content || message.text || '').toLowerCase()
        return content.includes(normalizedQuery)
    })
}

/**
 * Extracts quotes from conversation for reflection
 */
export function extractQuotableContent(messages: any[], messageId?: string) {
    const targetMessages = messageId 
        ? messages.filter(msg => msg.id === messageId)
        : messages
    
    return targetMessages.map(message => ({
        id: message.id,
        content: message.content || message.text || '',
        timestamp: message.timestamp,
        sender: message.sender || message.type,
        excerpt: (message.content || message.text || '').substring(0, 150) + '...'
    }))
}

// =============================================================================
// CONVERSATION PERSISTENCE UTILITIES
// =============================================================================

/**
 * Prepares conversation data for storage
 */
export function prepareConversationForStorage(messages: any[], sessionId: string) {
    return {
        sessionId,
        messages: messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp || Date.now()
        })),
        lastUpdated: Date.now(),
        version: '1.0'
    }
}

/**
 * Validates loaded conversation data
 */
export function validateLoadedConversation(data: any): boolean {
    return (
        data &&
        data.sessionId &&
        Array.isArray(data.messages) &&
        typeof data.lastUpdated === 'number'
    )
}