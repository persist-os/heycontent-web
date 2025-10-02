'use client'

import React from 'react'
import { getFileTypeIcon, formatFileSize, getFileDisplayUrl } from '@/lib/file-upload'

interface FileAttachment {
  file_url: string
  file_metadata: {
    original_filename: string
    content_type: string
    file_size: number
  }
}

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
        const { content_type, original_filename, file_size } = attachment.file_metadata
        const isImage = content_type.startsWith('image/')
        const isVideo = content_type.startsWith('video/')
        const isAudio = content_type.startsWith('audio/')
        
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
                  src={getFileDisplayUrl(attachment.file_url)}
                  alt={original_filename}
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
                  <span className="text-2xl">{getFileTypeIcon(content_type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {original_filename}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(file_size)}
                    </div>
                  </div>
                </div>
                <div className="p-2 bg-gradient-to-t from-black/70 to-transparent absolute bottom-0 left-0 right-0">
                  <div className="flex items-center gap-2 text-white text-xs">
                    <span>{getFileTypeIcon(content_type)}</span>
                    <span className="truncate">{original_filename}</span>
                    <span className="text-white/70">{formatFileSize(file_size)}</span>
                  </div>
                </div>
              </div>
            ) : isVideo ? (
              // Video display
              <div className="bg-muted/30 rounded-lg border border-border/50 overflow-hidden">
                <video
                  src={getFileDisplayUrl(attachment.file_url)}
                  className="w-full max-h-48 object-cover"
                  controls
                  preload="metadata"
                />
                <div className="p-2 bg-gradient-to-t from-black/70 to-transparent absolute bottom-0 left-0 right-0">
                  <div className="flex items-center gap-2 text-white text-xs">
                    <span>{getFileTypeIcon(content_type)}</span>
                    <span className="truncate">{original_filename}</span>
                    <span className="text-white/70">{formatFileSize(file_size)}</span>
                  </div>
                </div>
              </div>
            ) : isAudio ? (
              // Audio display
              <div className="bg-muted/30 rounded-lg border border-border/50 p-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFileTypeIcon(content_type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {original_filename}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(file_size)}
                    </div>
                  </div>
                  <audio
                    src={getFileDisplayUrl(attachment.file_url)}
                    controls
                    className="h-8"
                  />
                </div>
              </div>
            ) : (
              // Regular file display
              <div className="bg-muted/30 rounded-lg border border-border/50 p-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFileTypeIcon(content_type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {original_filename}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(file_size)}
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
