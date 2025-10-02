/**
 * Link Embed Component
 * 
 * Clean UI component for rendering rich link previews
 */

'use client'

import { ExternalLink, Image as ImageIcon } from 'lucide-react'
import type { LinkEmbedProps } from '../../../types/components/contentRenderer'

const CONTENT_LINK_PATTERNS = {
  image: {
    pattern: /\.(jpg|jpeg|png|gif|webp|svg)$/i,
    extract: () => null
  }
} as const

export function LinkEmbed({ href, children }: LinkEmbedProps) {
  const isImage = CONTENT_LINK_PATTERNS.image.pattern.test(href)
  
  // For embedded link format: [embed](url)
  if (children?.toString().toLowerCase() === 'embed') {
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
        {isImage && <ImageIcon className="w-3 h-3 inline ml-1" />}
        {!isImage && <ExternalLink className="w-3 h-3 inline ml-1" />}
      </a>
    </span>
  )
}
