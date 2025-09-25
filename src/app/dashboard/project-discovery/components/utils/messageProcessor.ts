/**
 * Message Processing Utilities
 * 
 * Utility functions for message processing, validation, and formatting
 * in the project discovery system. Handles message transformation,
 * validation, and metadata extraction.
 * 
 * Used by: API services, state hooks, message display components
 */

import { Message } from '@/types/chat'

export interface MessageMetadata {
  type?: string
  context?: string
  confidence?: number
  isWelcome?: boolean
  suggestions?: Array<{
    type: 'explore' | 'clarify' | 'action' | 'strategic'
    description: string
    context?: string
    confidence: number
  }>
  [key: string]: any
}

export interface ProcessedResponse {
  content: string
  metadata: MessageMetadata
  isValid: boolean
  errors?: string[]
}

/**
 * Formats message content by trimming whitespace and normalizing text
 * @param content - Raw message content
 * @returns Formatted message content
 */
export function formatMessage(content: string): string {
  if (!content || typeof content !== 'string') {
    return ''
  }
  
  return content.trim().replace(/\s+/g, ' ')
}

/**
 * Validates message content for basic requirements
 * @param content - Message content to validate
 * @returns True if message is valid, false otherwise
 */
export function validateMessage(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false
  }
  
  const trimmed = content.trim()
  return trimmed.length > 0 && trimmed.length <= 5000
}

/**
 * Extracts metadata from a message object
 * @param message - Message object to extract metadata from
 * @returns Extracted metadata object
 */
export function extractMetadata(message: any): MessageMetadata {
  if (!message || typeof message !== 'object') {
    return {}
  }
  
  return {
    type: message.metadata?.type,
    context: message.metadata?.context,
    confidence: message.metadata?.confidence,
    isWelcome: message.metadata?.isWelcome,
    suggestions: message.metadata?.suggestions,
    ...message.metadata
  }
}

/**
 * Processes API response and validates the result
 * @param response - Raw API response
 * @returns Processed response with validation results
 */
export function processResponse(response: any): ProcessedResponse {
  const errors: string[] = []
  
  if (!response) {
    errors.push('Response is null or undefined')
    return {
      content: '',
      metadata: {},
      isValid: false,
      errors
    }
  }
  
  const content = formatMessage(response.content || response.message || '')
  const metadata = extractMetadata(response)
  
  if (!validateMessage(content)) {
    errors.push('Invalid message content')
  }
  
  return {
    content,
    metadata,
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  }
}
