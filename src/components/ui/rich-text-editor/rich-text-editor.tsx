'use client'

import React, { useState, useEffect, useRef, useCallback, forwardRef } from 'react'
import { InlineCommandPalette } from '@/app/dashboard/notes/components/InlineCommandPalette'
import { MarkdownRenderer } from '@/app/dashboard/chat/markdown-renderer'
import { NoteContentRenderer } from '@/app/dashboard/notes/components/NoteContentRenderer'
import { EnhancedContentSelector } from '@/app/dashboard/notes/components/EnhancedContentSelector'
import { LinkedContentRenderer } from '@/app/dashboard/notes/components/LinkedContentRenderer'
import { Eye, Edit } from 'lucide-react'

// Import utilities
import { 
  FormatTextParams, 
  TextAreaRef,
  getCursorCoordinates,
  formatText,
  insertAtCursor,
  insertBulletList,
  insertNumberedList,
  insertHeading,
  insertLink,
  insertLinkEmbed,
  insertTable
} from './formatting-utils'

import { AIHandlers, createAIHandlers } from './ai-utils'

interface RichTextEditorProps {
  content: string
  onContentChange: (content: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  showPreview?: boolean
  onShowPreviewChange?: (show: boolean) => void
  // AI handlers
  onAskAI?: (prompt: string) => Promise<string>
  onRequestAnalysis?: (noteType: string) => Promise<string>
  onRequestIdeas?: () => Promise<string[]>
  // Context
  noteId?: string
  noteTitle?: string
  platform?: string
  tags?: string[]
  userId?: string
  noteType?: string
  // Content linking
  availableNotes?: Array<{ _id: string; title: string; type: string }>
  onLinkNote?: (noteId: string) => void
  onLinkContent?: (prefixedId: string) => void // New handler for prefixed content IDs
  // --- NEW: Optional container ref for palette positioning ---
  containerRef?: React.RefObject<HTMLElement>
}

export const RichTextEditor = forwardRef<HTMLTextAreaElement, RichTextEditorProps>(({
  content,
  onContentChange,
  placeholder = 'Start writing...',
  disabled = false,
  className = '',
  showPreview = true,
  onShowPreviewChange,
  onAskAI,
  onRequestAnalysis,
  onRequestIdeas,
  noteId,
  noteTitle,
  platform,
  tags,
  userId,
  noteType = 'idea_bank',
  availableNotes = [],
  onLinkNote,
  onLinkContent,
  containerRef,
  ...rest
}, ref) => {
  const [localShowPreview, setLocalShowPreview] = useState(true)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showEnhancedContentSelector, setShowEnhancedContentSelector] = useState(false)
  const [palettePosition, setPalettePosition] = useState({ top: 100, left: 100 })
  const [paletteMode, setPaletteMode] = useState<'commands' | 'notes'>('commands')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [contentSearchTerm, setContentSearchTerm] = useState('')
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  
  // Sync external ref
  useEffect(() => {
    if (ref && typeof ref === 'function') {
      ref(textAreaRef.current)
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = textAreaRef.current
    }
  }, [ref])

  // Sync preview state - default to showing rich text
  const currentShowPreview = onShowPreviewChange ? showPreview : localShowPreview
  const setCurrentShowPreview = onShowPreviewChange || setLocalShowPreview

  // Custom Note Link Component
  const NoteLinkCard = ({ note, onClick }: { note: { _id: string; title: string; type: string }, onClick: () => void }) => (
    <span
      onClick={onClick}
      className="inline-flex items-center px-4 py-2 mx-1 my-1 rounded-lg border border-border bg-muted text-lg font-semibold text-foreground cursor-pointer align-middle min-h-[2.8em]"
      style={{ whiteSpace: 'normal', lineHeight: '1.4' }}
    >
      {note.title}
    </span>
  )

  // Function to render content with embedded note link components
  const renderContentWithNoteLinks = useCallback((rawContent: string) => {
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
          // Handle note linking (existing functionality)
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
        // Legacy note ID format (no prefix)
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
          // Note not found, show missing note badge
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
  }, [availableNotes, onLinkNote, onLinkContent])

  // Function to convert note IDs to titles for display in edit mode
  const getDisplayContent = useCallback((rawContent: string) => {
    if (!rawContent || availableNotes.length === 0) return rawContent
    
    let displayContent = rawContent
    const linkRegex = /@\[([^\]]+)\]@/g
    let match
    
    while ((match = linkRegex.exec(rawContent)) !== null) {
      const noteId = match[1].trim()
      const linkedNote = availableNotes.find(note => String(note._id) === String(noteId))
      
      if (linkedNote) {
        // Replace @[id]@ with @[Title]@ for display
        displayContent = displayContent.replace(match[0], `@[${linkedNote.title}]@`)
      } else {
        // Show [Missing Note] for unknown IDs
        displayContent = displayContent.replace(match[0], `@[Missing Note]@`)
      }
    }
    
    return displayContent
  }, [availableNotes])

  // Function to convert display content back to storage format (titles back to IDs)
  const getStorageContent = useCallback((displayContent: string) => {
    if (!displayContent || availableNotes.length === 0) return displayContent
    
    let storageContent = displayContent
    const linkRegex = /@\[([^\]]+)\]@/g
    let match
    
    while ((match = linkRegex.exec(displayContent)) !== null) {
      const titleOrId = match[1].trim()
      // Skip if it's already an ID format (looks like an ID)
      const idMatch = availableNotes.find(note => String(note._id) === titleOrId)
      if (idMatch) continue
      // Find note by title
      const linkedNote = availableNotes.find(note => note.title === titleOrId)
      if (linkedNote) {
        // Replace @[Title]@ with @[id]@ for storage
        storageContent = storageContent.replace(match[0], `@[${linkedNote._id}]@`)
      }
    }
    return storageContent
  }, [availableNotes])

  // Create AI handlers
  const aiHandlers: AIHandlers = {
    onAskAI,
    onRequestAnalysis,
    onRequestIdeas
  }

  const { handleAskAI, handleRequestAnalysis, handleRequestIdeas, handleGenerateTableFromContent } = createAIHandlers(
    { content, textAreaRef, onContentChange },
    aiHandlers
  )

  // Formatting handlers with proper parameters
  const handleInsertBulletList = useCallback(() => {
    const params = { content, textAreaRef, onContentChange }
    insertBulletList(params)
  }, [content, onContentChange])

  const handleInsertNumberedList = useCallback(() => {
    const params = { content, textAreaRef, onContentChange }
    insertNumberedList(params)
  }, [content, onContentChange])

  const handleInsertHeading = useCallback((level: number) => {
    const params = { content, textAreaRef, onContentChange }
    insertHeading(params, level)
  }, [content, onContentChange])

  const handleInsertLink = useCallback((url: string, text: string) => {
    const params = { content, textAreaRef, onContentChange }
    insertLink(params, url, text)
  }, [content, onContentChange])

  const handleInsertLinkEmbed = useCallback((url: string) => {
    const params = { content, textAreaRef, onContentChange }
    insertLinkEmbed(params, url)
  }, [content, onContentChange])

  const handleInsertTable = useCallback((rows: number = 3, cols: number = 3) => {
    const params = { content, textAreaRef, onContentChange }
    insertTable(params, rows, cols)
  }, [content, onContentChange])

  // Handle note linking
  const handleLinkNote = useCallback((noteId: string) => {
    console.log('🔗 handleLinkNote called with noteId:', noteId)
    
    if (!textAreaRef.current) {
      console.log('❌ No textarea available')
      return
    }

    const selectedNote = availableNotes.find(note => String(note._id) === noteId)
    if (!selectedNote) {
      console.log('❌ Selected note not found:', noteId)
      return
    }

    console.log('✅ Selected note found:', selectedNote)
    
    // Close the palette immediately
    setShowCommandPalette(false)

    const textarea = textAreaRef.current
    const cursorPos = textarea.selectionStart
    const displayContent = getDisplayContent(content)
    const beforeCursor = displayContent.substring(0, cursorPos)
    
    // Look for @ symbol by checking backwards
    let atPosition = -1
    for (let i = cursorPos - 1; i >= Math.max(0, cursorPos - 20); i--) {
      if (beforeCursor[i] === '@') {
        atPosition = i
        console.log('📍 Found @ at position:', atPosition)
        break
      }
      // Stop if we hit whitespace or newline
      if (beforeCursor[i] === ' ' || beforeCursor[i] === '\n') {
        console.log('📍 Hit whitespace, stopping search')
        break
      }
    }
    
    const linkText = `@[${selectedNote.title}]@`
    
    if (atPosition !== -1) {
      // Replace @ and any typed text with note link
      const beforeAt = displayContent.substring(0, atPosition)
      const afterCursor = displayContent.substring(cursorPos)
      const newDisplayContent = beforeAt + linkText + afterCursor
      const newCursorPos = atPosition + linkText.length
      
      // Convert back to storage format and save
      const newStorageContent = getStorageContent(newDisplayContent)
      onContentChange(newStorageContent)
      
      // Set cursor position after the link
      setTimeout(() => {
        textarea.setSelectionRange(newCursorPos, newCursorPos)
        textarea.focus()
      }, 0)
      
      console.log('🔄 Replaced @ and text with note link')
    } else {
      // No @ found, just insert the note link
      const beforeCursor = displayContent.substring(0, cursorPos)
      const afterCursor = displayContent.substring(cursorPos)
      const newDisplayContent = beforeCursor + linkText + afterCursor
      const newCursorPos = cursorPos + linkText.length
      
      // Convert back to storage format and save
      const newStorageContent = getStorageContent(newDisplayContent)
      onContentChange(newStorageContent)
      
      // Set cursor position after the link
      setTimeout(() => {
        textarea.setSelectionRange(newCursorPos, newCursorPos)
        textarea.focus()
      }, 0)
      
      console.log('➕ Inserted note link at cursor')
    }
  }, [content, onContentChange, availableNotes])

  // Handle content linking
  const handleLinkContent = useCallback((prefixedId: string) => {
    console.log('🔗 handleLinkContent called with prefixedId:', prefixedId)
    
    if (!textAreaRef.current) {
      console.log('❌ No textarea available')
      return
    }

    // Close the selector immediately
    setShowEnhancedContentSelector(false)

    const textarea = textAreaRef.current
    const cursorPos = textarea.selectionStart
    const displayContent = getDisplayContent(content)
    const beforeCursor = displayContent.substring(0, cursorPos)
    
    // Look for @ symbol by checking backwards
    let atPosition = -1
    for (let i = cursorPos - 1; i >= Math.max(0, cursorPos - 20); i--) {
      if (beforeCursor[i] === '@') {
        atPosition = i
        console.log('📍 Found @ at position:', atPosition)
        break
      }
      // Stop if we hit whitespace or newline
      if (beforeCursor[i] === ' ' || beforeCursor[i] === '\n') {
        console.log('📍 Hit whitespace, stopping search')
        break
      }
    }
    
    const linkText = `@[${prefixedId}]@`
    
    if (atPosition !== -1) {
      // Replace @ and any typed text with content link
      const beforeAt = displayContent.substring(0, atPosition)
      const afterCursor = displayContent.substring(cursorPos)
      const newDisplayContent = beforeAt + linkText + afterCursor
      const newCursorPos = atPosition + linkText.length
      
      // Convert back to storage format and save
      const newStorageContent = getStorageContent(newDisplayContent)
      onContentChange(newStorageContent)
      
      // Set cursor position after the link
      setTimeout(() => {
        textarea.setSelectionRange(newCursorPos, newCursorPos)
        textarea.focus()
      }, 0)
      
      console.log('🔄 Replaced @ and text with content link')
    } else {
      // No @ found, just insert the content link
      const beforeCursor = displayContent.substring(0, cursorPos)
      const afterCursor = displayContent.substring(cursorPos)
      const newDisplayContent = beforeCursor + linkText + afterCursor
      const newCursorPos = cursorPos + linkText.length
      
      // Convert back to storage format and save
      const newStorageContent = getStorageContent(newDisplayContent)
      onContentChange(newStorageContent)
      
      // Set cursor position after the link
      setTimeout(() => {
        textarea.setSelectionRange(newCursorPos, newCursorPos)
        textarea.focus()
      }, 0)
      
      console.log('➕ Inserted content link at cursor')
    }
  }, [content, onContentChange, getDisplayContent, getStorageContent])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + K to open inline command palette
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      e.stopPropagation()
      // Small delay to ensure textarea is focused and cursor position is accurate
      setTimeout(() => {
        const coords = getCursorCoordinates(textAreaRef, containerRef)
        setPalettePosition(coords)
        setPaletteMode('commands')
        setShowCommandPalette(true)
      }, 0)
      return
    }

    // Traditional formatting shortcuts
    if (e.metaKey || e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault()
          formatText({ content, textAreaRef, onContentChange }, '**', '**')
          return
        case 'i':
          e.preventDefault()
          formatText({ content, textAreaRef, onContentChange }, '*', '*')
          return
        case 'u':
          e.preventDefault()
          formatText({ content, textAreaRef, onContentChange }, '<u>', '</u>')
          return
      }
    }

    // '/' at the start of a line to open command palette
    if (e.key === '/') {
      const textarea = textAreaRef.current
      if (!textarea) return
      
      const start = textarea.selectionStart
      const lineStart = content.lastIndexOf('\n', start - 1) + 1
      const lineContent = content.substring(lineStart, start)
      
      if (lineContent.trim() === '') {
        e.preventDefault()
        e.stopPropagation()
        setTimeout(() => {
          const coords = getCursorCoordinates(textAreaRef, containerRef)
          setPalettePosition(coords)
          setPaletteMode('commands')
          setShowCommandPalette(true)
        }, 0)
        return
      }
    }

    // '@' to open note linking palette
    if (e.key === '@') {
      // Let the @ be typed first, then open palette
      setTimeout(() => {
        if (textAreaRef.current) {
          const coords = getCursorCoordinates(textAreaRef, containerRef)
          setPalettePosition(coords)
          setShowEnhancedContentSelector(true)
          setShowCommandPalette(false)
        }
      }, 10) // Slightly longer delay to ensure @ is typed and cursor updated
      return
    }

    // Handle ESC to close command palette
    if (e.key === 'Escape' && showCommandPalette) {
      e.preventDefault()
      e.stopPropagation()
      setShowCommandPalette(false)
      return
    }
  }, [content, showCommandPalette, onContentChange, containerRef])

  // Handle content changes from typing
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const displayContent = e.target.value
    const newCursorPosition = e.target.selectionStart
    
    // Convert display content (with titles) back to storage format (with IDs)
    const storageContent = getStorageContent(displayContent)
    onContentChange(storageContent)
    setCursorPosition(newCursorPosition)
  }, [onContentChange, getStorageContent])

  const togglePreview = useCallback(() => {
    setCurrentShowPreview(!currentShowPreview)
  }, [currentShowPreview, setCurrentShowPreview])

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Preview Toggle Button */}
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={togglePreview}
          className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-background/90 backdrop-blur-sm border border-border hover:bg-muted transition-colors text-xs font-medium"
          title={currentShowPreview ? 'Switch to edit mode' : 'Switch to preview mode'}
        >
          {currentShowPreview ? (
            <>
              <Edit className="w-3 h-3" />
              Edit
            </>
          ) : (
            <>
              <Eye className="w-3 h-3" />
              Preview
            </>
          )}
        </button>
      </div>

      {currentShowPreview ? (
        /* Markdown Preview */
        <div 
          className="w-full h-full overflow-auto p-4 cursor-text"
          onClick={() => setCurrentShowPreview(false)}
        >
          {content ? (
            <div className="w-full max-w-none">
              {content.includes('@[') ? (
                // Only use complex rendering when there are note links
                <div className="space-y-0">
                  {renderContentWithNoteLinks(content).map((part, index) => (
                    <React.Fragment key={index}>{part}</React.Fragment>
                  ))}
                </div>
              ) : (
                // Use direct MarkdownRenderer for simple content
                <MarkdownRenderer content={content} />
              )}
            </div>
          ) : (
            <div className="text-muted-foreground italic">
              Click here to start writing, or use the Edit button to switch to edit mode.
              <br/><br/>
              <strong>Keyboard shortcuts:</strong><br/>
              • ⌘B for bold<br/>
              • ⌘I for italic<br/>
              • ⌘U for underline<br/>
              • ⌘K or / for AI assistant
            </div>
          )}
        </div>
      ) : (
        /* Text Editor */
        <textarea
          ref={textAreaRef}
          value={getDisplayContent(content)}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          className="w-full h-full min-h-[300px] resize-none p-4 text-base leading-relaxed bg-background text-foreground placeholder:text-muted-foreground/50 border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 transition-all duration-200 rounded-md transform-gpu will-change-contents"
          placeholder={`${placeholder}

⌘K or / for AI assistant • ⌘B bold • ⌘I italic • ⌘U underline • Click Preview to see rich text`}
          disabled={disabled}
          spellCheck={true}
          autoFocus={!disabled}
        />
      )}
      
      {/* Inline Command Palette */}
      <InlineCommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        position={palettePosition}
        onAskAI={handleAskAI}
        onRequestAnalysis={handleRequestAnalysis}
        onRequestIdeas={handleRequestIdeas}
        onInsertBulletList={handleInsertBulletList}
        onInsertNumberedList={handleInsertNumberedList}
        onInsertHeading={handleInsertHeading}
        onInsertLink={handleInsertLink}
        onInsertLinkEmbed={handleInsertLinkEmbed}
        onInsertTable={handleInsertTable}
        onGenerateTableFromContent={handleGenerateTableFromContent}
        onLinkNote={handleLinkNote}
        noteType={noteType}
        availableNotes={availableNotes}
        currentNoteId={noteId}
        showNoteLinks={paletteMode === 'notes'}
      />

      {/* Enhanced Content Selector */}
      <EnhancedContentSelector
        isOpen={showEnhancedContentSelector}
        onClose={() => setShowEnhancedContentSelector(false)}
        onSelect={handleLinkContent}
        position={palettePosition}
        searchTerm={contentSearchTerm}
        onSearchChange={setContentSearchTerm}
        excludeContentId={noteId ? `note:${noteId}` : undefined}
      />
    </div>
  )
})

RichTextEditor.displayName = 'RichTextEditor' 