'use client';

import React from 'react';
import { Search, Package, Sparkles, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ContentType } from './types/contentAttachment';

interface SearchAndFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedType: ContentType | 'all';
  onTypeChange: (type: ContentType | 'all') => void;
}

export function SearchAndFilterBar({
  searchTerm,
  onSearchChange,
  selectedType,
  onTypeChange
}: SearchAndFilterBarProps) {
  return (
    <div className="flex gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
        <Input
          placeholder="Search content, tags, or metadata..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-12 pr-4 py-3 bg-muted/20 border-0 rounded-2xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-muted/30 transition-all font-light"
        />
      </div>
      <div className="flex gap-2">
        <Button
          variant={selectedType === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTypeChange('all')}
          className="rounded-xl"
        >
          All
        </Button>
        <Button
          variant={selectedType === 'note' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTypeChange('note')}
          className="rounded-xl"
        >
          Notes
        </Button>
        <Button
          variant={selectedType === 'artifact' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTypeChange('artifact')}
          className="rounded-xl"
        >
          <Package className="w-3 h-3 mr-1" />
          Artifacts
        </Button>
        <Button
          variant={selectedType === 'stardust' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTypeChange('stardust')}
          className="rounded-xl"
        >
          <Sparkles className="w-3 h-3 mr-1" />
          Stardust
        </Button>
        <Button
          variant={selectedType === 'shard' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTypeChange('shard')}
          className="rounded-xl"
        >
          <Gem className="w-3 h-3 mr-1" />
          Shards
        </Button>
      </div>
    </div>
  );
}
