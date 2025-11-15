/**
 * Content Renderer
 * 
 * Clean UI component for rendering linked content in dialogue messages.
 * Uses ContentProcessor for business logic separation.
 */

'use client'

import { useCallback, useMemo, useRef } from 'react'
import { useAuth } from '@/app/context/auth-context'
import { useContentResolver } from '../../../lib/content-resolver'
import { ContentProcessor, ContentClickHandler } from '../../../lib/contentProcessor'
import type { ContentRendererProps } from '../../../types/components/contentRenderer'
import { getCurrentUserId } from '@/app/lib/api-helpers'

export function ContentRenderer({ 
  content,
  className = '',
  onContentClick,
  resolvedContent
}: ContentRendererProps) {
  const userId = getCurrentUserId()
  
  // Get current chat ID from URL
  const currentChatId = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search).get('id') 
    : null
  
  // Track if content has been processed to prevent unnecessary re-processing
  const processedContentRef = useRef<string>('')
  const processorRef = useRef<ContentProcessor>()
  
  // Fetch all linkable content
  const { allContent: allLinkableContent } = useContentResolver(userId)

  // Initialize or update content processor
  const contentProcessor = useMemo(() => {
    if (!processorRef.current) {
      processorRef.current = new ContentProcessor(allLinkableContent || [])
    } else if (allLinkableContent) {
      processorRef.current.updateContent(allLinkableContent)
    }
    return processorRef.current
  }, [allLinkableContent])

  // Initialize click handler
  const clickHandler = useMemo(() => 
    new ContentClickHandler(onContentClick, currentChatId), 
    [onContentClick, currentChatId]
  )

  // Process content to render linked content
  const processedContent = useMemo(() => {
    if (!content) return content
    
    // If we've already processed this content and it has clickable links, return cached version
    if (processedContentRef.current && contentProcessor.hasClickableLinks(processedContentRef.current)) {
      return processedContentRef.current
    }
    
    // If content appears to already be processed with titles, check if it needs link conversion
    if (contentProcessor.isContentProcessed(content)) {
      // Check if we need to convert the titles back to clickable links
      if (allLinkableContent && contentProcessor.needsLinkConversion(content)) {
        const convertedContent = contentProcessor.convertTitlesToClickableLinks(content)
        
        // Only cache if we actually converted something
        if (contentProcessor.hasClickableLinks(convertedContent)) {
          processedContentRef.current = convertedContent
        }
        return convertedContent
      }
      
      // If content already has clickable links, cache it
      if (contentProcessor.hasClickableLinks(content)) {
        processedContentRef.current = content
      }
      return content
    }
    
    // Process content with @[contentId]@ patterns
    const processedContent = contentProcessor.processContentLinks(content, resolvedContent)
    
    // Cache the processed content if it has clickable links
    if (contentProcessor.hasClickableLinks(processedContent)) {
      processedContentRef.current = processedContent
    }
    
    return processedContent
  }, [content, allLinkableContent, resolvedContent, contentProcessor])

  return (
    <div 
      className={`content-renderer w-full break-words ${className}`}
      onClick={clickHandler.handleContentClick}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  )
}
