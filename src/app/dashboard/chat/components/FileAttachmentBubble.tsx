'use client'

import React from 'react'
import { FileText } from 'lucide-react'
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
      "max-w-full sm:max-w-[95%] w-full rounded-2xl px-5 sm:px-7 py-2 sm:py-3 bg-primary text-primary-foreground dark:text-black [&_*]:!text-primary-foreground dark:[&_*]:!text-black",
      className
    )}>
      <div className="space-y-2">
        {fileAttachments.map((file, index) => (
          <div key={`${file.file_id}-${index}`} className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">{file.original_filename}</span>
            <span className="text-primary-foreground/70 dark:text-black/70 ml-auto">
              ({formatFileSize(file.file_size)})
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
