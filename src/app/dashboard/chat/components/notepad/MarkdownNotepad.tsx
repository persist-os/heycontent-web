'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Send, Copy } from 'lucide-react'
import { CreateNoteButton } from '@/components/ui/CreateNoteButton'
import { useTheme } from 'next-themes'
import { useAuth } from '@/app/context/auth-context'
import { useInlineAI } from '../../../notes/hooks/useInlineAI'
import { InlineCommandPalette } from '../../../notes/components/InlineCommandPalette'

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
  const { firebaseUser } = useAuth()
  const isDark = theme === 'dark'
  const accentBg = isDark ? 'bg-primary' : 'bg-purple-600'
  const accentBgHover = isDark ? 'hover:bg-primary/90' : 'hover:bg-purple-700'

  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [palettePosition, setPalettePosition] = useState({ top: 0, left: 0 })

  const { askAI, requestAnalysis, requestIdeas } = useInlineAI({
    noteContent: content,
    userId: firebaseUser?.uid ?? '',
  })

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (quotedContent && isOpen) {
      const quotedText = `> ${quotedContent.replace(/\n/g, '\n> ')}\n\n`
      setContent(prev => prev + quotedText)
      onClearQuoted?.()
    }
  }, [quotedContent, isOpen, onClearQuoted])

  const getCursorCoordinates = useCallback(() => {
    if (!textareaRef.current) return { top: 100, left: 100 };
    
    const textarea = textareaRef.current;
    const rect = textarea.getBoundingClientRect();
    const start = textarea.selectionStart;
    const value = textarea.value;
    
    const textBeforeCursor = value.substring(0, start);
    const lines = textBeforeCursor.split('\n');
    const currentLineIndex = lines.length - 1;
    const currentLineText = lines[currentLineIndex] || '';
    
    const computed = window.getComputedStyle(textarea);
    const fontSize = parseInt(computed.fontSize, 10) || 16;
    const lineHeight = computed.lineHeight === 'normal' 
      ? fontSize * 1.2 
      : parseInt(computed.lineHeight, 10) || fontSize * 1.2;
    const paddingTop = parseInt(computed.paddingTop, 10) || 0;
    const paddingLeft = parseInt(computed.paddingLeft, 10) || 0;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = computed.font;
      const textWidth = ctx.measureText(currentLineText).width;
      
      const x = rect.left + paddingLeft + textWidth;
      const y = rect.top + paddingTop + (currentLineIndex * lineHeight) + lineHeight + 10;
      
      return {
        top: Math.min(y, window.innerHeight - 300),
        left: Math.min(x, window.innerWidth - 400)
      };
    }
    
    return { top: rect.top + 50, left: rect.left + 50 };
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + K to open inline command palette (only when textarea is focused)
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      e.stopPropagation(); // Prevent global command palette from opening
      const coords = getCursorCoordinates();
      setPalettePosition(coords);
      setShowCommandPalette(true);
      return;
    }

    // '/' at the start of a line to open command palette
    if (e.key === '/') {
      const textarea = textareaRef.current;
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const lineStart = content.lastIndexOf('\n', start - 1) + 1;
      const lineContent = content.substring(lineStart, start);
      
      // If we're at the start of a line or only whitespace before cursor
      if (lineContent.trim() === '') {
        e.preventDefault();
        e.stopPropagation(); // Prevent any potential conflicts
        const coords = getCursorCoordinates();
        setPalettePosition(coords);
        setShowCommandPalette(true);
        return;
      }
    }

    // Handle ESC to close command palette
    if (e.key === 'Escape' && showCommandPalette) {
      e.preventDefault();
      e.stopPropagation();
      setShowCommandPalette(false);
      return;
    }
  }, [content, getCursorCoordinates, showCommandPalette]);

  // Handle content changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  }, []);

  const insertAtCursor = useCallback((text: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newContent = content.substring(0, start) + text + content.substring(end);
    const newCursorPosition = start + text.length;
    
    setContent(newContent);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = newCursorPosition;
        textareaRef.current.selectionEnd = newCursorPosition;
        textareaRef.current.focus();
      }
    }, 0);
  }, [content]);

  const handleAskAI = useCallback(async (prompt: string) => {
    try {
      const response = await askAI(prompt);
      insertAtCursor(`\n\n${response}`);
    } catch (error) {
      console.error('Failed to get AI response:', error);
    }
  }, [askAI, insertAtCursor]);

  const handleRequestAnalysis = useCallback(async (noteType: string) => {
    try {
      const analysis = await requestAnalysis(noteType);
      insertAtCursor(`\n\n## Analysis\n\n${analysis}`);
    } catch (error) {
      console.error('Failed to get analysis:', error);
    }
  }, [requestAnalysis, insertAtCursor]);

  const handleRequestIdeas = useCallback(async () => {
    try {
      const ideas = await requestIdeas();
      const ideasText = ideas.map((idea, index) => `${index + 1}. ${idea}`).join('\n');
      insertAtCursor(`\n\n## Ideas\n\n${ideasText}`);
    } catch (error) {
      console.error('Failed to get ideas:', error);
    }
  }, [requestIdeas, insertAtCursor]);

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
        textareaRef.current?.select()
        document.execCommand('copy')
      }
    }
  }

  if (!isOpen) return null

  return (
    <>
    <div 
      className="fixed top-0 right-0 h-full bg-background border-l border-border z-40 flex flex-col shadow-lg"
      style={{ ...style, width: `${width}px` }}
    >
      <div
        className={`absolute left-0 top-0 w-1 h-full cursor-col-resize ${isDark ? 'hover:bg-primary/20' : 'hover:bg-purple-600/20'} transition-colors group`}
        onMouseDown={(e) => {
          e.preventDefault()
          setIsResizing(true)
        }}
      >
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-border ${isDark ? 'group-hover:bg-primary' : 'group-hover:bg-purple-600'} transition-colors rounded-r-sm`} />
      </div>
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

      <div className="flex-1">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Start writing...

**bold** *italic* `code` 
> quotes and lists supported

⌘K or / to open inline AI assistant. Referenced messages appear here."
          className="w-full h-full resize-none p-4 text-base leading-relaxed border-0 focus:outline-none focus:ring-0 bg-background text-foreground placeholder:text-muted-foreground/60"
        />
      </div>

      <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground/80 shrink-0">
        Markdown supported
      </div>
    </div>
    
         {/* Render command palette as portal to document body to avoid z-index issues */}
     {typeof window !== 'undefined' && showCommandPalette && createPortal(
       <InlineCommandPalette
         isOpen={showCommandPalette}
         onClose={() => setShowCommandPalette(false)}
         position={palettePosition}
         onAskAI={handleAskAI}
         onRequestAnalysis={handleRequestAnalysis}
         onRequestIdeas={handleRequestIdeas}
       />,
       document.body
     )}
  </>
  )
} 