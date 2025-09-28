'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { UnifiedContentSelector } from '@/components/ui/UnifiedContentSelector';
import { useAuth } from '@/app/context/auth-context'
import { useTheme } from 'next-themes';
import { Brain, Send, Loader2, MessageSquare, FileText, Search, Paperclip, Upload, X } from 'lucide-react'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { cn } from '@/lib/utils'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Message } from '@/app/types/chat'
import { uploadFile } from '@/lib/file-upload'

interface ChatInputProps {
  onSend: (message: string, fileAttachments?: any[]) => void
  isLoading?: boolean
  inputRef?: React.RefObject<HTMLTextAreaElement>
  maxLength?: number
  referencedMessage?: Message | null
  onClearReference?: () => void
  autoFocus?: boolean
  hasContext?: boolean
  contextPlatform?: string
  hasAnalysis?: boolean
  inputValue?: string
  onInputChange?: (value: string) => void
  notepadOpen?: boolean
  openNotepad?: () => void
  quotedForNotepad?: string
  onClearQuoted?: () => void
  disabled?: boolean
  currentTab?: string // Add currentTab prop for tab-specific @ linking
  sessionId?: string | null // Add sessionId prop for file uploads
  // Mobile props
  isMobile?: boolean
  activeTab?: 'chat' | 'notes'
}

const placeholders = [
  "What should I focus on next?",
  "Analyze audience growth...",
  "Get partnership recommendations...",
  "Optimize engagement...",
]

const contextPlaceholders = [
  "Ask about this content's analysis...",
  "What insights can you share?",
  "How can I improve this content?",
  "What trends do you see?",
]

export function ChatInput({
  onSend,
  isLoading,
  inputRef,
  maxLength = 5000,
  referencedMessage,
  onClearReference,
  autoFocus = true,
  hasContext = false,
  contextPlatform,
  hasAnalysis = false,
  inputValue,
  onInputChange,
  notepadOpen = false,
  openNotepad,
  quotedForNotepad,
  onClearQuoted,
  disabled = false,
  currentTab = 'all',
  sessionId = null,
  isMobile = false,
  activeTab = 'chat'
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const [placeholder, setPlaceholder] = useState(placeholders[0])
  const [showFullReply, setShowFullReply] = useState(false)
  const internalInputRef = useRef<HTMLTextAreaElement>(null)
  const textareaRef = inputRef || internalInputRef
  const { theme } = useTheme()
  
  // @ functionality state
  const [showEnhancedContentSelector, setShowEnhancedContentSelector] = useState(false)
  const [contentSelectorPosition, setContentSelectorPosition] = useState({ top: 100, left: 100 })
  const [contentSearchTerm, setContentSearchTerm] = useState('')
  
  // File upload state - changed to support multiple files
  const [attachedFiles, setAttachedFiles] = useState<Array<{
    file: File;
    id: string;
    isUploading?: boolean;
    uploadError?: string;
  }>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Get current user ID from API key
  const userId = getCurrentUserId()
  
  // Fetch unified content using platformRouter (same as UnifiedContentSelector)
  const allUnifiedContent = useQuery(
    api.platformRouter.getAllUnifiedContent,
    userId ? { 
      userId,
      platforms: currentTab !== 'all' ? [currentTab] : undefined,
      limit: 200 
    } : "skip"
  );

  // Transform unified content to the format expected by chat-input
  const allLinkableContent = useMemo(() => {
    if (!allUnifiedContent) return [];
    
    return allUnifiedContent.map(item => ({
      id: item.id, // Already in standardized format: platform:actualId
      title: item.title,
      content: item.content,
      type: item.platform, // 'youtube', 'instagram', 'gmail', 'notes', 'conversations', 'insights'
      metadata: item.metadata,
      originalDocument: item.originalDocument
    }));
  }, [allUnifiedContent]);

  const isContentLoading = !userId || allUnifiedContent === undefined;
  
  // Theme-aware accent colors
  const isDark = theme === 'dark'
  const accentColor = isDark ? 'text-accent' : 'text-purple-600'
  const accentBg = isDark ? 'bg-accent' : 'bg-purple-600'
  const accentBgHover = isDark ? 'hover:bg-accent/90' : 'hover:bg-purple-700'
  const accentBgLight = isDark ? 'bg-accent/10' : 'bg-purple-600/10'
  const accentBorder = isDark ? 'border-accent' : 'border-purple-600'
  const accentFocusBorder = isDark ? 'focus-within:border-accent' : 'focus-within:border-purple-600'

  // Use external input value if provided, otherwise use internal state
  const currentInput = inputValue !== undefined ? inputValue : input
  const setCurrentInput = (value: string) => {
    if (inputValue !== undefined) {
      onInputChange?.(value)
    } else {
      setInput(value)
    }
  }

  // Handle linking content from the selector
  const handleLinkContent = useCallback((contentId: string) => {
    if (!textareaRef.current) return
    const textarea = textareaRef.current
    const cursorPos = textarea.selectionStart
    const textBeforeCursor = textarea.value.substring(0, cursorPos)
    const atSymbolIndex = textBeforeCursor.lastIndexOf('@')
    if (atSymbolIndex === -1) return
    
    const linkedContent = allLinkableContent?.find(item => item.id === contentId)
    if (!linkedContent) return
    
    // Get the title and create a truncated version for display with brackets
    const title = linkedContent.title || 'Untitled'
    const truncatedTitle = title.replace(/\n/g, ' ').substring(0, 20) + (title.length > 20 ? '...' : '')
    
    // Replace the @ symbol with the truncated title in brackets for better clarity
    const textAfterCursor = textarea.value.substring(cursorPos)
    const newText = textarea.value.substring(0, atSymbolIndex) + `@[${truncatedTitle}]` + textAfterCursor
    
    setCurrentInput(newText)
    
    // Position cursor after the inserted content
    const newCursorPos = atSymbolIndex + `@[${truncatedTitle}]`.length
    textarea.setSelectionRange(newCursorPos, newCursorPos)
    
    setShowEnhancedContentSelector(false)
    setContentSearchTerm('')
  }, [textareaRef, allLinkableContent])

  // File upload handlers - modified to add files to current message
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const newFiles = Array.from(files).map(file => {
        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
          return {
            file,
            id: Math.random().toString(36).substr(2, 9),
            uploadError: 'File size must be less than 10MB'
          }
        }
        
        // Validate file type (allow common document and image types)
        const allowedTypes = [
          'text/plain',
          'text/csv',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'text/markdown'
        ]
        
        if (!allowedTypes.includes(file.type)) {
          return {
            file,
            id: Math.random().toString(36).substr(2, 9),
            uploadError: 'File type not supported. Please upload a document or image.'
          }
        }
        
        return {
          file,
          id: Math.random().toString(36).substr(2, 9)
        }
      })
      
      setAttachedFiles(prev => [...prev, ...newFiles])
    }
    
    // Clear the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Remove individual attached file
  const handleRemoveAttachedFile = useCallback((fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId))
  }, [])

  const handleFileButtonClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Handle textarea changes
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setCurrentInput(newValue)
  }, [setCurrentInput])

  // Handle textarea selection to prevent cursor inside links
  const handleTextareaSelect = useCallback((e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    // Simple cursor positioning - no complex link handling needed
  }, [])

  // Use context-aware placeholders when analysis is available
  const activePlaceholders = hasAnalysis ? contextPlaceholders : placeholders

  // Rotate placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholder(prev => {
        const currentIndex = activePlaceholders.indexOf(prev)
        const nextIndex = (currentIndex + 1) % activePlaceholders.length
        return activePlaceholders[nextIndex] || activePlaceholders[0]
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [activePlaceholders])

  // Update placeholder when context changes
  useEffect(() => {
    setPlaceholder(activePlaceholders[0])
  }, [hasAnalysis, activePlaceholders])

  // Auto-resize textarea and sync display div
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const scrollHeight = Math.min(textarea.scrollHeight, 120) // Max height of ~3 lines
      textarea.style.height = `${scrollHeight}px`
    }
  }, [currentInput, textareaRef])

  // Auto-focus effect
  useEffect(() => {
    if (autoFocus && textareaRef.current && !isLoading) {
      textareaRef.current.focus()
    }
  }, [autoFocus, isLoading, referencedMessage, textareaRef])

  // Get cursor coordinates for content selector positioning
  const getCursorCoordinates = useCallback((textarea: HTMLTextAreaElement) => {
    const rect = textarea.getBoundingClientRect()
    const style = window.getComputedStyle(textarea)
    const lineHeight = parseInt(style.lineHeight) || 20
    const paddingTop = parseInt(style.paddingTop) || 0
    const paddingLeft = parseInt(style.paddingLeft) || 0
    
    const text = textarea.value.substring(0, textarea.selectionStart)
    const lines = text.split('\n')
    const currentLine = lines[lines.length - 1]
    const lineNumber = lines.length
    
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) return { top: 0, left: 0 }
    
    context.font = style.font
    const textWidth = context.measureText(currentLine).width
    
    const cursorTop = rect.top + paddingTop + (lineNumber * lineHeight)
    const cursorLeft = rect.left + paddingLeft + textWidth
    
    // Check if there's enough space below the cursor
    const selectorHeight = 400 // Approximate height of the content selector
    const margin = 20
    const spaceBelow = window.innerHeight - cursorTop - margin
    const spaceAbove = cursorTop - margin
    
    // Position above cursor if there's not enough space below
    const finalTop = spaceBelow < selectorHeight && spaceAbove > selectorHeight 
      ? cursorTop - selectorHeight - 10 // Position above with 10px gap
      : cursorTop + 10 // Position below with 10px gap
    
    return {
      top: Math.max(margin, finalTop),
      left: Math.max(margin, Math.min(cursorLeft, window.innerWidth - 600 - margin)) // Ensure it doesn't go off-screen horizontally
    }
  }, [])

  // Function to convert numeric indices to content IDs
  const convertNumericIndicesToContentIds = (text: string): string => {
    // No conversion needed - we use direct content IDs now
    return text
  }

  // Function to convert truncated titles back to content IDs
  const convertTitlesToContentIds = useCallback((text: string): string => {
    if (!allLinkableContent) return text
    
    // Find all @[Title] patterns and convert them back to @[contentId]@ format
    let convertedText = text
    
    allLinkableContent.forEach(content => {
      const title = content.title || 'Untitled'
      const truncatedTitle = title.replace(/\n/g, ' ').substring(0, 20) + (title.length > 20 ? '...' : '')
      
      // Replace @[TruncatedTitle] with @[contentId]@
      const titlePattern = new RegExp(`@\\[${truncatedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g')
      convertedText = convertedText.replace(titlePattern, `@[${content.id}]@`)
    })
    
    return convertedText
  }, [allLinkableContent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔔 [CHAT INPUT] handleSubmit called:', {
      hasContent: !!currentInput.trim(),
      isLoading,
      inputLength: currentInput.length,
      maxLength,
      attachedFilesCount: attachedFiles.length
    })
    
    if ((currentInput.trim() || attachedFiles.length > 0) && !isLoading && currentInput.length <= maxLength) {
      let fileAttachments: any[] = []
      
      // Upload all attached files if any
      if (attachedFiles.length > 0 && userId) {
        console.log('🔗 [CHAT INPUT] Starting file upload process:', {
          attachedFilesCount: attachedFiles.length,
          userId,
          sessionId
        })
        try {
          const uploadPromises = attachedFiles
            .filter(f => !f.uploadError) // Only upload files without errors
            .map(async (attachedFile) => {
              console.log('🔗 [CHAT INPUT] Uploading file:', {
                fileName: attachedFile.file.name,
                fileSize: attachedFile.file.size,
                fileType: attachedFile.file.type
              })
              const uploadResponse = await uploadFile(attachedFile.file, userId, sessionId)
              console.log('🔗 [CHAT INPUT] File upload successful:', {
                fileId: uploadResponse.file_metadata.file_id,
                originalFilename: uploadResponse.file_metadata.original_filename
              })
              return {
                file_id: uploadResponse.file_metadata.file_id,
                original_filename: uploadResponse.file_metadata.original_filename,
                content_type: uploadResponse.file_metadata.content_type,
                file_size: uploadResponse.file_metadata.file_size,
                gcs_url: uploadResponse.file_metadata.gcs_url,
                uploaded_at: uploadResponse.file_metadata.uploaded_at
              }
            })
          
          fileAttachments = await Promise.all(uploadPromises)
          console.log('🔗 [CHAT INPUT] All files uploaded successfully:', {
            fileAttachmentsCount: fileAttachments.length,
            fileAttachments: fileAttachments
          })
        } catch (error) {
          console.error('🔗 [CHAT INPUT] Error uploading files:', error)
          // Continue with message even if file upload fails
        }
      } else {
        console.log('🔗 [CHAT INPUT] No files to upload:', {
          attachedFilesCount: attachedFiles.length,
          hasUserId: !!userId
        })
      }
      
      // Convert truncated titles back to content IDs before sending
      const processedMessage = convertTitlesToContentIds(currentInput.trim())
      console.log('🔔 [CHAT INPUT] Sending message:', {
        originalMessage: currentInput.trim(),
        processedMessage,
        fileAttachments
      })
      
      onSend(processedMessage, fileAttachments)
      setCurrentInput('')
      setAttachedFiles([]) // Clear attached files after sending
    }
  }

  // Override reference handling when notepad is open
  const handleReferenceClick = () => {
    if (notepadOpen && referencedMessage && quotedForNotepad !== undefined) {
      // Add to notepad logic is handled by parent
      if (onClearQuoted) {
        onClearQuoted()
      }
      onClearReference?.()
    }
  }

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow new line with Shift+Enter
        return
      } else {
        // Send message with Enter
        e.preventDefault()
        if ((!currentInput.trim() && attachedFiles.length === 0) || isLoading || characterCount >= maxLength) return
        
        let fileAttachments: any[] = []
        
        // Upload all attached files if any
        if (attachedFiles.length > 0 && userId) {
          console.log('🔗 [CHAT INPUT] Starting file upload process (Enter key):', {
            attachedFilesCount: attachedFiles.length,
            userId,
            sessionId
          })
          try {
            const uploadPromises = attachedFiles
              .filter(f => !f.uploadError) // Only upload files without errors
              .map(async (attachedFile) => {
                console.log('🔗 [CHAT INPUT] Uploading file (Enter key):', {
                  fileName: attachedFile.file.name,
                  fileSize: attachedFile.file.size,
                  fileType: attachedFile.file.type
                })
                const uploadResponse = await uploadFile(attachedFile.file, userId, sessionId)
                console.log('🔗 [CHAT INPUT] File upload successful (Enter key):', {
                  fileId: uploadResponse.file_metadata.file_id,
                  originalFilename: uploadResponse.file_metadata.original_filename
                })
                return {
                  file_id: uploadResponse.file_metadata.file_id,
                  original_filename: uploadResponse.file_metadata.original_filename,
                  content_type: uploadResponse.file_metadata.content_type,
                  file_size: uploadResponse.file_metadata.file_size,
                  gcs_url: uploadResponse.file_metadata.gcs_url,
                  uploaded_at: uploadResponse.file_metadata.uploaded_at
                }
              })
            
            fileAttachments = await Promise.all(uploadPromises)
            console.log('🔗 [CHAT INPUT] All files uploaded successfully (Enter key):', {
              fileAttachmentsCount: fileAttachments.length,
              fileAttachments: fileAttachments
            })
          } catch (error) {
            console.error('🔗 [CHAT INPUT] Error uploading files (Enter key):', error)
            // Continue with message even if file upload fails
          }
        } else {
          console.log('🔗 [CHAT INPUT] No files to upload (Enter key):', {
            attachedFilesCount: attachedFiles.length,
            hasUserId: !!userId
          })
        }
        
        // Convert truncated titles back to content IDs before sending
        const processedMessage = convertTitlesToContentIds(currentInput.trim())
        onSend(processedMessage, fileAttachments)
        setCurrentInput('')
        setAttachedFiles([]) // Clear attached files after sending
      }
    }

    // '@' to open content linking selector
    if (e.key === '@') {
      // Let the @ be typed first, then open selector
      setTimeout(() => {
        if (textareaRef.current) {
          const coords = getCursorCoordinates(textareaRef.current)
          setContentSelectorPosition(coords)
          setShowEnhancedContentSelector(true)
          setContentSearchTerm('')
        }
      }, 10) // Slightly longer delay to ensure @ is typed and cursor updated
      return
    }

    // Handle ESC to close content selector
    if (e.key === 'Escape' && showEnhancedContentSelector) {
      e.preventDefault()
      e.stopPropagation()
      setShowEnhancedContentSelector(false)
      return
    }
  }

  const characterCount = currentInput.length
  const isNearLimit = characterCount > maxLength * 0.8
  const isAtLimit = characterCount >= maxLength

  // Dynamic placeholder based on context
  let contextPlaceholder = placeholder
  if (hasContext && contextPlatform) {
    if (contextPlatform === 'ai-insights') {
      contextPlaceholder = "Ask about these insights..."
    } else if (contextPlatform === 'smart-notes') {
      contextPlaceholder = "Ask about your notes..."
    } else {
      contextPlaceholder = `Ask about your ${contextPlatform} content...`
    }
  } else if (hasAnalysis) {
    contextPlaceholder = "Ask me anything about your content..."
  }

  return (
    <div className="shrink-0 bg-background relative">
      <form onSubmit={handleSubmit} className="p-2 sm:p-3">
        {/* Context indicator */}
        {hasContext && (
          <div className="w-full mb-2">
            <div className={`flex items-center gap-2 text-xs p-2 rounded-lg border ${
              hasAnalysis 
                ? `${accentColor} ${accentBgLight} border-${accentBorder.split('-')[1]}/20`
                : `${accentColor} ${accentBgLight} border-${accentBorder.split('-')[1]}/20`
            }`}>
              <Search className="w-4 h-4 flex-shrink-0" />
              <span className="break-words">
                {hasAnalysis 
                  ? `AI analysis for this ${contextPlatform} content will be included as context`
                  : `Discussing ${contextPlatform} content`
                }
              </span>
            </div>
          </div>
        )}

        {/* Reference preview */}
        {referencedMessage && !notepadOpen && (
          <div className="w-full mb-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-muted/80 p-2 rounded-lg border border-border/50 min-w-0">
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <button 
                onClick={() => setShowFullReply(!showFullReply)}
                className="flex-1 text-left hover:text-foreground transition-colors min-w-0"
              >
                <span className={showFullReply ? "break-words whitespace-pre-wrap min-w-0" : "truncate block min-w-0"}>
                  Replying to: {showFullReply 
                    ? referencedMessage.content 
                    : referencedMessage.content.length > 60 
                      ? `${referencedMessage.content.slice(0, 60)}...` 
                      : referencedMessage.content}
                </span>
              </button>
              <button
                onClick={() => {
                  setShowFullReply(false)
                  onClearReference?.()
                }}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted flex-shrink-0 transition-colors"
                aria-label="Clear reply"
              >
                <span className="text-base font-medium">×</span>
              </button>
            </div>
          </div>
        )}

        {/* Reference notification when notepad is open */}
        {referencedMessage && notepadOpen && (
          <div className="w-full mb-2">
            <div className="flex items-center gap-3 text-xs text-foreground bg-muted/50 p-3 rounded-lg border border-border/50">
              <FileText className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              <button 
                onClick={handleReferenceClick}
                className="flex-1 text-left hover:text-foreground transition-colors font-medium"
              >
                Add quote to notepad
              </button>
              <button
                onClick={() => {
                  setShowFullReply(false)
                  onClearReference?.()
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
                aria-label="Clear reply"
              >
                <span className="text-sm">×</span>
              </button>
            </div>
          </div>
        )}

        {/* Attached files display - above text input */}
        {attachedFiles.length > 0 && (
          <div className="mb-3 p-3 bg-muted/30 rounded-lg border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <Paperclip className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Attached files ({attachedFiles.length})
              </span>
            </div>
            <div className="space-y-2">
              {attachedFiles.map((attachedFile) => (
                <div key={attachedFile.id} className="flex items-center gap-3 p-2 bg-background/50 rounded-md border border-border/20">
                  <div className="flex-shrink-0">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {attachedFile.file.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(attachedFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                    {attachedFile.uploadError && (
                      <div className="text-xs text-destructive mt-1">
                        {attachedFile.uploadError}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveAttachedFile(attachedFile.id)}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                    title="Remove file"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 items-end w-full relative">
          <div className={`
            flex-1 relative rounded-xl transition-all duration-200
            focus-within:bg-background
          `}>
            {/* Top section - Text input area */}
            <div className={`flex items-center rounded-t-xl bg-muted/50
              pl-3 py-2 pr-3
            `}>
              <textarea
                ref={textareaRef}
                value={currentInput}
                onChange={handleTextareaChange}
                placeholder={contextPlaceholder}
                className="text-base leading-relaxed flex-1 bg-transparent border-0 outline-0 resize-none placeholder:text-muted-foreground chat-font 
                [&::-webkit-scrollbar]:w-2 
                [&::-webkit-scrollbar]:h-2
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-border 
                [&::-webkit-scrollbar-thumb]:rounded-full 
                [&::-webkit-scrollbar-thumb]:border-transparent
                [&::-webkit-scrollbar-thumb]:bg-clip-padding
                hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50
                [&::-webkit-scrollbar-corner]:bg-transparent
                [scrollbar-width:thin]
                [scrollbar-color:hsl(var(--border))_transparent]"
                disabled={isLoading || disabled}
                onKeyDown={handleKeyDown}
                onSelect={handleTextareaSelect}
                maxLength={maxLength}
                data-chat-input
              />
            </div>

            {/* Bottom section - Buttons area */}
            <div className={`flex items-center justify-between rounded-b-xl
              px-3 py-2 h-10
            `}>
              {/* Left side - empty now, toggles moved to top bar */}
              <div className="flex items-center">
              </div>

              {/* Right side - Character count, Notes, Send */}
              <div className="flex items-center gap-2">
                {/* Character count */}
                {!isLoading && (
                  <div className={`text-xs
                    ${isAtLimit ? 'text-destructive font-medium' : ''}
                    ${isNearLimit && !isAtLimit ? 'text-warning font-medium' : 'text-muted-foreground'}
                    transition-colors duration-200
                  `}>
                    {characterCount.toLocaleString()}/{maxLength.toLocaleString()}
                  </div>
                )}
                
                {/* File upload button */}
                <button
                  type="button"
                  onClick={handleFileButtonClick}
                  aria-label="Upload file"
                  title="Upload file"
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </button>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".txt,.csv,.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.md"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Notepad button */}
                {openNotepad && (
                  <button
                    type="button"
                    onClick={openNotepad}
                    aria-label="Open markdown notepad"
                    title="Open markdown notepad"
                    data-notepad-button
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Send button */}
                <button
                  type="submit"
                  aria-label="Send message"
                  disabled={isLoading || !currentInput.trim() || isAtLimit || disabled}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200
                    ${isLoading || !currentInput.trim() || isAtLimit || disabled 
                      ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                      : `${accentBg} text-white ${accentBgHover} shadow-sm hover:shadow-md hover:scale-105 active:scale-95`
                    }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-1.5 text-xs text-muted-foreground text-center">
          Press Enter to send, Shift+Enter for new line, @ to link content
        </div>
        
        
        {/* Temporary shadow text display - only in development */}
        {/* Shadow text debug UI removed for production cleanup */}
      </form>

      {/* Enhanced Content Selector */}
      <UnifiedContentSelector
        mode="link"
        isOpen={showEnhancedContentSelector}
        onClose={() => setShowEnhancedContentSelector(false)}
        onSelect={handleLinkContent}
        position={contentSelectorPosition}
        searchTerm={contentSearchTerm}
        onSearchChange={setContentSearchTerm}
        currentTab={currentTab}
      />
    </div>
  )
}