'use client'

import React, { useState, useEffect, useRef, useCallback, forwardRef } from 'react'
import { InlineCommandPalette } from '@/app/dashboard/notes/components/InlineCommandPalette'
import { MarkdownRenderer } from '@/app/dashboard/chat/markdown-renderer'
import { Eye, Edit } from 'lucide-react'
import { useImageUpload } from '@/app/dashboard/notes/hooks/useImageUpload'
import toast from 'react-hot-toast'

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
import { markdownToHTML, htmlToMarkdown } from './markdown-utils'

interface RichTextEditorProps {
  content: string
  onContentChange: (content: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
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
  // Note linking
  availableNotes?: Array<{ _id: string; title: string; type: string }>
  onLinkNote?: (noteId: string) => void
  // Container ref for palette positioning
  containerRef?: React.RefObject<HTMLElement>
}

export const RichTextEditor = forwardRef<HTMLDivElement, RichTextEditorProps>(({
  content,
  onContentChange,
  placeholder = 'Start writing...',
  disabled = false,
  className = '',
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
  containerRef,
  ...rest
}, ref) => {
  const [showPreview, setShowPreview] = useState(false) // Default to edit mode
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [palettePosition, setPalettePosition] = useState({ top: 100, left: 100 })
  const [paletteMode, setPaletteMode] = useState<'commands' | 'notes'>('commands')
  const [isDragOver, setIsDragOver] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  
  const textAreaRef = useRef<HTMLDivElement>(null)
  const lastContentRef = useRef<string>('')
  const { uploadImage, isUploading } = useImageUpload()
  
  // Sync external ref
  useEffect(() => {
    if (ref && typeof ref === 'function') {
      ref(textAreaRef.current as any)
    } else if (ref) {
      (ref as any).current = textAreaRef.current
    }
  }, [ref])

  // Initialize content ONLY ONCE and prevent loops
  useEffect(() => {
    if (!showPreview && textAreaRef.current && !isInitialized) {
      if (content.trim() && content !== lastContentRef.current) {
        textAreaRef.current.innerHTML = markdownToHTML(content)
        lastContentRef.current = content
      }
      setIsInitialized(true)
    }
  }, [content, showPreview, isInitialized])

  // Save current editor content to lastContentRef
  const saveCurrentContent = useCallback(() => {
    if (textAreaRef.current) {
      const html = textAreaRef.current.innerHTML
      console.log('[RichTextEditor] Saving content - HTML:', html.substring(0, 100))
      if (html.trim()) {
        const markdown = htmlToMarkdown(html)
        console.log('[RichTextEditor] Saving content - Markdown:', markdown.substring(0, 100))
        lastContentRef.current = markdown
        onContentChange(markdown)
      }
    }
  }, [onContentChange])

  // Switch to edit mode - restore previous content IMMEDIATELY
  const switchToEditMode = useCallback(() => {
    console.log('[RichTextEditor] Switching to edit mode')
    console.log('[RichTextEditor] content prop:', content?.substring(0, 100))
    
    setShowPreview(false)
    
    // Use requestAnimationFrame to ensure DOM update completes, then setTimeout for additional safety
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (textAreaRef.current) {
          // Always use the content prop as the source of truth
          const contentToRestore = content
          console.log('[RichTextEditor] Restoring content:', contentToRestore?.substring(0, 100))
          
          if (contentToRestore && contentToRestore.trim()) {
            const htmlToRestore = markdownToHTML(contentToRestore)
            console.log('[RichTextEditor] Restoring HTML:', htmlToRestore.substring(0, 100))
            textAreaRef.current.innerHTML = htmlToRestore
          } else {
            // Clear content if empty
            textAreaRef.current.innerHTML = ''
          }
          
          // Ensure the contentEditable is properly activated
          textAreaRef.current.contentEditable = 'true'
          
          // Focus and place cursor at end
          textAreaRef.current.focus()
          
          // Ensure lastContentRef is updated
          lastContentRef.current = contentToRestore || ''
          
          const range = document.createRange()
          const selection = window.getSelection()
          try {
            if (textAreaRef.current.childNodes.length > 0) {
              range.selectNodeContents(textAreaRef.current)
              range.collapse(false)
              selection?.removeAllRanges()
              selection?.addRange(range)
            }
          } catch (e) {
            // Fallback if range selection fails
            console.log('[RichTextEditor] Range selection failed, using fallback')
          }
        }
      }, 20)
    })
  }, [content])

  // Toggle preview mode with event handling
  const togglePreview = useCallback((e?: React.MouseEvent) => {
    // Prevent event bubbling to avoid conflicts
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    console.log('[RichTextEditor] Toggling preview, current showPreview:', showPreview)
    setShowPreview(!showPreview)
  }, [showPreview])

  // Create AI handlers
  const aiHandlers: AIHandlers = {
    onAskAI,
    onRequestAnalysis,
    onRequestIdeas
  }

  const { handleAskAI, handleRequestAnalysis, handleRequestIdeas, handleGenerateTableFromContent } = createAIHandlers(
    { content, textAreaRef: { current: textAreaRef.current as any }, onContentChange },
    aiHandlers
  )

  // Formatting handlers
  const handleInsertBulletList = useCallback(() => {
    const params = { content, textAreaRef: { current: textAreaRef.current as any }, onContentChange }
    insertBulletList(params)
  }, [content, onContentChange])

  const handleInsertNumberedList = useCallback(() => {
    const params = { content, textAreaRef: { current: textAreaRef.current as any }, onContentChange }
    insertNumberedList(params)
  }, [content, onContentChange])

  const handleInsertHeading = useCallback((level: number) => {
    const params = { content, textAreaRef: { current: textAreaRef.current as any }, onContentChange }
    insertHeading(params, level)
  }, [content, onContentChange])

  const handleInsertLink = useCallback((url: string, text: string) => {
    const params = { content, textAreaRef: { current: textAreaRef.current as any }, onContentChange }
    insertLink(params, url, text)
  }, [content, onContentChange])

  const handleInsertLinkEmbed = useCallback((url: string) => {
    const params = { content, textAreaRef: { current: textAreaRef.current as any }, onContentChange }
    insertLinkEmbed(params, url)
  }, [content, onContentChange])

  const handleInsertTable = useCallback((rows: number = 3, cols: number = 3) => {
    const params = { content, textAreaRef: { current: textAreaRef.current as any }, onContentChange }
    insertTable(params, rows, cols)
  }, [content, onContentChange])

  // Handle note linking
  const handleLinkNote = useCallback((noteId: string) => {
    if (!textAreaRef.current) return

    const selectedNote = availableNotes.find(note => String(note._id) === noteId)
    if (!selectedNote) return
    
    // Close the palette
    setShowCommandPalette(false)

    // Insert note link at cursor position
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const linkText = `@[${selectedNote.title}]@`
    
    range.deleteContents()
    range.insertNode(document.createTextNode(linkText))
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
    
    // Trigger content change
    const html = textAreaRef.current.innerHTML
    const markdown = htmlToMarkdown(html)
    onContentChange(markdown)
  }, [availableNotes, onContentChange])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Cmd/Ctrl + K to open command palette
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      e.stopPropagation()
      setTimeout(() => {
        const coords = getCursorCoordinates({ current: textAreaRef.current as any }, containerRef)
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
          document.execCommand('bold')
          return
        case 'i':
          e.preventDefault()
          document.execCommand('italic')
          return
        case 'u':
          e.preventDefault()
          document.execCommand('underline')
          return
      }
    }

    // Handle Enter key for line breaks
    if (e.key === 'Enter') {
      e.preventDefault()
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        
        // Insert line break
        const br = document.createElement('br')
        range.insertNode(br)
        
        // Insert an empty text node after the br for proper cursor positioning
        const textNode = document.createTextNode('')
        range.setStartAfter(br)
        range.insertNode(textNode)
        
        // Position cursor in the text node
        range.setStart(textNode, 0)
        range.setEnd(textNode, 0)
        
        selection.removeAllRanges()
        selection.addRange(range)
      }
      return
    }

    // '/' to open command palette
    if (e.key === '/') {
      const selection = window.getSelection()
      if (!selection || !textAreaRef.current) return
      
      const range = selection.getRangeAt(0)
      const textContent = textAreaRef.current.textContent || ''
      const cursorOffset = range.startOffset
      
      const beforeCursor = textContent.substring(0, cursorOffset)
      const lastNewline = beforeCursor.lastIndexOf('\n')
      const lineContent = beforeCursor.substring(lastNewline + 1)
      
      if (lineContent.trim() === '') {
        e.preventDefault()
        e.stopPropagation()
        setTimeout(() => {
          const coords = getCursorCoordinates({ current: textAreaRef.current as any }, containerRef)
          setPalettePosition(coords)
          setPaletteMode('commands')
          setShowCommandPalette(true)
        }, 0)
        return
      }
    }

    // '@' to open note linking palette
    if (e.key === '@') {
      setTimeout(() => {
        if (textAreaRef.current) {
          const coords = getCursorCoordinates({ current: textAreaRef.current as any }, containerRef)
          setPalettePosition(coords)
          setPaletteMode('notes')
          setShowCommandPalette(true)
        }
      }, 10)
      return
    }

    // ESC to close command palette
    if (e.key === 'Escape' && showCommandPalette) {
      e.preventDefault()
      e.stopPropagation()
      setShowCommandPalette(false)
      return
    }
  }, [showCommandPalette, containerRef])

  // Handle content changes - convert HTML to markdown with debouncing
  const handleContentChange = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const html = (e.target as HTMLDivElement).innerHTML
    const markdown = htmlToMarkdown(html)
    
    // Prevent unnecessary updates if content hasn't actually changed
    if (markdown !== lastContentRef.current) {
      lastContentRef.current = markdown
      onContentChange(markdown)
    }
  }, [onContentChange])

  // Handle drag and drop for images
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length === 0) {
      toast.error('Please drop image files only')
      return
    }

    if (imageFiles.length > 5) {
      toast.error('Maximum 5 images at once')
      return
    }

    try {
      toast.loading(`Uploading ${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''}...`)
      
      const uploadPromises = imageFiles.map(file => uploadImage(file))
      const imageUrls = await Promise.all(uploadPromises)
      
      // Insert images at cursor position
      if (textAreaRef.current) {
        const selection = window.getSelection()
        const range = selection?.getRangeAt(0)
        
        if (range) {
          const imageElements = imageUrls
            .filter(url => url !== null)
            .map(url => {
              const img = document.createElement('img')
              img.src = url
              img.alt = 'Uploaded image'
              img.style.cssText = 'max-width: 100%; height: auto; max-height: 300px; border-radius: 8px; margin: 8px 0; display: block;'
              return img
            })
          
          range.deleteContents()
          imageElements.forEach(img => range.insertNode(img))
          range.collapse(false)
          selection?.removeAllRanges()
          selection?.addRange(range)
          
          // Force content change detection
          const html = textAreaRef.current.innerHTML
          const markdown = htmlToMarkdown(html)
          lastContentRef.current = markdown
          onContentChange(markdown)
        }
      }

      toast.success(`${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''} uploaded successfully!`)
    } catch (error) {
      console.error('Drag and drop upload failed:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload images')
    }
  }, [uploadImage, onContentChange])

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Preview Toggle Button */}
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={togglePreview}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-background/80 backdrop-blur-sm border border-border rounded-md hover:bg-muted transition-colors"
          title={showPreview ? "Switch to Edit Mode" : "Switch to Preview Mode"}
        >
          {showPreview ? (
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

      {showPreview ? (
        /* Preview Mode - ONLY show this, hide edit completely */
        <div 
          className="w-full h-full min-h-[300px] p-4 text-base leading-relaxed bg-background text-foreground overflow-auto"
        >
          {content ? (
            <MarkdownRenderer content={content} />
          ) : (
            <div className="text-muted-foreground/50 italic">
              {placeholder}
            </div>
          )}
        </div>
      ) : (
        /* Edit Mode - ContentEditable - ONLY show this when not in preview */
        <>
          <div
            ref={textAreaRef}
            contentEditable={!disabled && !isUploading}
            className={`w-full h-full min-h-[300px] resize-none p-4 text-base leading-relaxed bg-background text-foreground placeholder:text-muted-foreground/50 border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 transition-all duration-200 rounded-md ${
              isDragOver ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50/50 dark:bg-blue-900/10' : ''
            } ${isUploading ? 'opacity-60 cursor-wait' : ''}`}
            onInput={handleContentChange}
            onKeyDown={handleKeyDown}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onFocus={switchToEditMode}
            data-placeholder={`${placeholder}

⌘K or / for AI assistant • ⌘B bold • ⌘I italic • ⌘U underline

📎 Drag & drop images here`}
            suppressContentEditableWarning={true}
          />
          
          {/* Inline Command Palette - only show in edit mode */}
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
        </>
      )}
    </div>
  )
})

RichTextEditor.displayName = 'RichTextEditor'