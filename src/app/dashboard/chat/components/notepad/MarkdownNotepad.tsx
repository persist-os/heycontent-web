'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Send, Copy } from 'lucide-react'
import { CreateNoteButton } from '@/components/ui/CreateNoteButton'
import { useTheme } from 'next-themes'
import { useAuth } from '@/app/context/auth-context'
import { useInlineAI } from '../../../notes/hooks/useInlineAI'
import { RichTextEditor } from '@/components/ui/rich-text-editor'

interface MarkdownNotepadProps {
  isOpen: boolean
  onClose: () => void
  onSendToChat?: (content: string) => void
  quotedContent?: string
  onClearQuoted?: () => void
  width: number
  onWidthChange: (width: number) => void
  style: React.CSSProperties
}

export function MarkdownNotepad({ 
  isOpen, 
  onClose, 
  onSendToChat, 
  quotedContent, 
  onClearQuoted, 
  width, 
  onWidthChange, 
  style 
}: MarkdownNotepadProps) {
  const [content, setContent] = useState('')
  const [isResizing, setIsResizing] = useState(false)
  const { theme } = useTheme()
  const { firebaseUser } = useAuth()
  const isDark = theme === 'dark'
  const accentBg = isDark ? 'bg-primary' : 'bg-purple-600'
  const accentBgHover = isDark ? 'hover:bg-primary/90' : 'hover:bg-purple-700'

  const { askAI, requestAnalysis, requestIdeas } = useInlineAI({
    noteContent: content,
    userId: firebaseUser?.uid ?? '',
  })

  // Handle quoted content insertion
  useEffect(() => {
    if (quotedContent && isOpen) {
      const quotedText = `> ${quotedContent.replace(/\n/g, '\n> ')}\n\n`
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

  // Handle resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      
      const newWidth = Math.max(280, Math.min(600, window.innerWidth - e.clientX))
      onWidthChange(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      const chatContainer = document.querySelector('[data-chat-container]') as HTMLElement
      if (chatContainer) {
        chatContainer.style.transition = 'margin-right 0.1s ease-out'
      }
    }

    if (isResizing) {
      const chatContainer = document.querySelector('[data-chat-container]') as HTMLElement
      if (chatContainer) {
        chatContainer.style.transition = 'none'
      }

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

  if (!isOpen) return null

  return (
    <div 
      className="fixed top-0 right-0 h-full bg-background border-l border-border z-40 flex flex-col shadow-lg"
      style={{ ...style, width: `${width}px` }}
    >
      {/* Resize Handle */}
      <div
        className={`absolute left-0 top-0 w-1 h-full cursor-col-resize ${isDark ? 'hover:bg-primary/20' : 'hover:bg-purple-600/20'} transition-colors group`}
        onMouseDown={(e) => {
          e.preventDefault()
          setIsResizing(true)
        }}
      >
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-border ${isDark ? 'group-hover:bg-primary' : 'group-hover:bg-purple-600'} transition-colors rounded-r-sm`} />
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
      <div className="flex-1 overflow-hidden">
        <RichTextEditor
          content={content}
          onContentChange={setContent}
          placeholder="Start writing... Messages will appear here."
          onAskAI={handleAskAI}
          onRequestAnalysis={handleRequestAnalysis}
          onRequestIdeas={handleRequestIdeas}
          userId={firebaseUser?.uid}
          className="h-full border-0"
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground/80 shrink-0">
        Markdown supported • ⌘K for AI assistant • ⌘B bold • ⌘I italic • ⌘U underline
      </div>
    </div>
  )
} 