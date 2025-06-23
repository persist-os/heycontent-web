'use client'

import React, { useState, useEffect, useRef, useCallback, forwardRef } from 'react'
import { useTheme } from 'next-themes'
import { InlineCommandPalette } from '@/app/dashboard/notes/components/InlineCommandPalette'
import { MarkdownRenderer } from '@/app/dashboard/chat/markdown-renderer'
import { Eye, Edit } from 'lucide-react'

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
  noteType = 'idea_bank'
}, ref) => {
  const [localShowPreview, setLocalShowPreview] = useState(true)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [palettePosition, setPalettePosition] = useState({ top: 100, left: 100 })
  const [cursorPosition, setCursorPosition] = useState(0)
  
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

  // Calculate cursor position for command palette
  const getCursorCoordinates = useCallback(() => {
    if (!textAreaRef.current) return { top: 100, left: 100 }
    
    const textarea = textAreaRef.current
    const rect = textarea.getBoundingClientRect()
    const start = textarea.selectionStart
    const value = textarea.value
    
    const textBeforeCursor = value.substring(0, start)
    const lines = textBeforeCursor.split('\n')
    const currentLineIndex = lines.length - 1
    const currentLineText = lines[currentLineIndex] || ''
    
    const computed = window.getComputedStyle(textarea)
    const fontSize = parseInt(computed.fontSize, 10) || 16
    const lineHeight = computed.lineHeight === 'normal' 
      ? fontSize * 1.2 
      : parseInt(computed.lineHeight, 10) || fontSize * 1.2
    const paddingTop = parseInt(computed.paddingTop, 10) || 0
    const paddingLeft = parseInt(computed.paddingLeft, 10) || 0
    
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.font = computed.font
      const textWidth = ctx.measureText(currentLineText).width
      
      const x = rect.left + paddingLeft + textWidth
      const y = rect.top + paddingTop + (currentLineIndex * lineHeight) + lineHeight + 10
      
      return {
        top: Math.min(y, window.innerHeight - 300),
        left: Math.min(x, window.innerWidth - 400)
      }
    }
    
    return {
      top: rect.top + 50,
      left: rect.left + 50
    }
  }, [])

  // Format selected text or apply to new line
  const formatText = useCallback((prefix: string, suffix: string = '', newLineIfEmpty: boolean = false) => {
    if (!textAreaRef.current) return
    
    const textarea = textAreaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    
    let newContent: string
    let newCursorPosition: number
    
    if (selectedText) {
      const formattedText = `${prefix}${selectedText}${suffix}`
      newContent = content.substring(0, start) + formattedText + content.substring(end)
      newCursorPosition = start + formattedText.length
    } else if (newLineIfEmpty) {
      const textToInsert = `${prefix}${suffix}`
      newContent = content.substring(0, start) + textToInsert + content.substring(end)
      newCursorPosition = start + prefix.length
    } else {
      return
    }
    
    onContentChange(newContent)
    
    setTimeout(() => {
      if (textAreaRef.current) {
        textAreaRef.current.selectionStart = newCursorPosition
        textAreaRef.current.selectionEnd = newCursorPosition
        textAreaRef.current.focus()
      }
    }, 0)
  }, [content, onContentChange])

  // Insert content at cursor position
  const insertAtCursor = useCallback((text: string) => {
    if (!textAreaRef.current) return
    
    const textarea = textAreaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    
    const newContent = content.substring(0, start) + text + content.substring(end)
    const newCursorPosition = start + text.length
    
    onContentChange(newContent)
    
    setTimeout(() => {
      if (textAreaRef.current) {
        textAreaRef.current.selectionStart = newCursorPosition
        textAreaRef.current.selectionEnd = newCursorPosition
        textAreaRef.current.focus()
      }
    }, 0)
  }, [content, onContentChange])

  // AI handlers with fallbacks
  const handleAskAI = useCallback(async (prompt: string) => {
    if (onAskAI) {
      const response = await onAskAI(prompt)
      insertAtCursor(`\n\n${response}`)
    } else {
      insertAtCursor(`\n\n**AI Response to: "${prompt}"**\n\n[AI response would appear here]`)
    }
  }, [onAskAI, insertAtCursor])

  const handleRequestAnalysis = useCallback(async (noteType: string) => {
    if (onRequestAnalysis) {
      const analysis = await onRequestAnalysis(noteType)
      insertAtCursor(`\n\n## Analysis\n\n${analysis}`)
    } else {
      insertAtCursor(`\n\n## Analysis (${noteType})\n\n[Analysis would appear here]`)
    }
  }, [onRequestAnalysis, insertAtCursor])

  const handleRequestIdeas = useCallback(async () => {
    if (onRequestIdeas) {
      const ideas = await onRequestIdeas()
      const ideasText = ideas.map((idea, index) => `${index + 1}. ${idea}`).join('\n')
      insertAtCursor(`\n\n## Ideas\n\n${ideasText}`)
    } else {
      insertAtCursor('\n\n## Ideas\n\n1. [Idea 1]\n2. [Idea 2]\n3. [Idea 3]')
    }
  }, [onRequestIdeas, insertAtCursor])

  // Formatting handlers
  const handleInsertBulletList = useCallback(() => {
    if (!textAreaRef.current) return
    
    const textarea = textAreaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    
    if (selectedText) {
      const lines = selectedText.split('\n').filter(line => line.trim())
      const bulletList = lines.map(line => `- ${line.trim()}`).join('\n')
      const newContent = content.substring(0, start) + bulletList + content.substring(end)
      onContentChange(newContent)
      
      setTimeout(() => {
        if (textAreaRef.current) {
          textAreaRef.current.selectionStart = start + bulletList.length
          textAreaRef.current.selectionEnd = start + bulletList.length
          textAreaRef.current.focus()
        }
      }, 0)
    } else {
      insertAtCursor('\n- ')
    }
  }, [content, onContentChange, insertAtCursor])

  const handleInsertNumberedList = useCallback(() => {
    if (!textAreaRef.current) return
    
    const textarea = textAreaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    
    if (selectedText) {
      const lines = selectedText.split('\n').filter(line => line.trim())
      const numberedList = lines.map((line, index) => `${index + 1}. ${line.trim()}`).join('\n')
      const newContent = content.substring(0, start) + numberedList + content.substring(end)
      onContentChange(newContent)
      
      setTimeout(() => {
        if (textAreaRef.current) {
          textAreaRef.current.selectionStart = start + numberedList.length
          textAreaRef.current.selectionEnd = start + numberedList.length
          textAreaRef.current.focus()
        }
      }, 0)
    } else {
      insertAtCursor('\n1. ')
    }
  }, [content, onContentChange, insertAtCursor])

  const handleInsertHeading = useCallback((level: number) => {
    const prefix = '#'.repeat(level) + ' '
    formatText(prefix, '', true)
  }, [formatText])

  // Link insertion handlers
  const handleInsertLink = useCallback((url: string, text: string) => {
    const linkMarkdown = `[${text}](${url})`
    insertAtCursor(linkMarkdown)
  }, [insertAtCursor])

  const handleInsertLinkEmbed = useCallback((url: string) => {
    const embedMarkdown = `[embed](${url})`
    insertAtCursor(`\n\n${embedMarkdown}\n\n`)
  }, [insertAtCursor])

  // Table insertion handler
  const handleInsertTable = useCallback((rows: number = 3, cols: number = 3) => {
    const headers = Array(cols).fill('Header').map((h, i) => `${h} ${i + 1}`).join(' | ')
    const separator = Array(cols).fill('---').join(' | ')
    const tableRows = Array(rows - 1).fill(null).map((_, rowIndex) => 
      Array(cols).fill('Cell').map((c, colIndex) => `${c} ${rowIndex + 1}-${colIndex + 1}`).join(' | ')
    )
    
    const tableMarkdown = [
      `| ${headers} |`,
      `| ${separator} |`,
      ...tableRows.map(row => `| ${row} |`)
    ].join('\n')
    
    insertAtCursor(`\n\n${tableMarkdown}\n\n`)
  }, [insertAtCursor])

  // AI table generation handler
  const handleGenerateTableFromContent = useCallback(async () => {
    const tablePrompt = `Based on the following content, create a relevant and useful markdown table that organizes or summarizes key information. The table should have appropriate headers and meaningful data extracted from the content. If the content doesn't contain tabular data, create a summary table or analysis table that would be helpful for understanding the content.

Content:
${content}

Please respond with only the markdown table, no additional text.`

    if (onAskAI) {
      const response = await onAskAI(tablePrompt)
      insertAtCursor(`\n\n${response}`)
    } else {
      insertAtCursor(`\n\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Data 1   | Data 2   | Data 3   |\n| Data 4   | Data 5   | Data 6   |`)
    }
  }, [content, onAskAI, insertAtCursor])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + K to open inline command palette
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      e.stopPropagation()
      const coords = getCursorCoordinates()
      setPalettePosition(coords)
      setShowCommandPalette(true)
      return
    }

    // Traditional formatting shortcuts
    if (e.metaKey || e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault()
          formatText('**', '**')
          return
        case 'i':
          e.preventDefault()
          formatText('*', '*')
          return
        case 'u':
          e.preventDefault()
          formatText('<u>', '</u>')
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
        const coords = getCursorCoordinates()
        setPalettePosition(coords)
        setShowCommandPalette(true)
        return
      }
    }

    // Handle ESC to close command palette
    if (e.key === 'Escape' && showCommandPalette) {
      e.preventDefault()
      e.stopPropagation()
      setShowCommandPalette(false)
      return
    }
  }, [content, getCursorCoordinates, showCommandPalette, formatText])

  // Handle content changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    const newCursorPosition = e.target.selectionStart
    
    onContentChange(newContent)
    setCursorPosition(newCursorPosition)
  }, [onContentChange])

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
          className="w-full h-full overflow-auto p-4 prose prose-sm dark:prose-invert prose-p:my-2 prose-headings:my-3 max-w-none cursor-text"
          onClick={() => setCurrentShowPreview(false)}
        >
          {content ? (
            <MarkdownRenderer content={content} />
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
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="w-full h-full min-h-[300px] resize-none p-4 text-base leading-relaxed 
            bg-background text-foreground placeholder:text-muted-foreground/50
            border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2
            transition-all duration-200 rounded-md
            transform-gpu will-change-contents"
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
        noteType={noteType}
      />
    </div>
  )
})

RichTextEditor.displayName = 'RichTextEditor' 