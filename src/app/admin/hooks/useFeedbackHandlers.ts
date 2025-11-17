'use client'

import { useState } from 'react'
import type { Id } from '@/convex/_generated/dataModel'

export function useFeedbackHandlers(
  updateStatus: (args: {
    feedbackId: Id<'feedback'>
    status?: string
    priority?: string
    assignedTo?: string
  }) => Promise<void>
) {
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleStatusUpdate = async (
    feedbackId: string,
    newStatus?: string,
    newPriority?: string,
    newAssignee?: string
  ) => {
    try {
      await updateStatus({
        feedbackId: feedbackId as any,
        status: newStatus || 'new',
        priority: newPriority,
        assignedTo: newAssignee,
      })

      if (selectedFeedback && selectedFeedback._id === feedbackId) {
        setSelectedFeedback({
          ...selectedFeedback,
          status: newStatus || selectedFeedback.status,
          priority: newPriority || selectedFeedback.priority,
          assignedTo: newAssignee,
        })
      }

      if (isModalOpen) {
        setIsModalOpen(false)
        setSelectedFeedback(null)
      }
    } catch (error) {
      console.error('Failed to update feedback:', error)
      throw error
    }
  }

  const handleFeedbackClick = (feedbackItem: any) => {
    setSelectedFeedback(feedbackItem)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedFeedback(null)
  }

  return {
    selectedFeedback,
    isModalOpen,
    handleStatusUpdate,
    handleFeedbackClick,
    handleCloseModal,
  }
}


