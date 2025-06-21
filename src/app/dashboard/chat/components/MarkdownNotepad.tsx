'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Copy, Sparkles } from 'lucide-react'
import { CreateNoteButton } from '@/components/ui/CreateNoteButton'
import { useTheme } from 'next-themes'

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

export function MarkdownNotepad({ isOpen, onClose, onSendToChat, quotedContent, onClearQuoted, width, onWidthChange, style }: MarkdownNotepadProps) {
  const [content, setContent] = useState('')
  const [isResizing, setIsResizing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const accentColor = isDark ? 'text-primary' : 'text-purple-600'
  const accentBg = isDark ? 'bg-primary' : 'bg-purple-600'
  const accentBgHover = isDark ? 'hover:bg-primary/90' : 'hover:bg-purple-700'

  // Auto-focus when opened
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isOpen])

  // Handle quoted content
  useEffect(() => {
    if (quotedContent && isOpen) {
      const quotedText = `> ${quotedContent.replace(/\n/g, '\n> ')}\n\n`
      setContent(prev => prev + quotedText)
      onClearQuoted?.()
    }
  }, [quotedContent, isOpen, onClearQuoted])

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  // Handle resize drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      
      const newWidth = Math.max(280, Math.min(600, window.innerWidth - e.clientX))
      onWidthChange(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      // Re-enable transitions on the chat container
      const chatContainer = document.querySelector('[data-chat-container]') as HTMLElement
      if (chatContainer) {
        chatContainer.style.transition = 'margin-right 0.1s ease-out'
      }
    }

    if (isResizing) {
      // Disable transitions on the chat container during resize
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
    textareaRef.current?.focus()
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
        textareaRef.current?.select()
        document.execCommand('copy')
      }
    }
  }

  // Check if content is substantial enough for smart features
  const hasSmartContent = content.trim().length >= 10;

  if (!isOpen) return null

  return (
    <div 
      className="fixed top-0 right-0 h-full bg-background border-l border-border z-30 flex flex-col shadow-lg"
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
          {hasSmartContent && (
            <div className={`flex items-center gap-1 text-xs ${accentColor}`}>
              <Sparkles className="w-3 h-3" />
              <span>AI Ready</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {/* Create Note Button */}
          <CreateNoteButton
            content={content}
            onNoteCreate={onClose}
            title={hasSmartContent ? "Create smart note with AI-generated title" : "Create a new note"}
            className={hasSmartContent ? `${isDark ? 'bg-primary/10 text-primary' : 'bg-purple-600/10 text-purple-600'}` : ""}
          >
            {hasSmartContent ? (
              <>
                <Sparkles className="w-4 h-4 mr-1" />
                Smart Note
              </>
            ) : (
              "Create Note"
            )}
          </CreateNoteButton>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            disabled={!content.trim()}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
            aria-label="Copy content"
            title="Copy content"
          >
            <Copy className="w-4 h-4" />
          </button>
          
          {/* Clear Button */}
          <button
            onClick={handleClear}
            className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground rounded-md transition-colors hover:bg-muted"
            title="Clear content"
          >
            Clear
          </button>
          
          {/* Send to Chat Button */}
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
          
          {/* Close Button */}
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

      {/* Smart Features Hint */}
      {hasSmartContent && (
        <div className={`px-4 py-2 ${isDark ? 'bg-primary/5' : 'bg-purple-600/5'} border-b border-border text-xs`}>
          <div className={`flex items-center gap-2 ${accentColor}`}>
            <Sparkles className="w-3 h-3" />
            <span>AI will generate a smart title and classify your note type</span>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing...

**bold** *italic* `code` 
> quotes and lists supported

Referenced messages appear here when notepad is open."
          className="w-full h-full resize-none p-4 text-base leading-relaxed border-0 focus:outline-none focus:ring-0 bg-background text-foreground placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Footer info */}
      <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground/80 shrink-0">
        {hasSmartContent ? "Smart features enabled • Markdown supported" : "Temporary • Markdown supported"}
      </div>
    </div>
  )
} 