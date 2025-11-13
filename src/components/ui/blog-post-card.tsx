'use client';

import { Card } from '@/components/ui/card';
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
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg text-foreground">{post.title}</h3>
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
          <p className="text-sm text-muted-foreground mb-2">{post.description}</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            {post.authorName && (
              <>
                <span>By {post.authorName}</span>
                <span>•</span>
              </>
            )}
            <span>Slug: {post.slug}</span>
            <span>•</span>
            <span>{post.readTime}</span>
            {post.publishedAt && (
              <>
                <span>•</span>
                <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
              </>
            )}
            {!post.publishedAt && post.date && (
              <>
                <span>•</span>
                <span>{post.date}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onEdit}
            variant="outline"
            size="sm"
          >
            <Edit2 className="h-3 w-3 mr-1" />
            Edit
          </Button>
          {post.status === 'draft' && onPublish && (
            <Button
              onClick={onPublish}
              variant="outline"
              size="sm"
            >
              <Send className="h-3 w-3 mr-1" />
              Publish
            </Button>
          )}
          <Button
            onClick={onDelete}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      <div className="bg-muted/30 rounded-lg p-4">
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]}>
            {post.content.length > 500 ? post.content.substring(0, 500) + '...' : post.content}
          </ReactMarkdown>
        </div>
      </div>
    </Card>
  );
}


