/**
 * Content Renderer Types
 * 
 * Type definitions for content rendering and linking functionality
 */

export interface MarkdownRendererProps {
  content: string
  className?: string
}

export interface ContentRendererProps {
  content: string
  className?: string
  onContentClick?: (contentType: string, contentId: string) => void
  resolvedContent?: ResolvedContentItem[]
}

export interface ResolvedContentItem {
  contentId: string
  title: string
  type: string
}

export interface LinkableContent {
  id: string
  title: string
  type: string
  contentType?: string
  platform?: string
}

export interface LinkEmbedProps {
  href: string
  children: React.ReactNode
}

export type ContentLinkPattern = {
  pattern: RegExp
  extract: (href: string) => string | null
}

export const CONTENT_LINK_PATTERNS: Record<string, ContentLinkPattern> = {
  image: {
    pattern: /\.(jpg|jpeg|png|gif|webp|svg)$/i,
    extract: () => null
  }
} as const

export type ContentType = 'note' | 'crystal' | 'project' | 'conversation'

export const CONTENT_TYPE_PREFIXES: Record<string, ContentType> = {
  'note:': 'note',
  'notes:': 'note',
  'crystal:': 'crystal',
  'crystals:': 'crystal',
  'project:': 'project',
  'projects:': 'project',
  'conversation:': 'conversation',
  'conversations:': 'conversation'
} as const
