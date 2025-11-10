'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { StarRating } from '@/components/ui/star-rating'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { T } from '@/components/translation/T'

interface FeedbackDialogProps {
  isOpen: boolean
  onClose: () => void
  generationTimestamp: number | null
  noteId?: string
  noteContent?: string
}

export function FeedbackDialog({
  isOpen,
  onClose,
  generationTimestamp,
  noteId,
  noteContent
}: FeedbackDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createContentFeedback = useMutation(api.feedback.createContentFeedback)

  const handleRateFeedback = async (rating: number, feedbackText?: string) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      const currentUserId = await getCurrentUserId()

      await createContentFeedback({
        entityType: 'note_generation',
        entityId: noteId || `temp_note_${generationTimestamp}`,
        rating,
        feedbackText,
        userId: currentUserId,
        contentSnapshot: {
          noteContent: noteContent?.substring(0, 500),
          noteId,
          generationType: 'inline_ai'
        }
      })

      onClose()
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <T context="feedback.dialog.title">Rate AI Generation</T>
          </DialogTitle>
          <DialogDescription>
            <T context="feedback.dialog.description">How would you rate the quality of the AI-generated content?</T>
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <StarRating
            onRate={handleRateFeedback}
            size="lg"
            allowFeedbackText={true}
            disabled={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

