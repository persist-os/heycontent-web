'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { SearchBar } from '@/components/ui/search-bar'
import { formatFileSize, getFileTypeIcon, getFileDisplayUrl } from '@/lib/file-upload'

/**
 * Files Page - Displays actual file content inline (images, videos, text, PDFs, etc.)
 * 
 * Layout: Breadcrumb, SearchBar, File content display
 * Uses real data from Convex queries (Pattern: HomeScreen.tsx)
 * Shows actual file content, not just file cards
 */
export default function FilesPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Get user ID on component mount (Pattern: HomeScreen.tsx)
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

  // Fetch files from Convex (Pattern: HomeScreen.tsx)
  const files = useQuery(
    api.fileQueries.getUserFiles,
    userId ? { userId } : 'skip'
  )

  // Filter files by search term
  const filteredFiles = useMemo(() => {
    if (!files || !searchTerm) return files || []
    const term = searchTerm.toLowerCase()
    return files.filter((file: any) => 
      file.originalFilename?.toLowerCase().includes(term) ||
      file.filename?.toLowerCase().includes(term) ||
      file.contentType?.toLowerCase().includes(term)
    )
  }, [files, searchTerm])

  const breadcrumbItems = [
    { label: 'Files' }
  ]

  return (
    <div className="min-h-screen bg-[hsl(var(--file-bg))] relative size-full px-4 md:px-0">
      {/* Main Content - Layout handles navigation spacing automatically */}
      <div className="w-full md:w-[1124px] mx-auto">
        {/* Breadcrumb - Responsive typography */}
        <div className="content-stretch flex font-['DM_Sans'] font-extralight gap-[4px] items-center leading-[0] relative shrink-0 text-[hsl(var(--file-text-regular))] text-xl md:text-[32px] tracking-[-0.96px] whitespace-nowrap [font-variation-settings:'opsz'_14]">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Search Bar */}
        <div className="box-border content-stretch flex flex-col gap-[10px] items-start px-0 py-[8px] relative shrink-0 w-full">
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="What are you looking for?" />
        </div>

        {/* File Content */}
        <div className="content-stretch flex flex-wrap gap-4 items-start relative shrink-0 w-full mt-4">
          {files === undefined ? (
            // Loading state
            <div className="text-[hsl(var(--file-text-subtle))]">Loading files...</div>
          ) : filteredFiles.length === 0 ? (
            // Empty state
            <div className="text-[hsl(var(--file-text-subtle))]">
              {searchTerm ? 'No files found' : 'No files yet'}
            </div>
          ) : (
            filteredFiles.map((file: any) => {
              const isImage = file.contentType?.startsWith('image/')
              const isVideo = file.contentType?.startsWith('video/')
              const isAudio = file.contentType?.startsWith('audio/')
              const isText = file.contentType?.startsWith('text/') || 
                            file.contentType?.includes('json') ||
                            file.contentType?.includes('markdown')
              const isPdf = file.contentType?.includes('pdf')
              
              return (
                <div
                  key={file._id}
                  className={`relative group ${
                    isImage ? 'max-w-[400px]' : isVideo ? 'max-w-[500px]' : 'max-w-[300px]'
                  }`}
                >
                  {isImage ? (
                    // Image display
                    <div className="bg-muted/30 rounded-lg border border-border/50 overflow-hidden relative">
                      <img
                        src={getFileDisplayUrl(file.gcsUrl) || file.fileUrl}
                        alt={file.originalFilename || file.filename}
                        className="w-full max-h-[500px] object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback') as HTMLElement;
                          if (fallback) {
                            fallback.style.display = 'flex';
                          }
                        }}
                      />
                      <div className="image-fallback hidden items-center gap-3 p-4 text-sm h-32">
                        <span className="text-2xl">{getFileTypeIcon(file.contentType)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground truncate">
                            {file.originalFilename || file.filename}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatFileSize(file.fileSize)}
                          </div>
                        </div>
                      </div>
                      <div className="p-2 bg-gradient-to-t from-black/70 to-transparent absolute bottom-0 left-0 right-0">
                        <div className="flex items-center gap-2 text-white text-xs">
                          <span>{getFileTypeIcon(file.contentType)}</span>
                          <span className="truncate">{file.originalFilename || file.filename}</span>
                          <span className="text-white/70">{formatFileSize(file.fileSize)}</span>
                        </div>
                      </div>
                    </div>
                  ) : isVideo ? (
                    // Video display
                    <div className="bg-muted/30 rounded-lg border border-border/50 overflow-hidden relative">
                      <video
                        src={getFileDisplayUrl(file.gcsUrl) || file.fileUrl}
                        className="w-full max-h-[500px] object-contain"
                        controls
                        preload="metadata"
                      />
                      <div className="p-2 bg-gradient-to-t from-black/70 to-transparent absolute bottom-0 left-0 right-0">
                        <div className="flex items-center gap-2 text-white text-xs">
                          <span>{getFileTypeIcon(file.contentType)}</span>
                          <span className="truncate">{file.originalFilename || file.filename}</span>
                          <span className="text-white/70">{formatFileSize(file.fileSize)}</span>
                        </div>
                      </div>
                    </div>
                  ) : isAudio ? (
                    // Audio display
                    <div className="bg-muted/30 rounded-lg border border-border/50 p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFileTypeIcon(file.contentType)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">
                            {file.originalFilename || file.filename}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatFileSize(file.fileSize)}
                          </div>
                        </div>
                        <audio
                          src={getFileDisplayUrl(file.gcsUrl) || file.fileUrl}
                          controls
                          className="h-8"
                        />
                      </div>
                    </div>
                  ) : isPdf ? (
                    // PDF display
                    <div className="bg-muted/30 rounded-lg border border-border/50 overflow-hidden">
                      <iframe
                        src={getFileDisplayUrl(file.gcsUrl) || file.fileUrl}
                        className="w-full h-[600px]"
                        title={file.originalFilename || file.filename}
                      />
                      <div className="p-2 bg-muted/50">
                        <div className="flex items-center gap-2 text-xs">
                          <span>{getFileTypeIcon(file.contentType)}</span>
                          <span className="truncate text-foreground">{file.originalFilename || file.filename}</span>
                          <span className="text-muted-foreground">{formatFileSize(file.fileSize)}</span>
                        </div>
                      </div>
                    </div>
                  ) : isText ? (
                    // Text file display - fetch and show content
                    <TextFileViewer file={file} />
                  ) : (
                    // Regular file display with download option
                    <div className="bg-muted/30 rounded-lg border border-border/50 p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFileTypeIcon(file.contentType)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">
                            {file.originalFilename || file.filename}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatFileSize(file.fileSize)}
                          </div>
                        </div>
                        <a
                          href={getFileDisplayUrl(file.gcsUrl) || file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          Open
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// Text file viewer component
function TextFileViewer({ file }: { file: any }) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTextContent = async () => {
      try {
        const fileUrl = getFileDisplayUrl(file.gcsUrl) || file.fileUrl
        const response = await fetch(fileUrl)
        if (!response.ok) throw new Error('Failed to fetch file')
        const text = await response.text()
        setContent(text)
      } catch (err) {
        setError('Failed to load file content')
      } finally {
        setLoading(false)
      }
    }

    fetchTextContent()
  }, [file])

  if (loading) {
    return (
      <div className="bg-muted/30 rounded-lg border border-border/50 p-4">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-muted/30 rounded-lg border border-border/50 p-4">
        <div className="text-sm text-destructive">{error}</div>
      </div>
    )
  }

  return (
    <div className="bg-muted/30 rounded-lg border border-border/50 overflow-hidden">
      <div className="p-2 bg-muted/50 border-b border-border/50">
        <div className="flex items-center gap-2 text-xs">
          <span>{getFileTypeIcon(file.contentType)}</span>
          <span className="truncate text-foreground">{file.originalFilename || file.filename}</span>
          <span className="text-muted-foreground">{formatFileSize(file.fileSize)}</span>
        </div>
      </div>
      <div className="p-4 max-h-[600px] overflow-auto">
        <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
          {content}
        </pre>
      </div>
    </div>
  )
}

