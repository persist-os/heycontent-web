'use client'

import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'
import { X, Send, Copy } from 'lucide-react'
import { CreateNoteButton } from '@/components/ui/CreateNoteButton'
import { useTheme } from 'next-themes'
import { useAuth } from '@/app/context/auth-context'
import { useInlineAI } from '../../../notes/hooks/useInlineAI'
import { RichTextEditor } from '@/components/ui/rich-text-editor/rich-text-editor'

interface MarkdownNotepadProps {
  isOpen: boolean
  onClose: () => void
  onSendToChat?: (content: string) => void
  quotedContent?: string
  onClearQuoted?: () => void
  width: number
  onWidthChange: (width: number) => void
  style: React.CSSProperties
  // Note linking
  availableNotes?: Array<{ _id: string; title: string; type: string }>
  onLinkNote?: (noteId: string) => void
}

export const MarkdownNotepad = forwardRef(function MarkdownNotepad({ 
  isOpen, 
  onClose, 
  onSendToChat, 
  quotedContent, 
  onClearQuoted, 
  width, 
  onWidthChange, 
  style,
  availableNotes = [],
  onLinkNote
}: MarkdownNotepadProps, ref) {
  const [content, setContent] = useState('')
  const [isResizing, setIsResizing] = useState(false)
  const resizeStartX = useRef<number>(0)
  const resizeStartWidth = useRef<number>(0)
  const { theme } = useTheme()
  const { firebaseUser } = useAuth()
  const isDark = theme === 'dark'
  const accentBg = isDark ? 'bg-primary' : 'bg-purple-600'
  const accentBgHover = isDark ? 'hover:bg-primary/90' : 'hover:bg-purple-700'

  // --- Add sidebar container ref ---
  const sidebarRef = useRef<HTMLDivElement>(null)

  const { askAI, requestAnalysis, requestIdeas } = useInlineAI({
    noteContent: content,
    userId: firebaseUser?.uid ?? '',
  })

  // Handle quoted content insertion
  useEffect(() => {
    if (quotedContent && isOpen) {
      // Remove only leading/trailing quotes while preserving all markdown formatting (bold, italics, etc.) and newlines
      let cleanedContent = quotedContent.replace(/^['"]|['"]$/g, '').trim()
      // Remove leading '>' and whitespace from each line
      cleanedContent = cleanedContent
        .split('\n')
        .map(line => line.replace(/^\s*>\s?/, ''))
        .join('\n')
      const quotedText = `${cleanedContent}\n\n`
      setContent(prev => prev + quotedText)
      onClearQuoted?.()
    }
  }, [quotedContent, isOpen, onClearQuoted])

  // AI handlers that return values for RichTextEditor
  const handleAskAI = useCallback(async (prompt: string) => {
    try {
      const response = await askAI(prompt)
      return response
    } catch (error) {
      console.error('Failed to get AI response:', error)
      throw error
    }
  }, [askAI])

  const handleRequestAnalysis = useCallback(async (noteType: string) => {
    try {
      const analysis = await requestAnalysis(noteType)
      return analysis
    } catch (error) {
      console.error('Failed to get analysis:', error)
      throw error
    }
  }, [requestAnalysis])

  const handleRequestIdeas = useCallback(async () => {
    try {
      const ideas = await requestIdeas()
      return ideas
    } catch (error) {
      console.error('Failed to get ideas:', error)
      throw error
    }
  }, [requestIdeas])

  // Handle resizing with improved logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      
      // Calculate the change in X position since resize started
      const deltaX = resizeStartX.current - e.clientX
      // Apply delta to the starting width
      const newWidth = Math.max(300, Math.min(800, resizeStartWidth.current + deltaX))
      onWidthChange(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isResizing, onWidthChange])

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    resizeStartX.current = e.clientX
    resizeStartWidth.current = width
    setIsResizing(true)
  }, [width])

  const handleClear = () => {
    setContent('')
  }

  const handleSendToChat = () => {
    if (content.trim() && onSendToChat) {
      onSendToChat(content.trim())
      onClose()
    }
  }

  const handleCopy = async () => {
    if (content.trim()) {
      try {
        await navigator.clipboard.writeText(content)
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = content
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
    }
  }

  // Expose hasUnsavedContent to parent
  useImperativeHandle(ref, () => ({
    hasUnsavedContent: () => !!content.trim(),
    clearContent: () => setContent(''),
    getContent: () => content || '',
  }), [content]);

  if (!isOpen) return null

  return (
    <div 
      ref={sidebarRef}
      className="fixed top-0 right-0 h-full bg-background border-l border-border z-40 flex flex-col shadow-lg"
      style={{ ...style, width: `${width}px` }}
    >
      {/* Resize Handle */}
      <div
        className={`absolute left-0 top-0 w-2 h-full cursor-col-resize z-50 ${isDark ? 'hover:bg-primary/10' : 'hover:bg-purple-600/10'} transition-colors group flex items-center justify-center`}
        onMouseDown={handleResizeStart}
      >
        {/* Visual indicator for the resize handle */}
        <div className={`w-0.5 h-8 bg-border ${isDark ? 'group-hover:bg-primary/50' : 'group-hover:bg-purple-600/50'} transition-colors rounded-full`} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground">
            Smart Notes
          </h3>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            disabled={!content.trim()}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
            aria-label="Copy content"
            title="Copy content"
          >
            <Copy className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleClear}
            className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground rounded-md transition-colors hover:bg-muted"
            title="Clear content"
          >
            Clear
          </button>
          
          <CreateNoteButton content={content} onNoteCreate={handleClear} />

          {onSendToChat && (
            <button
              onClick={handleSendToChat}
              disabled={!content.trim()}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs ${accentBg} ${accentBgHover} text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium`}
              title="Send to chat"
            >
              <Send className="w-3 h-3" />
              Send
            </button>
          )}
          
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded transition-colors"
            aria-label="Close notepad"
            title="Close notepad"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Rich Text Editor */}
      <div className="flex-1 overflow-auto relative">
        <RichTextEditor
          content={content}
          onContentChange={setContent}
          placeholder="Start writing... Messages will appear here."
          onAskAI={handleAskAI}
          onRequestAnalysis={handleRequestAnalysis}
          onRequestIdeas={handleRequestIdeas}
          userId={firebaseUser?.uid}
          availableNotes={availableNotes}
          onLinkNote={onLinkNote}
          className="h-full border-0"
          containerRef={sidebarRef}
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground/80 shrink-0">
        Markdown supported • ⌘K for AI assistant • @ to link notes • ⌘B bold • ⌘I italic • ⌘U underline
      </div>
    </div>
  )
}) 