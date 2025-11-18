'use client'

import React from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { formatFileSize, getFileTypeIcon, getFileDisplayUrl } from '@/lib/file-upload'
import { Button } from '@/components/ui/button'
import { Trash2, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { SectionHeader } from '@/components/ui/section-header'
import { FilesTable, type FileItem } from '@/components/ui/files-table'

interface ProjectFilesSectionProps {
  projectId: Id<'projects'>
  userId: string
}

/**
 * ProjectFilesSection - Displays files attached to a project
 * 
 * Features:
 * - Display files attached to project
 * - Show file metadata (filename, contentType, fileSize)
 * - Allow detaching files (use detachFileFromProject mutation)
 * - Use getProjectFiles query
 */
export function ProjectFilesSection({ projectId, userId }: ProjectFilesSectionProps) {
  // Fetch files attached to project
  const files = useQuery(
    api.fileQueries.getProjectFiles,
    projectId && userId ? {
      projectId,
      userId
    } : 'skip'
  )

  // Mutation for detaching files
  const detachFileMutation = useMutation(api.fileMutations.detachFileFromProject)

  const handleDetachFile = async (fileId: Id<'files'>) => {
    try {
      await detachFileMutation({
        projectId,
        fileId,
        userId
      })
      toast.success('File detached from project')
    } catch (error) {
      console.error('Failed to detach file:', error)
      toast.error('Failed to detach file')
    }
  }

  // Convert files to FileItem format for FilesTable
  const fileItems: FileItem[] = React.useMemo(() => {
    if (!files || files.length === 0) return []
    
    return files.map((file: any) => ({
      id: file._id,
      name: file.originalFilename || file.filename || 'Untitled File',
      type: file.contentType || 'application/octet-stream',
      lastOpened: file.attachedAt || file._creationTime || Date.now()
    }))
  }, [files])

  // Loading state
  if (files === undefined) {
    return (
      <div className="flex flex-col gap-5">
        <SectionHeader title="Files" />
        <div className="text-sm text-muted-foreground">Loading files...</div>
      </div>
    )
  }

  // Empty state
  if (!files || files.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <SectionHeader title="Files" />
        <div className="text-sm text-muted-foreground">No files attached to this project</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title="Files" />
      
      {/* Files list with detach functionality */}
      <div className="space-y-2">
        {files.map((file: any) => {
          const fileUrl = getFileDisplayUrl(file.gcsUrl) || file.fileUrl
          const fileName = file.originalFilename || file.filename || 'Untitled File'
          
          return (
            <div
              key={file._id}
              className="flex items-center justify-between px-4 py-3 bg-[hsl(var(--assignment-surface-container))] border border-[hsl(var(--assignment-outline-variant))] rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-xl">{getFileTypeIcon(file.contentType)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">
                    {fileName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {file.contentType} • {formatFileSize(file.fileSize)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {fileUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(fileUrl, '_blank')}
                    className="min-h-[44px] min-w-[44px]"
                    aria-label="Open file"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDetachFile(file._id)}
                  className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
                  aria-label="Detach file"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

