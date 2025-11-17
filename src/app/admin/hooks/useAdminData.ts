'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { getCurrentUserId } from '@/app/lib/api-helpers'

export function useAdminData() {
  const [currentUserId, setCurrentUserId] = useState<string>('')

  // Initialize user ID
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await getCurrentUserId()
        setCurrentUserId(id)
      } catch (error) {
        console.error('Failed to get user ID:', error)
      }
    }
    fetchUserId()
  }, [])

  // Queries
  const feedback = useQuery(api.feedback.listFeedback, {
    status: 'all',
    type: 'all',
    priority: 'all',
    limit: 50,
  })
  const stats = useQuery(api.feedback.getFeedbackStats)
  const users = useQuery(
    api.auth.getUsersWithRoles,
    currentUserId ? { adminUserId: currentUserId } : 'skip'
  )
  const prompts = useQuery(api.promptsQueries.getAllPrompts, { limit: 200 })
  const blogPosts = useQuery(api.blogPostQueries.getAllBlogPosts, {
    includeDrafts: true,
    limit: 200,
  })

  // Mutations
  const updateStatus = useMutation(api.feedback.updateFeedbackStatus)
  const updatePrompt = useMutation(api.promptsMutations.updatePromptBlock)
  const deletePrompt = useMutation(api.promptsMutations.deletePromptBlock)
  const updateBlogPost = useMutation(api.blogPostMutations.updateBlogPost)
  const deleteBlogPost = useMutation(api.blogPostMutations.deleteBlogPost)
  const publishBlogPost = useMutation(api.blogPostMutations.publishBlogPost)
  const createBlogPost = useMutation(api.blogPostMutations.createBlogPost)

  return {
    currentUserId,
    feedback,
    stats,
    users,
    prompts,
    blogPosts,
    mutations: {
      updateStatus,
      updatePrompt,
      deletePrompt,
      updateBlogPost,
      deleteBlogPost,
      publishBlogPost,
      createBlogPost,
    },
  }
}



