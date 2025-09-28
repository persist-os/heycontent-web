'use client'

import React from 'react'
import { File, FileText, Image, FileSpreadsheet, FileVideo, FileAudio, Archive, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileAttachmentBubbleProps {
  fileAttachments: Array<{
    file_id: string;
    original_filename: string;
    content_type: string;
    file_size: number;
    gcs_url: string;
    uploaded_at: string;
  }>;
  className?: string;
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return Image
  if (fileType.includes('pdf') || fileType.includes('document')) return FileText
  if (fileType.includes('spreadsheet') || fileType.includes('csv')) return FileSpreadsheet
  if (fileType.includes('video')) return FileVideo
  if (fileType.includes('audio')) return FileAudio
  if (fileType.includes('zip') || fileType.includes('archive')) return Archive
  return File
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function FileAttachmentBubble({ 
  fileAttachments, 
  className 
}: FileAttachmentBubbleProps) {
  if (!fileAttachments || fileAttachments.length === 0) {
    return null
  }

  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-lg border bg-muted/30 text-muted-foreground",
      "text-xs max-w-fit",
      className
    )}>
      <Paperclip className="w-3 h-3 flex-shrink-0" />
      <span className="font-medium">
        {fileAttachments.length} file{fileAttachments.length > 1 ? 's' : ''} attached:
      </span>
      <div className="flex items-center gap-1 flex-wrap">
        {fileAttachments.map((file, index) => {
          const FileIcon = getFileIcon(file.content_type)
          return (
            <div
              key={`${file.file_id}-${index}`}
              className="flex items-center gap-1 bg-background/50 px-2 py-1 rounded border text-xs"
            >
              <FileIcon className="w-3 h-3" />
              <span className="truncate max-w-[120px]" title={file.original_filename}>
                {file.original_filename}
              </span>
              <span className="text-muted-foreground/70">
                ({formatFileSize(file.file_size)})
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
