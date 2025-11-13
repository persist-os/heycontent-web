'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { useBloggerAuth } from '@/app/lib/admin-auth';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText } from 'lucide-react';
import { DashboardNav } from '../_components/dashboard-nav';
import { BlogPostCard } from '@/components/ui/blog-post-card';
import { toast } from 'sonner';
import type { Id } from '@/convex/_generated/dataModel';

export default function BloggerPage() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const { canAccessBlogger } = useBloggerAuth();
  
  // Blog posts tab state
  const [blogPostStatusFilter, setBlogPostStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [blogPostCategoryFilter, setBlogPostCategoryFilter] = useState<'all' | 'code' | 'ux' | 'design'>('all');
  const [blogPostSeriesFilter, setBlogPostSeriesFilter] = useState<string>('all');

  // Fetch blog posts
  const blogPosts = useQuery(api.blogPostQueries.getAllBlogPosts, {
    includeDrafts: true,
    limit: 200,
  });

  // Mutations
  const deleteBlogPost = useMutation(api.blogPostMutations.deleteBlogPost);
  const publishBlogPost = useMutation(api.blogPostMutations.publishBlogPost);

  // Redirect if no access
  if (canAccessBlogger === false) {
    router.push('/dashboard/home');
    return null;
  }

  // Filter blog posts
  const filteredBlogPosts = blogPosts?.filter(post => {
    if (blogPostStatusFilter !== 'all' && post.status !== blogPostStatusFilter) return false;
    if (blogPostCategoryFilter !== 'all' && post.category !== blogPostCategoryFilter) return false;
    if (blogPostSeriesFilter !== 'all' && post.series !== blogPostSeriesFilter) return false;
    return true;
  }) || [];

  const handleDeleteBlogPost = async (blogPostId: Id<"blogPosts">) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;

    try {
      await deleteBlogPost({ blogPostId });
      toast.success('Blog post deleted');
    } catch (error) {
      toast.error(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handlePublishBlogPost = async (blogPostId: Id<"blogPosts">) => {
    try {
      await publishBlogPost({ blogPostId });
      toast.success('Blog post published');
    } catch (error) {
      toast.error(`Failed to publish: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Blog Editor</h1>
          <p className="text-muted-foreground">
            Create and manage your blog posts
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Status
            </label>
            <Select value={blogPostStatusFilter} onValueChange={(v: 'all' | 'draft' | 'published' | 'archived') => setBlogPostStatusFilter(v)}>
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
            <label className="text-sm font-medium text-foreground mb-2 block">
              Category
            </label>
            <Select value={blogPostCategoryFilter} onValueChange={(v: 'all' | 'code' | 'ux' | 'design') => setBlogPostCategoryFilter(v)}>
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
            <label className="text-sm font-medium text-foreground mb-2 block">
              Series
            </label>
            <Select value={blogPostSeriesFilter} onValueChange={setBlogPostSeriesFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {blogPosts
                  ?.map(p => p.series)
                  .filter((s): s is string => Boolean(s))
                  .filter((s, i, arr) => arr.indexOf(s) === i)
                  .map(series => (
                    <SelectItem key={series} value={series}>{series}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
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
              {blogPosts?.filter(p => p.status === 'published').length || 0}
            </div>
          </Card>
        </div>

        {/* Create New Post Button */}
        <div className="flex justify-end mb-6">
          <Button
            onClick={() => router.push('/dashboard/blogger/edit/new')}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Create New Post
          </Button>
        </div>

        {/* Blog Posts List */}
        <ScrollArea className="h-[calc(100vh-500px)]">
          <div className="space-y-4">
            {filteredBlogPosts.map((post) => (
              <BlogPostCard
                key={post._id}
                post={post}
                onDelete={() => handleDeleteBlogPost(post._id)}
                onPublish={post.status === 'draft' ? () => handlePublishBlogPost(post._id) : undefined}
                onEdit={() => router.push(`/dashboard/blogger/edit/${post.slug}`)}
              />
            ))}
          </div>
        </ScrollArea>

        {filteredBlogPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No blog posts found</p>
            <p className="text-sm text-muted-foreground mt-2">
              {blogPosts?.length === 0 ? 'Create your first blog post using the "Create New Post" button above' : 'Try adjusting your filters'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

