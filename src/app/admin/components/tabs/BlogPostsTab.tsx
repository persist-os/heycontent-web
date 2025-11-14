'use client'

import { useState, useMemo } from 'react'
import { FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BlogPostEditor } from '../BlogPostEditor'
import { useBlogPostHandlers } from '../../hooks/useBlogPostHandlers'
import type { Id } from '@/convex/_generated/dataModel'

interface BlogPostsTabProps {
  blogPosts: any[]
  currentUserId: string
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
  }) => Promise<void>
  deleteBlogPost: (args: { blogPostId: Id<'blogPosts'> }) => Promise<void>
  publishBlogPost: (args: { blogPostId: Id<'blogPosts'> }) => Promise<void>
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
}

export function BlogPostsTab({
  blogPosts,
  currentUserId,
  updateBlogPost,
  deleteBlogPost,
  publishBlogPost,
  createBlogPost,
}: BlogPostsTabProps) {
  const [blogPostStatusFilter, setBlogPostStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all')
  const [blogPostCategoryFilter, setBlogPostCategoryFilter] = useState<'all' | 'code' | 'ux' | 'design'>('all')
  const [blogPostSeriesFilter, setBlogPostSeriesFilter] = useState<string>('all')

  const { handleSaveBlogPost, handleDeleteBlogPost, handlePublishBlogPost, handleCreateBlogPost } =
    useBlogPostHandlers(updateBlogPost, deleteBlogPost, publishBlogPost, createBlogPost)

  const filteredBlogPosts = useMemo(() => {
    return (blogPosts || []).filter((post) => {
      if (blogPostStatusFilter !== 'all' && post.status !== blogPostStatusFilter) return false
      if (blogPostCategoryFilter !== 'all' && post.category !== blogPostCategoryFilter) return false
      if (blogPostSeriesFilter !== 'all' && post.series !== blogPostSeriesFilter) return false
      return true
    })
  }, [blogPosts, blogPostStatusFilter, blogPostCategoryFilter, blogPostSeriesFilter])

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
          <Select
            value={blogPostStatusFilter}
            onValueChange={(v: 'all' | 'draft' | 'published' | 'archived') => setBlogPostStatusFilter(v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
          <Select
            value={blogPostCategoryFilter}
            onValueChange={(v: 'all' | 'code' | 'ux' | 'design') => setBlogPostCategoryFilter(v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="code">Code</SelectItem>
              <SelectItem value="ux">UX</SelectItem>
              <SelectItem value="design">Design</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Series</label>
          <Select value={blogPostSeriesFilter} onValueChange={setBlogPostSeriesFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {Array.from(new Set(blogPosts?.map((p) => p.series).filter(Boolean))).map((series) => (
                <SelectItem key={series} value={series!}>
                  {series}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Posts</div>
          <div className="text-2xl font-bold text-foreground">{blogPosts?.length || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Filtered Results</div>
          <div className="text-2xl font-bold text-foreground">{filteredBlogPosts.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Published</div>
          <div className="text-2xl font-bold text-foreground">
            {blogPosts?.filter((p) => p.status === 'published').length || 0}
          </div>
        </Card>
      </div>

      {/* Create New Post Button */}
      <div className="flex justify-end">
        <Button onClick={handleCreateBlogPost} className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Create New Post
        </Button>
      </div>

      {/* Blog Posts List */}
      <ScrollArea className="h-[calc(100vh-500px)]">
        <div className="space-y-4">
          {filteredBlogPosts.map((post: any) => (
            <BlogPostEditor
              key={post._id}
              post={post}
              onSave={(updates) => handleSaveBlogPost(post._id, updates)}
              onDelete={() => handleDeleteBlogPost(post._id)}
              onPublish={post.status === 'draft' ? () => handlePublishBlogPost(post._id) : undefined}
              authorId={currentUserId}
            />
          ))}
        </div>
      </ScrollArea>

      {filteredBlogPosts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No blog posts found</p>
          <p className="text-sm text-muted-foreground mt-2">
            {blogPosts?.length === 0
              ? 'Create your first blog post using the "Create New Post" button above'
              : 'Try adjusting your filters'}
          </p>
        </div>
      )}
    </div>
  )
}

