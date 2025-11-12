'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { useBloggerAuth } from '@/app/lib/admin-auth';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SimpleTiptapEditor, SimpleTiptapEditorRef } from '@/components/ui/tiptap-editor/SimpleTiptapEditor';
import { BlogPostMetadataPanel, BlogPostMetadata } from '@/components/ui/blog-post-metadata-panel';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentUserId } from '@/app/lib/api-helpers';

export default function BlogPostEditPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { firebaseUser } = useAuth();
  const { canAccessBlogger } = useBloggerAuth();

  // Fetch post
  const post = useQuery(api.blogPostQueries.getBlogPostBySlug, {
    slug,
    includeDrafts: true,
  });

  // Mutations
  const createBlogPost = useMutation(api.blogPostMutations.createBlogPost);
  const updateBlogPost = useMutation(api.blogPostMutations.updateBlogPost);
  const publishBlogPost = useMutation(api.blogPostMutations.publishBlogPost);

  // State
  const [metadata, setMetadata] = useState<BlogPostMetadata>({
    title: '',
    slug: '',
    description: '',
    category: 'code',
    status: 'draft',
    readTime: '5 min',
  });
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const editorRef = useRef<SimpleTiptapEditorRef>(null);

  // Initialize state from post or new post (must be before early returns)
  useEffect(() => {
    if (slug === 'new' && !post) {
      // New post - initialize with defaults
      setMetadata({
        title: '',
        slug: '',
        description: '',
        category: 'code',
        status: 'draft',
        readTime: '5 min',
      });
      setContent('');
      setHasUnsavedChanges(false);
    } else if (post) {
      // Existing post - load data
      setMetadata({
        title: post.title,
        slug: post.slug,
        description: post.description,
        category: post.category,
        series: post.series,
        order: post.order,
        status: post.status,
        readTime: post.readTime,
        authorName: post.authorName,
      });
      setContent(post.content);
      setHasUnsavedChanges(false);
    }
  }, [post, slug]);

  const handleMetadataChange = (updates: Partial<BlogPostMetadata>) => {
    setMetadata((prev) => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const userId = await getCurrentUserId();
      
      if (!post) {
        // Create new post
        await createBlogPost({
          slug: metadata.slug || `new-post-${Date.now()}`,
          title: metadata.title || 'New Blog Post',
          description: metadata.description || '',
          content: content || '',
          category: metadata.category,
          readTime: metadata.readTime,
          series: metadata.series,
          order: metadata.order,
          status: metadata.status,
          authorId: userId,
          authorName: metadata.authorName,
        });
        toast.success('Post created');
        router.refresh();
      } else {
        // Update existing post
        await updateBlogPost({
          blogPostId: post._id,
          updates: {
            ...metadata,
            content,
          },
          authorId: userId,
        });
        setHasUnsavedChanges(false);
        toast.success('Saved');
      }
    } catch (error) {
      toast.error(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsSaving(true);
    try {
      const userId = await getCurrentUserId();
      
      if (!post) {
        // Create and publish new post
        await createBlogPost({
          slug: metadata.slug || `new-post-${Date.now()}`,
          title: metadata.title || 'New Blog Post',
          description: metadata.description || '',
          content: content || '',
          category: metadata.category,
          readTime: metadata.readTime,
          series: metadata.series,
          order: metadata.order,
          status: 'published',
          authorId: userId,
          authorName: metadata.authorName,
        });
        toast.success('Post created and published');
        router.refresh();
      } else {
        // Publish existing post
        await publishBlogPost({ blogPostId: post._id });
        toast.success('Published');
        router.refresh();
      }
    } catch (error) {
      toast.error(`Failed to publish: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Redirect if no access
  if (canAccessBlogger === false) {
    router.push('/dashboard/blogger');
    return null;
  }

  // Loading state (only show if slug is not "new")
  if (slug !== 'new' && post === undefined) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not found (only for existing posts, not new)
  if (slug !== 'new' && post === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Post Not Found</h1>
          <Button onClick={() => router.push('/dashboard/blogger')} variant="ghost">
            ← Back to Blog Posts
          </Button>
        </div>
      </div>
    );
  }

  const statusColors = {
    draft: 'bg-muted text-muted-foreground',
    published: 'bg-primary/10 text-primary border border-primary/20',
    archived: 'bg-destructive/10 text-destructive border border-destructive/20',
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <div className="flex-shrink-0 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 h-[60px]">
          <div className="flex items-center gap-4 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/blogger')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Input
              value={metadata.title}
              onChange={(e) => handleMetadataChange({ title: e.target.value })}
              placeholder="Post title"
              className="text-lg font-semibold text-foreground border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 max-w-md"
            />
            {metadata.status && (
              <Badge className={statusColors[metadata.status]}>
                {metadata.status}
              </Badge>
            )}
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-xs">
                Unsaved changes
              </Badge>
            )}
            {isSaving && (
              <Badge variant="outline" className="text-xs">
                Saving...
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              variant="default"
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            {metadata.status === 'draft' && (
              <Button
                onClick={handlePublish}
                disabled={isSaving}
                variant="default"
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                Publish
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Metadata Panel */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <BlogPostMetadataPanel
            metadata={metadata}
            onChange={handleMetadataChange}
            className="h-full"
          />
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <SimpleTiptapEditor
            ref={editorRef}
            content={content}
            onContentChange={handleContentChange}
            placeholder="Start writing your blog post..."
            className="flex-1"
            minHeight="100%"
          />
        </div>
      </div>
    </div>
  );
}

