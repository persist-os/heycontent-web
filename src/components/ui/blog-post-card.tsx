'use client';

import { BaseCard } from '@/components/ui/base-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import type { Id } from '@/convex/_generated/dataModel';

interface BlogPost {
  _id: Id<"blogPosts">;
  slug: string;
  title: string;
  description: string;
  content: string;
  category: 'code' | 'ux' | 'design';
  readTime: string;
  date: string;
  series?: string;
  order?: number;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: number;
  authorName?: string;
}

interface BlogPostCardProps {
  post: BlogPost;
  onDelete: () => Promise<void>;
  onPublish?: () => Promise<void>;
  onEdit: () => void;
}

export function BlogPostCard({
  post,
  onDelete,
  onPublish,
  onEdit,
}: BlogPostCardProps) {
  const statusColors = {
    draft: 'bg-muted text-muted-foreground',
    published: 'bg-primary/10 text-primary border border-primary/20',
    archived: 'bg-destructive/10 text-destructive border border-destructive/20',
  };

  return (
    <BaseCard variant="blog" className="p-4 md:p-6 [&>div]:p-0">
      {/* Mobile: Stack | Desktop: Row - EXACT original layout */}
      <div className="flex flex-col md:flex-row items-start md:items-start justify-between gap-4 md:gap-0 mb-4">
        <div className="flex-1 w-full md:w-auto">
          {/* Mobile: Stack badges | Desktop: Row - EXACT original */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="font-semibold text-base md:text-lg text-foreground break-words">{post.title}</h3>
            <Badge className={statusColors[post.status]}>
              {post.status}
            </Badge>
            <Badge variant="outline">{post.category}</Badge>
            {post.series && (
              <Badge variant="outline">
                {post.series} #{post.order}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2 break-words">{post.description}</p>
          {/* Mobile: Stack metadata | Desktop: Row - EXACT original */}
          <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
            {post.authorName && (
              <>
                <span>By {post.authorName}</span>
                <span className="hidden md:inline">•</span>
              </>
            )}
            <span className="break-all">Slug: {post.slug}</span>
            <span className="hidden md:inline">•</span>
            <span>{post.readTime}</span>
            {post.publishedAt && (
              <>
                <span className="hidden md:inline">•</span>
                <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
              </>
            )}
            {!post.publishedAt && post.date && (
              <>
                <span className="hidden md:inline">•</span>
                <span>{post.date}</span>
              </>
            )}
          </div>
        </div>
        {/* Mobile: Full width buttons | Desktop: Auto - EXACT original */}
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <Button
            onClick={onEdit}
            variant="outline"
            size="sm"
            className="min-h-[44px] md:min-h-0 w-full md:w-auto"
          >
            <Edit2 className="h-3 w-3 mr-1" />
            Edit
          </Button>
          {post.status === 'draft' && onPublish && (
            <Button
              onClick={onPublish}
              variant="outline"
              size="sm"
              className="min-h-[44px] md:min-h-0 w-full md:w-auto"
            >
              <Send className="h-3 w-3 mr-1" />
              Publish
            </Button>
          )}
          <Button
            onClick={onDelete}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 min-h-[44px] md:min-h-0 w-full md:w-auto"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      <div className="bg-muted/30 rounded-lg p-3 md:p-4">
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]}>
            {post.content.length > 500 ? post.content.substring(0, 500) + '...' : post.content}
          </ReactMarkdown>
        </div>
      </div>
    </BaseCard>
  );
}


