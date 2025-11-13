'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X, Edit2, Trash2, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
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
  authorId: string;
  contentHistory?: Array<{
    timestamp: number;
    authorId: string;
    content: string;
    title?: string;
  }>;
}

interface BlogPostEditorProps {
  post: BlogPost;
  onSave: (updates: {
    title?: string;
    slug?: string;
    description?: string;
    content?: string;
    category?: 'code' | 'ux' | 'design';
    readTime?: string;
    date?: string;
    series?: string;
    order?: number;
    status?: 'draft' | 'published' | 'archived';
  }) => Promise<void>;
  onDelete: () => Promise<void>;
  onPublish?: () => Promise<void>;
  authorId: string;
}

export function BlogPostEditor({
  post,
  onSave,
  onDelete,
  onPublish,
  authorId,
}: BlogPostEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const [editTitle, setEditTitle] = useState(post.title);
  const [editSlug, setEditSlug] = useState(post.slug);
  const [editDescription, setEditDescription] = useState(post.description);
  const [editContent, setEditContent] = useState(post.content);
  const [editCategory, setEditCategory] = useState<'code' | 'ux' | 'design'>(post.category);
  const [editReadTime, setEditReadTime] = useState(post.readTime);
  const [editDate, setEditDate] = useState(post.date);
  const [editSeries, setEditSeries] = useState(post.series || '');
  const [editOrder, setEditOrder] = useState(post.order?.toString() || '');
  const [editStatus, setEditStatus] = useState<'draft' | 'published' | 'archived'>(post.status);

  const handleStartEdit = () => {
    setIsEditing(true);
    setShowPreview(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditTitle(post.title);
    setEditSlug(post.slug);
    setEditDescription(post.description);
    setEditContent(post.content);
    setEditCategory(post.category);
    setEditReadTime(post.readTime);
    setEditDate(post.date);
    setEditSeries(post.series || '');
    setEditOrder(post.order?.toString() || '');
    setEditStatus(post.status);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        title: editTitle,
        slug: editSlug,
        description: editDescription,
        content: editContent,
        category: editCategory,
        readTime: editReadTime,
        date: editDate,
        series: editSeries || undefined,
        order: editOrder ? parseInt(editOrder) : undefined,
        status: editStatus,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save blog post:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (onPublish) {
      setIsSaving(true);
      try {
        await onPublish();
      } catch (error) {
        console.error('Failed to publish blog post:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const statusColors = {
    draft: 'bg-muted text-muted-foreground',
    published: 'bg-primary/10 text-primary border border-primary/20',
    archived: 'bg-destructive/10 text-destructive border border-destructive/20',
  };

  if (isEditing) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Title
              </label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Blog post title"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Slug
              </label>
              <Input
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                placeholder="url-slug"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Description
            </label>
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
              placeholder="Brief description"
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Category
              </label>
              <Select value={editCategory} onValueChange={(v: 'code' | 'ux' | 'design') => setEditCategory(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="code">Code</SelectItem>
                  <SelectItem value="ux">UX</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Read Time
              </label>
              <Input
                value={editReadTime}
                onChange={(e) => setEditReadTime(e.target.value)}
                placeholder="8 min"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Date
              </label>
              <Input
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                placeholder="2025-01-15"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Status
              </label>
              <Select value={editStatus} onValueChange={(v: 'draft' | 'published' | 'archived') => setEditStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Series (optional)
              </label>
              <Input
                value={editSeries}
                onChange={(e) => setEditSeries(e.target.value)}
                placeholder="Series name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Order (optional)
              </label>
              <Input
                type="number"
                value={editOrder}
                onChange={(e) => setEditOrder(e.target.value)}
                placeholder="1"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">
                Content (Markdown)
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-3 w-3 mr-1" />
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
            </div>
            {showPreview ? (
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                    {editContent}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={20}
                className="font-mono text-sm"
                placeholder="# Blog post content..."
              />
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button onClick={handleCancel} variant="outline" className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
            {editStatus === 'draft' && onPublish && (
              <Button onClick={handlePublish} variant="default" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Publish
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg">{post.title}</h3>
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
            <span>Slug: {post.slug}</span>
            <span>•</span>
            <span>{post.readTime}</span>
            <span>•</span>
            <span>{post.date}</span>
            {post.publishedAt && (
              <>
                <span>•</span>
                <span>Published: {new Date(post.publishedAt).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleStartEdit}
            variant="outline"
            size="sm"
          >
            <Edit2 className="h-3 w-3 mr-1" />
            Edit
          </Button>
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
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
            {post.content.length > 500 ? post.content.substring(0, 500) + '...' : post.content}
          </ReactMarkdown>
        </div>
      </div>
    </Card>
  );
}

