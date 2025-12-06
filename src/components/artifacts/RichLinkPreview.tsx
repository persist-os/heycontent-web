/**
 * Rich Link Preview Component
 * 
 * Pattern: PT:41 (Component-First Development), graceful degradation
 * Auto-detects URLs and renders Open Graph previews
 */

'use client'

import React from 'react'
import { ExternalLink, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useOpenGraphMetadata } from '@/hooks/useOpenGraphMetadata'

interface RichLinkPreviewProps {
  url: string
  children?: React.ReactNode
  className?: string
}

export function RichLinkPreview({ url, children, className }: RichLinkPreviewProps) {
  const { metadata, loading, error } = useOpenGraphMetadata(url)

  // Loading state (skeleton)
  if (loading) {
    return (
      <Card className={cn("my-4 border border-border/30 bg-card/50", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-muted/30 rounded animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted/30 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-muted/30 rounded animate-pulse w-1/2" />
            </div>
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state (fallback to plain link)
  if (error || !metadata) {
    return (
      <div className={cn("my-2", className)}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-1 text-sm break-words"
        >
          {children || url}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    )
  }

  // Rich preview card
  return (
    <Card className={cn("my-4 border border-border/30 bg-card/50 hover:bg-card/80 transition-colors", className)}>
      <CardContent className="p-0">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div className="flex flex-col md:flex-row">
            {/* Image (if available) */}
            {metadata.image && (
              <div className="w-full md:w-48 h-32 md:h-auto bg-muted/30 flex-shrink-0 overflow-hidden rounded-t-lg md:rounded-t-none md:rounded-l-lg">
                <img
                  src={metadata.image}
                  alt={metadata.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Hide image on error
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-foreground line-clamp-2">
                  {metadata.title}
                </h4>
                {metadata.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {metadata.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ExternalLink className="w-3 h-3" />
                  <span className="truncate">
                    {url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </a>
      </CardContent>
    </Card>
  )
}

/**
 * URL detection regex pattern
 * Matches URLs in text
 */
export const URL_PATTERN = /(https?:\/\/[^\s]+)/g

/**
 * Extract URLs from text
 */
export function extractUrls(text: string): string[] {
  const matches = text.match(URL_PATTERN)
  return matches || []
}

