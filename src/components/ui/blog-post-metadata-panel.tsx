'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface BlogPostMetadata {
  title: string;
  slug: string;
  description: string;
  category: 'code' | 'ux' | 'design';
  series?: string;
  order?: number;
  status: 'draft' | 'published' | 'archived';
  readTime: string;
  authorName?: string;
}

interface BlogPostMetadataPanelProps {
  metadata: BlogPostMetadata;
  onChange: (updates: Partial<BlogPostMetadata>) => void;
  className?: string;
}

export function BlogPostMetadataPanel({
  metadata,
  onChange,
  className,
}: BlogPostMetadataPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleChange = (field: keyof BlogPostMetadata, value: any) => {
    onChange({ [field]: value });
  };

  return (
    <div className={cn('bg-card border-r border-border flex flex-col', className)}>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Metadata</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="lg:hidden"
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-foreground mb-2 block">
              Title
            </Label>
            <Input
              id="title"
              value={metadata.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Blog post title"
              className="text-foreground"
            />
          </div>

          <div>
            <Label htmlFor="slug" className="text-sm font-medium text-foreground mb-2 block">
              Slug
            </Label>
            <Input
              id="slug"
              value={metadata.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              placeholder="url-slug"
              className="text-foreground font-mono text-sm"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium text-foreground mb-2 block">
              Description
            </Label>
            <Textarea
              id="description"
              value={metadata.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              placeholder="Brief description"
              className="text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category" className="text-sm font-medium text-foreground mb-2 block">
                Category
              </Label>
              <Select
                value={metadata.category}
                onValueChange={(v: 'code' | 'ux' | 'design') => handleChange('category', v)}
              >
                <SelectTrigger id="category">
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
              <Label htmlFor="status" className="text-sm font-medium text-foreground mb-2 block">
                Status
              </Label>
              <Select
                value={metadata.status}
                onValueChange={(v: 'draft' | 'published' | 'archived') => handleChange('status', v)}
              >
                <SelectTrigger id="status">
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

          <div>
            <Label htmlFor="series" className="text-sm font-medium text-foreground mb-2 block">
              Series (optional)
            </Label>
            <Input
              id="series"
              value={metadata.series || ''}
              onChange={(e) => handleChange('series', e.target.value || undefined)}
              placeholder="Series name"
              className="text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="order" className="text-sm font-medium text-foreground mb-2 block">
                Order (optional)
              </Label>
              <Input
                id="order"
                type="number"
                value={metadata.order?.toString() || ''}
                onChange={(e) => handleChange('order', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="1"
                className="text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="readTime" className="text-sm font-medium text-foreground mb-2 block">
                Read Time
              </Label>
              <Input
                id="readTime"
                value={metadata.readTime}
                onChange={(e) => handleChange('readTime', e.target.value)}
                placeholder="5 min"
                className="text-foreground"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="authorName" className="text-sm font-medium text-foreground mb-2 block">
              Author Name
            </Label>
            <Input
              id="authorName"
              value={metadata.authorName || ''}
              onChange={(e) => handleChange('authorName', e.target.value || undefined)}
              placeholder="Author display name"
              className="text-foreground"
            />
          </div>
        </div>
      )}
    </div>
  );
}

