'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, AlertTriangle } from 'lucide-react'

interface DeleteProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  projectName: string
  isDeleting: boolean
}

export function DeleteProjectModal({
  isOpen,
  onClose,
  onConfirm,
  projectName,
  isDeleting
}: DeleteProjectModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-background border border-border rounded-lg shadow-lg max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-950/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Delete Project
              </h3>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone
              </p>
            </div>
          </div>
          
          {/* Content */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-3">
              Are you sure you want to delete <strong>"{projectName}"</strong>?
            </p>
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/20 rounded-md p-3">
              <p className="text-sm text-red-800 dark:text-red-300">
                This will permanently delete:
              </p>
              <ul className="text-sm text-red-700 dark:text-red-400 mt-2 space-y-1">
                <li>• The project's fingerprint and widgets</li>
              </ul>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Deleting...' : 'Delete Project'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
