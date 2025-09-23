/**
 * Message Renderer
 *
 * Utility functions for rendering and formatting messages for display.
 * Pure functions that transform message data into display-ready formats.
 */

// =============================================================================
// MESSAGE DISPLAY UTILITIES
// =============================================================================

/**
 * Formats message content for display (handles markdown, code, etc.)
 */
export function formatMessageContent(content: string): {
    text: string
    hasMarkdown: boolean
    hasCode: boolean
    hasLinks: boolean
} {
    const hasMarkdown = /[*_`#>]/.test(content)
    const hasCode = /```[\s\S]*?```|`[^`]+`/.test(content)
    const hasLinks = /https?:\/\/[^\s]+/.test(content)
    
    return {
        text: content,
        hasMarkdown,
        hasCode,
        hasLinks
    }
}

/**
 * Extracts code blocks from message content
 */
export function extractCodeBlocks(content: string) {
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g
    const inlineCodeRegex = /`([^`]+)`/g
    
    const blocks: Array<{
        type: 'block' | 'inline'
        language?: string
        code: string
        startIndex: number
        endIndex: number
    }> = []
    
    // Extract code blocks
    let match
    while ((match = codeBlockRegex.exec(content)) !== null) {
        blocks.push({
            type: 'block',
            language: match[1] || 'text',
            code: match[2].trim(),
            startIndex: match.index,
            endIndex: match.index + match[0].length
        })
    }
    
    // Extract inline code
    while ((match = inlineCodeRegex.exec(content)) !== null) {
        // Skip if already part of a code block
        const isInBlock = blocks.some(block => 
            match.index >= block.startIndex && match.index <= block.endIndex
        )
        
        if (!isInBlock) {
            blocks.push({
                type: 'inline',
                code: match[1],
                startIndex: match.index,
                endIndex: match.index + match[0].length
            })
        }
    }
    
    return blocks.sort((a, b) => a.startIndex - b.startIndex)
}

/**
 * Formats timestamp for message display
 */
export function formatMessageTimestamp(timestamp: number, format: 'relative' | 'absolute' = 'relative'): string {
    const date = new Date(timestamp)
    const now = new Date()
    
    if (format === 'absolute') {
        return date.toLocaleString()
    }
    
    const diffMs = now.getTime() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffSeconds < 60) return 'just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
}

// =============================================================================
// MESSAGE STYLING UTILITIES
// =============================================================================

/**
 * Determines CSS classes for message container based on type and state
 */
export function getMessageClasses(message: any, options: {
    isOwn?: boolean
    isHighlighted?: boolean
    isSelected?: boolean
    theme?: 'light' | 'dark'
} = {}) {
    const baseClasses = ['message-container']
    
    // Message type classes
    const messageType = message.type || message.sender || 'unknown'
    baseClasses.push(`message-${messageType}`)
    
    // State classes
    if (options.isOwn) baseClasses.push('message-own')
    if (options.isHighlighted) baseClasses.push('message-highlighted')
    if (options.isSelected) baseClasses.push('message-selected')
    
    // Theme classes
    if (options.theme) baseClasses.push(`message-theme-${options.theme}`)
    
    // Content type classes
    const content = message.content || message.text || ''
    if (content.includes('```')) baseClasses.push('message-has-code')
    if (content.includes('http')) baseClasses.push('message-has-links')
    if (content.length > 500) baseClasses.push('message-long')
    
    return baseClasses.join(' ')
}

/**
 * Generates avatar/icon for message sender
 */
export function getMessageAvatar(message: any): {
    type: 'icon' | 'image' | 'text'
    content: string
    color?: string
} {
    const sender = message.sender || message.type || 'unknown'
    
    switch (sender) {
        case 'user':
            return { type: 'icon', content: '👤', color: '#3b82f6' }
        case 'assistant':
            return { type: 'icon', content: '🤖', color: '#10b981' }
        case 'system':
            return { type: 'icon', content: '⚙️', color: '#6b7280' }
        default:
            return { type: 'text', content: sender.substring(0, 2).toUpperCase(), color: '#8b5cf6' }
    }
}

// =============================================================================
// MESSAGE INTERACTION UTILITIES
// =============================================================================

/**
 * Generates action buttons for message interactions
 */
export function getMessageActions(message: any, options: {
    allowQuote?: boolean
    allowCopy?: boolean
    allowDelete?: boolean
    allowEdit?: boolean
} = {}) {
    const actions = []
    
    if (options.allowQuote !== false) {
        actions.push({
            id: 'quote',
            label: 'Quote in Notes',
            icon: '📝',
            action: 'quote'
        })
    }
    
    if (options.allowCopy !== false) {
        actions.push({
            id: 'copy',
            label: 'Copy Text',
            icon: '📋',
            action: 'copy'
        })
    }
    
    if (options.allowDelete && message.sender === 'user') {
        actions.push({
            id: 'delete',
            label: 'Delete Message',
            icon: '🗑️',
            action: 'delete'
        })
    }
    
    if (options.allowEdit && message.sender === 'user') {
        actions.push({
            id: 'edit',
            label: 'Edit Message',
            icon: '✏️',
            action: 'edit'
        })
    }
    
    return actions
}

/**
 * Formats message content for copying to clipboard
 */
export function formatMessageForCopy(message: any, includeMetadata: boolean = false): string {
    const content = message.content || message.text || ''
    
    if (!includeMetadata) {
        return content
    }
    
    const sender = message.sender || message.type || 'Unknown'
    const timestamp = message.timestamp 
        ? formatMessageTimestamp(message.timestamp, 'absolute')
        : 'Unknown time'
    
    return `${sender} (${timestamp}):\n${content}`
}

// =============================================================================
// MESSAGE GROUPING UTILITIES
// =============================================================================

/**
 * Groups consecutive messages from the same sender
 */
export function groupConsecutiveMessages(messages: any[]) {
    const groups = []
    let currentGroup = null
    
    messages.forEach(message => {
        const sender = message.sender || message.type
        const timestamp = message.timestamp || 0
        
        if (currentGroup && 
            currentGroup.sender === sender && 
            (timestamp - currentGroup.lastTimestamp) < 5 * 60 * 1000) { // 5 minutes
            currentGroup.messages.push(message)
            currentGroup.lastTimestamp = timestamp
        } else {
            currentGroup = {
                sender,
                messages: [message],
                firstTimestamp: timestamp,
                lastTimestamp: timestamp
            }
            groups.push(currentGroup)
        }
    })
    
    return groups
}

/**
 * Determines if message should show timestamp
 */
export function shouldShowTimestamp(message: any, previousMessage?: any): boolean {
    if (!previousMessage) return true
    
    const currentTime = message.timestamp || 0
    const previousTime = previousMessage.timestamp || 0
    const timeDiff = currentTime - previousTime
    
    // Show timestamp if more than 5 minutes apart
    return timeDiff > 5 * 60 * 1000
}