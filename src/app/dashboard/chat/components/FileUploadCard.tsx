'use client'

import React from 'react'
import { File, FileText, Image, FileSpreadsheet, FileVideo, FileAudio, Archive } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadCardProps {
  fileName: string
  fileSize: number
  fileType: string
  uploadedAt?: string
  className?: string
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

const formatUploadTime = (uploadedAt: string): string => {
  const date = new Date(uploadedAt)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return date.toLocaleDateString()
}

export function FileUploadCard({ 
  fileName, 
  fileSize, 
  fileType, 
  uploadedAt,
  className 
}: FileUploadCardProps) {
  const FileIcon = getFileIcon(fileType)
  
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border bg-card text-card-foreground",
      "hover:bg-accent/50 transition-colors",
      className
    )}>
      <div className="flex-shrink-0">
        <FileIcon className="w-5 h-5 text-muted-foreground" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">
            {fileName}
          </p>
          {uploadedAt && (
            <span className="text-xs text-muted-foreground">
              {formatUploadTime(uploadedAt)}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatFileSize(fileSize)}</span>
          <span>•</span>
          <span className="capitalize">
            {fileType.split('/')[1] || fileType}
          </span>
        </div>
      </div>
    </div>
  )
}
