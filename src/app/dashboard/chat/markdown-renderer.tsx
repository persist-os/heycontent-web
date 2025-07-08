'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeRaw from 'rehype-raw'
import { ExternalLink, Play, Image, FileText, Youtube, Instagram, Lightbulb } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAuth } from '@/app/context/auth-context'
import { useCallback, useMemo } from 'react'

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
function ChatContentRenderer({ content, className = '', onContentClick }: ChatContentRendererProps & { onContentClick?: (contentType: string, contentId: string) => void }) {
  const { firebaseUser } = useAuth()
  const userId = firebaseUser?.uid
  
  // Get current chat ID from URL
  const currentChatId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null
  
  // Debug logging
  console.log('🔗 ChatContentRenderer:', {
    content: content.substring(0, 100) + '...',
    hasContentLinks: content.includes('@[')
  })
  
  // Fetch all linkable content
  const allLinkableContent = useQuery(api.notes.getAllLinkableContent, { 
    userId: userId || '' 
  })

  // Process content to render linked content
  const processedContent = useMemo(() => {
    if (!content || !allLinkableContent) return content

    // Handle content ID format @[contentId]@ (e.g., @[note:123]@, @[youtube:456]@)
    let processedContent = content.replace(/@\[([^\]]+)\]@/g, (match, contentId) => {
      console.log('🔗 Processing content link:', { contentId })
      
      // Handle different content ID formats
      let actualContentId = contentId
      let contentType = 'note'
      
      // Check if it's a prefixed ID (note:, youtube:, etc.)
      if (contentId.includes(':')) {
        const [prefix, id] = contentId.split(':', 2)
        contentType = prefix
        actualContentId = id
      }
      
      console.log('🔗 Parsed content ID:', { contentId, actualContentId, contentType })
      
      // Find the linked content
      let linkedContent
      if (contentType === 'note') {
        // Try to find by the actual ID (without prefix)
        linkedContent = allLinkableContent.find(item => item.id === actualContentId)
        // If not found, try with the full contentId (in case it's already prefixed)
        if (!linkedContent) {
          linkedContent = allLinkableContent.find(item => item.id === contentId)
        }
      } else {
        // For other content types, use the full contentId
        linkedContent = allLinkableContent.find(item => item.id === contentId)
      }
      
      console.log('🔗 Found linked content:', linkedContent)
      
      if (linkedContent) {
        const title = linkedContent.title || 'Untitled'
        return `<a href="#" class="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium" data-content-id="${contentId}" data-content-type="${linkedContent.type}">${title}</a>`
      }
      
      // Fallback if content not found
      console.log('🔗 Content not found for ID:', contentId)
      return `<a href="#" class="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium" data-content-id="${contentId}">[${contentId}]</a>`
    })

    // Then handle legacy content ID format @[note:ID]@ for backward compatibility
    processedContent = processedContent.replace(/@\[([^\]]+)\]@/g, (match, contentId) => {
      // Handle different content ID formats
      let actualContentId = contentId
      let contentType = 'note'
      
      // Check if it's a prefixed ID (note:, youtube:, etc.)
      if (contentId.includes(':')) {
        const [prefix, id] = contentId.split(':', 2)
        contentType = prefix
        actualContentId = id
      }
      
      // For smart notes, we need to handle both prefixed and non-prefixed IDs
      let linkedContent
      if (contentType === 'note') {
        // Try to find by the actual ID (without prefix)
        linkedContent = allLinkableContent.find(item => item.id === actualContentId)
        // If not found, try with the full contentId (in case it's already prefixed)
        if (!linkedContent) {
          linkedContent = allLinkableContent.find(item => item.id === contentId)
        }
      } else {
        // For other content types, use the full contentId
        linkedContent = allLinkableContent.find(item => item.id === contentId)
      }
      
      if (!linkedContent) {
        // Content not found, show as plain text
        return `<span class="text-muted-foreground italic">[Content not found: ${contentId}]</span>`
      }

      const title = linkedContent.title || 'Untitled'
      
      // Create the proper content ID for navigation
      let navigationId = contentId
      if (linkedContent.type === 'note' && !contentId.startsWith('note:')) {
        // For smart notes, ensure we have the note: prefix
        navigationId = `note:${contentId}`
      }
      
      // Create a clickable link that opens in a new tab or navigates appropriately
      return `<a href="#" class="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium" data-content-id="${navigationId}" data-content-type="${linkedContent.type}">${title}</a>`
    })

    return processedContent
  }, [content, allLinkableContent])

  // Handle clicks on linked content
  const handleContentClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'A') {
      e.preventDefault()
      
      // Handle numeric index links (new format) - these should now be converted to content ID links
      if (target.hasAttribute('data-link-index')) {
        const linkIndex = target.getAttribute('data-link-index')
        console.log('Numeric link clicked (fallback):', linkIndex)
        // This should only happen if the link registry is missing or content not found
        alert(`Link ${linkIndex} clicked! Content not found or link registry missing.`)
        return
      }
      
      // Handle content ID links (legacy format)
      if (target.hasAttribute('data-content-id')) {
        const contentId = target.getAttribute('data-content-id')
        const contentType = target.getAttribute('data-content-type')
        
        if (contentId && contentType) {
          // If onContentClick is provided, use overlay mode
          if (onContentClick) {
            // Extract the actual content ID without prefix
            let actualContentId = contentId
            if (contentType === 'note' && contentId.startsWith('note:')) {
              actualContentId = contentId.replace('note:', '')
            } else if (contentType === 'youtube' && contentId.startsWith('youtube:')) {
              actualContentId = contentId.replace('youtube:', '')
            }
            onContentClick(contentType, actualContentId)
          } else {
            // Fallback to navigation mode
            const chatIdParam = currentChatId ? `&chatId=${currentChatId}` : ''
            
            switch (contentType) {
              case 'note':
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
                // For Instagram, navigate to content analytics with back navigation
                window.open(`/dashboard/content-analytics?analyticsId=${contentId}&platform=instagram&tab=posts&fromChat=true${chatIdParam}`, '_blank')
                break
              case 'insight':
                // Navigate to insight analysis with back navigation
                window.open(`/dashboard/notes/insight-analysis/${encodeURIComponent(contentId)}?fromChat=true${chatIdParam}`, '_blank')
                break
              default:
                console.log('Unknown content type:', contentType, contentId)
            }
          }
        }
      }
    }
  }, [onContentClick, currentChatId])

  return (
    <div 
      className={`chat-content-renderer ${className}`}
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
              <p className="mb-3 last:mb-0 text-base leading-relaxed w-full break-words hyphens-auto">
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
            <ul className="list-disc ml-5 mb-4 space-y-1 w-full">
              {children}
            </ul>
          ),
          
          // Ordered lists with better spacing and proper wrapping
          ol: ({ children }) => (
            <ol className="list-decimal ml-5 mb-4 space-y-1 w-full">
              {children}
            </ol>
          ),
          
          // List items with proper sizing and word wrapping
          li: ({ children }) => (
            <li className="text-base leading-relaxed text-gray-800 dark:text-gray-200 w-full break-words hyphens-auto">{children}</li>
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
            <h1 className="text-lg font-bold mb-3 mt-6 first:mt-0 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-1 w-full break-words hyphens-auto">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold mb-3 mt-5 first:mt-0 text-gray-900 dark:text-gray-100 w-full break-words hyphens-auto">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mb-2 mt-4 first:mt-0 text-gray-900 dark:text-gray-100 w-full break-words hyphens-auto">{children}</h3>
          ),
          
          // Links with embed support
          a: ({ href, children }) => (
            <LinkEmbed href={href || '#'}>
              {children}
            </LinkEmbed>
          ),
          
          // Blockquotes with proper wrapping
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400 mb-3 text-base w-full break-words hyphens-auto">
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