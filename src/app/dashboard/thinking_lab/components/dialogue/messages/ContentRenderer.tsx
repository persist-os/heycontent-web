/**
 * Content Renderer
 * 
 * Clean UI component for rendering linked content in dialogue messages.
 * Uses ContentProcessor for business logic separation.
 */

'use client'

import { useCallback, useMemo, useRef } from 'react'
import { useAuth } from '@/app/context/auth-context'
import { useContentResolver } from '@/lib/content-resolver'
import { ContentProcessor, ContentClickHandler } from '../../../lib/contentProcessor'
import type { ContentRendererProps } from '../../../types/components/contentRenderer'

export function ContentRenderer({ 
  content, 
  className = '', 
  onContentClick,
  resolvedContent 
}: ContentRendererProps) {
  const { firebaseUser } = useAuth()
  const userId = firebaseUser?.uid
  
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
    
    console.log('🔗 ContentRenderer: Processing content:', {
      contentPreview: content.substring(0, 200),
      hasContentLinks: content.includes('@['),
      resolvedContentCount: resolvedContent?.length || 0,
      allLinkableContentCount: allLinkableContent?.length || 0
    })
    
    // If we've already processed this content and it has clickable links, return cached version
    if (processedContentRef.current && contentProcessor.hasClickableLinks(processedContentRef.current)) {
      console.log('🔗 Returning cached processed content with clickable links')
      return processedContentRef.current
    }
    
    // If content appears to already be processed with titles, check if it needs link conversion
    if (contentProcessor.isContentProcessed(content)) {
      console.log('🔗 Content appears to already be processed with titles')
      
      // Check if we need to convert the titles back to clickable links
      if (allLinkableContent && contentProcessor.needsLinkConversion(content)) {
        console.log('🔗 Converting processed titles back to clickable links')
        const convertedContent = contentProcessor.convertTitlesToClickableLinks(content)
        
        // Only cache if we actually converted something
        if (contentProcessor.hasClickableLinks(convertedContent)) {
          processedContentRef.current = convertedContent
          console.log('🔗 Cached converted content with clickable links')
        }
        return convertedContent
      }
      
      // If content already has clickable links, cache it
      if (contentProcessor.hasClickableLinks(content)) {
        processedContentRef.current = content
        console.log('🔗 Cached content that already had clickable links')
      }
      return content
    }
    
    // Process content with @[contentId]@ patterns
    const processedContent = contentProcessor.processContentLinks(content, resolvedContent)
    
    console.log('🔗 Final processed content:', {
      originalLength: content.length,
      processedLength: processedContent.length,
      hasHtml: processedContent.includes('<'),
      hasClickableLinks: contentProcessor.hasClickableLinks(processedContent),
      preview: processedContent.substring(0, 200)
    })
    
    // Cache the processed content if it has clickable links
    if (contentProcessor.hasClickableLinks(processedContent)) {
      processedContentRef.current = processedContent
      console.log('🔗 Cached processed content with clickable links')
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
