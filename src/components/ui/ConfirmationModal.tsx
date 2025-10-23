'use client'

import React from 'react'
import { BaseModal } from './base-modal'

export interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  titleContext?: string
  description?: string
  descriptionContext?: string
  confirmText?: string
  confirmContext?: string
  cancelText?: string
  cancelContext?: string
  isLoading?: boolean
  loadingText?: string
  loadingContext?: string
  variant?: 'default' | 'destructive'
}

/**
 * ConfirmationModal - Reusable confirmation dialog component
 * 
 * Built on BaseModal with sensible defaults for confirmation flows.
 * Automatically handles translation contexts and loading states.
 * 
 * @example
 * ```tsx
 * const [showConfirm, setShowConfirm] = useState(false)
 * 
 * <ConfirmationModal
 *   isOpen={showConfirm}
 *   onClose={() => setShowConfirm(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Item"
 *   titleContext="modal.delete.title"
 *   description="Are you sure? This action cannot be undone."
 *   descriptionContext="modal.delete.description"
 *   variant="destructive"
 *   isLoading={isDeleting}
 * />
 * ```
 */
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  titleContext,
  description,
  descriptionContext,
  confirmText = 'Confirm',
  confirmContext = 'button.confirm',
  cancelText = 'Cancel',
  cancelContext = 'button.cancel',
  isLoading = false,
  loadingText = 'Processing...',
  loadingContext = 'status.processing',
  variant = 'default',
}: ConfirmationModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      titleContext={titleContext}
      description={description}
      descriptionContext={descriptionContext}
      onConfirm={onConfirm}
      onCancel={onClose}
      confirmText={confirmText}
      confirmContext={confirmContext}
      cancelText={cancelText}
      cancelContext={cancelContext}
      isLoading={isLoading}
      loadingText={loadingText}
      loadingContext={loadingContext}
      variant={variant}
      maxWidth="sm"
      showGradient={false}
    >
      {/* Empty children - description is in header */}
      <></>
    </BaseModal>
  )
}

