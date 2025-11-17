'use client'

import { toast } from 'sonner'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import type { Id } from '@/convex/_generated/dataModel'

export function useBlogPostHandlers(
  updateBlogPost: (args: {
    blogPostId: Id<'blogPosts'>
    updates: {
      title?: string
      slug?: string
      description?: string
      content?: string
      category?: 'code' | 'ux' | 'design'
      readTime?: string
      date?: string
      series?: string
      order?: number
      status?: 'draft' | 'published' | 'archived'
    }
    authorId: string
  }) => Promise<void>,
  deleteBlogPost: (args: { blogPostId: Id<'blogPosts'> }) => Promise<void>,
  publishBlogPost: (args: { blogPostId: Id<'blogPosts'> }) => Promise<void>,
  createBlogPost: (args: {
    slug: string
    title: string
    description: string
    content: string
    category: 'code' | 'ux' | 'design'
    readTime: string
    date: string
    authorId: string
    status: 'draft' | 'published' | 'archived'
  }) => Promise<void>
) {
  const handleSaveBlogPost = async (
    blogPostId: Id<'blogPosts'>,
    updates: {
      title?: string
      slug?: string
      description?: string
      content?: string
      category?: 'code' | 'ux' | 'design'
      readTime?: string
      date?: string
      series?: string
      order?: number
      status?: 'draft' | 'published' | 'archived'
    }
  ) => {
    try {
      const userId = await getCurrentUserId()
      await updateBlogPost({
        blogPostId,
        updates,
        authorId: userId,
      })
      toast.success('Blog post updated successfully')
    } catch (error) {
      if (error instanceof Error && error.message.includes('User identification required')) {
        toast.error('Must be logged in to save posts')
      } else {
        toast.error(`Failed to update: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
      throw error
    }
  }

  const handleDeleteBlogPost = async (blogPostId: Id<'blogPosts'>) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return

    try {
      await deleteBlogPost({ blogPostId })
      toast.success('Blog post deleted')
    } catch (error) {
      toast.error(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handlePublishBlogPost = async (blogPostId: Id<'blogPosts'>) => {
    try {
      await publishBlogPost({ blogPostId })
      toast.success('Blog post published')
    } catch (error) {
      toast.error(`Failed to publish: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleCreateBlogPost = async () => {
    const newSlug = `new-post-${Date.now()}`
    try {
      const userId = await getCurrentUserId()
      await createBlogPost({
        slug: newSlug,
        title: 'New Blog Post',
        description: 'Edit this description',
        content: '# New Blog Post\n\nEdit this content...',
        category: 'code',
        readTime: '5 min',
        date: new Date().toISOString().split('T')[0],
        authorId: userId,
        status: 'draft',
      })
      toast.success('Draft post created! Refresh to see it.')
    } catch (error) {
      if (error instanceof Error && error.message.includes('User identification required')) {
        toast.error('Must be logged in to create posts')
      } else {
        toast.error(`Failed to create: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  return {
    handleSaveBlogPost,
    handleDeleteBlogPost,
    handlePublishBlogPost,
    handleCreateBlogPost,
  }
}


