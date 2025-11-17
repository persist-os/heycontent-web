'use client'

import React from 'react'
import { getFileTypeIcon, formatFileSize, getFileDisplayUrl } from '@/lib/file-upload'
import { FileAttachment } from '@/app/types/chat'

interface FileAttachmentRendererProps {
  attachments: FileAttachment[]
  className?: string
}

export function FileAttachmentRenderer({ attachments, className = '' }: FileAttachmentRendererProps) {
  if (!attachments || attachments.length === 0) {
    return null
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {attachments.map((attachment, index) => {
        // Use flat structure only (Convex schema is SSOT)
        const contentType = attachment.contentType || 'application/octet-stream'
        const originalFilename = attachment.originalFilename || ''
        const fileSize = attachment.fileSize || 0
        const fileUrl = attachment.fileUrl || attachment.file_url || ''  // Use camelCase first, fallback to snake_case for backward compatibility
        const safeContentType = contentType || 'application/octet-stream'
        const isImage = safeContentType.startsWith('image/')
        const isVideo = safeContentType.startsWith('video/')
        const isAudio = safeContentType.startsWith('audio/')
        
        return (
          <div
            key={index}
            className={`relative group ${
              isImage ? 'max-w-[300px]' : isVideo ? 'max-w-[400px]' : 'max-w-[250px]'
            }`}
          >
            {isImage ? (
              // Image display
              <div className="bg-muted/30 rounded-lg border border-border/50 overflow-hidden relative">
                <img
                  src={getFileDisplayUrl(fileUrl)}
                  alt={originalFilename}
                  className="w-full max-h-48 object-cover"
                  onError={(e) => {
                    // Show fallback on error
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback') as HTMLElement;
                    if (fallback) {
                      fallback.style.display = 'flex';
                    }
                  }}
                />
                <div className="image-fallback hidden items-center gap-3 p-4 text-sm h-32">
                  <span className="text-2xl">{getFileTypeIcon(safeContentType)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {originalFilename}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(fileSize)}
                    </div>
                  </div>
                </div>
                <div className="p-2 bg-gradient-to-t from-black/70 to-transparent absolute bottom-0 left-0 right-0">
                  <div className="flex items-center gap-2 text-white text-xs">
                    <span>{getFileTypeIcon(safeContentType)}</span>
                    <span className="truncate">{originalFilename}</span>
                    <span className="text-white/70">{formatFileSize(fileSize)}</span>
                  </div>
                </div>
              </div>
            ) : isVideo ? (
              // Video display
              <div className="bg-muted/30 rounded-lg border border-border/50 overflow-hidden">
                <video
                  src={getFileDisplayUrl(fileUrl)}
                  className="w-full max-h-48 object-cover"
                  controls
                  preload="metadata"
                />
                <div className="p-2 bg-gradient-to-t from-black/70 to-transparent absolute bottom-0 left-0 right-0">
                  <div className="flex items-center gap-2 text-white text-xs">
                    <span>{getFileTypeIcon(safeContentType)}</span>
                    <span className="truncate">{originalFilename}</span>
                    <span className="text-white/70">{formatFileSize(fileSize)}</span>
                  </div>
                </div>
              </div>
            ) : isAudio ? (
              // Audio display
              <div className="bg-muted/30 rounded-lg border border-border/50 p-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFileTypeIcon(safeContentType)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {originalFilename}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(fileSize)}
                    </div>
                  </div>
                  <audio
                    src={getFileDisplayUrl(fileUrl)}
                    controls
                    className="h-8"
                  />
                </div>
              </div>
            ) : (
              // Regular file display
              <div className="bg-muted/30 rounded-lg border border-border/50 p-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFileTypeIcon(safeContentType)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {originalFilename}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(fileSize)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
