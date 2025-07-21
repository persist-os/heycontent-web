'use client'

import React from 'react'
import { MarkdownRenderer } from '@/app/dashboard/chat/markdown-renderer'
import { LinkedContentRenderer } from '@/app/dashboard/notes/components/LinkedContentRenderer'
import { NoteLinkCard } from './note-link-card'
import { NoteLink } from './rich-text-editor.types'

interface ContentRendererProps {
  content: string
  availableNotes: NoteLink[]
  allLinkableContent?: Array<{ id: string; title: string; type: string }>
  onLinkNote?: (noteId: string) => void
  onLinkContent?: (prefixedId: string) => void
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({
  content,
  availableNotes,
  allLinkableContent,
  onLinkNote,
  onLinkContent
}) => {
  const renderContentWithNoteLinks = (rawContent: string) => {
    if (!rawContent) return []
    
    const parts: React.ReactNode[] = []
    let remainingContent = rawContent
    let partIndex = 0
    
    while (remainingContent.length > 0) {
      // Find the next potential link start @[
      const linkStartIndex = remainingContent.indexOf('@[')
      
      if (linkStartIndex === -1) {
        // No more @[ patterns, add remaining content as markdown
        if (remainingContent) {
          parts.push(
            <MarkdownRenderer 
              key={`markdown-${partIndex}`} 
              content={remainingContent} 
            />
          )
        }
        break
      }
      
      // Add text before the @[ as markdown
      if (linkStartIndex > 0) {
        const beforeLink = remainingContent.substring(0, linkStartIndex)
        parts.push(
          <MarkdownRenderer 
            key={`markdown-before-${partIndex}`} 
            content={beforeLink} 
          />
        )
      }
      
      // Look for the closing ]@
      const afterLinkStart = remainingContent.substring(linkStartIndex + 2) // Skip @[
      const linkEndIndex = afterLinkStart.indexOf(']@')

      if (linkEndIndex === -1) {
        // No closing ]@, treat as regular text
        parts.push(
          <MarkdownRenderer 
            key={`markdown-incomplete-${partIndex}`} 
            content={remainingContent.substring(linkStartIndex)} 
          />
        )
        break
      }

      // Extract the content ID
      const contentId = afterLinkStart.substring(0, linkEndIndex).trim()
      
      // Check if it's a prefixed ID (youtube:, instagram:, etc.)
      if (contentId.includes(':')) {
        const [contentType, id] = contentId.split(':', 2)
        
        if (contentType === 'note') {
          // Handle note linking
          const linkedNote = availableNotes.find(note => String(note._id) === String(id))
          
          if (linkedNote) {
            // Render as embedded note link component
            parts.push(
              <NoteLinkCard
                key={`note-link-${partIndex}-${linkStartIndex}`}
                note={linkedNote}
                onClick={() => {
                  if (onLinkNote) {
                    onLinkNote(linkedNote._id)
                  }
                }}
              />
            )
          } else {
            // Note not found, show missing note badge
            parts.push(
              <span
                key={`missing-note-${partIndex}-${linkStartIndex}`}
                className="inline-flex items-center gap-1 px-2 py-1 mx-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-xs"
              >
                ⚠️ Missing Note: {id}
              </span>
            )
          }
        } else if (contentType === 'insight') {
          // Handle insight linking - ID format is insight:analysisId:index
          const fullInsightId = contentId // Keep the full ID including the index
          const insight = allLinkableContent?.find(n => n.id === fullInsightId)
          const insightTitle = insight?.title || '[Insight: Unknown]'
          
          parts.push(
            <button
              key={`insight-link-${partIndex}-${linkStartIndex}`}
              onClick={(e) => {
                e.preventDefault()
                // Always pass the full insight ID, not just the analysis ID
                if (onLinkContent) onLinkContent(fullInsightId)
              }}
              className="inline-flex items-center px-4 py-2 mx-1 my-1 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 text-lg font-semibold cursor-pointer align-middle min-h-[2.8em] hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
              style={{ whiteSpace: 'normal', lineHeight: '1.4' }}
            >
              {`Insight: ${insightTitle}`}
            </button>
          )
        } else {
          // Handle other content types (youtube, instagram, etc.)
          parts.push(
            <LinkedContentRenderer
              key={`content-link-${partIndex}-${linkStartIndex}`}
              prefixedId={contentId}
              onLinkContent={onLinkContent}
            />
          )
        }
      } else {
        // Raw note ID format (no prefix) - check if it's a note ID
        const linkedNote = availableNotes.find(note => String(note._id) === String(contentId))
        
        if (linkedNote) {
          // Render as embedded note link component
          parts.push(
            <NoteLinkCard
              key={`note-link-${partIndex}-${linkStartIndex}`}
              note={linkedNote}
              onClick={() => {
                if (onLinkNote) {
                  onLinkNote(linkedNote._id)
                }
              }}
            />
          )
        } else {
          // Check if it might be a YouTube or Instagram ID without prefix
          // For now, show as missing note
          parts.push(
            <span
              key={`missing-note-${partIndex}-${linkStartIndex}`}
              className="inline-flex items-center gap-1 px-2 py-1 mx-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-xs"
            >
              ⚠️ Missing Note: {contentId}
            </span>
          )
        }
      }

      // Move past this link
      remainingContent = afterLinkStart.substring(linkEndIndex + 2) // Skip ]@
      partIndex++
    }

    return parts
  }

  if (!content) {
    return (
      <div className="text-muted-foreground italic">
        Click here to start writing, or use the Edit button to switch to edit mode.
        <br/><br/>
        <strong>Keyboard shortcuts:</strong><br/>
        • ⌘B for bold<br/>
        • ⌘I for italic<br/>
        • ⌘U for underline<br/>
        • ⌘K or / for AI assistant
      </div>
    )
  }

  if (content.includes('@[')) {
    // Only use complex rendering when there are note links
    return (
      <div className="space-y-0">
        {renderContentWithNoteLinks(content).map((part, index) => (
          <React.Fragment key={index}>{part}</React.Fragment>
        ))}
      </div>
    )
  }

  // Use direct MarkdownRenderer for simple content
  return <MarkdownRenderer content={content} />
} 