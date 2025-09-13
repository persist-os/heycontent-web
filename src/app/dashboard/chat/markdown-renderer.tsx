'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeRaw from 'rehype-raw'
import { ExternalLink, Play, Image, FileText, Youtube, Instagram, Lightbulb } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAuth } from '@/app/context/auth-context'
import { useCallback, useMemo, useRef } from 'react'
import { useContentResolver } from '@/lib/content-resolver'

interface MarkdownRendererProps {
  content: string
  className?: string
}

interface ChatContentRendererProps {
  content: string
  className?: string
}

// Link embed component for rich previews
function LinkEmbed({ href, children }: { href: string; children: React.ReactNode }) {
  const isYoutube = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/.test(href)
  const isTwitter = /twitter\.com|x\.com/.test(href)
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(href)
  
  // For embedded link format: [embed](url)
  if (children?.toString().toLowerCase() === 'embed') {
    if (isYoutube) {
      const videoId = href.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)?.[1]
      if (videoId) {
        return (
          <div className="my-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video"
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          </div>
        )
      }
    }
    
    if (isImage) {
      return (
        <div className="my-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <img
            src={href}
            alt="Embedded image"
            className="w-full h-auto max-h-96 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )
    }
    
    // Generic link preview for other URLs
    return (
      <div className="my-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-3">
          <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
              {href.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </div>
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Open link →
            </a>
          </div>
        </div>
      </div>
    )
  }
  
  // Regular link with preview hint
  return (
    <span className="relative group">
      <a 
        href={href} 
        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline text-base break-words inline-flex items-center gap-1" 
        target="_blank" 
        rel="noopener noreferrer"
      >
        {children}
        {isYoutube && <Play className="w-3 h-3 inline ml-1" />}
        {isImage && <Image className="w-3 h-3 inline ml-1" />}
        {!isYoutube && !isImage && <ExternalLink className="w-3 h-3 inline ml-1" />}
      </a>
    </span>
  )
}

// Component to render linked content in chat messages
function ChatContentRenderer({ 
  content, 
  className = '', 
  onContentClick,
  resolvedContent 
}: ChatContentRendererProps & { 
  onContentClick?: (contentType: string, contentId: string) => void
  resolvedContent?: Array<{ contentId: string; title: string; type: string }>
}) {
  const { firebaseUser } = useAuth()
  const userId = firebaseUser?.uid
  
  // Get current chat ID from URL
  const currentChatId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null
  
  // Track if content has been processed to prevent unnecessary re-processing
  const processedContentRef = useRef<string>('')
  
  // Function to convert processed titles back to clickable links
  const convertTitlesToClickableLinks = useCallback((content: string, allContent: any[]): string => {
    // This function converts titles in brackets back to clickable links
    // It's used when the backend sends processed content but we need to make it interactive
    
    console.log('🔗 Converting titles to clickable links:', {
      contentPreview: content.substring(0, 200),
      allContentCount: allContent.length,
      allContentTypes: allContent.map(item => ({ type: item.type, title: item.title?.substring(0, 50) }))
    })
    
    // Find all content that could match the titles
    const contentMap = new Map()
    allContent.forEach(item => {
      if (item.title) {
        // Create multiple variations of the title for better matching
        const fullTitle = item.title
        const cleanTitle = item.title.replace(/\n/g, ' ').trim()
        const truncatedTitle = cleanTitle.substring(0, 50) + (cleanTitle.length > 50 ? '...' : '')
        
        // Map all variations
        contentMap.set(fullTitle, item)
        contentMap.set(cleanTitle, item)
        contentMap.set(truncatedTitle, item)
        
        // Also try to match partial titles
        if (cleanTitle.length > 20) {
          const partialTitle = cleanTitle.substring(0, 20) + '...'
          contentMap.set(partialTitle, item)
        }
      }
    })
    
    console.log('🔗 Content map created:', {
      mapSize: contentMap.size,
      sampleKeys: Array.from(contentMap.keys()).slice(0, 5)
    })
    
    // Replace titles in brackets with clickable links
    const result = content.replace(/\[([^\]]+)\]/g, (match, title) => {
      console.log('🔗 Trying to match title:', title)
      
      // Clean the title for matching
      const cleanTitle = title.replace(/\n/g, ' ').trim()
      
      // Try to find a match
      let linkedContent = contentMap.get(title) || contentMap.get(cleanTitle)
      
      // If no exact match, try partial matching
      if (!linkedContent) {
        for (const [key, value] of contentMap.entries()) {
          if (key.includes(cleanTitle) || cleanTitle.includes(key)) {
            linkedContent = value
            console.log('🔗 Found partial match:', { title: cleanTitle, matchedKey: key })
            break
          }
        }
      }
      
      if (linkedContent) {
        console.log('🔗 Converting title to clickable link:', { title: cleanTitle, type: linkedContent.type, id: linkedContent.id })
        // Create a clickable link
        return `<a href="#" class="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium" data-content-id="${linkedContent.id}" data-content-type="${linkedContent.type}">${title}</a>`
      }
      
      console.log('🔗 No match found for title:', cleanTitle)
      // If no match found, keep the original bracket format
      return match
    })
    
    console.log('🔗 Conversion result:', {
      originalLength: content.length,
      resultLength: result.length,
      hasClickableLinks: result.includes('data-content-id'),
      preview: result.substring(0, 200)
    })
    
    return result
  }, [])
  
  // Debug logging
  console.log('🔗 ChatContentRenderer:', {
    content: content.substring(0, 100) + '...',
    hasContentLinks: content.includes('@['),
    resolvedContentCount: resolvedContent?.length || 0
  })
  
  // Fetch all linkable content using content resolver
  const { allContent: allLinkableContent } = useContentResolver(userId)

  // Process content to render linked content
  const processedContent = useMemo(() => {
    if (!content) return content
    
    console.log('🔗 ChatContentRenderer: Processing content:', {
      contentPreview: content.substring(0, 200),
      hasContentLinks: content.includes('@['),
      resolvedContentCount: resolvedContent?.length || 0,
      allLinkableContentCount: allLinkableContent?.length || 0,
      processedContentRefCurrent: processedContentRef.current ? 'has cached content' : 'no cached content'
    })
    
    // If we've already processed this content and it has clickable links, return the cached version
    // This prevents unnecessary re-processing and maintains clickable state
    if (processedContentRef.current && processedContentRef.current.includes('data-content-id')) {
      console.log('🔗 Returning cached processed content with clickable links')
      return processedContentRef.current
    }
    
    // If content contains titles in brackets but no @[ patterns, it's already been processed
    if (content.includes('[') && content.includes(']') && !content.includes('@[')) {
      console.log('🔗 Content appears to already be processed with titles, checking if it needs link conversion')
      console.log('🔗 Content details:', {
        hasBrackets: content.includes('[') && content.includes(']'),
        hasAtPatterns: content.includes('@['),
        hasClickableLinks: content.includes('<a href="#"'),
        contentPreview: content.substring(0, 200)
      })
      
      // Check if we need to convert the titles back to clickable links
      // This happens when the backend sends processed content but we need to make it interactive
      if (allLinkableContent && !content.includes('<a href="#"')) {
        console.log('🔗 Converting processed titles back to clickable links')
        const convertedContent = convertTitlesToClickableLinks(content, allLinkableContent)
        // Only cache if we actually converted something
        if (convertedContent.includes('data-content-id')) {
          processedContentRef.current = convertedContent
          console.log('🔗 Cached converted content with clickable links')
        }
        return convertedContent
      }
      
      // If content already has clickable links, cache it
      if (content.includes('<a href="#"')) {
        processedContentRef.current = content
        console.log('🔗 Cached content that already had clickable links')
      }
      return content
    }
    
    // Handle content ID format @[contentId]@ (e.g., @[note:123]@, @[youtube:456]@, @[conversations:789]@)
    let processedContent = content.replace(/@\[([^\]]+)\]@/g, (match, contentId) => {
      console.log('🔗 Processing content link:', { contentId })
      
      // First try to find content in the resolved content from the message
      if (resolvedContent && resolvedContent.length > 0) {
        const resolvedItem = resolvedContent.find(item => item.contentId === contentId)
        if (resolvedItem) {
          console.log('🔗 Found resolved content:', { id: contentId, title: resolvedItem.title, type: resolvedItem.type })
          return `<a href="#" class="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium" data-content-id="${contentId}" data-content-type="${resolvedItem.type}">${resolvedItem.title}</a>`
        }
      }
      
      // Fallback to client-side store if no resolved content
      if (allLinkableContent) {
        console.log('🔗 Looking for content in store:', {
          contentId,
          storeContentCount: allLinkableContent.length,
          storeContentTypes: allLinkableContent.map(item => ({ id: item.id, type: item.type, title: item.title }))
        })
        
        // Try multiple ways to find the content
        let linkedContent = allLinkableContent.find(item => item.id === contentId)
        
        // If not found by exact ID, try removing prefixes
        if (!linkedContent) {
          const cleanContentId = contentId.replace(/^(conversations?|notes?|insights?|youtube|instagram|gmail):/, '')
          linkedContent = allLinkableContent.find(item => 
            item.id === cleanContentId || 
            item.id === contentId
          )
        }
        
        // Special handling for insights with complex ID format
        if (!linkedContent && contentId.startsWith('insights:') || contentId.startsWith('insight:')) {
          const insightParts = contentId.split(':')
          if (insightParts.length >= 4) {
            const platform = insightParts[1]
            const analysisId = insightParts[2]
            const index = insightParts[3]
            
            // Try to find by platform and analysis ID
            linkedContent = allLinkableContent.find(item => 
              item.type === 'insight' && 
              (item.id === contentId || 
               item.id === `${platform}:${analysisId}:${index}` ||
               item.id === `insight:${platform}:${analysisId}:${index}`)
            )
          }
        }
        
        if (linkedContent) {
          const title = linkedContent.title || 'Untitled'
          console.log('🔗 Found linked content in store:', { id: contentId, title, type: linkedContent.type })
          
          // Create a clickable link with the title and proper navigation attributes
          return `<a href="#" class="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium" data-content-id="${contentId}" data-content-type="${linkedContent.type}">${title}</a>`
        }
      }
      
      // If content not found, show a clean fallback (not the raw ID)
      console.log('🔗 Content not found for ID:', contentId)
      return `<span class="text-muted-foreground italic">[Content not found]</span>`
    })
    
    console.log('🔗 Final processed content:', {
      originalLength: content.length,
      processedLength: processedContent.length,
      hasHtml: processedContent.includes('<'),
      hasClickableLinks: processedContent.includes('data-content-id'),
      preview: processedContent.substring(0, 200)
    })
    
    // Cache the processed content if it has clickable links
    if (processedContent.includes('data-content-id')) {
      processedContentRef.current = processedContent
      console.log('🔗 Cached processed content with clickable links')
    }
    
    return processedContent
  }, [content, allLinkableContent, resolvedContent, convertTitlesToClickableLinks])

  // Handle clicks on linked content
  const handleContentClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'A') {
      e.preventDefault()
      
      // Handle content ID links
      if (target.hasAttribute('data-content-id')) {
        const contentId = target.getAttribute('data-content-id')
        const contentType = target.getAttribute('data-content-type')
        
        if (contentId && contentType) {
          // If onContentClick is provided, use overlay mode
          if (onContentClick) {
            // Extract the actual content ID without prefix
            let actualContentId = contentId
            if (contentType === 'smart_note' && contentId.startsWith('note:')) {
              actualContentId = contentId.replace('note:', '')
            } else if (contentType === 'youtube' && contentId.startsWith('youtube:')) {
              actualContentId = contentId.replace('youtube:', '')
            } else if (contentType === 'instagram' && contentId.startsWith('instagram:')) {
              actualContentId = contentId.replace('instagram:', '')
            } else if (contentType === 'gmail' && contentId.startsWith('gmail:')) {
              actualContentId = contentId.replace('gmail:', '')
            } else if (contentType === 'conversation' && contentId.startsWith('conversations:')) {
              actualContentId = contentId.replace('conversations:', '')
            }
            onContentClick(contentType, actualContentId)
          } else {
            // Fallback to navigation mode
            const chatIdParam = currentChatId ? `&chatId=${currentChatId}` : ''
            
            switch (contentType) {
              case 'smart_note':
                // Extract the note ID (remove note: prefix if present)
                const noteId = contentId.startsWith('note:') ? contentId.replace('note:', '') : contentId
                // Navigate to the note with back navigation to chat
                window.open(`/dashboard/notes?noteId=${noteId}&fromChat=true${chatIdParam}`, '_blank')
                break
              case 'youtube':
                // Extract video ID and navigate to YouTube analysis with back navigation
                const videoId = contentId.replace('youtube:', '')
                window.open(`/dashboard/notes/youtube-analysis/${videoId}?fromChat=true${chatIdParam}`, '_blank')
                break
              case 'instagram':
                // Extract post ID and navigate to Instagram analysis with back navigation
                const postId = contentId.replace('instagram:', '')
                window.open(`/dashboard/notes/instagram-analysis/${postId}?fromChat=true${chatIdParam}`, '_blank')
                break
              case 'gmail':
                // Extract thread ID and navigate to Gmail analysis with back navigation
                const threadId = contentId.replace('gmail:', '')
                window.open(`/dashboard/notes/gmail-analysis/${threadId}?fromChat=true${chatIdParam}`, '_blank')
                break
              case 'conversation':
                // For conversations, we can show them in a modal or navigate to chat history
                console.log('Conversation clicked:', contentId)
                // You can implement conversation display logic here
                break
              case 'insight':
                // For insights, we can show them in a modal
                console.log('Insight clicked:', contentId)
                // You can implement insight display logic here
                break
              default:
                console.log('Unknown content type clicked:', contentType, contentId)
            }
          }
        }
      }
    }
  }, [onContentClick, currentChatId])

  return (
    <div 
      className={`chat-content-renderer w-full break-words ${className}`}
      onClick={handleContentClick}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  )
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // Enhanced preprocessing to preserve empty lines and handle line breaks better
  const processedContent = content
    // First, preserve empty lines by replacing them with a placeholder
    .replace(/\n\s*\n/g, '\n&nbsp;\n')
    // Handle completely empty lines (just whitespace)
    .replace(/^[\s]*$/gm, '&nbsp;')
    // Convert single line breaks to double when they separate numbered items
    .replace(/(\d+\.\s[^\n]+)\n(?=\d+\.\s)/g, '$1\n\n')
    // Handle multi-line numbered items
    .replace(/(\d+\.\s[^\n]+(?:\n(?!\d+\.\s)[^\n]*)*)\n(?=\d+\.\s)/g, '$1\n\n')
    // Preserve single line breaks as proper breaks
    .replace(/(?<!\n)\n(?!\n)/g, '  \n');

  return (
    <div className={`markdown-content w-full ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Handle line breaks explicitly
          br: () => <br className="block" />,
          
          // Enhanced paragraph styling with empty paragraph support
          p: ({ children }) => {
            // Check if this is an empty paragraph (just &nbsp; or empty)
            const isEmptyParagraph = children === '&nbsp;' || 
                                   (Array.isArray(children) && children.length === 1 && children[0] === '\u00A0') ||
                                   (typeof children === 'string' && children.trim() === '') ||
                                   (Array.isArray(children) && children.every(child => 
                                     typeof child === 'string' && child.trim() === ''
                                   ));
            
            if (isEmptyParagraph) {
              return <div className="h-6 w-full" />; // Empty line with proper height
            }
            
            return (
              <p className="mb-3 last:mb-0 text-base leading-relaxed w-full break-words word-break-break-word hyphens-auto overflow-wrap-anywhere">
                {children}
              </p>
            );
          },
          
          // Bold text
          strong: ({ children }) => (
            <strong className="font-semibold break-words">
              {children}
            </strong>
          ),
          
          // Italic text
          em: ({ children }) => (
            <em className="italic break-words">
              {children}
            </em>
          ),
          
          // Underline text
          u: ({ children }) => (
            <u className="underline break-words">
              {children}
            </u>
          ),
          
          // Unordered lists with better spacing and proper wrapping
          ul: ({ children }) => (
            <ul className="list-disc ml-4 sm:ml-5 mb-4 space-y-1 w-full break-words overflow-visible">
              {children}
            </ul>
          ),
          
          // Ordered lists with better spacing and proper wrapping
          ol: ({ children }) => (
            <ol className="list-decimal ml-4 sm:ml-5 mb-4 space-y-1 w-full break-words overflow-visible">
              {children}
            </ol>
          ),
          
          // List items with proper sizing and word wrapping
          li: ({ children }) => (
            <li className="text-base leading-relaxed text-gray-800 dark:text-gray-200 w-full break-words word-break-break-word hyphens-auto whitespace-normal overflow-wrap-anywhere">
              {children}
            </li>
          ),
          
          // Inline code
          code: ({ children, className }) => {
            const isBlock = className?.includes('language-')
            
            if (isBlock) {
              return (
                <code className="block bg-gray-100 dark:bg-gray-700 rounded p-3 text-base font-mono overflow-x-auto mb-3 w-full break-words">
                  {children}
                </code>
              )
            }
            
            return (
              <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-base font-mono break-words">
                {children}
              </code>
            )
          },
          
          // Code blocks with full width and proper overflow handling
          pre: ({ children }) => (
            <pre className="bg-gray-100 dark:bg-gray-700 rounded p-3 text-base font-mono overflow-x-auto mb-3 w-full break-words whitespace-pre-wrap">
              {children}
            </pre>
          ),
          
          // Headings with better spacing and proper wrapping
          h1: ({ children }) => (
            <h1 className="text-lg font-bold mb-3 mt-6 first:mt-0 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-1 w-full break-words hyphens-auto whitespace-normal">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold mb-3 mt-5 first:mt-0 text-gray-900 dark:text-gray-100 w-full break-words hyphens-auto whitespace-normal">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mb-2 mt-4 first:mt-0 text-gray-900 dark:text-gray-100 w-full break-words hyphens-auto whitespace-normal">{children}</h3>
          ),
          
          // Links with embed support
          a: ({ href, children }) => (
            <LinkEmbed href={href || '#'}>
              {children}
            </LinkEmbed>
          ),
          
          // Blockquotes with proper wrapping
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400 mb-3 text-base w-full break-words hyphens-auto whitespace-normal">
              {children}
            </blockquote>
          ),
          
          // Horizontal rules
          hr: () => (
            <hr className="border-gray-300 dark:border-gray-600 my-4 w-full" />
          ),
          
          // Tables with proper overflow handling
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3 w-full">
              <table className="min-w-full border border-gray-300 dark:border-gray-600 text-base w-full">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-100 dark:bg-gray-700 font-semibold text-left text-base break-words">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-base break-words">
              {children}
            </td>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}

// Export the ChatContentRenderer for use in chat messages
export { ChatContentRenderer } 