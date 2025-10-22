/**
 * Content Processor
 * 
 * Business logic for processing and resolving content links in dialogue messages.
 * Separated from UI concerns for better testability and maintainability.
 */

import type { 
  ResolvedContentItem, 
  LinkableContent,
  ContentType
} from '../types/components/contentRenderer'
import { CONTENT_TYPE_PREFIXES } from '../types/components/contentRenderer'

export class ContentProcessor {
  private contentMap: Map<string, LinkableContent> = new Map()
  
  constructor(private allContent: LinkableContent[] = []) {
    this.updateContentMap()
  }

  /**
   * Update the internal content map when content changes
   */
  updateContent(newContent: LinkableContent[]): void {
    this.allContent = newContent
    this.updateContentMap()
  }

  /**
   * Build content map with multiple variations for better matching
   */
  private updateContentMap(): void {
    this.contentMap.clear()
    
    this.allContent.forEach(item => {
      if (!item.title) return
      
      // Create multiple variations of the title for better matching
      const fullTitle = item.title
      const cleanTitle = item.title.replace(/\n/g, ' ').trim()
      const truncatedTitle = cleanTitle.substring(0, 50) + (cleanTitle.length > 50 ? '...' : '')
      
      // Map all variations
      this.contentMap.set(fullTitle, item)
      this.contentMap.set(cleanTitle, item)
      this.contentMap.set(truncatedTitle, item)
      
      // Also try to match partial titles
      if (cleanTitle.length > 20) {
        const partialTitle = cleanTitle.substring(0, 20) + '...'
        this.contentMap.set(partialTitle, item)
      }
    })
  }

  /**
   * Process content with @[contentId]@ patterns into clickable links
   */
  processContentLinks(
    content: string, 
    resolvedContent?: ResolvedContentItem[]
  ): string {
    if (!content) return content

    // Handle content ID format @[contentId]@ (e.g., @[note:123]@, @[crystal:456]@, @[project:789]@)
    return content.replace(/@\[([^\]]+)\]@/g, (match, contentId) => {
      
      // First try to find content in the resolved content from the message
      if (resolvedContent?.length) {
        const resolvedItem = resolvedContent.find(item => item.contentId === contentId)
        if (resolvedItem) {
          return this.createClickableLink(contentId, resolvedItem.title, resolvedItem.type)
        }
      }
      
      // Fallback to client-side content
      const linkedContent = this.findContentById(contentId)
      if (linkedContent) {
        const title = linkedContent.title || 'Untitled'
        
        return this.createClickableLink(contentId, title, linkedContent.type)
      }
      
      // If content not found, show a clean fallback
      return `<span class="text-muted-foreground italic">[Content not found]</span>`
    })
  }

  /**
   * Convert titles in brackets back to clickable links
   * Used when backend sends processed content but we need to make it interactive
   */
  convertTitlesToClickableLinks(content: string): string {
    
    // Replace titles in brackets with clickable links
    return content.replace(/\[([^\]]+)\]/g, (match, title) => {
      
      // Clean the title for matching
      const cleanTitle = title.replace(/\n/g, ' ').trim()
      
      // Try to find a match
      let linkedContent = this.contentMap.get(title) || this.contentMap.get(cleanTitle)
      
      // If no exact match, try partial matching
      if (!linkedContent) {
        for (const [key, value] of this.contentMap.entries()) {
          if (key.includes(cleanTitle) || cleanTitle.includes(key)) {
            linkedContent = value
            break
          }
        }
      }
      
      if (linkedContent) {
        return this.createClickableLink(linkedContent.id, title, linkedContent.type)
      }

      // If no match found, keep the original bracket format
      return match
    })
  }

  /**
   * Find content by ID with enhanced fallback strategies
   */
  private findContentById(contentId: string): LinkableContent | null {
    
    // Try exact match first
    let linkedContent = this.allContent.find(item => item.id === contentId)
    
    // Try with and without prefixes for: notes, chat, projects, crystals
    if (!linkedContent) {
      const cleanContentId = contentId.replace(/^(chat|conversations?|notes?|crystals?|projects?):/, '')
      linkedContent = this.allContent.find(item => 
        item.id === cleanContentId || 
        item.id === contentId ||
        item.id === `note:${cleanContentId}` ||
        item.id === `crystal:${cleanContentId}` ||
        item.id === `chat:${cleanContentId}` ||
        item.id === `conversation:${cleanContentId}` ||
        item.id === `project:${cleanContentId}`
      )
    }
    
    // Handle Convex IDs (which start with special characters)
    if (!linkedContent && contentId.match(/^[a-z0-9]{32}$/)) {
      linkedContent = this.allContent.find(item => 
        item.id === contentId ||
        item.id.endsWith(contentId) ||
        item.id.includes(contentId)
      )
    }
    
    return linkedContent
  }

  /**
   * Create a clickable link HTML element
   */
  private createClickableLink(contentId: string, title: string, contentType: string): string {
    return `<a href="#" class="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium" data-content-id="${contentId}" data-content-type="${contentType}">${title}</a>`
  }

  /**
   * Check if content has already been processed (has clickable links or titles in brackets)
   */
  isContentProcessed(content: string): boolean {
    return (content.includes('[') && content.includes(']') && !content.includes('@['))
  }

  /**
   * Check if content has clickable links
   */
  hasClickableLinks(content: string): boolean {
    return content.includes('data-content-id')
  }

  /**
   * Check if content needs link conversion (has titles but no clickable links)
   */
  needsLinkConversion(content: string): boolean {
    return this.isContentProcessed(content) && !this.hasClickableLinks(content)
  }
}

/**
 * Content Click Handler
 * 
 * Handles navigation and content display for linked content
 */
export class ContentClickHandler {
  constructor(
    private onContentClick?: (contentType: string, contentId: string) => void,
    private currentChatId?: string | null
  ) {}

  /**
   * Handle clicks on content links
   */
  handleContentClick = (e: React.MouseEvent): void => {
    const target = e.target as HTMLElement
    if (target.tagName !== 'A') return
    
    e.preventDefault()
    
    // Handle content ID links
    if (!target.hasAttribute('data-content-id')) return
    
    const contentId = target.getAttribute('data-content-id')
    const contentType = target.getAttribute('data-content-type')
    
    if (!contentId || !contentType) return
    
    // If onContentClick is provided, use overlay mode
    if (this.onContentClick) {
      const actualContentId = this.extractActualContentId(contentId, contentType as ContentType)
      this.onContentClick(contentType, actualContentId)
    } else {
      // Fallback to navigation mode
      this.navigateToContent(contentType as ContentType, contentId)
    }
  }

  /**
   * Extract the actual content ID without prefix
   */
  private extractActualContentId(contentId: string, contentType: ContentType): string {
    const prefixMap = Object.entries(CONTENT_TYPE_PREFIXES).reduce((acc, [prefix, type]) => {
      if (type === contentType) acc.push(prefix)
      return acc
    }, [] as string[])

    for (const prefix of prefixMap) {
      if (contentId.startsWith(prefix)) {
        return contentId.replace(prefix, '')
      }
    }
    
    return contentId
  }

  /**
   * Navigate to content based on type: notes, chat, projects, crystals
   */
  private navigateToContent(contentType: ContentType, contentId: string): void {
    const chatIdParam = this.currentChatId ? `&chatId=${this.currentChatId}` : ''
    
    switch (contentType) {
      case 'note':
        const noteId = contentId.startsWith('note:') ? contentId.replace('note:', '') : contentId
        window.open(`/dashboard/thinking_lab?noteId=${noteId}&fromChat=true${chatIdParam}`, '_blank')
        break
      case 'crystal':
        const crystalId = contentId.replace('crystal:', '')
        window.open(`/dashboard/crystals?crystalId=${crystalId}&fromChat=true${chatIdParam}`, '_blank')
        break
      case 'project':
        const projectId = contentId.replace('project:', '')
        window.open(`/dashboard/living-projects/${projectId}?fromChat=true${chatIdParam}`, '_blank')
        break
      case 'conversation':
        const conversationId = contentId.replace(/^(chat|conversation):/, '')
        window.open(`/dashboard/thinking_lab?conversationId=${conversationId}&fromChat=true${chatIdParam}`, '_blank')
        break
      default:
        // Unknown content type
    }
  }
}
