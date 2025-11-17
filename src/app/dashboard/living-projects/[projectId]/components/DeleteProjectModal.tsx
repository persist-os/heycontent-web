'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { T } from '@/components/translation'
import { BaseModal } from '@/components/ui/base-modal'

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
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Project"
      titleContext="modal.delete_project_title"
      description="This action cannot be undone"
      descriptionContext="modal.cannot_undo"
      confirmText="Delete Project"
      confirmContext="button.delete_project"
      cancelText="Cancel"
      cancelContext="button.cancel"
      variant="delete"
      isLoading={isDeleting}
      loadingText="Deleting..."
      loadingContext="button.deleting"
      maxWidth="md"
    >
      {/* Warning icon header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            <T context="modal.confirm_delete">Are you sure you want to delete</T>{' '}
            <strong className="text-foreground">"{projectName}"</strong>?
          </p>
        </div>
      </div>

      {/* Warning content */}
      <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
        <p className="text-sm text-destructive font-medium mb-2">
          <T context="modal.permanently_delete">This will permanently delete:</T>
        </p>
        <ul className="text-sm text-destructive/80 space-y-1">
          <li>• <T context="modal.delete_fingerprint">The project's fingerprint and widgets</T></li>
        </ul>
      </div>
    </BaseModal>
  )
}
