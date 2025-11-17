'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { Id } from '@/convex/_generated/dataModel'

export function usePromptHandlers(
  updatePrompt: (args: {
    promptId: Id<'prompts'>
    content: string
    tags: string[]
    description?: string
  }) => Promise<void>,
  deletePrompt: (args: { promptId: Id<'prompts'> }) => Promise<void>
) {
  const [editingPromptId, setEditingPromptId] = useState<Id<'prompts'> | null>(null)
  const [editPromptContent, setEditPromptContent] = useState('')
  const [editPromptTags, setEditPromptTags] = useState('')
  const [editPromptDescription, setEditPromptDescription] = useState('')

  const handleEditPrompt = (prompt: any) => {
    setEditingPromptId(prompt._id)
    setEditPromptContent(prompt.content)
    setEditPromptTags(prompt.tags.join(', '))
    setEditPromptDescription(prompt.description || '')
  }

  const handleSavePrompt = async () => {
    if (!editingPromptId) return

    try {
      await updatePrompt({
        promptId: editingPromptId,
        content: editPromptContent,
        tags: editPromptTags.split(',').map((t) => t.trim()).filter((t) => t.length > 0),
        description: editPromptDescription || undefined,
      })
      toast.success('Prompt updated successfully')
      setEditingPromptId(null)
    } catch (error) {
      toast.error(`Failed to update: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleCancelEditPrompt = () => {
    setEditingPromptId(null)
    setEditPromptContent('')
    setEditPromptTags('')
    setEditPromptDescription('')
  }

  const handleDeletePrompt = async (promptId: Id<'prompts'>) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return

    try {
      await deletePrompt({ promptId })
      toast.success('Prompt deleted')
    } catch (error) {
      toast.error(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return {
    editingPromptId,
    editPromptContent,
    editPromptTags,
    editPromptDescription,
    setEditPromptContent,
    setEditPromptTags,
    setEditPromptDescription,
    handleEditPrompt,
    handleSavePrompt,
    handleCancelEditPrompt,
    handleDeletePrompt,
  }
}


