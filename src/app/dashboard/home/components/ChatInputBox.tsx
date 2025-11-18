'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import { AtSign, Paperclip, Send, Mic, X, FlaskConical, Home, FolderOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { cn } from '@/lib/utils'
import { uploadFile, formatFileSize, getFileTypeIcon, type FileUploadResponse } from '@/lib/file-upload'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { T } from '@/components/translation/T'
import { useTranslation } from '@/hooks/useTranslation'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

interface ChatInputBoxProps {
  value: string
  onChange: (value: string) => void
  onSend: (message: string, fileAttachments?: FileUploadResponse[]) => void
  isLoading?: boolean
  conversationId?: string | null
}

/**
 * ChatInputBox - Main chat interface input
 * 
 * Features:
 * - Gradient background (amber to blue)
 * - Glassmorphism effect
 * - Action icons (@mention, attach, voice, send)
 * - Open in Thinking Lab button (when conversationId available)
 * - Controlled component for chat integration
 */
export function ChatInputBox({ value, onChange, onSend, isLoading = false, conversationId }: ChatInputBoxProps) {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [fileAttachments, setFileAttachments] = useState<FileUploadResponse[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Translations for aria-labels and titles
  const { text: placeholderText } = useTranslation('What can I help you with?', {
    sourceLang: 'en',
    context: 'dashboard.home.chat.input.placeholder'
  })
  const { text: removeFileLabel } = useTranslation('Remove file', {
    sourceLang: 'en',
    context: 'dashboard.home.chat.input.remove_file'
  })
  const { text: fileInputLabel } = useTranslation('File input', {
    sourceLang: 'en',
    context: 'dashboard.home.chat.input.file_input'
  })
  const { text: attachFileLabel } = useTranslation('Attach file', {
    sourceLang: 'en',
    context: 'dashboard.home.chat.input.attach_file'
  })
  const { text: openInLabLabel } = useTranslation('Open in Thinking Lab', {
    sourceLang: 'en',
    context: 'dashboard.home.chat.input.open_lab'
  })
  const { text: sendMessageLabel } = useTranslation('Send message', {
    sourceLang: 'en',
    context: 'dashboard.home.chat.input.send'
  })
  const { text: switchThreadsLabel } = useTranslation('Switch threads', {
    sourceLang: 'en',
    context: 'dashboard.home.chat.input.switch_threads'
  })

  // Get user ID on mount
  useEffect(() => {
    const getUserId = async () => {
      try {
        const id = await getCurrentUserId()
        setUserId(id)
      } catch (error) {
        console.error('Failed to get user ID:', error)
      }
    }
    getUserId()
  }, [])

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const scrollHeight = Math.min(textarea.scrollHeight, 300) // Max height matches max-h-[300px]
      textarea.style.height = `${Math.max(120, scrollHeight)}px` // Min height matches min-h-[120px]
    }
  }, [value])

  // Get all user threads for thread menu
  const allThreads = useQuery(
    api.chatQueries.getAllUserThreads,
    userId ? { userId } : 'skip'
  )

  // Format relative time helper
  const formatRelativeTime = (timestamp?: number): string => {
    if (!timestamp) return ''
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'now'
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    return `${days}d`
  }

  // Handle thread selection - navigate to thinking lab with that conversation
  const handleThreadSelect = useCallback((threadId: string) => {
    const params = new URLSearchParams()
    params.set('chatId', threadId)
    router.push(`/dashboard/thinking_lab?${params.toString()}`)
  }, [router])

  const handleSend = () => {
    if (!value.trim() || isLoading) return
    onSend(value, fileAttachments)
    setFileAttachments([]) // Clear attachments after sending
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    // Allow Shift+Enter for new lines
  }

  // File upload handlers
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || !userId) return
    
    setIsUploading(true)
    const uploadPromises: Promise<FileUploadResponse>[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      uploadPromises.push(uploadFile(file, userId))
    }
    
    try {
      const uploadResults = await Promise.all(uploadPromises)
      setFileAttachments(prev => [...prev, ...uploadResults])
    } catch (error) {
      console.error('File upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }, [userId])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFileSelect])

  const removeFileAttachment = useCallback((index: number) => {
    setFileAttachments(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleOpenInThinkingLab = useCallback(() => {
    if (conversationId) {
      router.push(`/dashboard/thinking_lab?chatId=${conversationId}`)
    }
  }, [conversationId, router])

  return (
    <div className="relative flex flex-col gap-2">
      {/* File attachments preview */}
      {fileAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-6 pt-3">
          {fileAttachments.map((file, index) => {
            // FileUploadResponse has flat structure (camelCase), not nested file_metadata
            const fileIcon = getFileTypeIcon(file.contentType)
            return (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20"
              >
                <span className="text-base">{fileIcon}</span>
                <span className="text-sm text-foreground max-w-[150px] truncate">
                  {file.originalFilename}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(file.fileSize)}
                </span>
                <button
                  onClick={() => removeFileAttachment(index)}
                  className="ml-1 p-1 hover:bg-destructive/20 rounded transition-colors"
                  aria-label={removeFileLabel}
                >
                  <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Input container with header and input area */}
      <div className="flex flex-col">
        {/* Header section with label */}
        <div className="px-8 pt-6 pb-3">
          <h3 className="text-xl font-medium text-foreground">
            {placeholderText}
          </h3>
        </div>
        
        {/* Separator line */}
        <div className="px-8">
          <div className="border-t border-border/50"></div>
        </div>
        
        {/* Input row */}
        <div className="flex items-end gap-3 px-8 py-6">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="*/*"
            onChange={handleFileInputChange}
            className="hidden"
            aria-label={fileInputLabel}
          />
          
          {/* Input field - Multi-line textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            disabled={isLoading}
            className={cn(
              "flex-1 bg-transparent border-none outline-none resize-none",
              "text-foreground placeholder:text-muted-foreground",
              "text-xl leading-relaxed",
              "focus:outline-none focus:ring-0 focus:border-none",
              "min-h-[120px] max-h-[300px] overflow-y-auto",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          />
          
          {/* Action Icons */}
          <div className="flex items-center gap-2 pb-1">
          
          {/* Attach */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              fileInputRef.current?.click()
            }}
            disabled={isUploading}
            className={cn(
              "p-2.5 rounded-lg hover:bg-foreground/5 transition-colors",
              isUploading && "opacity-50 cursor-not-allowed"
            )}
            aria-label={attachFileLabel}
          >
            {isUploading ? (
              <div className="w-6 h-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            ) : (
              <Paperclip className="w-6 h-6 text-muted-foreground hover:text-foreground" />
            )}
          </button>

          {/* Thread menu button - @ button for switching threads */}
          {userId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={isLoading}
                  className="p-2.5 rounded-lg hover:bg-foreground/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={switchThreadsLabel}
                >
                  <AtSign className="w-6 h-6 text-muted-foreground hover:text-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                side="top"
                className="w-96 max-h-[500px] overflow-y-auto"
              >
                {allThreads === undefined ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Loading threads...
                  </div>
                ) : allThreads && allThreads.length > 0 ? (
                  allThreads.map(thread => {
                    const isActive = thread._id === conversationId
                    const isMain = thread.threadType === 'main'
                    return (
                      <DropdownMenuItem
                        key={thread._id}
                        onClick={() => handleThreadSelect(thread._id)}
                        className={cn(
                          "p-4 cursor-pointer",
                          isActive && "bg-muted"
                        )}
                      >
                        <div className="flex items-start gap-3 w-full">
                          {/* Icon */}
                          <div className="mt-0.5 flex-shrink-0">
                            {isMain ? (
                              <Home className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <FolderOpen className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          
                          {/* Content - Multi-line layout */}
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className={cn(
                                "text-sm font-medium",
                                isActive && "text-foreground",
                                !isActive && "text-muted-foreground"
                              )}>
                                {thread.title}
                              </span>
                            </div>
                            
                            {thread.lastMessagePreview && (
                              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                                {thread.lastMessagePreview}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{thread.messageCount} msgs</span>
                              <span>{formatRelativeTime(thread.lastMessageAt)}</span>
                            </div>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    )
                  })
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No threads yet
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Open in Thinking Lab - Only show when conversation exists */}
          {conversationId && (
            <button
              type="button"
              onClick={handleOpenInThinkingLab}
              className={cn(
                "p-2.5 rounded-lg hover:bg-foreground/5 transition-colors group",
                "relative"
              )}
              aria-label={openInLabLabel}
              title={openInLabLabel}
            >
              <FlaskConical className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          )}

          {/* Send */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!value.trim() || isLoading || isUploading}
            className={cn(
              "p-2.5 rounded-lg transition-all",
              value.trim() && !isLoading && !isUploading
                ? "bg-gradient-to-r from-primary to-primary-dark text-primary-darker hover:shadow-lg hover:shadow-primary/30"
                : "bg-muted/20 text-muted-foreground cursor-not-allowed"
            )}
            aria-label={sendMessageLabel}
          >
            <Send className="w-6 h-6" />
          </button>
          
        </div>
        </div>
      </div>
    </div>
  )
}

