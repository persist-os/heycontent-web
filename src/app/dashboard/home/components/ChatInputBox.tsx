'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import { AtSign, Paperclip, Send, Mic, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadFile, formatFileSize, getFileTypeIcon, type FileUploadResponse } from '@/lib/file-upload'
import { getCurrentUserId } from '@/app/lib/api-helpers'

interface ChatInputBoxProps {
  value: string
  onChange: (value: string) => void
  onSend: (message: string, fileAttachments?: FileUploadResponse[]) => void
  isLoading?: boolean
}

/**
 * ChatInputBox - Main chat interface input
 * 
 * Features:
 * - Gradient background (amber to blue)
 * - Glassmorphism effect
 * - Action icons (@mention, attach, voice, send)
 * - Controlled component for chat integration
 */
export function ChatInputBox({ value, onChange, onSend, isLoading = false }: ChatInputBoxProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [fileAttachments, setFileAttachments] = useState<FileUploadResponse[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleSend = () => {
    if (!value.trim() || isLoading) return
    onSend(value, fileAttachments)
    setFileAttachments([]) // Clear attachments after sending
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
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

  return (
    <div className="relative flex flex-col gap-2">
      {/* File attachments preview */}
      {fileAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-6 pt-3">
          {fileAttachments.map((file, index) => {
            const fileIcon = getFileTypeIcon(file.file_metadata.content_type)
            return (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20"
              >
                <span className="text-base">{fileIcon}</span>
                <span className="text-sm text-foreground max-w-[150px] truncate">
                  {file.file_metadata.original_filename}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(file.file_metadata.file_size)}
                </span>
                <button
                  onClick={() => removeFileAttachment(index)}
                  className="ml-1 p-1 hover:bg-destructive/20 rounded transition-colors"
                  aria-label="Remove file"
                >
                  <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-3 px-6 py-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="*/*"
          onChange={handleFileInputChange}
          className="hidden"
          aria-label="File input"
        />
        
        {/* Input field */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What can I help you with?"
          disabled={isLoading}
          className={cn(
            "flex-1 bg-transparent border-none outline-none",
            "text-foreground placeholder:text-muted-foreground",
            "text-base",
            "focus:outline-none focus:ring-0 focus:border-none",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
        />
        
        {/* Action Icons */}
        <div className="flex items-center gap-2">
          
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
              "p-2 rounded-lg hover:bg-foreground/5 transition-colors",
              isUploading && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Attach file"
          >
            {isUploading ? (
              <div className="w-5 h-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            ) : (
              <Paperclip className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            )}
          </button>

          {/* Send */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!value.trim() || isLoading || isUploading}
            className={cn(
              "p-2 rounded-lg transition-all",
              value.trim() && !isLoading && !isUploading
                ? "bg-gradient-to-r from-primary to-primary-dark text-primary-darker hover:shadow-lg hover:shadow-primary/30"
                : "bg-muted/20 text-muted-foreground cursor-not-allowed"
            )}
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
          
        </div>
      </div>
    </div>
  )
}

