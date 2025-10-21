'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog'
import { Button } from './button'
import { T } from '@/components/translation/T'

export interface BaseModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  titleContext?: string
  description?: string
  descriptionContext?: string
  children: React.ReactNode
  onConfirm?: () => void
  onCancel?: () => void
  confirmText?: string
  confirmContext?: string
  cancelText?: string
  cancelContext?: string
  isLoading?: boolean
  loadingText?: string
  loadingContext?: string
  variant?: 'default' | 'destructive'
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  showGradient?: boolean
  className?: string
}

/**
 * BaseModal - A reusable modal component with Material Design 3 styling
 * 
 * Features:
 * - Semantic color system (uses CSS variables from globals.css)
 * - Optional gradient accent line at top
 * - Translation-ready (all text props support translation contexts)
 * - Glassmorphism effects
 * - Loading states
 * - Variant support (default, destructive)
 * 
 * @example
 * ```tsx
 * <BaseModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Delete Item"
 *   titleContext="modal.delete.title"
 *   description="Are you sure you want to delete this item?"
 *   descriptionContext="modal.delete.description"
 *   confirmText="Delete"
 *   confirmContext="button.delete"
 *   cancelText="Cancel"
 *   cancelContext="button.cancel"
 *   onConfirm={handleDelete}
 *   variant="destructive"
 *   isLoading={isDeleting}
 * >
 *   <p>Additional content goes here</p>
 * </BaseModal>
 * ```
 */
export function BaseModal({
  isOpen,
  onClose,
  title,
  titleContext,
  description,
  descriptionContext,
  children,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  confirmContext = 'button.confirm',
  cancelText = 'Cancel',
  cancelContext = 'button.cancel',
  isLoading = false,
  loadingText = 'Loading...',
  loadingContext = 'status.loading',
  variant = 'default',
  maxWidth = 'md',
  showGradient = true,
  className = '',
}: BaseModalProps) {
  const maxWidthClass = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
  }[maxWidth]

  const handleClose = () => {
    if (onCancel) {
      onCancel()
    } else {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`${maxWidthClass} border-border/30 ${className}`}>
        {/* Optional gradient line at top */}
        {showGradient && (
          <div className="h-px bg-gradient-to-r from-primary/40 via-primary/20 to-transparent w-3/4 mb-6" />
        )}
        
        <DialogHeader className="pb-6">
          <div className="space-y-4">
            <DialogTitle className="text-2xl font-light tracking-tight text-foreground">
              {titleContext ? (
                <T context={titleContext}>{title}</T>
              ) : (
                title
              )}
            </DialogTitle>
            
            {description && (
              <>
                <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent w-2/3" />
                <DialogDescription className="text-muted-foreground leading-relaxed text-base">
                  {descriptionContext ? (
                    <T context={descriptionContext}>{description}</T>
                  ) : (
                    description
                  )}
                </DialogDescription>
              </>
            )}
          </div>
        </DialogHeader>

        {/* Modal content */}
        <div className="space-y-6">
          {children}
        </div>

        {/* Action buttons (if confirm/cancel handlers provided) */}
        {(onConfirm || onCancel) && (
          <div className="flex gap-4 pt-6">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 py-3 text-base border-border/50 hover:border-border hover:bg-muted/30 transition-all duration-300"
                disabled={isLoading}
              >
                <T context={cancelContext}>{cancelText}</T>
              </Button>
            )}
            {onConfirm && (
              <Button
                type="button"
                variant={variant === 'destructive' ? 'destructive' : 'default'}
                onClick={onConfirm}
                className={`flex-1 py-3 text-base transition-all duration-300 ${
                  variant === 'default'
                    ? 'bg-foreground text-background hover:bg-foreground/90 hover:scale-[1.02]'
                    : ''
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    <span>
                      <T context={loadingContext}>{loadingText}</T>
                    </span>
                  </div>
                ) : (
                  <T context={confirmContext}>{confirmText}</T>
                )}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

